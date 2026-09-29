import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema, Types } from "mongoose";
import { User } from "./User.schema.js";

@Schema()
export class Todo {
    @Prop({ required: true })
    title: string;

    @Prop()
    description: string;

    @Prop({ default: "pending", enum: ["pending", "in-progress", "completed"] })
    status: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
    userId: Types.ObjectId;
}

export const TodoSchema = SchemaFactory.createForClass(Todo);