import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/Interceptors/transform.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable incoming request validation and transformation
  app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector))); 

  // Enable global validation pipe with whitelist and transformation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const PORT = process.env.PORT ?? 3000
  console.log("App running on PORT : ", PORT)
  await app.listen(PORT);
}
await bootstrap();
