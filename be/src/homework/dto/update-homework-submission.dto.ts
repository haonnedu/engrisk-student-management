import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsArray } from "class-validator";

export class UpdateHomeworkSubmissionDto {
  @ApiPropertyOptional({ description: "Comment from student/parent" })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({
    description: "Array of file IDs to add",
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fileIds?: string[];
}

