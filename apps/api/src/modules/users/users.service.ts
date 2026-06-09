import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LMSR } from '../trade/lmsr';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        stats: true,
        achievements: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 1. Fetch active holdings to compute public valuation
    const holdings = await this.prisma.holding.findMany({
      where: { userId },
      include: { market: true },
    });

    let totalHoldingsValue = 0;
    const activePositions = [];

    for (const h of holdings) {
      if (h.yesShares > 0 || h.noShares > 0) {
        const yesPrice = LMSR.getYesPrice(h.market.yesShares, h.market.noShares, h.market.liquidity);
        const noPrice = 1 - yesPrice;
        
        const currentValue = h.yesShares * yesPrice + h.noShares * noPrice;
        totalHoldingsValue += currentValue;

        activePositions.push({
          id: h.id,
          marketId: h.marketId,
          marketTitle: h.market.title,
          yesShares: h.yesShares,
          noShares: h.noShares,
          currentValue,
          resolved: h.market.resolved,
        });
      }
    }

    // 2. Fetch recent public trades
    const recentTrades = await this.prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { market: true },
    });

    const publicTrades = recentTrades.map(t => ({
      id: t.id,
      marketTitle: t.market.title,
      marketId: t.marketId,
      side: t.side,
      shares: t.shares,
      price: t.price,
      amount: t.amount,
      createdAt: t.createdAt,
    }));

    // Calculate public metrics
    const stats = user.stats;
    const totalPredictions = stats?.totalPredictions || 0;
    const correctPredictions = stats?.correctPredictions || 0;
    const winRate = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;
    const level = stats?.level || 1;
    const currentStreak = stats?.currentStreak || 0;
    const longestStreak = stats?.longestStreak || 0;
    const xp = stats?.xp || 0;
    const xpNeededForNextLevel = level * 100;

    return {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      reputationPoints: user.reputationPoints,
      createdAt: user.createdAt,
      stats: {
        level,
        xp,
        xpNeededForNextLevel,
        currentStreak,
        longestStreak,
        totalPredictions,
        correctPredictions,
        winRate,
      },
      achievements: (user.achievements || []).map(a => a.type),
      portfolio: {
        publicNetWorth: user.walletBalance + totalHoldingsValue,
        activePositions,
        recentTrades: publicTrades,
      },
    };
  }
}
