import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LMSR } from '../trade/lmsr';

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  async getPortfolio(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Retrieve all holdings for the user to compute realized and unrealized P&L
    const holdings = await this.prisma.holding.findMany({
      where: {
        userId,
      },
      include: {
        market: true,
      },
    });

    let totalHoldingsValue = 0;
    let totalInvestedAmount = 0;
    let totalRealizedPnL = 0;
    let totalUnrealizedPnL = 0;

    const holdingsWithMarketData = [];

    for (const holding of holdings) {
      const market = holding.market;
      const yesPrice = LMSR.getYesPrice(market.yesShares, market.noShares, market.liquidity);
      const noPrice = 1 - yesPrice;

      // 1. Fetch all trades by user in this market to calculate cost basis and realized proceeds
      const marketTrades = await this.prisma.trade.findMany({
        where: { userId, marketId: market.id },
      });

      let yesSharesBought = 0;
      let yesCashSpent = 0;
      let noSharesBought = 0;
      let noCashSpent = 0;
      let yesSharesSold = 0;
      let yesCashReceived = 0;
      let noSharesSold = 0;
      let noCashReceived = 0;

      marketTrades.forEach((trade) => {
        if (trade.side === 'YES') {
          yesSharesBought += trade.shares;
          yesCashSpent += trade.amount;
        } else if (trade.side === 'NO') {
          noSharesBought += trade.shares;
          noCashSpent += trade.amount;
        } else if (trade.side === 'SELL_YES') {
          yesSharesSold += trade.shares;
          yesCashReceived += trade.amount;
        } else if (trade.side === 'SELL_NO') {
          noSharesSold += trade.shares;
          noCashReceived += trade.amount;
        }
      });

      if (market.resolved) {
        // Realized Settlement
        const winningSide = market.outcome; // "YES" or "NO"
        const remainingYes = Math.max(0, yesSharesBought - yesSharesSold);
        const remainingNo = Math.max(0, noSharesBought - noSharesSold);
        
        const settlementPayout = winningSide === 'YES' ? remainingYes * 1.0 : (winningSide === 'NO' ? remainingNo * 1.0 : 0);
        const totalReceived = yesCashReceived + noCashReceived + settlementPayout;
        const totalSpent = yesCashSpent + noCashSpent;
        const pnl = totalReceived - totalSpent;
        
        totalRealizedPnL += pnl;
        totalInvestedAmount += totalSpent;
      } else {
        // Unrealized Valuation - only process if user has active shares
        if (holding.yesShares > 0 || holding.noShares > 0) {
          const yesValue = holding.yesShares * yesPrice;
          const noValue = holding.noShares * noPrice;
          const currentValue = yesValue + noValue;
          
          const yesAvgEntry = yesSharesBought > 0 ? yesCashSpent / yesSharesBought : 0;
          const noAvgEntry = noSharesBought > 0 ? noCashSpent / noSharesBought : 0;
          // Cost basis = weighted average entry cost for remaining shares
          const costBasis = holding.yesShares * yesAvgEntry + holding.noShares * noAvgEntry;
          
          // Unrealized PnL is the PnL of the current active position
          const unrealizedPnL = currentValue - costBasis;
          
          // Realized PnL from early exits in this market:
          const yesRealizedPnL = yesCashReceived - (yesSharesSold * yesAvgEntry);
          const noRealizedPnL = noCashReceived - (noSharesSold * noAvgEntry);
          const realizedPnLFromSells = yesRealizedPnL + noRealizedPnL;

          totalUnrealizedPnL += unrealizedPnL;
          totalRealizedPnL += realizedPnLFromSells; // Add realized portion to realized P&L

          totalHoldingsValue += currentValue;
          totalInvestedAmount += costBasis;
          
          const avgEntryPrice = holding.yesShares > 0 ? yesAvgEntry : noAvgEntry;

          holdingsWithMarketData.push({
            ...holding,
            currentValue: parseFloat(currentValue.toFixed(2)),
            costBasis: parseFloat(costBasis.toFixed(2)),
            unrealizedPnL: parseFloat(unrealizedPnL.toFixed(2)),
            avgEntryPrice: parseFloat(avgEntryPrice.toFixed(2)),
            pnl: parseFloat((unrealizedPnL + realizedPnLFromSells).toFixed(2)), // Total market PnL
            market: {
              ...market,
              yesPrice,
              noPrice,
            },
          });
        }
      }
    }


    // Retrieve recent trades to show in history and calculate cost basis
    const trades = await this.prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 2. Real Win Rate calculation from resolved markets using trade logs
    const resolvedMarketsTraded = await this.prisma.market.findMany({
      where: {
        resolved: true,
        trades: { some: { userId } },
      },
    });

    let wins = 0;
    for (const m of resolvedMarketsTraded) {
      const userTrades = await this.prisma.trade.findMany({
        where: { userId, marketId: m.id },
      });
      let yesShares = 0;
      let noShares = 0;
      userTrades.forEach((t) => {
        if (t.side === 'YES') yesShares += t.shares;
        if (t.side === 'NO') noShares += t.shares;
      });

      if (m.outcome === 'YES' && yesShares > 0) wins++;
      else if (m.outcome === 'NO' && noShares > 0) wins++;
    }

    const totalResolvedTraded = resolvedMarketsTraded.length;
    const winRate = totalResolvedTraded > 0 ? (wins / totalResolvedTraded) * 100 : 0.0;

    const totalPnL = totalRealizedPnL + totalUnrealizedPnL;

    return {
      walletBalance: user.walletBalance,
      reputationPoints: user.reputationPoints,
      totalHoldingsValue: parseFloat(totalHoldingsValue.toFixed(2)),
      netWorth: parseFloat((user.walletBalance + totalHoldingsValue).toFixed(2)),
      totalPnL: parseFloat(totalPnL.toFixed(2)),
      totalRealizedPnL: parseFloat(totalRealizedPnL.toFixed(2)),
      totalUnrealizedPnL: parseFloat(totalUnrealizedPnL.toFixed(2)),
      winRate: parseFloat(winRate.toFixed(1)),
      holdings: holdingsWithMarketData,
      recentTrades: trades,
    };
  }
}
