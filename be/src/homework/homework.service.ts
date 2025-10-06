import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateHomeworkDto, UpdateHomeworkDto } from "./dto";

@Injectable()
export class HomeworkService {
  constructor(private prisma: PrismaService) {}

  async create(createHomeworkDto: CreateHomeworkDto) {
    return this.prisma.homework.create({
      data: {
        ...createHomeworkDto,
        dueDate: createHomeworkDto.dueDate
          ? new Date(createHomeworkDto.dueDate)
          : null,
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

  async findAll(sectionId?: string, studentId?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (sectionId) {
      where.sectionId = sectionId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    const [data, total] = await Promise.all([
      this.prisma.homework.findMany({
        where,
        skip,
        take: limit,
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
        orderBy: { submittedAt: "desc" },
      }),
      this.prisma.homework.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.homework.findUnique({
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

  async update(id: string, updateHomeworkDto: UpdateHomeworkDto) {
    const updateData: any = { ...updateHomeworkDto };
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    return this.prisma.homework.update({
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
    return this.prisma.homework.delete({
      where: { id },
    });
  }

  async getStudentHomeworkStats(studentId: string, sectionId?: string) {
    const where: any = { studentId };
    if (sectionId) {
      where.sectionId = sectionId;
    }

    const homeworks = await this.prisma.homework.findMany({
      where,
      orderBy: { submittedAt: "asc" },
    });

    const totalPoints = homeworks.reduce((sum, hw) => sum + hw.points, 0);
    const totalMaxPoints = homeworks.reduce((sum, hw) => sum + hw.maxPoints, 0);
    const average =
      totalMaxPoints > 0 ? (totalPoints / totalMaxPoints) * 100 : 0;

    return {
      totalHomeworks: homeworks.length,
      totalPoints,
      totalMaxPoints,
      average: Math.round(average * 10) / 10,
      homeworks,
    };
  }
}
