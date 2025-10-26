import { Injectable, NotFoundException } from "@nestjs/common";
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
          throw new Error("Missing required fields: firstName, lastName, engName, dateOfBirth");
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
            throw new Error("Invalid dateOfBirth format; expected YYYY-MM-DD or Excel date");
          }
          dateOfBirth = parsed;
        } else {
          throw new Error("Unsupported dateOfBirth value");
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
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const student = await this.findOne(id);

    return this.prisma.student.update({
      where: { id },
      data: updateStudentDto,
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

  async remove(id: string) {
    const student = await this.findOne(id);

    return this.prisma.student.delete({
      where: { id },
    });
  }
}
