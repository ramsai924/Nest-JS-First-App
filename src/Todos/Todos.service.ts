import { ITodo } from "./models.js";
import { writeFile } from 'fs/promises';
import { join } from 'path'
import { readData } from "../utils/readData.js";
import { v4 } from 'uuid';
import { TodosDto } from "./dto/todos.dto.js";

export class TodoService {

    private readonly filepath = join(process.cwd(), 'src', 'Data', 'Todos.json');
   
    async getAllTodos(): Promise<ITodo[]> {
        const todos: ITodo[] = await readData(this.filepath);
        return todos;
    }

    async getUserTodos(userId: string): Promise<ITodo[]> {
        const todos: ITodo[] = await this.getAllTodos();
        return todos.filter((todo) => todo.userId === userId);
    }

    async createTodo(todo: TodosDto, userId: string): Promise<ITodo> {
        const todos: ITodo[] = await this.getAllTodos();
        const newTodo: ITodo = {
            ...todo,
            userId: userId,
            id: v4(),
            createdAt: new Date(),
        };
        todos.push(newTodo);
        await writeFile(this.filepath, JSON.stringify(todos));
        return newTodo;
    }
}