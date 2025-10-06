import { Injectable } from "@nestjs/common";
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
      throw new Error("No enrolled students found for this section");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const attendanceRecords = [];

    // Generate attendance for each day in the range
    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      for (const enrollment of enrollments) {
        // Check if attendance already exists for this student and date
        const existing = await this.prisma.attendance.findFirst({
          where: {
            sectionId,
            studentId: enrollment.student.id,
            date: new Date(date),
          },
        });

        if (!existing) {
          const attendance = await this.prisma.attendance.create({
            data: {
              sectionId,
              studentId: enrollment.student.id,
              date: new Date(date),
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
    }

    return attendanceRecords;
  }
}
