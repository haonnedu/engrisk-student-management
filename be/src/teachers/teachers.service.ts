import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTeacherDto } from "./dto";
import * as bcrypt from "bcryptjs";
import { TeacherStatus, UserRole } from "@prisma/client";

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async create(createTeacherDto: CreateTeacherDto) {
    // If userId is not provided, automatically create a User with default password
    let teacherId = createTeacherDto.teacherId;

    if (!teacherId) {
      const defaultPassword =
        process.env.DEFAULT_TEACHER_PASSWORD || "Teacher123!";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const createdUser = await this.prisma.user.create({
        data: {
          email: undefined, // optional; may be set later
          phone: createTeacherDto.phone, // attach phone if provided
          password: hashedPassword,
          role: UserRole.TEACHER,
        },
      });
      teacherId = createdUser.id;
    }
    return this.prisma.teacher.create({
      data: {
        firstName: createTeacherDto.firstName,
        lastName: createTeacherDto.lastName,
        phone: createTeacherDto.phone,
        address: createTeacherDto.address,
        position: createTeacherDto.position,
        status: createTeacherDto.status ?? TeacherStatus.ACTIVE,
        userId: teacherId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(page = 1, limit = 10, status?: TeacherStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    return this.prisma.teacher.findMany({
      where,
      skip,
      take: limit,
    });
  }

  async findOne(id: string) {
    return this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  async update(id: string, updateData: Partial<CreateTeacherDto>) {
    // Get teacher to check if they have a user account
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      select: { userId: true },
    });

    // If teacher has a user and phone is being updated, update user.phone too
    if (teacher?.userId && updateData.phone !== undefined) {
      await this.prisma.user.update({
        where: { id: teacher.userId },
        data: { phone: updateData.phone },
      });
    }

    // Update teacher data
    return this.prisma.teacher.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    // This will also delete the associated user due to onDelete: Cascade
    return this.prisma.teacher.delete({
      where: { id },
    });
  }
}