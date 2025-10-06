import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ClassesService } from "./sections.service";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Classes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("classes")
export class ClassesController {
  constructor(private readonly sectionsService: ClassesService) {}

  @ApiOperation({ summary: "Create a new class" })
  @ApiResponse({ status: 201, description: "Class created successfully" })
  @Post()
  create(@Body() body: any) {
    return this.sectionsService.createSection(body);
  }

  @ApiOperation({ summary: "Get all classes" })
  @ApiResponse({ status: 200, description: "Classes retrieved successfully" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @Get()
  findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string
  ) {
    return this.sectionsService.listSections(page, limit, search);
  }

  @ApiOperation({ summary: "Get a class by ID" })
  @ApiResponse({ status: 200, description: "Class retrieved successfully" })
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.sectionsService.getSection(id);
  }

  @ApiOperation({ summary: "Update a class" })
  @ApiResponse({ status: 200, description: "Class updated successfully" })
  @Put(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.sectionsService.updateSection(id, body);
  }

  @ApiOperation({ summary: "Delete a class" })
  @ApiResponse({ status: 200, description: "Class deleted successfully" })
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.sectionsService.removeSection(id);
  }

  @ApiOperation({ summary: "Seed assessments for a class" })
  @ApiResponse({ status: 200, description: "Assessments seeded successfully" })
  @Post(":id/assessments/seed")
  seedAssessments(@Param("id") id: string) {
    return this.sectionsService.seedAssessments(id);
  }

  @ApiOperation({ summary: "Get assessments for a class" })
  @ApiResponse({
    status: 200,
    description: "Assessments retrieved successfully",
  })
  @Get(":id/assessments")
  getAssessments(@Param("id") id: string) {
    return this.sectionsService.listAssessments(id);
  }

  @ApiOperation({ summary: "Update scores for a class" })
  @ApiResponse({ status: 200, description: "Scores updated successfully" })
  @Post(":id/scores")
  updateScores(@Param("id") id: string, @Body() body: any) {
    return this.sectionsService.upsertScores({
      sectionId: id,
      scores: body.scores,
    });
  }

  @ApiOperation({ summary: "Generate attendance for a class" })
  @ApiResponse({
    status: 200,
    description: "Attendance generated successfully",
  })
  @Post(":id/attendance/generate")
  generateAttendance(
    @Param("id") id: string,
    @Body() body: { startDate: string; endDate: string }
  ) {
    return this.sectionsService.generateAttendance(
      id,
      body.startDate,
      body.endDate
    );
  }

  @ApiOperation({ summary: "Set attendance for a student" })
  @ApiResponse({ status: 200, description: "Attendance updated successfully" })
  @Post(":id/attendance")
  setAttendance(
    @Param("id") id: string,
    @Body() body: { studentId: string; date: string; status: string }
  ) {
    return this.sectionsService.setAttendance(
      id,
      body.studentId,
      body.date,
      body.status
    );
  }

  @ApiOperation({ summary: "Get attendance for a class" })
  @ApiResponse({
    status: 200,
    description: "Attendance retrieved successfully",
  })
  @ApiQuery({ name: "month", required: false, type: String })
  @Get(":id/attendance")
  getAttendance(@Param("id") id: string, @Query("month") month?: string) {
    return this.sectionsService.listAttendance(id, month);
  }
}
