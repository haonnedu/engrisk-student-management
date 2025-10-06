import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from "class-validator";
import { AttendanceStatus } from "@prisma/client";

export class CreateAttendanceDto {
  @ApiProperty({ description: "Section ID" })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ description: "Student ID" })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: "Attendance date", example: "2025-01-15" })
  @IsDateString()
  date: string;

  @ApiProperty({ description: "Attendance status", enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ description: "Optional note" })
  @IsString()
  @IsOptional()
  note?: string;
}
