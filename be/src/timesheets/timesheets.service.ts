import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimesheetDto, UpdateTimesheetDto } from './dto';
import { TimesheetStatus } from '@prisma/client';

@Injectable()
export class TimesheetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createTimesheetDto: CreateTimesheetDto) {
    // Find teacher by userId
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found for this user');
    }

    // Check if timesheet already exists for this date
    const existingTimesheet = await this.prisma.timesheet.findUnique({
      where: {
        teacherId_date: {
          teacherId: teacher.id,
          date: new Date(createTimesheetDto.date),
        },
      },
    });

    if (existingTimesheet) {
      throw new BadRequestException('Timesheet already exists for this date');
    }

    return this.prisma.timesheet.create({
      data: {
        teacherId: teacher.id,
        date: new Date(createTimesheetDto.date),
        hoursWorked: createTimesheetDto.hoursWorked,
        minutesWorked: createTimesheetDto.minutesWorked,
        description: createTimesheetDto.description,
        status: TimesheetStatus.DRAFT,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findAll(
    page = 1,
    limit = 10,
    status?: TimesheetStatus,
    teacherId?: string,
    month?: number,
    year?: number,
  ) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    // Filter by year (and optionally month) — return all matching (no paging)
    const yearValid = year != null && !Number.isNaN(year);
    const monthValid =
      month != null && !Number.isNaN(month) && month >= 1 && month <= 12;

    if (yearValid) {
      const rangeStart = monthValid
        ? new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))   // first day of selected month
        : new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));          // Jan 1 when only year
      const rangeEnd = monthValid
        ? new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))   // last day of selected month
        : new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));    // Dec 31 when only year
      where.date = { gte: rangeStart, lte: rangeEnd };
    }

    const total = await this.prisma.timesheet.count({ where });

    // When filtering by year (with or without month), fetch all; otherwise paginate
    const filterByDate = yearValid;
    const take = filterByDate ? Math.min(total, 5000) : limit;
    const skip = filterByDate ? 0 : (page - 1) * limit;

    const timesheets = await this.prisma.timesheet.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'desc' },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const totalPages = filterByDate ? 1 : Math.ceil(total / limit);

    return {
      data: timesheets,
      meta: {
        total,
        page: filterByDate ? 1 : page,
        limit: filterByDate ? total : limit,
        totalPages,
      },
    };
  }

  async findMyTimesheets(
    userId: string,
    page = 1,
    limit = 10,
    month?: number,
    year?: number,
    status?: TimesheetStatus,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return this.findAll(page, limit, status, teacher.id, month, year);
  }

  async findOne(id: string) {
    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    return timesheet;
  }

  async update(id: string, userId: string, updateTimesheetDto: UpdateTimesheetDto) {
    const timesheet = await this.findOne(id);

    // Verify teacher owns this timesheet
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher || timesheet.teacherId !== teacher.id) {
      throw new ForbiddenException('You can only update your own timesheets');
    }

    // Can only update draft or rejected timesheets
    if (timesheet.status !== TimesheetStatus.DRAFT && timesheet.status !== TimesheetStatus.REJECTED) {
      throw new BadRequestException('Can only update draft or rejected timesheets');
    }

    // Convert date string to Date object if provided
    const updateData = { ...updateTimesheetDto };
    if (updateData.date) {
      updateData.date = new Date(updateData.date) as any;
    }

    return this.prisma.timesheet.update({
      where: { id },
      data: updateData,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async submit(id: string, userId: string) {
    const timesheet = await this.findOne(id);

    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher || timesheet.teacherId !== teacher.id) {
      throw new ForbiddenException('You can only submit your own timesheets');
    }

    // Can submit draft or rejected timesheets
    if (timesheet.status !== TimesheetStatus.DRAFT && timesheet.status !== TimesheetStatus.REJECTED) {
      throw new BadRequestException('Can only submit draft or rejected timesheets');
    }

    return this.prisma.timesheet.update({
      where: { id },
      data: {
        status: TimesheetStatus.SUBMITTED,
        submittedAt: new Date(),
        // Clear rejection data when resubmitting
        rejectedAt: null,
        rejectionReason: null,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async approve(id: string, userId: string) {
    const timesheet = await this.findOne(id);

    if (timesheet.status !== TimesheetStatus.SUBMITTED) {
      throw new BadRequestException('Can only approve submitted timesheets');
    }

    return this.prisma.timesheet.update({
      where: { id },
      data: {
        status: TimesheetStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: userId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async reject(id: string, userId: string, reason: string) {
    const timesheet = await this.findOne(id);

    if (timesheet.status !== TimesheetStatus.SUBMITTED) {
      throw new BadRequestException('Can only reject submitted timesheets');
    }

    return this.prisma.timesheet.update({
      where: { id },
      data: {
        status: TimesheetStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const timesheet = await this.findOne(id);

    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher || timesheet.teacherId !== teacher.id) {
      throw new ForbiddenException('You can only delete your own timesheets');
    }

    // Can only delete draft or rejected timesheets
    if (timesheet.status !== TimesheetStatus.DRAFT && timesheet.status !== TimesheetStatus.REJECTED) {
      throw new BadRequestException('Can only delete draft or rejected timesheets');
    }

    return this.prisma.timesheet.delete({
      where: { id },
    });
  }
}

