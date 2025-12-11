import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStudentDto, UpdateStudentDto } from "./dto";
import { StudentStatus, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as XLSX from "xlsx";

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async generateTemplate(): Promise<Buffer> {
    const headers = [
      "firstName",
      "lastName",
      "engName",
      "dateOfBirth",
      "phone",
      "address",
      "emergencyContact",
      "classSchool",
      "status",
    ];

    const exampleRow = [
      "John",
      "Doe",
      "John",
      "1995-01-15",
      "+84901234567",
      "123 Main St",
      "Jane Doe - 0900000000",
      "12A1 - THPT Example",
      "ACTIVE",
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    const buffer: Buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buffer;
  }

  async importFromExcel(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

    const results = {
      created: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index] as any;
      try {
        const firstName = (row.firstName ?? row.FirstName ?? row["First Name"]) as string | null;
        const lastName = (row.lastName ?? row.LastName ?? row["Last Name"]) as string | null;
        const engName = (row.engName ?? row.EngName ?? row["English Name"]) as string | null;
        let dateOfBirthRaw = row.dateOfBirth ?? row.DateOfBirth ?? row["Date of Birth"];
        const phone = (row.phone ?? row.Phone) as string | null;
        const address = (row.address ?? row.Address) as string | null;
        const emergencyContact = (row.emergencyContact ?? row["Emergency Contact"]) as string | null;
        const classSchool = (row.classSchool ?? row["Class School"]) as string | null;
        const statusStr = (row.status ?? row.Status) as string | null;

        if (!firstName || !lastName || !engName || !dateOfBirthRaw) {
          throw new BadRequestException("Missing required fields: firstName, lastName, engName, dateOfBirth");
        }

        let dateOfBirth: Date;
        if (dateOfBirthRaw instanceof Date) {
          dateOfBirth = dateOfBirthRaw;
        } else if (typeof dateOfBirthRaw === "number") {
          // Excel serialized date number -> JS Date (assuming days since 1899-12-30)
          const excelEpoch = new Date(Date.UTC(1899, 11, 30));
          dateOfBirth = new Date(excelEpoch.getTime() + dateOfBirthRaw * 24 * 60 * 60 * 1000);
        } else if (typeof dateOfBirthRaw === "string") {
          const parsed = new Date(dateOfBirthRaw);
          if (isNaN(parsed.getTime())) {
            throw new BadRequestException("Invalid dateOfBirth format; expected YYYY-MM-DD or Excel date");
          }
          dateOfBirth = parsed;
        } else {
          throw new BadRequestException("Unsupported dateOfBirth value");
        }

        const status = (statusStr as string | null)?.toUpperCase?.() as keyof typeof StudentStatus | undefined;
        const validStatus = status && StudentStatus[status] ? (StudentStatus[status] as StudentStatus) : StudentStatus.ACTIVE;

        const dto: CreateStudentDto = {
          firstName,
          lastName,
          engName,
          dateOfBirth,
          phone: phone ?? undefined,
          address: address ?? undefined,
          emergencyContact: emergencyContact ?? undefined,
          classSchool: classSchool ?? undefined,
          status: validStatus,
        } as CreateStudentDto;

        await this.create(dto);
        results.created += 1;
      } catch (err: any) {
        results.failed += 1;
        results.errors.push({ row: index + 2, error: err?.message ?? String(err) });
        // index + 2 because headers are row 1 and sheet_to_json starts at row 2 for first data row
      }
    }

    return results;
  }

  async create(createStudentDto: CreateStudentDto) {
    // If userId is not provided, automatically create a User with default password
    let userId = createStudentDto.userId;

    if (!userId) {
      const defaultPassword =
        process.env.DEFAULT_STUDENT_PASSWORD || "Student123!";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const createdUser = await this.prisma.user.create({
        data: {
          email: undefined, // optional; may be set later
          phone: createStudentDto.phone, // attach phone if provided
          password: hashedPassword,
          role: UserRole.STUDENT,
        },
      });

      userId = createdUser.id;
    }

    return this.prisma.student.create({
      data: {
        userId,
        firstName: createStudentDto.firstName,
        engName: createStudentDto.engName,
        lastName: createStudentDto.lastName,
        dateOfBirth: createStudentDto.dateOfBirth,
        phone: createStudentDto.phone,
        address: createStudentDto.address,
        emergencyContact: createStudentDto.emergencyContact,
        status: createStudentDto.status ?? StudentStatus.ACTIVE,
        studentId: `STU${Date.now()}`, // Generate unique student ID
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        enrollments: {
          include: {
            course: true,
          },
        },
      },
    });
  }

  async findAll(page = 1, limit = 10, status?: StudentStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          enrollments: {
            include: {
              course: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        enrollments: {
          include: {
            course: true,
          },
        },
        grades: {
          include: {
            course: true,
            gradeType: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async findByUserId(userId: string) {
    if (!userId) {
      throw new NotFoundException('User ID is required');
    }

    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        enrollments: {
          include: {
            course: true,
            section: true,
          },
        },
        grades: {
          include: {
            course: true,
            gradeType: true,
          },
          orderBy: {
            gradedAt: 'desc',
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(
        'Student profile not found. Please ensure your account is properly registered as a student.'
      );
    }

    // Filter grades to only show those from active section grade types
    // Get all section IDs from enrollments
    const sectionIds = student.enrollments
      .filter((e) => e.sectionId)
      .map((e) => e.sectionId as string);

    if (sectionIds.length > 0) {
      // Get all active grade type IDs from section_grade_types
      const sectionGradeTypes = await this.prisma.sectionGradeType.findMany({
        where: {
          sectionId: { in: sectionIds },
          isActive: true,
        },
        select: {
          gradeTypeId: true,
        },
      });

      const allowedGradeTypeIds = new Set(
        sectionGradeTypes.map((sgt) => sgt.gradeTypeId)
      );

      // Only filter if we have section grade types configured
      // If no section grade types configured, show all grades
      if (allowedGradeTypeIds.size > 0) {
        // Filter grades to only include those with gradeTypeId in allowed list
        student.grades = student.grades.filter((grade) =>
          allowedGradeTypeIds.has(grade.gradeTypeId)
        );
      }
      // If no section grade types configured, keep all grades (don't filter)
    }
    // If no sections/enrollments, still return all grades (don't clear them)

    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const student = await this.findOne(id);

    // If phone is being updated, also update it in the user table
    if (updateStudentDto.phone !== undefined) {
      await this.prisma.user.update({
        where: { id: student.userId },
        data: { phone: updateStudentDto.phone },
      });
    }

    return this.prisma.student.update({
      where: { id },
      data: updateStudentDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        enrollments: {
          include: {
            course: true,
          },
        },
      },
    });
  }

  async updateByUserId(userId: string, updateStudentDto: UpdateStudentDto) {
    if (!userId) {
      throw new NotFoundException('User ID is required');
    }

    const student = await this.findByUserId(userId);

    try {
      // If phone is being updated, also update it in the user table
      if (updateStudentDto.phone !== undefined) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { phone: updateStudentDto.phone },
        });
      }

      return await this.prisma.student.update({
        where: { id: student.id },
        data: updateStudentDto,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          enrollments: {
            include: {
              course: true,
              section: true,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(
        'Failed to update student profile. Please check your input and try again.'
      );
    }
  }

  async remove(id: string) {
    const student = await this.findOne(id);

    return this.prisma.student.delete({
      where: { id },
    });
  }
}
