import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStudentDto, UpdateStudentDto } from "./dto";
import { StudentStatus, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

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
