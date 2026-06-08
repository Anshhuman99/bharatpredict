import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletTransactionRequestDto } from '@bharatpredict/types';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(@Query('userId') userId: string) {
    return await this.walletService.getWallet(userId);
  }

  @Post('deposit')
  async deposit(@Body() dto: WalletTransactionRequestDto) {
    return await this.walletService.deposit(dto);
  }

  @Post('withdraw')
  async withdraw(@Body() dto: WalletTransactionRequestDto) {
    return await this.walletService.withdraw(dto);
  }
}
