import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  createSection(data: any) {
    return this.prisma.classSection.create({ data });
  }

  getSection(id: string) {
    return this.prisma.classSection.findUnique({
      where: { id },
      include: { assessments: true, enrollments: true },
    });
  }
}
