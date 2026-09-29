import { Module } from "@nestjs/common"
import { AuthController } from "./Auth.controller.js";
import { AuthService } from "./Auth.service.js";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../Schemas/User.schema.js";
import { AuthGuard } from "../common/Gaurds/auth.gaurd.js";

@Module({
    imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
    controllers: [AuthController],
    providers: [AuthService, AuthGuard],
    exports: [AuthGuard, MongooseModule],
})

export class AuthModule {}