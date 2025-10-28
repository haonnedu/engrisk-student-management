import { Body, Controller, Get, Param, Post, Patch, Delete, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { TeacherStatus } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateTeacherDto } from "./dto";
import { TeachersService } from "./teachers.service";

@ApiTags("Teachers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("teachers")
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @ApiOperation({ summary: "Create a new teacher" })
  @ApiResponse({ status: 201, description: "Teacher created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @Post()
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  @ApiOperation({ summary: "Get all teachers" })
  @ApiResponse({ status: 200, description: "Teachers retrieved successfully" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "status", required: false, enum: TeacherStatus })
  @Get()
  findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("status") status?: TeacherStatus
  ) {
    return this.teachersService.findAll(page, limit, status);
  }

  @ApiOperation({ summary: "Get a teacher by ID" })
  @ApiResponse({ status: 200, description: "Teacher retrieved successfully" })
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.teachersService.findOne(id);
  }

  @ApiOperation({ summary: "Update a teacher" })
  @ApiResponse({ status: 200, description: "Teacher updated successfully" })
  @ApiResponse({ status: 404, description: "Teacher not found" })
  @Patch(":id")
  update(@Param("id") id: string, @Body() updateTeacherDto: Partial<CreateTeacherDto>) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  @ApiOperation({ summary: "Delete a teacher" })
  @ApiResponse({ status: 200, description: "Teacher deleted successfully" })
  @ApiResponse({ status: 404, description: "Teacher not found" })
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.teachersService.remove(id);
  }
}