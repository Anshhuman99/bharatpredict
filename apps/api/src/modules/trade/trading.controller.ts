import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { TradingService } from './trading.service';
import { TradeRequestDto, SellRequestDto } from '@bharatpredict/types';

@Controller('trade')
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  // POST /trade — buy YES or NO shares
  @Post()
  @HttpCode(HttpStatus.OK)
  async executeTrade(@Body() dto: TradeRequestDto) {
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

  // POST /trade/sell — sell shares back to AMM and receive cash
  @Post('sell')
  @HttpCode(HttpStatus.OK)
  async executeSell(@Body() dto: SellRequestDto) {
    return await this.tradingService.executeSell(dto);
  }

  // GET /trade/sell-preview?marketId=&userId=&side=&shares= — preview sell (no DB write)
  @Get('sell-preview')
  async previewSell(
    @Query('marketId') marketId: string,
    @Query('userId') userId: string,
    @Query('side') side: 'YES' | 'NO',
    @Query('shares') shares: string,
  ) {
    return await this.tradingService.previewSell(marketId, userId, side, parseFloat(shares));
  }
}
