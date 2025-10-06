import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class CreateGradeDto {
  @ApiProperty({ description: "Student ID" })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: "Course ID" })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ description: "Grade Type ID" })
  @IsString()
  @IsNotEmpty()
  gradeTypeId: string;

  @ApiProperty({ description: "Grade value (0-100)", example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  grade: number;

  @ApiPropertyOptional({ description: "Optional comments" })
  @IsString()
  @IsOptional()
  comments?: string;
}
