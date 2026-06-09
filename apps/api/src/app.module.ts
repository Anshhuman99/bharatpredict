import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { AuthModule } from './modules/auth/auth.module';
import { MarketModule } from './modules/market/market.module';
import { TradeModule } from './modules/trade/trade.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { CommentsModule } from './modules/comments/comments.module';
import { CopyTradingModule } from './modules/copytrading/copytrading.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { UsersModule } from './modules/users/users.module';
import { AppController } from './app.controller';
import { LoggingMiddleware } from './common/middleware/logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RealtimeModule,
    AuthModule,
    MarketModule,
    TradeModule,
    WalletModule,
    PortfolioModule,
    CommentsModule,
    CopyTradingModule,
    PaymentsModule,
    NotificationsModule,
    GamificationModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
