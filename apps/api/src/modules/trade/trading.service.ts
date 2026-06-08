import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { LMSR } from './lmsr';
import { TradeRequestDto } from '@bharatpredict/types';

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
        throw new BadRequestException('The trade size is too small or liquidity is too low');
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

    return {
      shares: calculation.shares,
      fee: calculation.fee,
      netAmount: calculation.netAmount,
      avgPrice: calculation.avgPrice,
      slippage: calculation.slippage,
    };
  }
}
