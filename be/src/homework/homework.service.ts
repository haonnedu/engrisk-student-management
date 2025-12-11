import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateHomeworkDto, UpdateHomeworkDto } from "./dto";
import { BulkCreateHomeworkDto } from "./dto/bulk-create-homework.dto";
import {
  CreateHomeworkSubmissionDto,
  UpdateHomeworkSubmissionDto,
} from "./dto";

@Injectable()
export class HomeworkService {
  private readonly logger = new Logger(HomeworkService.name);

  constructor(private prisma: PrismaService) {}

  async create(createHomeworkDto: CreateHomeworkDto) {
    const homework = await this.prisma.homework.create({
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
            courseId: true,
          },
        },
      },
    });

    // Sync homework to grades
    await this.syncHomeworkToGrades(homework.studentId, homework.section?.courseId);

    return homework;
  }

  async createBulk(payload: BulkCreateHomeworkDto) {
    const { sectionId, title, description, maxPoints = 100, dueDate, items } =
      payload;

    const due = dueDate ? new Date(dueDate) : null;

    // Get section to get courseId
    const section = await this.prisma.classSection.findUnique({
      where: { id: sectionId },
      select: { courseId: true },
    });

    // Create many
    await this.prisma.homework.createMany({
      data: items.map((it) => ({
        sectionId,
        studentId: it.studentId,
        title,
        description,
        points: it.points,
        maxPoints,
        dueDate: due,
      })),
    });

    // Return created records for the given students (latest by createdAt)
    const created = await this.prisma.homework.findMany({
      where: {
        sectionId,
        title,
        studentId: { in: items.map((i) => i.studentId) },
      },
      orderBy: { createdAt: "desc" },
    });

    // Sync homework to grades for all affected students
    const uniqueStudentIds = new Set(items.map((item) => item.studentId));
    for (const studentId of uniqueStudentIds) {
      await this.syncHomeworkToGrades(studentId, section?.courseId);
    }

    return { count: items.length, data: created };
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

    const homework = await this.prisma.homework.update({
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
            courseId: true,
          },
        },
      },
    });

    // Sync homework to grades
    await this.syncHomeworkToGrades(homework.studentId, homework.section?.courseId);

    return homework;
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

  // Homework Submissions methods
  async createSubmission(
    studentId: string,
    createSubmissionDto: CreateHomeworkSubmissionDto
  ) {
    // Verify homework exists and belongs to student
    const homework = await this.prisma.homework.findUnique({
      where: { id: createSubmissionDto.homeworkId },
    });

    if (!homework) {
      throw new NotFoundException("Homework not found");
    }

    if (homework.studentId !== studentId) {
      throw new NotFoundException("Homework does not belong to this student");
    }

    // Check if submission already exists
    const existingSubmission = await this.prisma.homeworkSubmission.findFirst({
      where: {
        homeworkId: createSubmissionDto.homeworkId,
        studentId,
      },
    });

    if (existingSubmission) {
      throw new NotFoundException("Submission already exists. Use update instead.");
    }

    const submission = await this.prisma.homeworkSubmission.create({
      data: {
        homeworkId: createSubmissionDto.homeworkId,
        studentId,
        comment: createSubmissionDto.comment,
      },
      include: {
        homework: {
          include: {
            section: {
              select: {
                id: true,
                name: true,
                code: true,
                courseId: true,
              },
            },
          },
        },
        files: {
          include: {
            googleDrive: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Sync homework to grades (in case teacher grades the homework)
    await this.syncHomeworkToGrades(
      studentId,
      submission.homework.section?.courseId
    );

    return submission;
  }

  async updateSubmission(
    submissionId: string,
    studentId: string,
    updateSubmissionDto: UpdateHomeworkSubmissionDto
  ) {
    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      include: {
        homework: {
          include: {
            section: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException("Submission not found");
    }

    if (submission.studentId !== studentId) {
      throw new NotFoundException("Submission does not belong to this student");
    }

    const updatedSubmission = await this.prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        comment: updateSubmissionDto.comment,
      },
      include: {
        homework: {
          include: {
            section: {
              select: {
                id: true,
                name: true,
                code: true,
                courseId: true,
              },
            },
          },
        },
        files: {
          include: {
            googleDrive: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Sync homework to grades (in case teacher updates the grade)
    await this.syncHomeworkToGrades(
      studentId,
      updatedSubmission.homework.section?.courseId
    );

    return updatedSubmission;
  }

  async getSubmissions(homeworkId?: string, studentId?: string) {
    const where: any = {};
    if (homeworkId) {
      where.homeworkId = homeworkId;
    }
    if (studentId) {
      where.studentId = studentId;
    }

    // If no filters provided, return empty array (don't return all submissions)
    if (!homeworkId && !studentId) {
      return [];
    }

    return this.prisma.homeworkSubmission.findMany({
      where,
      include: {
        homework: {
          include: {
            section: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        files: {
          include: {
            googleDrive: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
  }

  async getSubmission(submissionId: string, studentId?: string) {
    const where: any = { id: submissionId };
    if (studentId) {
      where.studentId = studentId;
    }

    const submission = await this.prisma.homeworkSubmission.findFirst({
      where,
      include: {
        homework: {
          include: {
            section: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        files: {
          include: {
            googleDrive: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException("Submission not found");
    }

    return submission;
  }

  async addFileToSubmission(
    submissionId: string,
    studentId: string,
    fileData: {
      fileName: string;
      originalFileName: string;
      fileSize: number;
      mimeType: string;
      googleDriveFileId: string;
      googleDriveId: string;
      downloadUrl?: string;
      thumbnailUrl?: string;
    }
  ) {
    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException("Submission not found");
    }

    if (submission.studentId !== studentId) {
      throw new NotFoundException("Submission does not belong to this student");
    }

    return this.prisma.homeworkFile.create({
      data: {
        submissionId,
        ...fileData,
      },
      include: {
        googleDrive: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async deleteFileFromSubmission(
    fileId: string,
    studentId: string
  ) {
    const file = await this.prisma.homeworkFile.findUnique({
      where: { id: fileId },
      include: {
        submission: true,
      },
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    if (file.submission.studentId !== studentId) {
      throw new NotFoundException("File does not belong to this student");
    }

    return this.prisma.homeworkFile.delete({
      where: { id: fileId },
    });
  }

  /**
   * Sync homework points to grades table
   * Calculates average homework score and updates/create HW grade
   */
  private async syncHomeworkToGrades(studentId: string, courseId?: string | null) {
    try {
      // Get all homework for this student
      const homeworks = await this.prisma.homework.findMany({
        where: { studentId },
        select: {
          points: true,
          maxPoints: true,
          section: {
            select: {
              courseId: true,
            },
          },
        },
      });

      if (homeworks.length === 0) {
        // No homework, set grade to 0 if exists
        await this.updateHWGrade(studentId, courseId, 0);
        return;
      }

      // Group by course if courseId provided, otherwise calculate overall average
      if (courseId) {
        const courseHomeworks = homeworks.filter(
          (hw) => hw.section?.courseId === courseId
        );
        if (courseHomeworks.length > 0) {
          const averageScore = this.calculateAverageScore(courseHomeworks);
          await this.updateHWGrade(studentId, courseId, averageScore);
        }
      } else {
        // Calculate overall average for all courses
        const averageScore = this.calculateAverageScore(homeworks);
        
        // Update HW grade for each unique course
        const uniqueCourseIds = new Set(
          homeworks
            .map((hw) => hw.section?.courseId)
            .filter((id): id is string => !!id)
        );

        for (const cId of uniqueCourseIds) {
          const courseHomeworks = homeworks.filter(
            (hw) => hw.section?.courseId === cId
          );
          const courseAverage = this.calculateAverageScore(courseHomeworks);
          await this.updateHWGrade(studentId, cId, courseAverage);
        }
      }
    } catch (error) {
      this.logger.error(`Error syncing homework to grades for student ${studentId}:`, error);
      // Don't throw error, just log it
    }
  }

  /**
   * Calculate average score from homework array
   */
  private calculateAverageScore(
    homeworks: Array<{ points: number; maxPoints: number }>
  ): number {
    if (homeworks.length === 0) return 0;

    const totalPoints = homeworks.reduce((sum, hw) => sum + hw.points, 0);
    const totalMaxPoints = homeworks.reduce((sum, hw) => sum + hw.maxPoints, 0);

    if (totalMaxPoints === 0) return 0;

    const average = (totalPoints / totalMaxPoints) * 100;
    return Math.round(average * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Update or create HW grade for student
   */
  private async updateHWGrade(
    studentId: string,
    courseId: string | null | undefined,
    averageScore: number
  ) {
    if (!courseId) {
      // If no courseId, try to find from enrollments
      const enrollment = await this.prisma.enrollment.findFirst({
        where: { studentId },
        select: { courseId: true },
      });
      if (!enrollment) {
        this.logger.warn(`No enrollment found for student ${studentId}, cannot update HW grade`);
        return;
      }
      courseId = enrollment.courseId;
    }

    // Find HW grade type
    const hwGradeType = await this.prisma.gradeType.findFirst({
      where: { code: "HW", isActive: true },
    });

    if (!hwGradeType) {
      this.logger.warn("HW grade type not found, cannot sync homework to grades");
      return;
    }

    // Find existing HW grade
    const existingGrade = await this.prisma.grade.findFirst({
      where: {
        studentId,
        courseId,
        gradeTypeId: hwGradeType.id,
      },
    });

    if (existingGrade) {
      // Update existing grade
      await this.prisma.grade.update({
        where: { id: existingGrade.id },
        data: { grade: averageScore },
      });
    } else {
      // Create new grade
      await this.prisma.grade.create({
        data: {
          studentId,
          courseId,
          gradeTypeId: hwGradeType.id,
          grade: averageScore,
          comments: "Auto-synced from homework",
        },
      });
    }
  }
}
