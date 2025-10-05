import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EnrollmentStatus } from "@prisma/client";

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    studentId: string;
    courseId: string;
    status?: EnrollmentStatus;
  }) {
    return this.prisma.enrollment.create({ data });
  }

  async findAll() {
    return this.prisma.enrollment.findMany({
      include: {
        student: true,
        course: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: { student: true, course: true },
    });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }
    return enrollment;
  }

  async update(
    id: string,
    data: Partial<{ status: EnrollmentStatus; completedAt?: Date }>
  ) {
    await this.findOne(id);
    return this.prisma.enrollment.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.enrollment.delete({ where: { id } });
  }
}
