import { Module } from "@nestjs/common";
import { TodosController } from "./Todos.controller.js";
import { TodoService } from "./Todos.service.js";
import { AuthModule } from "../Auth/Auth.module.js";
import { MongooseModule } from "@nestjs/mongoose";
import { Todo, TodoSchema } from "../Schemas/Todo.schema.js";


@Module({
    imports: [AuthModule, MongooseModule.forFeature([
        { name: Todo.apply.name, schema: TodoSchema }
    ])],
    controllers: [
        TodosController,
    ],
    providers: [
        TodoService,
    ],
})
export class TodosModule { }