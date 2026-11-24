import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonLogger } from './utils/winston-logger';
// Import models to ensure associations are initialized
import './models/index';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Replace Nest's default logger with Winston (Console + optional CloudWatch)
  try {
    app.useLogger(new WinstonLogger());
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to initialize Winston logger for Nest, using default logger', e);
  }

  // Lightweight request logger to help debug auth/route access during development
  app.use((req: any, _res: any, next: any) => {
    try {
      const hasAuth = Boolean(req.headers && req.headers.authorization);
      // eslint-disable-next-line no-console
      console.log('[req-log]', req.method, req.originalUrl || req.url, 'authHeader=', hasAuth);
    } catch {}
    next();
  });

  const apiPrefixFromEnv = process.env.API_PREFIX ?? 'api/v1';
  const normalizedApiPrefix = apiPrefixFromEnv.replace(/^\/+|\/+$/g, '');
  const swaggerPath = 'api-docs';

  app.setGlobalPrefix(normalizedApiPrefix);

  // Swagger/OpenAPI setup; expose docs under the versioned API prefix
  const config = new DocumentBuilder()
    .setTitle('TBT API')
    .setDescription('API documentation for TBT backend')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter JWT token',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(swaggerPath, app, document, {
    useGlobalPrefix: true,
  });

  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
