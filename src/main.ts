import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('NestJS Auth API')
    .setDescription('Secure Authentication with Refresh Tokens')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.getHttpAdapter().get('/openapi.json', (req, res) => {
    res.json(document);
  });

  app.use(
    '/docs',
    apiReference({
      spec: {
        content: document,
      }
    } as any)
  )

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
