import { Module } from '@nestjs/common';
import { CopyTradingController } from './copytrading.controller';
import { CopyTradingService } from './copytrading.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CopyTradingController],
  providers: [CopyTradingService],
  exports: [CopyTradingService],
})
export class CopyTradingModule {}
