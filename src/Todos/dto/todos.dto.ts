import { IsDate, IsEnum, IsIn, IsNotEmpty, IsString } from "class-validator";
import { TodoStatus } from "../models.js";

export class TodosDto {
    @IsNotEmpty({ message: "Title is required" })
    title: string;

    @IsString({ message: "Description must be a string" })
    description: string;

    @IsNotEmpty({
        message: "Status is required",
    })
    @IsEnum(TodoStatus, {
        message: "Status must be pending, in-progress, or completed",
    })
    status: TodoStatus;
}