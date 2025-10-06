import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    description: "User email address or phone number",
    example: "admin@example.com or +84123456789",
  })
  @IsString()
  @IsNotEmpty()
  emailOrPhone: string;

  @ApiProperty({
    description: "User password",
    example: "password123",
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
