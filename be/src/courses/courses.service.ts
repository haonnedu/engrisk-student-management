import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.course.create({
      data,
    });
  }

  findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        {
          title: { contains: search, mode: "insensitive" as const },
        },
        {
          courseCode: { contains: search, mode: "insensitive" as const },
        },
        {
          description: { contains: search, mode: "insensitive" as const },
        },
      ];
    }

    return Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.course.count({ where }),
    ]).then(([data, total]) => ({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }));
  }

  findOne(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
    });
  }

  update(id: string, data: any) {
    return this.prisma.course.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.course.delete({
      where: { id },
    });
  }
}
