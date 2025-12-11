import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { HomeworkService } from "./homework.service";
import { GoogleDriveService } from "../google-drive/google-drive.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateHomeworkDto, UpdateHomeworkDto } from "./dto";
import { BulkCreateHomeworkDto } from "./dto/bulk-create-homework.dto";
import {
  CreateHomeworkSubmissionDto,
  UpdateHomeworkSubmissionDto,
} from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { diskStorage } from "multer";
import * as path from "path";
import * as fs from "fs";

@Controller("homework")
@UseGuards(JwtAuthGuard)
export class HomeworkController {
  constructor(
    private readonly homeworkService: HomeworkService,
    private readonly googleDriveService: GoogleDriveService,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  create(@Body() createHomeworkDto: CreateHomeworkDto) {
    return this.homeworkService.create(createHomeworkDto);
  }

  @Post("bulk")
  createBulk(@Body() body: BulkCreateHomeworkDto) {
    return this.homeworkService.createBulk(body);
  }

  @Get()
  findAll(
    @Query("sectionId") sectionId?: string,
    @Query("studentId") studentId?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.homeworkService.findAll(
      sectionId,
      studentId,
      pageNum,
      limitNum
    );
  }

  @Get("stats/:studentId")
  getStudentStats(
    @Param("studentId") studentId: string,
    @Query("sectionId") sectionId?: string
  ) {
    return this.homeworkService.getStudentHomeworkStats(studentId, sectionId);
  }

  // Homework Submissions endpoints - MUST be before :id routes to avoid matching "submissions" as :id
  @Post("submissions")
  async createSubmission(
    @Body() createSubmissionDto: CreateHomeworkSubmissionDto,
    @Req() req: any
  ) {
    const studentId = req.user?.student?.id;
    if (!studentId) {
      throw new Error("Student ID not found in token");
    }
    return this.homeworkService.createSubmission(studentId, createSubmissionDto);
  }

  @Get("submissions")
  async getSubmissions(
    @Query("homeworkId") homeworkId?: string,
    @Query("studentId") studentId?: string,
    @Req() req?: any
  ) {
    // If studentId not provided, use from token
    const finalStudentId = studentId || req?.user?.student?.id;
    return this.homeworkService.getSubmissions(homeworkId, finalStudentId);
  }

  @Get("submissions/:id")
  async getSubmission(@Param("id") id: string, @Req() req: any) {
    const studentId = req.user?.student?.id;
    return this.homeworkService.getSubmission(id, studentId);
  }

  @Patch("submissions/:id")
  async updateSubmission(
    @Param("id") id: string,
    @Body() updateSubmissionDto: UpdateHomeworkSubmissionDto,
    @Req() req: any
  ) {
    const studentId = req.user?.student?.id;
    return this.homeworkService.updateSubmission(
      id,
      studentId,
      updateSubmissionDto
    );
  }

  // Generic :id routes - MUST be AFTER specific routes like "submissions"
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.homeworkService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateHomeworkDto: UpdateHomeworkDto
  ) {
    return this.homeworkService.update(id, updateHomeworkDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.homeworkService.remove(id);
  }

  @Post("submissions/:id/upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = process.env.UPLOAD_DIR 
            ? path.join(process.env.UPLOAD_DIR, "temp")
            : path.join(process.cwd(), "uploads", "temp");
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max
      },
    })
  )
  async uploadFile(
    @Param("id") submissionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    if (!file) {
      throw new Error("No file uploaded");
    }

    const studentId = req.user?.student?.id;
    if (!studentId) {
      throw new Error("Student ID not found in token");
    }

    // Get submission with homework, section, and student info
    const submission = await this.homeworkService.getSubmission(submissionId, studentId);
    
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Check if submission already has files - if yes, delete old files
    if (submission.files && submission.files.length > 0) {
      for (const oldFile of submission.files) {
        try {
          // Get the drive account used for the old file
          const oldDriveAccount = await this.googleDriveService.getDriveById(oldFile.googleDriveId);
          
          // Delete file from Google Drive
          await this.googleDriveService.deleteFile(
            oldFile.googleDriveFileId,
            oldDriveAccount
          );
          
          // Delete file record from database
          await this.homeworkService.deleteFileFromSubmission(oldFile.id, studentId);
        } catch (error) {
          // Log error but continue - don't fail the upload if delete fails
          console.error(`Failed to delete old file ${oldFile.id}:`, error);
        }
      }
    }

    // Generate new filename: homeworkTitle_className_engName.extension
    const homeworkTitle = submission.homework?.title || "Homework";
    const className = submission.homework?.section?.name || submission.homework?.section?.code || "Class";
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { engName: true },
    });
    const engName = student?.engName || "Student";
    
    // Sanitize filenames (remove special characters, replace spaces)
    const sanitize = (str: string) => {
      return str
        .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special chars except spaces, dashes, underscores
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .trim();
    };
    
    const sanitizedTitle = sanitize(homeworkTitle);
    const sanitizedClassName = sanitize(className);
    const sanitizedEngName = sanitize(engName);
    const fileExtension = path.extname(file.originalname);
    
    const newFileName = `${sanitizedTitle}_${sanitizedClassName}_${sanitizedEngName}${fileExtension}`;
    
    // Update file object with new name
    file.originalname = newFileName;

    // Get available Google Drive
    const driveAccount = await this.googleDriveService.getAvailableDrive();

    // Upload to Google Drive
    const uploadResult = await this.googleDriveService.uploadFile(
      file,
      driveAccount
    );

    // Add file record to submission
    const fileRecord = await this.homeworkService.addFileToSubmission(
      submissionId,
      studentId,
      {
        fileName: uploadResult.fileId,
        originalFileName: file.originalname, // This will be the new formatted name
        fileSize: file.size,
        mimeType: file.mimetype,
        googleDriveFileId: uploadResult.fileId,
        googleDriveId: driveAccount.id,
        downloadUrl: uploadResult.downloadUrl,
        thumbnailUrl: uploadResult.thumbnailUrl,
      }
    );

    return fileRecord;
  }

  @Delete("submissions/:submissionId/files/:fileId")
  async deleteFile(
    @Param("submissionId") submissionId: string,
    @Param("fileId") fileId: string,
    @Req() req: any
  ) {
    const studentId = req.user?.student?.id;
    if (!studentId) {
      throw new Error("Student ID not found in token");
    }

    // Get file info to delete from Google Drive
    const submission = await this.homeworkService.getSubmission(submissionId, studentId);
    const fileRecord = submission.files.find((f) => f.id === fileId);
    
    if (!fileRecord) {
      throw new Error("File not found");
    }

    // Get drive account from database
    const driveAccount = await this.googleDriveService.getDriveById(
      fileRecord.googleDriveId
    );

    if (driveAccount) {
      // Delete from Google Drive
      await this.googleDriveService.deleteFile(
        fileRecord.googleDriveFileId,
        driveAccount
      );
    }

    // Delete from database
    return this.homeworkService.deleteFileFromSubmission(fileId, studentId);
  }
}
