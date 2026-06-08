import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { LMSR } from './lmsr';
import { TradeRequestDto, SellRequestDto } from '@bharatpredict/types';

@Injectable()
export class TradingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async executeTrade(dto: TradeRequestDto) {
    const { userId, marketId, side, amount } = dto;

    if (amount <= 0) {
      throw new BadRequestException('Trade amount must be greater than zero');
    }

    // Run trade execution inside a rigorous database transaction to prevent race conditions
    return await this.prisma.$transaction(async (tx) => {
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

      // 3. Compute LMSR shares with platform fees and slippage calculations
      const calculation = LMSR.calculateSharesReceived(
        market.yesShares,
        market.noShares,
        market.liquidity,
        amount,
        side,
        0.01, // 1% platform fee
      );

      const { shares, fee, avgPrice } = calculation;

      if (shares <= 0) {
        throw new BadRequestException('Trade size too small');
      }

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
          shares,
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
          yesShares: side === 'YES' ? shares : 0,
          noShares: side === 'NO' ? shares : 0,
        },
        update: {
          yesShares: side === 'YES' ? { increment: shares } : undefined,
          noShares: side === 'NO' ? { increment: shares } : undefined,
        },
      });

      // 8. Update market state (q1, q2 and volume)
      const updatedMarket = await tx.market.update({
        where: { id: marketId },
        data: {
          yesShares: side === 'YES' ? { increment: shares } : undefined,
          noShares: side === 'NO' ? { increment: shares } : undefined,
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
        sharesBought: shares,
        avgPrice,
        newBalance: updatedUser.walletBalance,
        yesPrice: newYesPrice,
        noPrice: newNoPrice,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // SELL: exit a position early at the current LMSR market price
  // ---------------------------------------------------------------------------

  async executeSell(dto: SellRequestDto) {
    const { userId, marketId, side, shares: sharesToSell } = dto;

    if (sharesToSell <= 0) {
      throw new BadRequestException('Shares to sell must be greater than zero');
    }

    return await this.prisma.$transaction(async (tx) => {
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

      // 8. Record the sell trade
      const trade = await tx.trade.create({
        data: {
          userId,
          marketId,
          side,
          amount: -sellCalc.netCash,   // negative = cash came into wallet (sell)
          shares: -actualSell,          // negative = shares left holding
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
      };
    });
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
}
