import { Module } from "@nestjs/common";
import { FileUploadController } from "./fileUpload.controller.js";
import { FileUploadService } from "./fileUpload.service.js";
import { AuthService } from "../Auth/Auth.service.js";

@Module({
    controllers: [FileUploadController],
    providers: [FileUploadService, AuthService],
})

export class FileUploadModule {}