import { Body, Controller, Get, NotFoundException, Param, Post, Request, UseGuards } from "@nestjs/common";
import { AuthService } from "./Auth.service.js";
import { UserDto } from "./dto/User.dto.js";
import type { IUser } from "./models.js";
import { Message } from "../common/decorators/message.decorator.js";
import { RolesGuard } from "../common/Gaurds/roles.gaurd.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import { AuthGuard } from "../common/Gaurds/auth.gaurd.js";

@Controller("auth")

export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('/signup')
    @Message("User created successfully!!")
    async signup(@Body() body: UserDto): Promise<IUser> {
        return this.authService.signup(body);
    }

    @Get('/get-all-users')
    @UseGuards(AuthGuard, RolesGuard)
    @Message("Users fetched successfully!!")
    async getAllUsers(): Promise<IUser[]> {
        return this.authService.getAllUsers();
    }

    @Get("/user/info")
    @UseGuards(AuthGuard)
    @Message("User info fetched successfully!!")
    async getUserById(@CurrentUser() user: IUser): Promise<IUser> {
        if(user && user.id) {
            return this.authService.getUserById(user.id);
        }

        throw new NotFoundException("User not found");
    }

    @Post("/signin")
    @Message("User signed in successfully!!")
    async signIn(@Body() body: { email: string; password: string }): Promise<{ token: string }> {
        return this.authService.signIn(body.email, body.password);
    }
}