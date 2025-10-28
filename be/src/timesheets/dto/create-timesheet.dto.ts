import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsDateString, IsOptional, Min, Max } from 'class-validator';

export class CreateTimesheetDto {
  @ApiProperty({
    description: 'Date of the timesheet',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  date: Date;

  @ApiProperty({
    description: 'Hours worked',
    example: 8,
    minimum: 0,
    maximum: 24,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(24)
  hoursWorked: number;

  @ApiProperty({
    description: 'Minutes worked',
    example: 30,
    minimum: 0,
    maximum: 59,
    default: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(59)
  minutesWorked: number;

  @ApiPropertyOptional({
    description: 'Description of work done',
    example: 'Teaching English 101, grading assignments',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

