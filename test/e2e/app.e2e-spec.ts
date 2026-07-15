import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from 'src/app';
import { configureApp } from 'src/middleware';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bodyParser: false });
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET / returns handleResponse envelope', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({
        statusCode: 200,
        statusType: 'OK',
        message: 'OK',
        data: { message: 'Hello World!' },
      });
  });

  it('GET /health returns handleResponse envelope with up status', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({
        statusCode: 200,
        statusType: 'OK',
        message: 'OK',
        data: { status: 'up' },
      });
  });

  it('GET /health/ready returns 503 when dependencies are not configured', () => {
    return request(app.getHttpServer())
      .get('/health/ready')
      .expect(503)
      .expect((res) => {
        const body = res.body as {
          statusCode: number;
          statusType: string;
          message: string;
          data: unknown;
        };
        expect(body.statusCode).toBe(503);
        expect(body.statusType).toBe('SERVICE_UNAVAILABLE');
        expect(body.message).toBe('Service Unavailable');
        expect(body.data).toBeDefined();
      });
  });
});
