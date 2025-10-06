import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
} from "class-validator";

export class RegisterDto {
  @ApiPropertyOptional({
    description: "User email address",
    example: "student@example.com",
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: "User password",
    example: "password123",
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: "First name",
    example: "John",
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: "Last name",
    example: "Doe",
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: "Eng name",
    example: "John",
  })
  @IsString()
  @IsNotEmpty()
  engName: string;

  @ApiPropertyOptional({
    description: "User role",
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    description: "Date of birth (for students)",
    example: "1995-01-15",
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional({
    description: "Phone number",
    example: "+1234567890",
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: "Address",
    example: "123 Main St, City, State",
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: "Position (for admin users)",
    example: "Academic Coordinator",
  })
  @IsString()
  @IsOptional()
  position?: string;
}
