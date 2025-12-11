import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
} from "class-validator";

export class CreateHomeworkSubmissionDto {
  @ApiProperty({ description: "Homework ID" })
  @IsString()
  @IsNotEmpty()
  homeworkId: string;

  @ApiPropertyOptional({ description: "Comment from student/parent" })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({
    description: "Array of file IDs (after upload)",
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fileIds?: string[];
}

