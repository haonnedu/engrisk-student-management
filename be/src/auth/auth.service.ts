import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";
import { LoginDto, RegisterDto } from "./dto";
import { UserRole } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async validateUser(emailOrPhone: string, password: string): Promise<any> {
    // Check if input is email or phone
    const isEmail = emailOrPhone.includes("@");

    const user = await this.prisma.user.findUnique({
      where: isEmail ? { email: emailOrPhone } : { phone: emailOrPhone },
      include: {
        student: true,
        admin: true,
      },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(
      loginDto.emailOrPhone,
      loginDto.password
    );
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        student: user.student,
        admin: user.admin,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        phone: registerDto.phone,
        password: hashedPassword,
        role: registerDto.role || UserRole.STUDENT,
      },
    });

    // Create student or admin profile based on role
    if (user.role === UserRole.STUDENT) {
      await this.prisma.student.create({
        data: {
          userId: user.id,
          studentId: `STU${Date.now()}`, // Generate student ID
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          engName: registerDto.engName,
          dateOfBirth: registerDto.dateOfBirth,
          phone: registerDto.phone,
          address: registerDto.address,
        },
      });
    } else if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN
    ) {
      await this.prisma.admin.create({
        data: {
          userId: user.id,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          position: registerDto.position,
        },
      });
    }

    const { password, ...result } = user;
    return result;
  }
}
