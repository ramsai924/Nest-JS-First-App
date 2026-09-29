import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { IUser } from "./models.js";
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from "@nestjs/mongoose";
import { User } from "../Schemas/User.schema.js";
import { Model } from "mongoose";
import { UserDto } from "./dto/User.dto.js";

@Injectable()
export class AuthService {
    constructor(@InjectModel(User.name) private UserModel: Model<User>){}

    async signup(userInfo: UserDto): Promise<IUser> {
        const user = { ...userInfo, token: `${uuidv4()}-${new Date().getTime()}` };

        try {
            const createdUser = await this.UserModel.create(user);
            return { ...createdUser.toObject(), _id: createdUser._id.toString() } as IUser;
        } catch (error) {
            if (
                typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === 11000
            ) {
                throw new ConflictException("An account with this email already exists");
            }
            throw new InternalServerErrorException("Unable to create user");
        }
    }

    async signIn(email: string, password: string): Promise<{ token: string }> {
        const user = await this.UserModel.findOne({ email, password });

        if (!user || !user.token) {
            throw new NotFoundException("Invalid email or password");
        }

        return { token: user.token };
    }

    async getUserById(id: string): Promise<IUser> {
        const user = await this.UserModel.findById(id)
        if (!user) {
            throw new NotFoundException("User not found");
        }
        return { ...user.toObject(), _id: user._id.toString() } as IUser;
    }

    async getAllUsers(): Promise<IUser[]> {
        const users = await this.UserModel.find()
        if(users.length === 0) {
            throw new NotFoundException("No users found in DB");
        }
        return users.map((user) => ({ ...user.toObject(), _id: user._id.toString() }) as IUser);
    }

    // async updateUserProfile(
    //     file: Express.Multer.File,
    //     userId: string,
    // ): Promise<IUser> {
    //     const users: IUser[] = await readData(this.filePath);

    //     const user = users.find((u) => u.id === userId);

    //     if (!user) {
    //         // Delete uploaded file because user doesn't exist
    //         await unlink(file.path);

    //         throw new NotFoundException("No user found in DB");
    //     }

    //     user.profilePhoto = file.filename;

    //     await writeFile(
    //         this.filePath,
    //         JSON.stringify(users, null, 2),
    //         "utf-8",
    //     );

    //     return user;
    // }
}