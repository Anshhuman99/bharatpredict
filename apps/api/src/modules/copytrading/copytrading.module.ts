import { Module } from '@nestjs/common';
import { CopyTradingController } from './copytrading.controller';
import { CopyTradingService } from './copytrading.service';

@Module({
  controllers: [CopyTradingController],
  providers: [CopyTradingService],
  exports: [CopyTradingService],
})
export class CopyTradingModule {}
