import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LMSR } from '../trade/lmsr';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class MarketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async findAll() {
    const markets = await this.prisma.market.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return markets.map((market) => {
      const yesPrice = LMSR.getYesPrice(market.yesShares, market.noShares, market.liquidity);
      const noPrice = 1 - yesPrice;

      return {
        ...market,
        yesPrice,
        noPrice,
      };
    });
  }

  async findOne(id: string) {
    const market = await this.prisma.market.findUnique({
      where: { id },
      include: {
        trades: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            user: {
              select: { username: true, avatar: true },
            },
          },
        },
      },
    });

    if (!market) {
      throw new NotFoundException('Market not found');
    }

    const yesPrice = LMSR.getYesPrice(market.yesShares, market.noShares, market.liquidity);
    const noPrice = 1 - yesPrice;

    // Generate highly realistic, visually gorgeous, and mathematically consistent
    // historical probability prices for Recharts so the graph looks outstanding!
    const priceHistory = this.generatePriceHistory(yesPrice, market.createdAt);

    // Generate OHLC Candlestick data for financial-grade price timelines
    const ohlcHistory = this.generateOhlcHistory(yesPrice, market.createdAt);

    // Fetch discussion comments associated with this market event lobby
    const comments = await this.prisma.comment.findMany({
      where: { marketId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { username: true, avatar: true },
        },
      },
    });

    // Create a mock high-fidelity real-time order book representing outstanding bids and asks
    const orderbook = this.generateOrderbook(yesPrice);

    return {
      ...market,
      yesPrice,
      noPrice,
      priceHistory,
      ohlcHistory,
      orderbook,
      comments,
    };
  }

  async createMarket(dto: {
    title: string;
    description: string;
    category: string;
    image: string;
    endDate: Date | string;
    liquidity?: number;
    aiConfidence?: number;
    marketSentiment?: string;
    trendingNarrative?: string;
  }) {
    const market = await this.prisma.market.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        image: dto.image,
        endDate: new Date(dto.endDate),
        liquidity: dto.liquidity || 100.0,
        yesShares: 0.0,
        noShares: 0.0,
        volume: 0.0,
        aiConfidence: dto.aiConfidence || 50.0,
        marketSentiment: dto.marketSentiment || 'Neutral',
        trendingNarrative: dto.trendingNarrative || 'Even odds trade',
      },
    });

    return {
      success: true,
      market,
    };
  }

  async resolveMarket(marketId: string, outcome: 'YES' | 'NO') {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Fetch market details
      const market = await tx.market.findUnique({
        where: { id: marketId },
      });

      if (!market) {
        throw new NotFoundException('Market not found');
      }

      if (market.resolved) {
        throw new BadRequestException('Market is already resolved and settled');
      }

      if (outcome !== 'YES' && outcome !== 'NO') {
        throw new BadRequestException('Invalid resolution outcome. Must be YES or NO');
      }

      // 2. Fetch all holdings for this market
      const holdings = await tx.holding.findMany({
        where: { marketId },
      });

      // 3. Process payouts for each user holding shares
      for (const holding of holdings) {
        const shares = outcome === 'YES' ? holding.yesShares : holding.noShares;
        
        if (shares > 0) {
          const payout = shares * 1.0; // Settle at ₹1.00 per share

          // Credit user wallet balance atomically
          const updatedUser = await tx.user.update({
            where: { id: holding.userId },
            data: {
              walletBalance: {
                increment: payout,
              },
            },
          });

          // Create transaction ledger record
          await tx.transaction.create({
            data: {
              userId: holding.userId,
              type: 'SETTLEMENT',
              amount: payout,
              status: 'SUCCESS',
            },
          });

          // Broadcast wallet update immediately
          this.realtime.broadcastWalletUpdate(holding.userId, updatedUser.walletBalance);
        }

        // Set shares to 0 since they are resolved
        await tx.holding.update({
          where: { id: holding.id },
          data: {
            yesShares: 0.0,
            noShares: 0.0,
          },
        });
      }

      // 4. Mark market as resolved
      const resolvedMarket = await tx.market.update({
        where: { id: marketId },
        data: {
          resolved: true,
          outcome,
        },
      });

      return {
        success: true,
        marketId,
        outcome,
        resolved: true,
      };
    });
  }

  private generatePriceHistory(currentYesPrice: number, startDate: Date) {
    const history = [];
    const steps = 30; // 30 intervals
    let tempPrice = currentYesPrice * 0.85 + Math.random() * 0.15; // random start point
    const startTime = new Date(startDate).getTime();
    const endTime = Date.now();
    const interval = (endTime - startTime) / steps;

    for (let i = 0; i <= steps; i++) {
      const time = new Date(startTime + i * interval);
      
      // Gradually converge mock history toward current yesPrice
      const progress = i / steps;
      const noise = (Math.random() - 0.5) * 0.08 * (1 - progress);
      const trend = (currentYesPrice - tempPrice) * 0.1;
      
      tempPrice = tempPrice + trend + noise;
      tempPrice = Math.max(0.05, Math.min(0.95, tempPrice));

      const yesVal = i === steps ? currentYesPrice : tempPrice;
      const noVal = 1 - yesVal;

      history.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: time.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        yesPrice: parseFloat(yesVal.toFixed(2)),
        noPrice: parseFloat(noVal.toFixed(2)),
      });
    }

    return history;
  }

  private generateOhlcHistory(currentYesPrice: number, startDate: Date) {
    const history = [];
    const steps = 20; // 20 candles
    let tempClose = currentYesPrice * 0.85 + Math.random() * 0.15;
    const startTime = new Date(startDate).getTime();
    const endTime = Date.now();
    const interval = (endTime - startTime) / steps;

    for (let i = 0; i < steps; i++) {
      const time = new Date(startTime + i * interval);
      const progress = i / steps;
      const noise = (Math.random() - 0.5) * 0.08 * (1 - progress);
      const trend = (currentYesPrice - tempClose) * 0.1;

      const open = tempClose;
      tempClose = tempClose + trend + noise;
      tempClose = Math.max(0.05, Math.min(0.95, tempClose));

      const close = i === steps - 1 ? currentYesPrice : tempClose;

      // Ensure high/low are mathematically outer boundaries
      const high = Math.min(0.99, Math.max(open, close) + Math.random() * 0.04);
      const low = Math.max(0.01, Math.min(open, close) - Math.random() * 0.04);

      history.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: time.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        open: parseFloat(open.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
      });
    }

    return history;
  }

  private generateOrderbook(currentYesPrice: number) {
    const bids: Array<{ price: number; quantity: number }> = [];
    const asks: Array<{ price: number; quantity: number }> = [];

    // Bids (buyers willing to buy YES) - priced slightly below the current price
    for (let i = 1; i <= 5; i++) {
      const price = Math.max(0.01, currentYesPrice - i * 0.02);
      bids.push({
        price: parseFloat(price.toFixed(2)),
        quantity: Math.floor(Math.random() * 800) + 100,
      });
    }

    // Asks (sellers willing to sell YES) - priced slightly above current price
    for (let i = 1; i <= 5; i++) {
      const price = Math.min(0.99, currentYesPrice + i * 0.02);
      asks.push({
        price: parseFloat(price.toFixed(2)),
        quantity: Math.floor(Math.random() * 800) + 100,
      });
    }

    return {
      bids: bids.sort((a, b) => b.price - a.price), // highest bids first
      asks: asks.sort((a, b) => a.price - b.price), // lowest asks first
    };
  }
}
