import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Booking Platform E2E (Phase 7)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    let token: string;

    it('/api/v1/auth/register (POST) - should create a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ fullName: 'E2E User', email: 'e2e@example.com', password: 'StrongPassword123!' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('/api/v1/auth/login (POST) - should return JWT', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'e2e@example.com', password: 'StrongPassword123!' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.access_token).toBeDefined();
          token = res.body.data.access_token;
        });
    });
  });

  describe('Services API', () => {
    it('/api/v1/services (GET) - should list services', () => {
      return request(app.getHttpServer())
        .get('/api/v1/services')
        .expect(200);
    });
  });
});
