import { IUser } from "../Auth/models.js";
import { readData } from "./readData.js";
import { join } from "path";

export const checkAuthorization = async (token: string): Promise<IUser | undefined> => {
    const filePath = join(process.cwd(), 'src', 'Data', 'Users.json');
    const users = await readData(filePath);
    const user = users.find((user: { token: string }) => user.token === token);

    return user;
}