import { Module } from "@nestjs/common";
import { TodosController } from "./Todos.controller.js";
import { TodoService } from "./Todos.service.js";


@Module({
    controllers: [
        TodosController,
    ],
    providers: [
        TodoService,
    ],
})
export class TodosModule { }