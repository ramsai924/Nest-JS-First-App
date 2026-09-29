import { BadRequestException, Controller, FileTypeValidator, MaxFileSizeValidator, ParseFilePipe, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { Message } from "../common/decorators/message.decorator.js";

const ALLOWED_FILETYPES = [
    "image/jpeg",
    "image/png",
    "application/pdf",
];

@Controller('file')
export class FileUploadController {
    constructor() {}

    @Post("/upload")
    @UseInterceptors(
        FileInterceptor("file", {
            limits: {
                fileSize: 5 * 1024 * 1024, // 5 MB
            },

            fileFilter: (req, file, callback) => {

                if (!ALLOWED_FILETYPES.includes(file.mimetype)) {
                    return callback(
                        new BadRequestException(
                            "Only JPG, PNG and PDF files are allowed",
                        ),
                        false,
                    );
                }

                callback(null, true);
            },

            storage: diskStorage({
                destination: "./uploads",
                filename: (req, file, callback) => {
                    const filename =
                        `${Date.now()}-${Math.round(Math.random() * 1e9)}` +
                        extname(file.originalname);

                    callback(null, filename);
                },
            }),
        }),
    )
    @Message("File uploaded successfully!!")
    async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<any> {
        return {
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            path: file.path,
        }
    }
}