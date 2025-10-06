import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from "class-validator";

export class CreateHomeworkDto {
  @ApiProperty({ description: "Student ID" })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: "Section ID" })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ description: "Homework title" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: "Homework description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Points earned", minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  points: number;

  @ApiPropertyOptional({
    description: "Maximum possible points",
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxPoints?: number;

  @ApiPropertyOptional({
    description: "Due date",
    example: "2025-01-15T23:59:59.000Z",
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
