import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TimesheetsService } from './timesheets.service';
import { CreateTimesheetDto, UpdateTimesheetDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TimesheetStatus } from '@prisma/client';

@ApiTags('Timesheets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('timesheets')
export class TimesheetsController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  @ApiOperation({ summary: 'Create a new timesheet' })
  @ApiResponse({ status: 201, description: 'Timesheet created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  create(@Request() req: any, @Body() createTimesheetDto: CreateTimesheetDto) {
    const userId = req.user.id;
    return this.timesheetsService.create(userId, createTimesheetDto);
  }

  @ApiOperation({ summary: 'Get all timesheets (Admin only)' })
  @ApiResponse({ status: 200, description: 'Timesheets retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TimesheetStatus })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: TimesheetStatus,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.timesheetsService.findAll(page, limit, status, teacherId);
  }

  @ApiOperation({ summary: 'Get my timesheets' })
  @ApiResponse({ status: 200, description: 'Timesheets retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('my')
  findMyTimesheets(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.id;
    return this.timesheetsService.findMyTimesheets(userId, page, limit);
  }

  @ApiOperation({ summary: 'Get a timesheet by ID' })
  @ApiResponse({ status: 200, description: 'Timesheet retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Timesheet not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.timesheetsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a timesheet' })
  @ApiResponse({ status: 200, description: 'Timesheet updated successfully' })
  @ApiResponse({ status: 404, description: 'Timesheet not found' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateTimesheetDto: UpdateTimesheetDto,
  ) {
    const userId = req.user.id;
    return this.timesheetsService.update(id, userId, updateTimesheetDto);
  }

  @ApiOperation({ summary: 'Submit a timesheet' })
  @ApiResponse({ status: 200, description: 'Timesheet submitted successfully' })
  @HttpCode(HttpStatus.OK)
  @Post(':id/submit')
  submit(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.id;
    return this.timesheetsService.submit(id, userId);
  }

  @ApiOperation({ summary: 'Approve a timesheet (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Timesheet approved successfully' })
  @HttpCode(HttpStatus.OK)
  @Post(':id/approve')
  approve(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.id;
    return this.timesheetsService.approve(id, userId);
  }

  @ApiOperation({ summary: 'Reject a timesheet (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Timesheet rejected successfully' })
  @HttpCode(HttpStatus.OK)
  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { reason: string },
  ) {
    const userId = req.user.id;
    return this.timesheetsService.reject(id, userId, body.reason);
  }

  @ApiOperation({ summary: 'Delete a timesheet' })
  @ApiResponse({ status: 200, description: 'Timesheet deleted successfully' })
  @ApiResponse({ status: 404, description: 'Timesheet not found' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.id;
    return this.timesheetsService.remove(id, userId);
  }
}

