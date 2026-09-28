import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map, Observable } from "rxjs";
import { RESPONSE_MESSAGE } from "../decorators/message.decorator.js";

interface Response<T> {
    data: T;
    statusCode: number;
    message: string;
}

// 1. Interceptors are used to transform the response before sending it back to the client. 
// In this case, the TransformInterceptor is used to standardize the response format for all API responses.

@Injectable()
export class TransformInterceptor implements NestInterceptor<any, Response<any>> {

    constructor(private readonly reflector: Reflector) { }

    intercept(
        context: ExecutionContext,
        next: CallHandler<any>,
    ): Observable<Response<any>> {

        const customMessage =
            this.reflector.get<string>(
                RESPONSE_MESSAGE,
                context.getHandler(),
            ) || "Request successful";
            
        return next.handle().pipe(map((data: any) => {
            return {
                data: data,
                statusCode: context.switchToHttp().getResponse().statusCode,
                message: customMessage
            };
        }));
    }   
}