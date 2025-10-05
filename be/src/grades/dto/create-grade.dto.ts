import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { GradeType } from "@prisma/client";

export class CreateGradeDto {
  @ApiProperty({ description: "Student ID" })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: "Course ID" })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ description: "Grade value (0-100)", example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  grade: number;

  @ApiProperty({ description: "Type of grade", enum: GradeType })
  @IsEnum(GradeType)
  gradeType: GradeType;

  @ApiPropertyOptional({ description: "Optional comments" })
  @IsString()
  @IsOptional()
  comments?: string;
}

