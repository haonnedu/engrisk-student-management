import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as XLSX from "xlsx";

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    studentId: string;
    courseId: string;
    gradeTypeId: string;
    grade: number;
    comments?: string;
  }) {
    return this.prisma.grade.create({
      data,
      include: {
        gradeType: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
      },
    });
  }

  async findAll(page = 1, limit = 10, search?: string, studentIds?: string[]) {
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

    if (studentIds && studentIds.length > 0) {
      where.studentId = { in: studentIds };
    }

    const [data, total] = await Promise.all([
      this.prisma.grade.findMany({
        where,
        skip,
        take: limit,
        include: {
          gradeType: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              engName: true,
              studentId: true,
              enrollments: {
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
            },
          },
          course: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.grade.count({ where }),
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
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: {
        gradeType: true,
        student: true,
        course: true,
      },
    });
    if (!grade) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
    }
    return grade;
  }

  async update(
    id: string,
    data: Partial<{ grade: number; gradeTypeId: string; comments?: string }>
  ) {
    await this.findOne(id);
    return this.prisma.grade.update({
      where: { id },
      data,
      include: {
        gradeType: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.grade.delete({ where: { id } });
  }

  async exportSectionGrades(sectionId: string): Promise<Buffer> {
    // Get section info
    const section = await this.prisma.classSection.findUnique({
      where: { id: sectionId },
      include: {
        course: true,
      },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    // Get enrollments for this section
    const enrollments = await this.prisma.enrollment.findMany({
      where: { sectionId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            engName: true,
            studentId: true,
            classSchool: true,
          },
        },
      },
    });

    const studentIds = enrollments.map((e) => e.studentId);

    // Get section-specific grade types or all active grade types
    const sectionGradeTypes = await this.prisma.sectionGradeType.findMany({
      where: { sectionId, isActive: true },
      include: { gradeType: true },
      orderBy: { sortOrder: "asc" },
    });

    // Build list of grade types with their IDs
    let gradeTypesWithInfo: Array<{
      gradeTypeId: string;
      gradeType: any;
    }>;

    if (sectionGradeTypes.length === 0) {
      // If no section-specific grade types, use all active grade types
      const allActiveGradeTypes = await this.prisma.gradeType.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
      gradeTypesWithInfo = allActiveGradeTypes.map((gt) => ({
        gradeTypeId: gt.id,
        gradeType: gt,
      }));
    } else {
      gradeTypesWithInfo = sectionGradeTypes.map((sgt) => ({
        gradeTypeId: sgt.gradeTypeId,
        gradeType: sgt.gradeType,
      }));
    }

    // Get all grades for students in this section
    const grades = await this.prisma.grade.findMany({
      where: {
        studentId: { in: studentIds },
        courseId: section.courseId,
      },
      include: {
        gradeType: true,
        student: true,
      },
    });

    // Build header row
    const headers = [
      "No",
      "Student ID",
      "First Name",
      "Last Name",
      "English Name",
      "School Class",
      ...gradeTypesWithInfo.map((gt) => gt.gradeType.name),
      "Average",
      "Grade Level",
    ];

    // Build data rows
    const rows: any[][] = [];
    enrollments.forEach((enrollment, index) => {
      const student = enrollment.student;
      const studentGrades = grades.filter((g) => g.studentId === student.id);

      // Get grade for each grade type
      const gradeValues = gradeTypesWithInfo.map((gt) => {
        const grade = studentGrades.find(
          (g) => g.gradeTypeId === gt.gradeTypeId
        );
        return grade ? grade.grade : 0;
      });

      // Calculate average
      const sum = gradeValues.reduce((acc, val) => acc + val, 0);
      const average =
        gradeValues.length > 0 ? sum / gradeValues.length : 0;

      // Determine grade level
      let gradeLevel = "";
      if (average >= 85) {
        gradeLevel = "Excellent";
      } else if (average >= 70) {
        gradeLevel = "Good";
      } else if (average >= 55) {
        gradeLevel = "Average";
      } else {
        gradeLevel = "Needs Improvement";
      }

      rows.push([
        index + 1,
        student.studentId || "",
        student.firstName || "",
        student.lastName || "",
        student.engName || "",
        student.classSchool || "",
        ...gradeValues,
        average.toFixed(1),
        gradeLevel,
      ]);
    });

    // Sort rows by student name for consistency
    rows.sort((a, b) => {
      const nameA = `${a[2]} ${a[3]}`.toLowerCase();
      const nameB = `${b[2]} ${b[3]}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // Re-number after sorting
    rows.forEach((row, index) => {
      row[0] = index + 1;
    });

    // Create worksheet
    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const colWidths = [
      { wch: 5 },   // No
      { wch: 12 },  // Student ID
      { wch: 15 },  // First Name
      { wch: 15 },  // Last Name
      { wch: 15 },  // English Name
      { wch: 15 },  // School Class
      ...gradeTypesWithInfo.map(() => ({ wch: 10 })), // Grade columns
      { wch: 10 },  // Average
      { wch: 18 },  // Grade Level
    ];
    worksheet["!cols"] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const sheetName = `${section.code || section.name}`.substring(0, 31); // Excel sheet name limit is 31 chars
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Write to buffer
    const buffer: Buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return buffer;
  }
}
