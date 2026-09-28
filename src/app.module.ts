import { MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import { TodosModule } from './Todos/Todos.module.js';
import { AuthModule } from './Auth/Auth.module.js';
import { LoggerMiddleware } from './common/Middleware/Logger.middleware.js';

@Module({
  imports: [
    AuthModule,
    TodosModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware) // Apply the LoggerMiddleware to all routes
      .forRoutes('*'); // Apply the LoggerMiddleware to all routes
  }
}
