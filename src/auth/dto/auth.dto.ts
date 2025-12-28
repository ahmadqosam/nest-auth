import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { Role } from "../enums/role.enum";

export class AuthDto {
    /**
     * The email address of the user.
     * Must be a valid email format.
     */
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty({
        example: 'test@example.com',
        description: 'The email address of the user',
        required: true,
    })
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @ApiProperty({
        example: 'password',
        description: 'The password of the user',
        required: true,
    })
    password: string;

    @IsOptional()
    @IsEnum(Role, { message: 'Invalid role' })
    @ApiProperty({
        enum: Role,
        example: Role.User,
        description: 'The role of the user',
        required: false,
    })
    roles?: Role;
}