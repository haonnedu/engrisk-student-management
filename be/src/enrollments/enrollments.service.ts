import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    // Check if enrollment already exists
    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId: data.studentId,
        courseId: data.courseId,
      },
    });

    if (existingEnrollment) {
      throw new Error(
        "This student is already enrolled in this course."
      );
    }

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

    // Auto-create default grades for all active grade types
    const gradeTypes = await this.prisma.gradeType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const gradePromises = gradeTypes.map((gradeType) =>
      this.prisma.grade.create({
        data: {
          studentId: data.studentId,
          courseId: data.courseId,
          gradeTypeId: gradeType.id,
          grade: 0,
          comments: `Auto-generated for ${gradeType.name}`,
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

  async remove(id: string) {
    // First, get the enrollment to get studentId, courseId, and sectionId
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      select: {
        studentId: true,
        courseId: true,
        sectionId: true,
      },
    });

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    // Delete all grades for this student and course combination
    await this.prisma.grade.deleteMany({
      where: {
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
      },
    });

    // Delete all homework records for this student and section
    await this.prisma.homework.deleteMany({
      where: {
        studentId: enrollment.studentId,
        sectionId: enrollment.sectionId,
      },
    });

    // Finally, delete the enrollment
    return this.prisma.enrollment.delete({
      where: { id },
    });
  }
}
