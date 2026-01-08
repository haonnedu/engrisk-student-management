import {
  Controller,
  Get,
  UseGuards,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  Res,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiProduces } from "@nestjs/swagger";
import { GradesService } from "./grades.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateGradeDto } from "./dto/create-grade.dto";
import { UpdateGradeDto } from "./dto/update-grade.dto";
import { Response } from "express";

@ApiTags("Grades")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("grades")
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @ApiOperation({ summary: "Export grades for a section to Excel" })
  @ApiResponse({ status: 200, description: "Excel file generated successfully" })
  @ApiProduces("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  @Get("export/:sectionId")
  async exportSectionGrades(
    @Param("sectionId") sectionId: string,
    @Res() res: Response
  ) {
    const buffer = await this.gradesService.exportSectionGrades(sectionId);
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `grades-${sectionId}-${timestamp}.xlsx`;
    
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @ApiOperation({ summary: "Create grade" })
  @Post()
  create(@Body() createDto: CreateGradeDto) {
    return this.gradesService.create(createDto);
  }

  @Get()
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("studentIds") studentIds?: string
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    const studentIdsArray = studentIds ? studentIds.split(",") : undefined;

    return this.gradesService.findAll(
      pageNum,
      limitNum,
      search,
      studentIdsArray
    );
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.gradesService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateDto: UpdateGradeDto) {
    return this.gradesService.update(id, updateDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.gradesService.remove(id);
  }
}
