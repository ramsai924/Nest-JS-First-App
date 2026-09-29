import { MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import { TodosModule } from './Todos/Todos.module.js';
import { AuthModule } from './Auth/Auth.module.js';
import { LoggerMiddleware } from './common/Middleware/Logger.middleware.js';
import { FileUploadModule } from './FileUpload/fileUpload.module.js';
import { MongooseModule } from '@nestjs/mongoose'

@Module({
  imports: [
    MongooseModule.forRoot("mongodb://127.0.0.1:27017/nest"),
    AuthModule,
    TodosModule,
    FileUploadModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware) // Apply the LoggerMiddleware to all routes
      .forRoutes('*'); // Apply the LoggerMiddleware to all routes
  }
}
