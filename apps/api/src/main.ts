import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { TransformInterceptor } from './common/middleware/transform.interceptor';
import { HttpExceptionFilter } from './common/middleware/http-exception.filter';
import { loadEnvironment } from './common/utils/config.loader';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // 1. Load and validate environment variables at startup
  const config = loadEnvironment();
  
  const app = await NestFactory.create(AppModule);

  // Security headers using Helmet, adjusted to allow WebSocket connections
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled for easy local dev testing
    }),
  );

  // Enable CORS for frontend connection
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // 2. Set global API versioning and prefixes
  app.setGlobalPrefix('api/v1');

  // 3. Register global validation DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 4. Register global interceptors & filters
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = config.PORT;
  await app.listen(port);
  
  logger.log(`===============================================`);
  logger.log(`🚀 BHARATPREDICT BACKEND RUNNING ON PORT ${port}`);
  logger.log(`📂 API BASE ROUTE URL: http://localhost:${port}/api/v1`);
  logger.log(`===============================================`);
}
bootstrap();
