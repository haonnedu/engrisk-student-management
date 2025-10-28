import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Res,
  UploadedFile,
  UseInterceptors,
  Request,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiProduces,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StudentStatus } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @ApiOperation({ summary: 'Download Excel template for students import' })
  @ApiResponse({ status: 200, description: 'Template generated successfully' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Get('template')
  async downloadTemplate(@Res() res: any) {
    const buffer = await this.studentsService.generateTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="students-template.xlsx"');
    return res.send(buffer);
  }

  @ApiOperation({ summary: 'Create a new student' })
  @ApiResponse({ status: 201, description: 'Student created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @ApiOperation({ summary: 'Get all students' })
  @ApiResponse({ status: 200, description: 'Students retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: StudentStatus })
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: StudentStatus,
  ) {
    return this.studentsService.findAll(page, limit, status);
  }

  @ApiOperation({ summary: 'Get current student profile' })
  @ApiResponse({ status: 200, description: 'Student profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('me/profile')
  async getMyProfile(@Request() req: any) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new NotFoundException('User ID not found in token');
      }
      return await this.studentsService.findByUserId(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Unable to retrieve student profile. Please contact administrator.');
    }
  }

  @ApiOperation({ summary: 'Get a student by ID' })
  @ApiResponse({ status: 200, description: 'Student retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update current student profile' })
  @ApiResponse({ status: 200, description: 'Student profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Patch('me/profile')
  async updateMyProfile(@Request() req: any, @Body() updateStudentDto: UpdateStudentDto) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new NotFoundException('User ID not found in token');
      }
      return await this.studentsService.updateByUserId(userId, updateStudentDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Unable to update student profile. Please contact administrator.');
    }
  }

  @ApiOperation({ summary: 'Update a student' })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @ApiOperation({ summary: 'Delete a student' })
  @ApiResponse({ status: 200, description: 'Student deleted successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  @ApiOperation({ summary: 'Import students from Excel' })
  @ApiResponse({ status: 200, description: 'Import completed with summary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @Post('import')
  async import(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { created: 0, failed: 0, errors: [{ row: 0, error: 'No file uploaded' }] };
    }
    return this.studentsService.importFromExcel(file.buffer);
  }
}
