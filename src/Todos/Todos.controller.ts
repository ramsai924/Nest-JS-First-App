import { Body, Controller, Get, Param, Post, Request, UseGuards } from "@nestjs/common";
import { TodoService } from "./Todos.service.js";
import type { ITodo } from "./models.js";
import { TodosDto } from "./dto/todos.dto.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import type { IUser } from "../Auth/models.js";
import { Message } from "../common/decorators/message.decorator.js";
import { AuthGuard } from "../common/Gaurds/auth.gaurd.js";

@Controller('todos')
@UseGuards(AuthGuard) // Apply the AuthGuard to all routes in this controller
export class TodosController {
    constructor(private readonly todoService: TodoService) {}

    @Post("/create")
    async createTodo(@Body() body: TodosDto, @CurrentUser() user: IUser): Promise<ITodo> {
        return this.todoService.createTodo(body, user._id);
    }

    @Get('/user')
    @Message("User todos fetched successfully!!")
    async getAllTodosByUser(@CurrentUser() user: IUser): Promise<ITodo[]> {
        return this.todoService.getUserTodos(user._id);
    }
}