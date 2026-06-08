import { Controller, Post, Get, Body, Param, Put, BadRequestException } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly marketsService: MarketsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('markets')
  async createMarket(@Body() dto: {
    title: string;
    description: string;
    category: string;
    image: string;
    endDate: string;
    liquidity?: number;
    aiConfidence?: number;
    marketSentiment?: string;
    trendingNarrative?: string;
  }) {
    return await this.marketsService.createMarket(dto);
  }

  @Post('markets/:id/resolve')
  async resolveMarket(
    @Param('id') id: string,
    @Body() dto: { outcome: 'YES' | 'NO' },
  ) {
    if (!dto.outcome) {
      throw new BadRequestException('Outcome is required (YES or NO)');
    }
    return await this.marketsService.resolveMarket(id, dto.outcome);
  }

  @Get('trades')
  async getTradesMonitor() {
    // Audit recent trades across the exchange for risk monitoring
    const trades = await this.prisma.trade.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { username: true } },
        market: { select: { title: true } },
      },
    });

    // Simple automated anomaly detection: flag trades above ₹10,000 as high risk
    const alerts = trades
      .filter((t) => t.amount >= 10000)
      .map((t) => ({
        id: t.id,
        message: `High risk trade: User "${t.user.username}" invested ₹${t.amount.toFixed(2)} on "${t.market.title}"`,
        severity: 'WARNING',
        timestamp: t.createdAt,
      }));

    return {
      success: true,
      trades,
      alerts,
    };
  }

  @Put('users/:id/suspend')
  async suspendUser(@Param('id') id: string, @Body() dto: { suspend: boolean }) {
    // Sandbox simulation: flag status in console or return success
    return {
      success: true,
      userId: id,
      suspended: dto.suspend,
      message: `User ${id} suspension status set to ${dto.suspend}`,
    };
  }
}
