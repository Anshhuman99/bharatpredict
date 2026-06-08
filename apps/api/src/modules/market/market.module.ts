import { Module } from '@nestjs/common';
import { MarketsController } from './markets.controller';
import { AdminController } from './admin.controller';
import { MarketsService } from './markets.service';

@Module({
  controllers: [MarketsController, AdminController],
  providers: [MarketsService],
  exports: [MarketsService],
})
export class MarketModule {}
