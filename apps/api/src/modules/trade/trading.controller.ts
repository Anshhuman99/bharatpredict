import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { TradingService } from './trading.service';
import { TradeRequestDto, SellRequestDto } from '@bharatpredict/types';
import { AuthGuard } from '../auth/auth.guard';

@Controller('trade')
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  // POST /trade — buy YES or NO shares (secured)
  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async executeTrade(@Body() dto: TradeRequestDto, @Req() req: any) {
    dto.userId = req.user.id;
    return await this.tradingService.executeTrade(dto);
  }

  // GET /trade/preview?marketId=&side=&amount= — preview buy (no DB write)
  @Get('preview')
  async previewTrade(
    @Query('marketId') marketId: string,
    @Query('side') side: 'YES' | 'NO',
    @Query('amount') amount: string,
  ) {
    return await this.tradingService.previewTrade(marketId, side, parseFloat(amount));
  }

  // POST /trade/sell — sell shares back to AMM (secured)
  @Post('sell')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async executeSell(@Body() dto: SellRequestDto, @Req() req: any) {
    dto.userId = req.user.id;
    return await this.tradingService.executeSell(dto);
  }

  // GET /trade/sell-preview?marketId=&side=&shares= — preview sell (secured)
  @Get('sell-preview')
  @UseGuards(AuthGuard)
  async previewSell(
    @Query('marketId') marketId: string,
    @Req() req: any,
    @Query('side') side: 'YES' | 'NO',
    @Query('shares') shares: string,
  ) {
    return await this.tradingService.previewSell(marketId, req.user.id, side, parseFloat(shares));
  }
}

