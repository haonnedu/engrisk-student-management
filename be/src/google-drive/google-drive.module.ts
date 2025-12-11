import { Module } from "@nestjs/common";
import { GoogleDriveService } from "./google-drive.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [GoogleDriveService],
  exports: [GoogleDriveService],
})
export class GoogleDriveModule {}

