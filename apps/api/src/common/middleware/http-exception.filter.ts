import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Determine error message
    let message = 'Internal server error';
    let details: any = null;

    if (exception instanceof HttpException) {
      const resPayload = exception.getResponse();
      if (typeof resPayload === 'object' && resPayload !== null) {
        message = (resPayload as any).message || exception.message;
        details = (resPayload as any).error || null;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Extract request ID if added by logging middleware
    const requestId = request.headers['x-request-id'] || undefined;

    response.status(status).json({
      success: false,
      data: null,
      error: {
        message: Array.isArray(message) ? message[0] : message, // Standardize class-validator array messages
        code: status,
        details,
        requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
