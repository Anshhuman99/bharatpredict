import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { GamificationService } from '../gamification/gamification.service';
import { LMSR } from './lmsr';
import { TradeRequestDto, SellRequestDto, LimitOrderRequestDto } from '@bharatpredict/types';

@Injectable()
export class TradingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationsService,
    private readonly gamification: GamificationService,
  ) {}

  async executeTrade(dto: TradeRequestDto) {
    const { userId, marketId, side, amount } = dto;

    if (amount <= 0) {
      throw new BadRequestException('Trade amount must be greater than zero');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Fetch and lock user details
      const user = await tx.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.walletBalance < amount) {
        throw new BadRequestException(`Insufficient wallet balance. Available: ₹${user.walletBalance.toFixed(2)}, Required: ₹${amount.toFixed(2)}`);
      }

      // 2. Fetch and lock market details
      const market = await tx.market.findUnique({
        where: { id: marketId },
      });
      if (!market) {
        throw new NotFoundException('Market not found');
      }
      if (market.resolved) {
        throw new BadRequestException('This market is already resolved and settled');
      }

      // --- HYBRID P2P LIMIT ORDER MATCHING PATH ---
      let matchedShares = 0;
      let remainingCash = amount;
      let p2pCashSpent = 0;
      const matchesToNotify: any[] = [];

      const rawCounterparties = await tx.limitOrder.findMany({
        where: {
          marketId,
          status: { in: ['PENDING', 'PARTIAL'] },
          userId: { not: userId },
          OR: [
            { orderType: 'SELL', side: side },
            { orderType: 'BUY', side: side === 'YES' ? 'NO' : 'YES' }
          ]
        }
      });

      const mappedCounterparties = rawCounterparties.map(cp => {
        const executionPrice = cp.orderType === 'SELL' ? cp.price : (1.00 - cp.price);
        return { cp, executionPrice };
      });

      mappedCounterparties.sort((a, b) => {
        if (a.executionPrice !== b.executionPrice) {
          return a.executionPrice - b.executionPrice;
        }
        return new Date(a.cp.createdAt).getTime() - new Date(b.cp.createdAt).getTime();
      });

      for (const item of mappedCounterparties) {
        const cp = item.cp;
        const executionPrice = item.executionPrice;
        if (remainingCash <= 0.01) break;

        const cpRemaining = cp.shares - cp.filled;
        const maxBuyShares = remainingCash / executionPrice;
        const matchShares = Math.min(cpRemaining, maxBuyShares);

        if (matchShares <= 0.001) continue;

        const cost = matchShares * executionPrice;
        remainingCash -= cost;
        p2pCashSpent += cost;
        matchedShares += matchShares;

        // Perform settlement updates for limit order match
        if (cp.orderType === 'SELL') {
          // Seller gets tokens
          await tx.user.update({
            where: { id: cp.userId },
            data: { walletBalance: { increment: cost } }
          });
          await tx.transaction.create({
            data: {
              userId: cp.userId,
              type: cp.side === 'YES' ? 'SELL_YES' : 'SELL_NO',
              amount: cost,
              status: 'SUCCESS'
            }
          });
        } else {
          // BUY other side: both got shares. Other side's tokens are already locked.
          await tx.holding.upsert({
            where: { userId_marketId: { userId: cp.userId, marketId } },
            create: {
              userId: cp.userId,
              marketId,
              yesShares: cp.side === 'YES' ? matchShares : 0,
              noShares: cp.side === 'NO' ? matchShares : 0,
            },
            update: {
              yesShares: cp.side === 'YES' ? { increment: matchShares } : undefined,
              noShares: cp.side === 'NO' ? { increment: matchShares } : undefined,
            }
          });
          // Create Trade record for counterparty
          await tx.trade.create({
            data: {
              userId: cp.userId,
              marketId,
              side: cp.side,
              amount: matchShares * cp.price,
              shares: matchShares,
              price: cp.price
            }
          });
        }

        // Collect match details for user notifications
        matchesToNotify.push({
          userId: cp.userId,
          side: cp.side,
          shares: matchShares,
          price: cp.price,
          orderId: cp.id,
          marketTitle: market.title,
        });

        // Update cp limit order
        const newCpFilled = cp.filled + matchShares;
        await tx.limitOrder.update({
          where: { id: cp.id },
          data: {
            filled: newCpFilled,
            status: newCpFilled >= cp.shares ? 'FILLED' : 'PARTIAL'
          }
        });

        // Broadcast cp wallet update
        const cpUser = await tx.user.findUnique({ where: { id: cp.userId } });
        if (cpUser) {
          this.realtime.broadcastWalletUpdate(cp.userId, cpUser.walletBalance);
        }
      }

      // --- AMM PATH FOR REMAINING CASH ---
      let ammShares = 0;
      let ammFee = 0;

      if (remainingCash > 0.05) {
        const calculation = LMSR.calculateSharesReceived(
          market.yesShares,
          market.noShares,
          market.liquidity,
          remainingCash,
          side,
          0.01, // 1% platform fee
        );
        ammShares = calculation.shares;
        ammFee = calculation.fee;
      }

      const totalShares = matchedShares + ammShares;

      if (totalShares <= 0) {
        throw new BadRequestException('Trade size too small');
      }

      const avgPrice = amount / totalShares;

      // 4. Update user's wallet balance (decrement total cash spent)
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: {
            decrement: amount,
          },
        },
      });

      // 5. Create a transaction ledger record
      await tx.transaction.create({
        data: {
          userId,
          type: side === 'YES' ? 'BUY_YES' : 'BUY_NO',
          amount,
          status: 'SUCCESS',
        },
      });

      // 6. Record the trade
      const trade = await tx.trade.create({
        data: {
          userId,
          marketId,
          side,
          amount,
          shares: totalShares,
          price: avgPrice,
        },
        include: {
          user: {
            select: { username: true, avatar: true },
          },
        },
      });

      // 7. Upsert user holdings
      await tx.holding.upsert({
        where: {
          userId_marketId: { userId, marketId },
        },
        create: {
          userId,
          marketId,
          yesShares: side === 'YES' ? totalShares : 0,
          noShares: side === 'NO' ? totalShares : 0,
        },
        update: {
          yesShares: side === 'YES' ? { increment: totalShares } : undefined,
          noShares: side === 'NO' ? { increment: totalShares } : undefined,
        },
      });

      // 8. Update market state (increment AMM volume and shares only by what went through the AMM)
      const updatedMarket = await tx.market.update({
        where: { id: marketId },
        data: {
          yesShares: side === 'YES' ? { increment: ammShares } : undefined,
          noShares: side === 'NO' ? { increment: ammShares } : undefined,
          volume: { increment: amount },
        },
      });

      // 9. Compute new current prices
      const newYesPrice = LMSR.getYesPrice(updatedMarket.yesShares, updatedMarket.noShares, updatedMarket.liquidity);
      const newNoPrice = 1 - newYesPrice;

      // 10. Broadcast realtime updates
      this.realtime.broadcastMarketPrice(
        marketId,
        newYesPrice,
        newNoPrice,
        updatedMarket.volume,
      );

      this.realtime.broadcastNewTrade({
        id: trade.id,
        marketId: market.id,
        username: user.username,
        avatar: user.avatar,
        marketTitle: market.title,
        side: trade.side,
        amount: trade.amount,
        shares: trade.shares,
        price: trade.price,
        createdAt: trade.createdAt,
      });

      this.realtime.broadcastWalletUpdate(userId, updatedUser.walletBalance);

      return {
        success: true,
        tradeId: trade.id,
        sharesBought: totalShares,
        avgPrice,
        newBalance: updatedUser.walletBalance,
        yesPrice: newYesPrice,
        noPrice: newNoPrice,
        marketTitle: market.title,
        matchesToNotify,
      };
    });

    if (result.success) {
      // Record gamification activity
      await this.gamification.recordTradeActivity(userId);

      // Create notification for trader
      await this.notifications.createNotification(
        userId,
        'TRADE',
        'Trade Executed',
        `Bought ${result.sharesBought.toFixed(2)} shares of ${side} in '${result.marketTitle}' at average price of ${result.avgPrice.toFixed(2)} BP.`,
        { marketId, tradeId: result.tradeId }
      );

      // Create notifications for matched counterparties
      for (const match of result.matchesToNotify) {
        await this.notifications.createNotification(
          match.userId,
          'TRADE',
          'Limit Order Matched',
          `Your limit order matched ${match.shares.toFixed(2)} shares of ${match.side} in '${match.marketTitle}' at ${match.price.toFixed(2)} BP.`,
          { marketId, orderId: match.orderId }
        );
      }
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // SELL: exit a position early at the current LMSR market price
  // ---------------------------------------------------------------------------

  async executeSell(dto: SellRequestDto) {
    const { userId, marketId, side, shares: sharesToSell } = dto;

    if (sharesToSell <= 0) {
      throw new BadRequestException('Shares to sell must be greater than zero');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Fetch user
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      // 2. Fetch market
      const market = await tx.market.findUnique({ where: { id: marketId } });
      if (!market) throw new NotFoundException('Market not found');
      if (market.resolved) {
        throw new BadRequestException('Market is already resolved. No selling after settlement.');
      }

      // 3. Fetch holding — user must own enough shares of the correct side
      const holding = await tx.holding.findUnique({
        where: { userId_marketId: { userId, marketId } },
      });
      if (!holding) {
        throw new BadRequestException('You do not hold any shares in this market');
      }

      const ownedShares = side === 'YES' ? holding.yesShares : holding.noShares;
      if (sharesToSell > ownedShares + 1e-9) {
        throw new BadRequestException(
          `Cannot sell ${sharesToSell.toFixed(2)} shares — you only own ${ownedShares.toFixed(2)} ${side} shares`,
        );
      }

      const actualSell = Math.min(sharesToSell, ownedShares);

      // 4. Compute reverse LMSR cash out
      const sellCalc = LMSR.calculateSellCashOut(
        market.yesShares,
        market.noShares,
        market.liquidity,
        actualSell,
        side,
        0.01, // 1% platform fee
      );

      if (sellCalc.netCash <= 0) {
        throw new BadRequestException('Position too small to generate meaningful proceeds');
      }

      // 5. Decrement holding
      await tx.holding.update({
        where: { userId_marketId: { userId, marketId } },
        data: {
          yesShares: side === 'YES' ? { decrement: actualSell } : undefined,
          noShares: side === 'NO' ? { decrement: actualSell } : undefined,
        },
      });

      // 6. Decrement market q1 or q2 (shares leave the AMM pool)
      const updatedMarket = await tx.market.update({
        where: { id: marketId },
        data: {
          yesShares: side === 'YES' ? { decrement: actualSell } : undefined,
          noShares: side === 'NO' ? { decrement: actualSell } : undefined,
        },
      });

      // 7. Credit user wallet with net cash received
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: sellCalc.netCash } },
      });

      // 8. Record the sell trade with positive values and SELL_YES/SELL_NO side
      const trade = await tx.trade.create({
        data: {
          userId,
          marketId,
          side: `SELL_${side}`,   // distinguishes sells from buys in history
          amount: sellCalc.netCash,  // positive: cash received by user
          shares: actualSell,         // positive: shares sold
          price: sellCalc.avgSellPrice,
        },
        include: { user: { select: { username: true, avatar: true } } },
      });

      // 9. Transaction ledger record
      await tx.transaction.create({
        data: {
          userId,
          type: side === 'YES' ? 'SELL_YES' : 'SELL_NO',
          amount: sellCalc.netCash,
          status: 'SUCCESS',
        },
      });

      // 10. Compute new prices and broadcast real-time updates
      const newYesPrice = LMSR.getYesPrice(
        updatedMarket.yesShares,
        updatedMarket.noShares,
        updatedMarket.liquidity,
      );
      const newNoPrice = 1 - newYesPrice;

      this.realtime.broadcastMarketPrice(marketId, newYesPrice, newNoPrice, updatedMarket.volume);
      this.realtime.broadcastNewTrade({
        id: trade.id,
        marketId: market.id,
        username: user.username,
        avatar: user.avatar,
        marketTitle: market.title,
        side: `SELL_${side}` as any,
        amount: sellCalc.netCash,
        shares: actualSell,
        price: sellCalc.avgSellPrice,
        createdAt: trade.createdAt,
      });
      this.realtime.broadcastWalletUpdate(userId, updatedUser.walletBalance);

      return {
        success: true,
        tradeId: trade.id,
        sharesSold: actualSell,
        cashReceived: sellCalc.cashReceived,
        fee: sellCalc.fee,
        netCash: sellCalc.netCash,
        avgSellPrice: sellCalc.avgSellPrice,
        newBalance: updatedUser.walletBalance,
        yesPrice: newYesPrice,
        noPrice: newNoPrice,
        marketTitle: market.title,
      };
    });

    if (result.success) {
      // Record gamification activity
      await this.gamification.recordTradeActivity(userId);

      await this.notifications.createNotification(
        userId,
        'TRADE',
        'Position Exited 📉',
        `Sold ${result.sharesSold.toFixed(2)} shares of ${side} in '${result.marketTitle}' for a net credit of ${result.netCash.toFixed(2)} BP.`,
        { marketId, tradeId: result.tradeId }
      );
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // PREVIEW SELL: read-only calculation for frontend debounced preview
  // ---------------------------------------------------------------------------

  async previewSell(marketId: string, userId: string, side: 'YES' | 'NO', shares: number) {
    if (shares <= 0) {
      throw new BadRequestException('Shares must be positive');
    }

    const [market, holding] = await Promise.all([
      this.prisma.market.findUnique({ where: { id: marketId } }),
      this.prisma.holding.findUnique({ where: { userId_marketId: { userId, marketId } } }),
    ]);

    if (!market) throw new NotFoundException('Market not found');
    if (market.resolved) throw new BadRequestException('Market is already resolved');

    const ownedShares = holding ? (side === 'YES' ? holding.yesShares : holding.noShares) : 0;
    if (shares > ownedShares + 1e-9) {
      throw new BadRequestException(`You only own ${ownedShares.toFixed(2)} ${side} shares`);
    }

    const sellCalc = LMSR.calculateSellCashOut(
      market.yesShares,
      market.noShares,
      market.liquidity,
      shares,
      side,
      0.01,
    );

    return {
      cashReceived: sellCalc.cashReceived,
      fee: sellCalc.fee,
      netCash: sellCalc.netCash,
      avgSellPrice: sellCalc.avgSellPrice,
      slippage: sellCalc.slippage,
      ownedShares,
    };
  }

  // ---------------------------------------------------------------------------
  // PREVIEW BUY: read-only calculation for buy preview
  // ---------------------------------------------------------------------------

  async previewTrade(marketId: string, side: 'YES' | 'NO', amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
    });

    if (!market) {
      throw new NotFoundException('Market not found');
    }

    if (market.resolved) {
      throw new BadRequestException('Market is already resolved');
    }

    const calculation = LMSR.calculateSharesReceived(
      market.yesShares,
      market.noShares,
      market.liquidity,
      amount,
      side,
      0.01, // 1% platform fee
    );

    if (calculation.shares <= 0) {
      throw new BadRequestException('Trade size too small');
    }

    return {
      shares: calculation.shares,
      fee: calculation.fee,
      netAmount: calculation.netAmount,
      avgPrice: calculation.avgPrice,
      slippage: calculation.slippage,
    };
  }

  // ---------------------------------------------------------------------------
  // LIMIT ORDERS: place, get active, cancel, match limit orders
  // ---------------------------------------------------------------------------

  async placeLimitOrder(dto: LimitOrderRequestDto) {
    const { userId, marketId, side, orderType, price, shares } = dto;

    if (price <= 0.009 || price >= 0.991) {
      throw new BadRequestException('Price must be between 0.01 and 0.99');
    }
    if (shares <= 0) {
      throw new BadRequestException('Shares must be greater than zero');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const cost = price * shares;
      if (orderType === 'BUY') {
        if (user.walletBalance < cost) {
          throw new BadRequestException(`Insufficient balance. Cost: ${cost.toFixed(2)} tokens`);
        }
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { decrement: cost } },
        });
        await tx.transaction.create({
          data: {
            userId,
            type: side === 'YES' ? 'BUY_YES' : 'BUY_NO',
            amount: cost,
            status: 'PENDING',
          }
        });
      } else {
        const holding = await tx.holding.findUnique({
          where: { userId_marketId: { userId, marketId } }
        });
        const owned = holding ? (side === 'YES' ? holding.yesShares : holding.noShares) : 0;
        if (owned < shares) {
          throw new BadRequestException(`Insufficient shares to sell. Owned: ${owned.toFixed(2)}`);
        }
        await tx.holding.update({
          where: { userId_marketId: { userId, marketId } },
          data: {
            yesShares: side === 'YES' ? { decrement: shares } : undefined,
            noShares: side === 'NO' ? { decrement: shares } : undefined,
          }
        });
      }

      const order = await tx.limitOrder.create({
        data: {
          userId,
          marketId,
          side,
          orderType,
          price,
          shares,
          status: 'PENDING'
        }
      });

      // Run matcher
      const matches = await this.matchLimitOrder(order.id, tx) || [];

      // Fetch market title
      const market = await tx.market.findUnique({ where: { id: marketId } });
      const marketTitle = market?.title || 'Prediction Market';

      const updatedUser = await tx.user.findUnique({ where: { id: userId } });
      if (updatedUser) {
        this.realtime.broadcastWalletUpdate(userId, updatedUser.walletBalance);
      }

      return {
        success: true,
        orderId: order.id,
        orderType,
        side,
        price,
        shares,
        marketTitle,
        matches,
      };
    });

    if (result.success) {
      // Record gamification activity
      await this.gamification.recordTradeActivity(userId);

      // 1. Notify the order placement itself
      await this.notifications.createNotification(
        userId,
        'TRADE',
        'Limit Order Placed',
        `Placed a limit order to ${result.orderType} ${result.shares.toFixed(2)} shares of ${result.side} at ${result.price.toFixed(2)} BP in '${result.marketTitle}'.`,
        { marketId, orderId: result.orderId }
      );

      // 2. Notify all matches
      for (const match of result.matches) {
        // Notify the maker (the counterparty)
        await this.notifications.createNotification(
          match.makerUserId,
          'TRADE',
          'Limit Order Matched',
          `Your limit order in '${result.marketTitle}' matched ${match.shares.toFixed(2)} shares of ${match.makerSide} at ${match.price.toFixed(2)} BP.`,
          { marketId, orderId: match.makerOrderId }
        );

        // Notify the taker (this order creator, but only if they matched any shares)
        if (match.takerUserId === userId) {
          await this.notifications.createNotification(
            userId,
            'TRADE',
            'Limit Order Matched',
            `Your limit order in '${result.marketTitle}' matched ${match.shares.toFixed(2)} shares of ${result.side} at ${match.price.toFixed(2)} BP.`,
            { marketId, orderId: result.orderId }
          );
        }
      }
    }

    return result;
  }

  async getActiveLimitOrders(userId: string, marketId?: string) {
    return await this.prisma.limitOrder.findMany({
      where: {
        userId,
        marketId,
        status: { in: ['PENDING', 'PARTIAL'] }
      },
      include: {
        market: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async cancelLimitOrder(id: string, userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.limitOrder.findFirst({
        where: { id, userId, status: { in: ['PENDING', 'PARTIAL'] } }
      });
      if (!order) throw new NotFoundException('Limit order not found or already filled/cancelled');

      const remainingShares = order.shares - order.filled;
      if (order.orderType === 'BUY') {
        const refundAmount = remainingShares * order.price;
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: refundAmount } }
        });
        await tx.transaction.create({
          data: {
            userId,
            type: 'WITHDRAW',
            amount: refundAmount,
            status: 'SUCCESS'
          }
        });
      } else {
        await tx.holding.update({
          where: { userId_marketId: { userId, marketId: order.marketId } },
          data: {
            yesShares: order.side === 'YES' ? { increment: remainingShares } : undefined,
            noShares: order.side === 'NO' ? { increment: remainingShares } : undefined
          }
        });
      }

      const updatedOrder = await tx.limitOrder.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });

      const updatedUser = await tx.user.findUnique({ where: { id: userId } });
      if (updatedUser) {
        this.realtime.broadcastWalletUpdate(userId, updatedUser.walletBalance);
      }

      return {
        success: true,
        order: updatedOrder
      };
    });
  }

  async matchLimitOrder(orderId: string, tx: any) {
    const order = await tx.limitOrder.findUnique({
      where: { id: orderId }
    });
    if (!order || order.status !== 'PENDING') return [];

    let remainingShares = order.shares - order.filled;
    if (remainingShares <= 0) return [];

    const matches: any[] = [];

    let candidates = [];
    if (order.orderType === 'BUY') {
      candidates = await tx.limitOrder.findMany({
        where: {
          marketId: order.marketId,
          status: { in: ['PENDING', 'PARTIAL'] },
          id: { not: order.id },
          OR: [
            { orderType: 'SELL', side: order.side, price: { lte: order.price } },
            { orderType: 'BUY', side: order.side === 'YES' ? 'NO' : 'YES', price: { gte: 1.00 - order.price } }
          ]
        }
      });
    } else {
      candidates = await tx.limitOrder.findMany({
        where: {
          marketId: order.marketId,
          status: { in: ['PENDING', 'PARTIAL'] },
          id: { not: order.id },
          orderType: 'BUY',
          side: order.side,
          price: { gte: order.price }
        }
      });
    }

    const mapped = candidates.map((cp: any) => {
      const executionPrice = (order.side === cp.side) ? cp.price : (1.00 - cp.price);
      return { cp, executionPrice };
    });

    mapped.sort((a: any, b: any) => {
      if (a.executionPrice !== b.executionPrice) {
        return order.orderType === 'BUY'
          ? (a.executionPrice - b.executionPrice)
          : (b.executionPrice - a.executionPrice);
      }
      return new Date(a.cp.createdAt).getTime() - new Date(b.cp.createdAt).getTime();
    });

    const counterparties = mapped.map((x: any) => x.cp);

    for (const cp of counterparties) {
      if (remainingShares <= 0) break;

      const cpRemaining = cp.shares - cp.filled;
      const matchShares = Math.min(remainingShares, cpRemaining);

      if (matchShares <= 0) continue;

      if (order.side === cp.side && order.orderType !== cp.orderType) {
        const buyer = order.orderType === 'BUY' ? order : cp;
        const seller = order.orderType === 'SELL' ? order : cp;
        const executionPrice = cp.price;

        await tx.user.update({
          where: { id: seller.userId },
          data: { walletBalance: { increment: matchShares * executionPrice } }
        });
        await tx.transaction.create({
          data: {
            userId: seller.userId,
            type: seller.side === 'YES' ? 'SELL_YES' : 'SELL_NO',
            amount: matchShares * executionPrice,
            status: 'SUCCESS'
          }
        });

        await tx.holding.upsert({
          where: { userId_marketId: { userId: buyer.userId, marketId: order.marketId } },
          create: {
            userId: buyer.userId,
            marketId: order.marketId,
            yesShares: buyer.side === 'YES' ? matchShares : 0,
            noShares: buyer.side === 'NO' ? matchShares : 0,
          },
          update: {
            yesShares: buyer.side === 'YES' ? { increment: matchShares } : undefined,
            noShares: buyer.side === 'NO' ? { increment: matchShares } : undefined,
          }
        });

        await tx.trade.create({
          data: {
            userId: buyer.userId,
            marketId: order.marketId,
            side: buyer.side,
            amount: matchShares * executionPrice,
            shares: matchShares,
            price: executionPrice
          }
        });

        if (buyer.price > executionPrice) {
          const refund = matchShares * (buyer.price - executionPrice);
          await tx.user.update({
            where: { id: buyer.userId },
            data: { walletBalance: { increment: refund } }
          });
        }

        matches.push({
          shares: matchShares,
          price: executionPrice,
          makerUserId: cp.userId,
          makerSide: cp.side,
          makerOrderId: cp.id,
          takerUserId: order.userId,
        });
      }
      else if (order.orderType === 'BUY' && cp.orderType === 'BUY' && order.side !== cp.side) {
        const buyerYes = order.side === 'YES' ? order : cp;
        const buyerNo = order.side === 'NO' ? order : cp;

        await tx.holding.upsert({
          where: { userId_marketId: { userId: buyerYes.userId, marketId: order.marketId } },
          create: {
            userId: buyerYes.userId,
            marketId: order.marketId,
            yesShares: matchShares,
          },
          update: {
            yesShares: { increment: matchShares },
          }
        });

        await tx.holding.upsert({
          where: { userId_marketId: { userId: buyerNo.userId, marketId: order.marketId } },
          create: {
            userId: buyerNo.userId,
            marketId: order.marketId,
            noShares: matchShares,
          },
          update: {
            noShares: { increment: matchShares },
          }
        });

        await tx.trade.create({
          data: {
            userId: buyerYes.userId,
            marketId: order.marketId,
            side: 'YES',
            amount: matchShares * buyerYes.price,
            shares: matchShares,
            price: buyerYes.price
          }
        });

        await tx.trade.create({
          data: {
            userId: buyerNo.userId,
            marketId: order.marketId,
            side: 'NO',
            amount: matchShares * buyerNo.price,
            shares: matchShares,
            price: buyerNo.price
          }
        });

        const totalCost = buyerYes.price + buyerNo.price;
        if (totalCost > 1.00) {
          const surplus = totalCost - 1.00;
          const taker = order.id === orderId ? order : cp;
          await tx.user.update({
            where: { id: taker.userId },
            data: { walletBalance: { increment: matchShares * surplus } }
          });
        }

        matches.push({
          shares: matchShares,
          price: cp.price,
          makerUserId: cp.userId,
          makerSide: cp.side,
          makerOrderId: cp.id,
          takerUserId: order.userId,
        });
      }

      await tx.market.update({
        where: { id: order.marketId },
        data: { volume: { increment: matchShares * (cp.price + order.price) / 2 } }
      });

      const newCpFilled = cp.filled + matchShares;
      const newCpStatus = newCpFilled >= cp.shares ? 'FILLED' : 'PARTIAL';
      await tx.limitOrder.update({
        where: { id: cp.id },
        data: { filled: newCpFilled, status: newCpStatus }
      });

      remainingShares -= matchShares;

      const cpUser = await tx.user.findUnique({ where: { id: cp.userId } });
      if (cpUser) {
        this.realtime.broadcastWalletUpdate(cp.userId, cpUser.walletBalance);
      }
    }

    const orderStatus = remainingShares <= 0 ? 'FILLED' : (order.shares - remainingShares > 0 ? 'PARTIAL' : 'PENDING');
    await tx.limitOrder.update({
      where: { id: order.id },
      data: { filled: order.shares - remainingShares, status: orderStatus }
    });

    return matches;
  }
}
