import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CourseStatus } from "@prisma/client";

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    courseCode: string;
    title: string;
    description?: string;
    credits: number;
    duration: number;
    maxStudents?: number;
    status?: CourseStatus;
  }) {
    return this.prisma.course.create({ data });
  }

  async findAll() {
    return this.prisma.course.findMany({
      include: {
        enrollments: {
          include: {
            student: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            student: true,
          },
        },
      },
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return course;
  }

  async update(
    id: string,
    data: Partial<{
      courseCode: string;
      title: string;
      description?: string;
      credits: number;
      duration: number;
      maxStudents?: number;
      status?: CourseStatus;
    }>
  ) {
    await this.findOne(id);
    return this.prisma.course.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.course.delete({ where: { id } });
  }
}
