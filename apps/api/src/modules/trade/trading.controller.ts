import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { TradingService } from './trading.service';
import { TradeRequestDto } from '@bharatpredict/types';

@Controller('trade')
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async executeTrade(@Body() dto: TradeRequestDto) {
    return await this.tradingService.executeTrade(dto);
  }

  @Get('preview')
  async previewTrade(
    @Query('marketId') marketId: string,
    @Query('side') side: 'YES' | 'NO',
    @Query('amount') amount: string,
  ) {
    return await this.tradingService.previewTrade(marketId, side, parseFloat(amount));
  }
}
