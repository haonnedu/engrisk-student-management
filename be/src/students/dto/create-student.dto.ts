import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { StudentStatus } from "@prisma/client";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateStudentDto {
  @ApiPropertyOptional({
    description:
      "Existing User ID to associate with this student (optional). If omitted, a new user will be created automatically with default password.",
    example: "clx1234567890",
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  userId?: string;

  @ApiProperty({
    description: "Student first name",
    example: "John",
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: "Student last name",
    example: "Doe",
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: "Student eng name",
    example: "John",
  })
  @IsString()
  @IsNotEmpty()
  engName: string;

  @ApiProperty({
    description: "Date of birth",
    example: "1995-01-15",
  })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: Date;

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
    description: "Emergency contact information",
    example: "Jane Doe - +0987654321",
  })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiPropertyOptional({
    description: "Class - School information",
    example: "12A1 - THPT Nguyen Du",
  })
  @IsString()
  @IsOptional()
  classSchool?: string;

  @ApiPropertyOptional({
    description: "Student status",
    enum: StudentStatus,
    default: StudentStatus.ACTIVE,
  })
  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus;
}
