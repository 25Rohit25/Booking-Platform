import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';

describe('Booking Platform E2E (Phase 7)', () => {
  let app: INestApplication;
  let token: string;
  let refreshToken: string;
  const testEmail = `e2e-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'api/v',
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('/api/v1/auth/register (POST) - should create a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ fullName: 'E2E User', email: testEmail, password: 'StrongPassword123!' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('/api/v1/auth/login (POST) - should return JWT', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'StrongPassword123!' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.access_token).toBeDefined();
          expect(res.body.data.refresh_token).toBeDefined();
          token = res.body.data.access_token;
          refreshToken = res.body.data.refresh_token;
        });
    });

    it('/api/v1/auth/refresh (POST) - should refresh JWT', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.access_token).toBeDefined();
          expect(res.body.data.refresh_token).toBeDefined();
          // Update tokens for subsequent requests
          token = res.body.data.access_token;
          refreshToken = res.body.data.refresh_token;
        });
    });

    it('/api/v1/auth/logout (POST) - should logout user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Services API', () => {
    it('/api/v1/services (GET) - should list services', () => {
      return request(app.getHttpServer())
        .get('/api/v1/services')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
