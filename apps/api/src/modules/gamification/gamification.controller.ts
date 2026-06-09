import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('gamification')
@UseGuards(AuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('stats')
  async getStats(@Req() req: any) {
    const data = await this.gamificationService.getStats(req.user.id);
    return {
      success: true,
      data,
    };
  }

  @Post('claim-free')
  async claimFree(@Req() req: any) {
    const data = await this.gamificationService.claimDailyFreePrediction(req.user.id);
    return {
      success: true,
      data,
    };
  }
}
