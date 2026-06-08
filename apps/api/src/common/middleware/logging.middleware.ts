import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl } = req;
    
    // Generate simple high-fidelity request ID if not provided
    const requestId = (req.headers['x-request-id'] as string) || 
      `req-${Math.random().toString(36).substring(2, 11)}-${Date.now().toString().slice(-4)}`;
    
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const contentLen = res.get('content-length') || 0;

      this.logger.log(
        `[${requestId}] ${method} ${originalUrl} ${statusCode} - ${contentLen}b - ${duration}ms`,
      );
    });

    next();
  }
}
