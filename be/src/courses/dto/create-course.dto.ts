import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from "class-validator";
import { CourseStatus } from "@prisma/client";
import { IsEnum } from "class-validator";

export class CreateCourseDto {
  @ApiProperty({ description: "Unique course code", example: "CS101" })
  @IsString()
  @IsNotEmpty()
  courseCode: string;

  @ApiProperty({
    description: "Course title",
    example: "Introduction to Computer Science",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: "Course description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Course credits", example: 3 })
  @IsInt()
  @Min(1)
  @Max(10)
  credits: number;

  @ApiProperty({ description: "Duration in weeks", example: 12 })
  @IsInt()
  @IsPositive()
  duration: number;

  @ApiPropertyOptional({
    description: "Maximum number of students",
    example: 40,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(500)
  maxStudents?: number;

  @ApiPropertyOptional({ description: "Course status", enum: CourseStatus })
  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;
}

