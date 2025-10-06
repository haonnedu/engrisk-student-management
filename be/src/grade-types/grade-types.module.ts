import { Module } from "@nestjs/common";
import { GradeTypesService } from "./grade-types.service";
import { GradeTypesController } from "./grade-types.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [GradeTypesController],
  providers: [GradeTypesService],
  exports: [GradeTypesService],
})
export class GradeTypesModule {}
