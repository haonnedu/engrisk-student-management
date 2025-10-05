import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StudentStatus } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({
    description: 'User ID to associate with this student',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Student first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Student last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1995-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: Date;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Address',
    example: '123 Main St, City, State',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact information',
    example: 'Jane Doe - +0987654321',
  })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiPropertyOptional({
    description: 'Student status',
    enum: StudentStatus,
    default: StudentStatus.ACTIVE,
  })
  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus;
}
