import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CopyTradingService } from './copytrading.service';
import { CopyTradingRequestDto } from '@bharatpredict/types';

@Controller('copytrading')
export class CopyTradingController {
  constructor(private readonly copyTradingService: CopyTradingService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  async startCopyTrading(@Body() dto: CopyTradingRequestDto) {
    return await this.copyTradingService.startCopyTrading(dto);
  }

  @Get('active')
  async getActiveRelations(@Query('userId') userId: string) {
    return await this.copyTradingService.getActiveRelations(userId);
  }
}
