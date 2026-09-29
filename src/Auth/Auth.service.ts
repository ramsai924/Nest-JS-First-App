import { NotFoundException } from "@nestjs/common";
import { IUser } from "./models.js";
import { v4 as uuidv4 } from 'uuid';
import { unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { readData } from "../utils/readData.js";

export class AuthService {
    private readonly filePath = join(process.cwd(), 'src', 'Data', 'Users.json');

    async signup(userInfo: Pick<IUser, 'username' | 'email' | 'password' | 'role'>): Promise<IUser> {
        const user: IUser = { ...userInfo, id: uuidv4(), token: `${uuidv4()}-${new Date().getTime()}` };

        const users: IUser[] = await readData(this.filePath);
        users.push(user);
        await writeFile(this.filePath, JSON.stringify(users, null, 2), 'utf-8');

        return user;
    }

    async signIn(email: string, password: string): Promise<{ token: string }> {
        const users: IUser[] = await readData(this.filePath);
        const user = users.find((u) => u.email === email && u.password === password);

        if (!user) {
            throw new NotFoundException("Invalid email or password");
        }

        return { token: user.token! };
    }

    async getUserById(id: string): Promise<IUser> {
        const users: IUser[] = await readData(this.filePath);
        const user = users.find((u) => u.id === id);
        if (!user) {
            throw new NotFoundException("User not found");
        }
        return user;
    }

    async getAllUsers(): Promise<IUser[]> {
        const users: IUser[] = await readData(this.filePath);
        if(users.length === 0) {
            throw new NotFoundException("No users found in DB");
        }
        return users;
    }

    async updateUserProfile(
        file: Express.Multer.File,
        userId: string,
    ): Promise<IUser> {
        const users: IUser[] = await readData(this.filePath);

        const user = users.find((u) => u.id === userId);

        if (!user) {
            // Delete uploaded file because user doesn't exist
            await unlink(file.path);

            throw new NotFoundException("No user found in DB");
        }

        user.profilePhoto = file.filename;

        await writeFile(
            this.filePath,
            JSON.stringify(users, null, 2),
            "utf-8",
        );

        return user;
    }
}