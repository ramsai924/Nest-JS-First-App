import { Module } from "@nestjs/common";
import { FileUploadController } from "./fileUpload.controller.js";
import { FileUploadService } from "./fileUpload.service.js";

@Module({
    controllers: [FileUploadController],
    providers: [FileUploadService],
})

export class FileUploadModule {}