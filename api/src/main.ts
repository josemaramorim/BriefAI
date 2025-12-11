import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';

import { Catch, ArgumentsHost, ExceptionFilter, Logger, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    Logger.error('Erro global', exception.stack || exception);
    
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : { message: 'Internal server error', statusCode: status };

    response.status(status).json({
      ...(typeof message === 'string' ? { message } : message),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Global error logging
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS configuration via environment variable
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : ['http://localhost:3000'];

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Swagger configuration
  const port = process.env.PORT || 3000;
  const config = new DocumentBuilder()
    .setTitle('BriefAI API')
    .setDescription('API for managing architectural briefs with AI assistance')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(`http://localhost:${port}`, 'Development')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
