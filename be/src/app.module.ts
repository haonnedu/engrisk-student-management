import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { StudentsModule } from "./students/students.module";
import { CoursesModule } from "./courses/courses.module";
import { EnrollmentsModule } from "./enrollments/enrollments.module";
import { GradesModule } from "./grades/grades.module";
import { ClassesModule } from "./classes/sections.module";
import { AttendanceModule } from "./attendance/attendance.module";

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
    AttendanceModule,
  ],
})
export class AppModule {}
