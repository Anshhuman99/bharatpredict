import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { CopyTradingService } from './copytrading.service';
import { CopyTradingRequestDto } from '@bharatpredict/types';
import { AuthGuard } from '../auth/auth.guard';

@Controller('copytrading')
@UseGuards(AuthGuard)
export class CopyTradingController {
  constructor(private readonly copyTradingService: CopyTradingService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  async startCopyTrading(@Body() dto: CopyTradingRequestDto, @Req() req: any) {
    dto.copierId = req.user.id;
    return await this.copyTradingService.startCopyTrading(dto);
  }

  @Get('active')
  async getActiveRelations(@Req() req: any) {
    return await this.copyTradingService.getActiveRelations(req.user.id);
  }
}

