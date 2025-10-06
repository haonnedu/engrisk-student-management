import { Module } from "@nestjs/common";
import { ClassesService } from "./sections.service";
import { ClassesController } from "./sections.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [ClassesController],
  providers: [ClassesService, PrismaService],
})
export class ClassesModule {}
