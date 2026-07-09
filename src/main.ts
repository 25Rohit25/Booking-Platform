import { NestFactory } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // Fix Decimal serialization leak natively:
  // Intercept Prisma's Decimal.toJSON and cast it to a JS Number globally
  // This avoids O(N) recursive object mapping on every request.
  (Prisma.Decimal.prototype as any).toJSON = function () {
    return this.toNumber();
  };

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until Pino is ready
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;

  // 1. Logger
  app.useLogger(app.get(PinoLogger));
  const logger = new Logger('Bootstrap');

  // 2. Security Middleware
  app.use(helmet());
  app.enableCors({
    origin: '*', // TODO: Update with specific origins in production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 3. Compression
  app.use(compression());

  // 4. API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // 5. Global Pipes, Filters, and Interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have any decorators
      transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
      forbidNonWhitelisted: true, // Throw errors if non-whitelisted values are provided
      transformOptions: {
        enableImplicitConversion: true, // Allow primitive type conversion
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // 6. Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Booking Platform API')
    .setDescription('The robust backend for the Booking Platform.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // 7. Graceful Shutdown
  app.enableShutdownHooks();

  // 8. Start Server
  await app.listen(port);
  logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
