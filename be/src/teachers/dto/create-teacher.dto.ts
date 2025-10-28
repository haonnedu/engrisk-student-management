import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from "class-validator";
import { Transform } from "class-transformer";
import { TeacherStatus } from "@prisma/client";

export class CreateTeacherDto {
 @ApiPropertyOptional({
    description:
      "Existing User ID to associate with this teacher (optional). If omitted, a new user will be created automatically with default password.",
    example: "clx1234567890",
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  teacherId?: string;

  @ApiProperty({ description: "Teacher first name" })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: "Teacher last name" })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: "Teacher phone" })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ description: "Teacher address" })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: "Teacher position" })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ description: "Teacher status" })
  @IsEnum(TeacherStatus)
  @IsOptional()
  status?: TeacherStatus;
}