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
      include: {
        course: true,
        assessments: true,
        enrollments: { include: { student: true } },
      },
    });
  }

  listSections(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};
    return Promise.all([
      this.prisma.classSection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          course: true,
          enrollments: {
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
            },
          },
        },
      }),
      this.prisma.classSection.count({ where }),
    ]).then(([data, total]) => ({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }));
  }

  updateSection(id: string, data: any) {
    return this.prisma.classSection.update({ where: { id }, data });
  }

  removeSection(id: string) {
    return this.prisma.classSection.delete({ where: { id } });
  }

  async seedAssessments(sectionId: string) {
    const presets = [
      { code: "HW", label: "HW", order: 1 },
      { code: "SP", label: "SP", order: 2 },
      { code: "PP", label: "PP", order: 3 },
      { code: "TEST_1L", label: "Test 1L", order: 4 },
      { code: "TEST_1RW", label: "Test 1RW", order: 5 },
      { code: "TEST_2L", label: "Test 2L", order: 6 },
      { code: "TEST_2RW", label: "Test 2RW", order: 7 },
      { code: "TEST_3L", label: "Test 3L", order: 8 },
      { code: "TEST_3RW", label: "Test 3RW", order: 9 },
    ];
    for (const p of presets) {
      await this.prisma.assessment.upsert({
        where: { sectionId_code: { sectionId, code: p.code } },
        update: { label: p.label, order: p.order },
        create: { sectionId, code: p.code, label: p.label, order: p.order },
      });
    }
    return this.prisma.assessment.findMany({
      where: { sectionId },
      orderBy: { order: "asc" },
    });
  }

  listAssessments(sectionId: string) {
    return this.prisma.assessment.findMany({
      where: { sectionId },
      orderBy: { order: "asc" },
    });
  }

  upsertScores(payload: {
    sectionId: string;
    scores: { assessmentId: string; studentId: string; score: number | null }[];
  }) {
    const { scores } = payload;
    return this.prisma.$transaction(
      scores.map((s) =>
        this.prisma.assessmentScore.upsert({
          where: {
            assessmentId_studentId: {
              assessmentId: s.assessmentId,
              studentId: s.studentId,
            },
          },
          update: { score: s.score ?? null },
          create: {
            assessmentId: s.assessmentId,
            studentId: s.studentId,
            score: s.score ?? null,
          },
        })
      )
    );
  }

  async generateAttendance(
    sectionId: string,
    startDate: string,
    endDate: string
  ) {
    const section = await this.prisma.classSection.findUnique({
      where: { id: sectionId },
    });
    if (!section) return [];
    const d1 = section.day1 ?? null;
    const d2 = section.day2 ?? null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if ((d1 !== null && day === d1) || (d2 !== null && day === d2)) {
        dates.push(new Date(d));
      }
    }
    const enrolls = await this.prisma.enrollment.findMany({
      where: { sectionId },
    });
    const ops = [] as any[];
    for (const e of enrolls) {
      for (const date of dates) {
        ops.push(
          this.prisma.attendance.upsert({
            where: {
              sectionId_studentId_date: {
                sectionId,
                studentId: e.studentId,
                date,
              },
            },
            update: {},
            create: { sectionId, studentId: e.studentId, date },
          })
        );
      }
    }
    await this.prisma.$transaction(ops);
    return { created: ops.length };
  }

  setAttendance(
    sectionId: string,
    studentId: string,
    date: string,
    status: any
  ) {
    const d = new Date(date);
    return this.prisma.attendance.upsert({
      where: { sectionId_studentId_date: { sectionId, studentId, date: d } },
      update: { status },
      create: { sectionId, studentId, date: d, status },
    });
  }

  listAttendance(sectionId: string, month?: string) {
    const where: any = { sectionId };
    if (month) {
      const start = new Date(month + "-01T00:00:00.000Z");
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      where.date = { gte: start, lt: end };
    }
    return this.prisma.attendance.findMany({ where, orderBy: { date: "asc" } });
  }
}
