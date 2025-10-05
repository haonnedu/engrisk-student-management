import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { EnrollmentStatus } from "@prisma/client";

export class CreateEnrollmentDto {
  @ApiProperty({ description: "Student ID", example: "clx_student_1" })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: "Course ID", example: "clx_course_1" })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiPropertyOptional({
    description: "Enrollment status",
    enum: EnrollmentStatus,
  })
  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus;
}

