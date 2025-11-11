import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";

class BulkHomeworkItemDto {
  @ApiProperty({ description: "Student ID" })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: "Points earned", minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  points: number;
}

export class BulkCreateHomeworkDto {
  @ApiProperty({ description: "Section ID (class section)" })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ description: "Homework title (applies to all items)" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: "Homework description (optional)" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: "Maximum possible points (applies to all items)",
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxPoints?: number;

  @ApiPropertyOptional({
    description: "Due date (applies to all items)",
    example: "2025-01-15T23:59:59.000Z",
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({
    description: "List of student homework scores",
    type: [BulkHomeworkItemDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BulkHomeworkItemDto)
  items: BulkHomeworkItemDto[];
}


