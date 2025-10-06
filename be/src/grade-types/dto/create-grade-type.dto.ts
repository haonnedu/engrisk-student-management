import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from "class-validator";

export class CreateGradeTypeDto {
  @ApiProperty({ description: "Grade type name", example: "Assignment" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "Grade type code", example: "ASSIGNMENT" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: "Grade type description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: "Weight for calculating average",
    minimum: 0.1,
    maximum: 10.0,
    default: 1.0,
  })
  @IsNumber()
  @Min(0.1)
  @Max(10.0)
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({
    description: "Whether the grade type is active",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: "Sort order for display",
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
