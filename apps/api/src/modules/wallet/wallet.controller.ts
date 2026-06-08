import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletTransactionRequestDto } from '@bharatpredict/types';
import { AuthGuard } from '../auth/auth.guard';

@Controller('wallet')
@UseGuards(AuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(@Req() req: any) {
    return await this.walletService.getWallet(req.user.id);
  }

  @Post('deposit')
  async deposit(@Body() dto: WalletTransactionRequestDto, @Req() req: any) {
    dto.userId = req.user.id;
    return await this.walletService.deposit(dto);
  }

  @Post('withdraw')
  async withdraw(@Body() dto: WalletTransactionRequestDto, @Req() req: any) {
    dto.userId = req.user.id;
    return await this.walletService.withdraw(dto);
  }
}

