import { IUser } from "../Auth/models.js";

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

export {};