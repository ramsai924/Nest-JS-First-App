import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class User {
    @Prop({ required: true })
    username: string;

    @Prop({ unique: true, required: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true, enum: ["user", "admin"]})
    role: string;

    @Prop()
    profilePhoto?: string;

    @Prop()
    token?: string;
}

export const UserSchema = SchemaFactory.createForClass(User)