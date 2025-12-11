import { Module } from "@nestjs/common";
import { HomeworkService } from "./homework.service";
import { HomeworkController } from "./homework.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { GoogleDriveModule } from "../google-drive/google-drive.module";

@Module({
  imports: [PrismaModule, GoogleDriveModule],
  controllers: [HomeworkController],
  providers: [HomeworkService],
  exports: [HomeworkService],
})
export class HomeworkModule {}
