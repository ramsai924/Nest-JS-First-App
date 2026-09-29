import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Request } from "express";
import { User } from "../../Schemas/User.schema.js";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {

        const request =
            context.switchToHttp().getRequest<Request>();

        const token =
            request.headers.authorization?.split(" ")[1];

        if (!token) {
            throw new UnauthorizedException(
                "Authorization token is missing",
            );
        }

        const user = await this.userModel.findOne({ token }).select("_id username email role profilePhoto");

        if (!user) {
            throw new UnauthorizedException(
                "Unauthorized access",
            );
        }

        request.user = { ...user.toObject(), _id: user._id.toString() };

        return true;
    }
}