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

  async findAll(page = 1, limit = 10, status?: TimesheetStatus, teacherId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    const [timesheets, total] = await Promise.all([
      this.prisma.timesheet.findMany({
        where,
        skip,
        take: limit,
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
      }),
      this.prisma.timesheet.count({ where }),
    ]);

    return {
      data: timesheets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMyTimesheets(userId: string, page = 1, limit = 10) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return this.findAll(page, limit, undefined, teacher.id);
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

