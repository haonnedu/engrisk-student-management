import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { StudentsModule } from "./students/students.module";
import { CoursesModule } from "./courses/courses.module";
import { EnrollmentsModule } from "./enrollments/enrollments.module";
import { GradesModule } from "./grades/grades.module";
import { ClassesModule } from "./classes/sections.module";
import { SectionsModule } from "./sections/sections.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { HomeworkModule } from "./homework/homework.module";
import { GradeTypesModule } from "./grade-types/grade-types.module";
import { TeachersModule } from "./teachers/teachers.module";
import { TimesheetsModule } from "./timesheets/timesheets.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    StudentsModule,
    CoursesModule,
    EnrollmentsModule,
    GradesModule,
    ClassesModule,
    SectionsModule,
    AttendanceModule,
    HomeworkModule,
    GradeTypesModule,
    TeachersModule,
    TimesheetsModule,
    HealthModule,
  ],
})
export class AppModule {}
