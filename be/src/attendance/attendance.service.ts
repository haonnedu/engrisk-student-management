import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAttendanceDto } from "./dto/create-attendance.dto";
import { UpdateAttendanceDto } from "./dto/update-attendance.dto";

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async create(createAttendanceDto: CreateAttendanceDto) {
    return this.prisma.attendance.create({
      data: {
        ...createAttendanceDto,
        date: new Date(createAttendanceDto.date),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            engName: true,
            studentId: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async findAll(sectionId?: string, month?: string) {
    const where: any = {};

    if (sectionId) {
      where.sectionId = sectionId;
    }

    if (month) {
      const startDate = new Date(month + "-01");
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Last day of the month

      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            engName: true,
            studentId: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [{ student: { firstName: "asc" } }, { date: "asc" }],
    });
  }

  async findOne(id: string) {
    return this.prisma.attendance.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            engName: true,
            studentId: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async update(id: string, updateAttendanceDto: UpdateAttendanceDto) {
    const updateData: any = { ...updateAttendanceDto };
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    return this.prisma.attendance.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            engName: true,
            studentId: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.attendance.delete({
      where: { id },
    });
  }

  async setAttendance(
    sectionId: string,
    studentId: string,
    date: string,
    status: string,
    note?: string
  ) {
    // Check if attendance record exists
    const existing = await this.prisma.attendance.findFirst({
      where: {
        sectionId,
        studentId,
        date: new Date(date),
      },
    });

    if (existing) {
      return this.update(existing.id, { status: status as any, note });
    } else {
      return this.create({
        sectionId,
        studentId,
        date: new Date(date).toISOString().split("T")[0],
        status: status as any,
        note,
      });
    }
  }

  async generateAttendance(
    sectionId: string,
    startDate: string,
    endDate: string
  ) {
    // Get all enrolled students for this section
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        sectionId,
        status: "ENROLLED",
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
      },
    });

    if (enrollments.length === 0) {
      throw new NotFoundException("No enrolled students found for this section");
    }

    // Get class/section information to check day1 and day2
    const section = await this.prisma.classSection.findUnique({
      where: { id: sectionId },
      select: {
        day1: true,
        day2: true,
      },
    });

    // Days of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const allowedDays = [];
    if (section?.day1 !== null && section?.day1 !== undefined) {
      allowedDays.push(section.day1);
    }
    if (section?.day2 !== null && section?.day2 !== undefined) {
      allowedDays.push(section.day2);
    }

    // If no days are set, generate for all days (backward compatibility)
    const shouldFilterByDays = allowedDays.length > 0;

    // Parse dates correctly to avoid timezone issues
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    const attendanceRecords = [];

    // Generate attendance for each day in the range
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      // Check if this date matches the allowed days
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      if (shouldFilterByDays && !allowedDays.includes(dayOfWeek)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue; // Skip dates that don't match the class schedule
      }

      for (const enrollment of enrollments) {
        // Create a date with local time at noon to avoid timezone issues
        const localDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 12, 0, 0);
        
        // Check if attendance already exists for this student and date
        const existing = await this.prisma.attendance.findFirst({
          where: {
            sectionId,
            studentId: enrollment.student.id,
            date: localDate,
          },
        });

        if (!existing) {
          const attendance = await this.prisma.attendance.create({
            data: {
              sectionId,
              studentId: enrollment.student.id,
              date: localDate,
              status: "PRESENT" as any, // Default to present
              note: "",
            },
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  engName: true,
                  studentId: true,
                },
              },
              section: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          });
          attendanceRecords.push(attendance);
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return attendanceRecords;
  }
}
