import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class GamificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private getTodayStrIST() {
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
    const parts = new Intl.DateTimeFormat('en-IN', options).formatToParts(new Date());
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;
    return `${year}-${month}-${day}`;
  }

  private getYesterdayStrIST() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
    const parts = new Intl.DateTimeFormat('en-IN', options).formatToParts(yesterday);
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;
    return `${year}-${month}-${day}`;
  }

  async getStats(userId: string) {
    let stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      stats = await this.prisma.userStats.create({
        data: { userId },
      });
    }

    const achievements = await this.prisma.achievement.findMany({
      where: { userId },
    });

    // Check if free prediction token claimed today
    const lastClaim = stats.lastFreeClaimedAt;
    let claimedToday = false;
    if (lastClaim) {
      const lastClaimStr = new Date(lastClaim).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
      claimedToday = lastClaimStr === this.getTodayStrIST();
    }

    // Level L requires L * 100 XP to level up
    const xpNeededForNextLevel = stats.level * 100;
    const progressPercent = Math.min(100, Math.round((stats.xp / xpNeededForNextLevel) * 100));

    return {
      userId,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      totalPredictions: stats.totalPredictions,
      correctPredictions: stats.correctPredictions,
      xp: stats.xp,
      level: stats.level,
      progressPercent,
      xpNeededForNextLevel,
      claimedToday,
      unlockedAchievements: achievements.map(a => a.type),
    };
  }

  async recordTradeActivity(userId: string) {
    const today = this.getTodayStrIST();
    const yesterday = this.getYesterdayStrIST();

    let stats = await this.prisma.userStats.findUnique({ where: { userId } });
    if (!stats) {
      stats = await this.prisma.userStats.create({ data: { userId } });
    }

    let currentStreak = stats.currentStreak;
    let longestStreak = stats.longestStreak;
    const lastDate = stats.lastPredictionDate;

    if (!lastDate) {
      // First prediction ever
      currentStreak = 1;
      longestStreak = 1;
    } else if (lastDate === yesterday) {
      // Consecutive day!
      currentStreak += 1;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (lastDate !== today) {
      // Broken streak
      currentStreak = 1;
    }

    // Award XP: +20 XP per trade
    let xp = stats.xp + 20;
    let level = stats.level;
    const leveledUpList: number[] = [];

    while (xp >= level * 100) {
      xp -= level * 100;
      level += 1;
      leveledUpList.push(level);
    }

    const updated = await this.prisma.userStats.update({
      where: { userId },
      data: {
        currentStreak,
        longestStreak,
        totalPredictions: { increment: 1 },
        xp,
        level,
        lastPredictionDate: today,
      },
    });

    // Send notifications for level ups
    for (const lvl of leveledUpList) {
      await this.notifications.createNotification(
        userId,
        'SETTLEMENT',
        'Level Up! 🌟',
        `Congratulations! You've leveled up to Level ${lvl}! Keep making correct predictions to unlock cosmetic flairs.`,
      );
    }

    // Check achievements
    const totalPredictions = updated.totalPredictions;
    const unlockedNow: string[] = [];

    if (totalPredictions === 1) {
      unlockedNow.push('FIRST_TRADE');
    }
    if (currentStreak === 10) {
      unlockedNow.push('STREAK_10');
    }

    for (const type of unlockedNow) {
      const existing = await this.prisma.achievement.findFirst({
        where: { userId, type },
      });
      if (!existing) {
        await this.prisma.achievement.create({
          data: { userId, type },
        });

        const titleMap: Record<string, string> = {
          FIRST_TRADE: 'First Trade 🏆',
          STREAK_10: 'Streak Master 🔥',
        };
        const bodyMap: Record<string, string> = {
          FIRST_TRADE: "You've placed your first prediction trade on BharatPredict! Let the journey begin.",
          STREAK_10: "Incredible consistency! You've reached a 10-day prediction streak.",
        };

        await this.notifications.createNotification(
          userId,
          'SETTLEMENT',
          titleMap[type] || 'Achievement Unlocked! 🏅',
          bodyMap[type] || `You've unlocked the ${type} achievement badge.`,
        );
      }
    }

    return updated;
  }

  async recordResolutionActivity(userId: string, won: boolean, category: string) {
    let stats = await this.prisma.userStats.findUnique({ where: { userId } });
    if (!stats) {
      stats = await this.prisma.userStats.create({ data: { userId } });
    }

    const updated = await this.prisma.userStats.update({
      where: { userId },
      data: {
        correctPredictions: won ? { increment: 1 } : undefined,
      },
    });

    const unlockedNow: string[] = [];

    // Fetch user resolved trades to calculate realized profit
    const resolvedTrades = await this.prisma.trade.findMany({
      where: {
        userId,
        market: { resolved: true },
      },
      include: { market: true },
    });

    const marketGroups: Record<string, any[]> = {};
    resolvedTrades.forEach(t => {
      if (!marketGroups[t.marketId]) marketGroups[t.marketId] = [];
      marketGroups[t.marketId].push(t);
    });

    let totalResolvedPnL = 0;
    let iplTradesCount = 0;
    let iplWins = 0;

    for (const marketId of Object.keys(marketGroups)) {
      const trades = marketGroups[marketId];
      const market = trades[0].market;
      const winningSide = market.outcome;

      let yesBought = 0;
      let yesSpent = 0;
      let yesSold = 0;
      let yesReceived = 0;
      let noBought = 0;
      let noSpent = 0;
      let noSold = 0;
      let noReceived = 0;

      trades.forEach(t => {
        if (t.side === 'YES') {
          yesBought += t.shares;
          yesSpent += t.amount;
        } else if (t.side === 'NO') {
          noBought += t.shares;
          noSpent += t.amount;
        } else if (t.side === 'SELL_YES') {
          yesSold += t.shares;
          yesReceived += t.amount;
        } else if (t.side === 'SELL_NO') {
          noSold += t.shares;
          noReceived += t.amount;
        }
      });

      const remainingYes = Math.max(0, yesBought - yesSold);
      const remainingNo = Math.max(0, noBought - noSold);
      const settlement = winningSide === 'YES' ? remainingYes * 1.0 : (winningSide === 'NO' ? remainingNo * 1.0 : 0);
      const profit = (yesReceived + noReceived + settlement) - (yesSpent + noSpent);
      
      totalResolvedPnL += profit;

      if (market.category === 'IPL') {
        iplTradesCount++;
        if (profit > 0) {
          iplWins++;
        }
      }
    }

    if (totalResolvedPnL >= 10000) {
      unlockedNow.push('PROFIT_10K');
    }

    if (iplTradesCount >= 5 && (iplWins / iplTradesCount) >= 0.8) {
      unlockedNow.push('IPL_MASTER');
    }

    for (const type of unlockedNow) {
      const existing = await this.prisma.achievement.findFirst({
        where: { userId, type },
      });
      if (!existing) {
        await this.prisma.achievement.create({
          data: { userId, type },
        });

        const titleMap: Record<string, string> = {
          PROFIT_10K: 'Wealth Builder 💰',
          IPL_MASTER: 'IPL Master 🏏',
        };
        const bodyMap: Record<string, string> = {
          PROFIT_10K: "You've crossed ₹10,000 in total realized prediction profits!",
          IPL_MASTER: "Phenomenal! You've achieved an 80%+ win rate across at least 5 resolved IPL markets.",
        };

        await this.notifications.createNotification(
          userId,
          'SETTLEMENT',
          titleMap[type] || 'Achievement Unlocked! 🏅',
          bodyMap[type] || `You've unlocked the ${type} achievement badge.`,
        );
      }
    }

    return updated;
  }

  async claimDailyFreePrediction(userId: string) {
    const today = this.getTodayStrIST();

    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (stats?.lastFreeClaimedAt) {
      const lastClaimStr = new Date(stats.lastFreeClaimedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
      if (lastClaimStr === today) {
        throw new BadRequestException('Daily free prediction credit already claimed today. Try again tomorrow!');
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { increment: 100.0 },
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount: 100.0,
          status: 'SUCCESS',
        },
      });

      const updatedStats = await tx.userStats.upsert({
        where: { userId },
        create: {
          userId,
          lastFreeClaimedAt: new Date(),
        },
        update: {
          lastFreeClaimedAt: new Date(),
        },
      });

      return {
        walletBalance: user.walletBalance,
        stats: updatedStats,
      };
    });

    this.realtime.broadcastWalletUpdate(userId, result.walletBalance);

    await this.notifications.createNotification(
      userId,
      'SETTLEMENT',
      'Daily Faucet Credited 🎁',
      'You claimed your daily free prediction allowance of 100 BP! Use it to place predictions on the dashboard.',
    );

    return {
      success: true,
      walletBalance: result.walletBalance,
      lastFreeClaimedAt: result.stats.lastFreeClaimedAt,
    };
  }
}
