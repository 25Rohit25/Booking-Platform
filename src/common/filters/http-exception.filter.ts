import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const message =
      typeof errorResponse === 'string'
        ? errorResponse
        : (errorResponse as any).message || errorResponse;

    this.logger.error(
      `HTTP ${status} Error: ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      statusCode: status,
      error: exception instanceof HttpException ? exception.name : 'InternalServerError',
      message: message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
