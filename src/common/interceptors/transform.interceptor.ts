import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => {
        const isSuccess =
          response.statusCode >= 200 && response.statusCode < 300;
        return {
          success: isSuccess,
          message: data?.message || 'Success',
          data: data?.data ?? data, // If data already has a message/data structure, otherwise wrap it
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
