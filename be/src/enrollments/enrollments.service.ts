import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    // Create enrollment
    const enrollment = await this.prisma.enrollment.create({
      data,
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
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
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

    // Auto-create default grades for all grade types
    const gradeTypes = [
      "ASSIGNMENT",
      "QUIZ",
      "EXAM",
      "FINAL",
      "HW",
      "SP",
      "PP",
      "TEST_1L",
      "TEST_1RW",
      "TEST_2L",
      "TEST_2RW",
      "TEST_3L",
      "TEST_3RW",
    ];

    const gradePromises = gradeTypes.map((gradeType) =>
      this.prisma.grade.create({
        data: {
          studentId: data.studentId,
          courseId: data.courseId,
          grade: 0,
          gradeType: gradeType as any,
          comments: `Auto-generated for ${gradeType}`,
        },
      })
    );

    try {
      await Promise.all(gradePromises);
    } catch (error) {
      console.log("Some grades may already exist, continuing...");
    }

    return enrollment;
  }

  findAll(page = 1, limit = 10, search?: string, sectionId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        {
          student: {
            firstName: { contains: search, mode: "insensitive" as const },
          },
        },
        {
          student: {
            lastName: { contains: search, mode: "insensitive" as const },
          },
        },
        {
          course: {
            title: { contains: search, mode: "insensitive" as const },
          },
        },
      ];
    }

    if (sectionId) {
      where.sectionId = sectionId;
    }

    return Promise.all([
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
          course: {
            select: {
              id: true,
              title: true,
              courseCode: true,
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
      }),
      this.prisma.enrollment.count({ where }),
    ]).then(([data, total]) => ({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }));
  }

  findOne(id: string) {
    return this.prisma.enrollment.findUnique({
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
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
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

  update(id: string, data: any) {
    return this.prisma.enrollment.update({
      where: { id },
      data,
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
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
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

  remove(id: string) {
    return this.prisma.enrollment.delete({
      where: { id },
    });
  }
}
