import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getPortfolio(@Req() req: any) {
    return {
      success: true,
      data: await this.portfolioService.getPortfolio(req.user.id),
      error: null
    };
  }
}

