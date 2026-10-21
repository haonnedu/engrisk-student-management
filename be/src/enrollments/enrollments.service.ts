import { Injectable, ConflictException, NotFoundException, BadRequestException } from "@nestjs/common";
import { EnrollmentStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    // Validate input
    if (!data.studentId || !data.courseId) {
      throw new BadRequestException(
        "Student ID and Course ID are required"
      );
    }

    // Check if enrollment already exists
    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId: data.studentId,
        courseId: data.courseId,
      },
    });

    if (existingEnrollment) {
      throw new ConflictException(
        "This student is already enrolled in this course."
      );
    }

    // Resolve grade types BEFORE creating the enrollment.
    // If a section is provided, it MUST have grade types configured first.
    let gradeTypes: { id: string; name: string }[] = [];

    if (data.sectionId) {
      const sectionGradeTypes = await this.prisma.sectionGradeType.findMany({
        where: { sectionId: data.sectionId, isActive: true },
        include: { gradeType: true },
        orderBy: { sortOrder: "asc" },
      });

      // Only include grade types that are also globally active
      const filtered = sectionGradeTypes.filter((sgt) => sgt.gradeType.isActive);

      if (filtered.length === 0) {
        const section = await this.prisma.classSection.findUnique({
          where: { id: data.sectionId },
          select: { name: true },
        });
        throw new BadRequestException(
          `Class "${section?.name ?? data.sectionId}" has no grade types configured. ` +
          `Please set up grade types for this class before enrolling students.`
        );
      }

      gradeTypes = filtered.map((sgt) => sgt.gradeType);
    } else {
      gradeTypes = await this.prisma.gradeType.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
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

    await this.createMissingGradeRows(data.studentId, data.courseId, gradeTypes);

    return enrollment;
  }

  /**
   * Create grade rows (grade = 0) for every grade type the student does not
   * have yet for this course. Safe to call repeatedly.
   */
  private async createMissingGradeRows(
    studentId: string,
    courseId: string,
    gradeTypes: { id: string; name: string }[],
  ) {
    if (gradeTypes.length === 0) return 0;

    const existingGrades = await this.prisma.grade.findMany({
      where: {
        studentId,
        courseId,
        gradeTypeId: { in: gradeTypes.map((gt) => gt.id) },
      },
      select: { gradeTypeId: true },
    });
    const existingGradeTypeIds = new Set(existingGrades.map((g) => g.gradeTypeId));
    const newGradeTypes = gradeTypes.filter((gt) => !existingGradeTypeIds.has(gt.id));

    if (newGradeTypes.length > 0) {
      await this.prisma.grade.createMany({
        data: newGradeTypes.map((gradeType) => ({
          studentId,
          courseId,
          gradeTypeId: gradeType.id,
          grade: 0,
          comments: `Auto-generated for ${gradeType.name}`,
        })),
      });
    }
    return newGradeTypes.length;
  }

  /** Active grade types configured for a section (also globally active). */
  private async getSectionActiveGradeTypes(sectionId: string) {
    const sectionGradeTypes = await this.prisma.sectionGradeType.findMany({
      where: { sectionId, isActive: true },
      include: { gradeType: true },
      orderBy: { sortOrder: "asc" },
    });
    return sectionGradeTypes
      .filter((sgt) => sgt.gradeType.isActive)
      .map((sgt) => sgt.gradeType);
  }

  async levelUpClass(
    sourceSectionId: string,
    targetCourseId: string,
    targetSectionId: string,
  ) {
    // 1. Validate target section exists
    const targetSection = await this.prisma.classSection.findUnique({
      where: { id: targetSectionId },
      select: { name: true, courseId: true },
    });
    if (!targetSection) {
      throw new NotFoundException(`Target class not found.`);
    }

    // 2. Validate target section has grade types configured
    const targetSectionGradeTypes = await this.prisma.sectionGradeType.findMany({
      where: { sectionId: targetSectionId, isActive: true },
      include: { gradeType: true },
      orderBy: { sortOrder: 'asc' },
    });
    const targetGradeTypes = targetSectionGradeTypes
      .filter((sgt) => sgt.gradeType.isActive)
      .map((sgt) => sgt.gradeType);

    if (targetGradeTypes.length === 0) {
      throw new BadRequestException(
        `Target class "${targetSection.name}" has no grade types configured. ` +
        `Please set up grade types before leveling up.`,
      );
    }

    // 3. Get all ENROLLED students in source section
    const sourceEnrollments = await this.prisma.enrollment.findMany({
      where: { sectionId: sourceSectionId, status: 'ENROLLED' },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, engName: true, studentId: true },
        },
      },
    });

    if (sourceEnrollments.length === 0) {
      throw new BadRequestException('No active (ENROLLED) students found in the source class.');
    }

    // 4. Process each student
    const results: Array<{
      student: any;
      status: 'success' | 'skipped' | 'failed';
      reason?: string;
    }> = [];

    for (const enrollment of sourceEnrollments) {
      try {
        // Skip if already enrolled in the target course
        const existingTargetEnrollment = await this.prisma.enrollment.findFirst({
          where: { studentId: enrollment.studentId, courseId: targetCourseId },
        });

        if (existingTargetEnrollment) {
          results.push({
            student: enrollment.student,
            status: 'skipped',
            reason: 'Already enrolled in target course',
          });
          continue;
        }

        // Mark old enrollment as COMPLETED
        await this.prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });

        // Create new enrollment in target course + section
        await this.prisma.enrollment.create({
          data: {
            studentId: enrollment.studentId,
            courseId: targetCourseId,
            sectionId: targetSectionId,
            status: 'ENROLLED',
          },
        });

        // Create grades — skip grade types that already have records
        const existingGrades = await this.prisma.grade.findMany({
          where: {
            studentId: enrollment.studentId,
            courseId: targetCourseId,
            gradeTypeId: { in: targetGradeTypes.map((gt) => gt.id) },
          },
          select: { gradeTypeId: true },
        });
        const existingIds = new Set(existingGrades.map((g) => g.gradeTypeId));
        const newGradeTypes = targetGradeTypes.filter((gt) => !existingIds.has(gt.id));

        if (newGradeTypes.length > 0) {
          await this.prisma.grade.createMany({
            data: newGradeTypes.map((gt) => ({
              studentId: enrollment.studentId,
              courseId: targetCourseId,
              gradeTypeId: gt.id,
              grade: 0,
              comments: `Auto-generated for ${gt.name}`,
            })),
          });
        }

        results.push({ student: enrollment.student, status: 'success' });
      } catch (error) {
        results.push({
          student: enrollment.student,
          status: 'failed',
          reason: (error as any)?.message ?? 'Unknown error',
        });
      }
    }

    return {
      total: sourceEnrollments.length,
      succeeded: results.filter((r) => r.status === 'success').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      failed: results.filter((r) => r.status === 'failed').length,
      details: results,
    };
  }

  findAll(
    page = 1,
    limit = 10,
    search?: string,
    sectionId?: string,
    status?: EnrollmentStatus,
  ) {
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
          student: {
            engName: { contains: search, mode: "insensitive" as const },
          },
        },
        {
          student: {
            studentId: { contains: search, mode: "insensitive" as const },
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

    if (status) {
      where.status = status;
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

  async update(id: string, data: any) {
    const before = await this.prisma.enrollment.findUnique({
      where: { id },
      select: { studentId: true, courseId: true, sectionId: true, status: true },
    });
    if (!before) {
      throw new NotFoundException("Enrollment not found");
    }

    const updated = await this.prisma.enrollment.update({
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

    // When a student is (re-)activated in a class or moved to another class,
    // make sure grade rows exist for every grade type of that class.
    // Otherwise the grade sheet shows "-" for grade types added while the
    // student was not ENROLLED.
    const becameEnrolled =
      updated.status === "ENROLLED" && before.status !== "ENROLLED";
    const sectionChanged =
      !!updated.sectionId && updated.sectionId !== before.sectionId;
    const courseChanged = updated.courseId !== before.courseId;

    if (updated.sectionId && updated.status === "ENROLLED" &&
        (becameEnrolled || sectionChanged || courseChanged)) {
      const gradeTypes = await this.getSectionActiveGradeTypes(updated.sectionId);
      await this.createMissingGradeRows(updated.studentId, updated.courseId, gradeTypes);
    }

    return updated;
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
      throw new NotFoundException("Enrollment not found");
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
