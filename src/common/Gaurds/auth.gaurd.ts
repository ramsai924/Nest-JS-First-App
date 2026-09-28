import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";

import { Request } from "express";
import { checkAuthorization } from "../../utils/Authorization.js";

@Injectable()
export class AuthGuard implements CanActivate {

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

        const user = await checkAuthorization(token);

        if (!user) {
            throw new UnauthorizedException(
                "Unauthorized access",
            );
        }

        request.user = user;

        return true;
    }
}