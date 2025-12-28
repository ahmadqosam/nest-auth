import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);

    // cleanup
    await prisma.user.deleteMany({
      where: { email: 'e2e@test.com' }
    });
  });

  afterAll(async () => {
    // cleanup
    await prisma.user.deleteMany({
      where: { email: 'e2e@test.com' }
    });
    await app.close();
  });

  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  it('/auth/signup (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'e2e@test.com',
        password: 'password123',
      })
      .expect(201);

    expect(response.body).toEqual({
      access_token: expect.any(String),
      refresh_token: expect.any(String),
    });

    accessToken = response.body.access_token;
    refreshToken = response.body.refresh_token;
  });

  it('/profile (GET) - Invalid Token', async () => {
    const response = await request(app.getHttpServer())
      .get('/profile')
      .set('Authorization', `Bearer invalid_token`)
      .expect(401);
  });

  it('/profile (GET) - Valid Token', async () => {
    const response = await request(app.getHttpServer())
      .get('/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('email', 'e2e@test.com');
    expect(response.body).toHaveProperty('userId');
    userId = response.body.userId;
  });

  it('/auth/signin (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'e2e@test.com',
        password: 'password123',
      })
      .expect(200);

    expect(response.body).toEqual({
      access_token: expect.any(String),
      refresh_token: expect.any(String),
    });

    accessToken = response.body.access_token;
    refreshToken = response.body.refresh_token;
  });

  it('/auth/refresh (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        userId: userId,
        refreshToken: refreshToken,
      })
      .expect(200);

    expect(response.body).toEqual({
      access_token: expect.any(String),
      refresh_token: expect.any(String),
    });

    accessToken = response.body.access_token;
    refreshToken = response.body.refresh_token;
  });

  it('/auth/logout (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
