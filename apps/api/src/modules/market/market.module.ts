import { Module } from '@nestjs/common';
import { MarketsController } from './markets.controller';
import { AdminController } from './admin.controller';
import { MarketsService } from './markets.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [NotificationsModule, GamificationModule],
  controllers: [MarketsController, AdminController],
  providers: [MarketsService],
  exports: [MarketsService],
})
export class MarketModule {}
