import { SetMetadata } from "@nestjs/common";

export const RESPONSE_MESSAGE = "response_message";

export const Message = (message: string) =>
    SetMetadata(RESPONSE_MESSAGE, message);