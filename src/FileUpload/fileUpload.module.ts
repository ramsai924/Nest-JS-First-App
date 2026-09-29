import { Module } from "@nestjs/common";
import { FileUploadController } from "./fileUpload.controller.js";
import { FileUploadService } from "./fileUpload.service.js";
import { AuthService } from "../Auth/Auth.service.js";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../Schemas/User.schema.js";

@Module({
    imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
    controllers: [FileUploadController],
    providers: [FileUploadService, AuthService],
})

export class FileUploadModule {}