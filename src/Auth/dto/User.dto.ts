import { IsEmail, IsNotEmpty, IsString, Max, MaxLength, MinLength, IsIn } from "class-validator";

const ALLOWED_ROLES = ['admin', 'user'] as const;

export class UserDto {
    @IsNotEmpty()
    @IsString()
    username!: string;

    @IsNotEmpty()
    @IsEmail()
    email!: string;
    
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    @MaxLength(15)
    password!: string;

    @IsNotEmpty()
    @IsString()
    @IsIn(ALLOWED_ROLES)
    role!: "admin" | "user";
}