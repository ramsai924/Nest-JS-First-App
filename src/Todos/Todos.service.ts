import { ITodo } from "./models.js";
import { TodosDto } from "./dto/todos.dto.js";
import { InjectModel } from "@nestjs/mongoose";
import { Todo } from "../Schemas/Todo.schema.js";
import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";

@Injectable()
export class TodoService {
    constructor(@InjectModel(Todo.name) private TodoModel: Model<Todo>){}

    async getUserTodos(userId: string): Promise<ITodo[]> {
        const todos: ITodo[] = await this.TodoModel.find()
        return todos.filter((todo) => todo.userId?.toString() === userId);
    }

    async createTodo(todo: TodosDto, userId: string): Promise<ITodo> {
        const newTodo: ITodo = {
            ...todo,
            userId: userId,
        };
        const createdTodo = await this.TodoModel.create(newTodo)
        const todoObject = createdTodo.toObject();
        return {
            ...todoObject,
            _id: createdTodo._id?.toString(),
            userId: todoObject.userId.toString(),
        } as ITodo;
    }
}