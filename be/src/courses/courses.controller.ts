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
import { CoursesService } from "./courses.service";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Courses")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("courses")
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @ApiOperation({ summary: "Create a new course" })
  @ApiResponse({ status: 201, description: "Course created successfully" })
  @Post()
  create(@Body() body: any) {
    return this.coursesService.create(body);
  }

  @ApiOperation({ summary: "Get all courses" })
  @ApiResponse({
    status: 200,
    description: "Courses retrieved successfully",
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @Get()
  findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string
  ) {
    return this.coursesService.findAll(page, limit, search);
  }

  @ApiOperation({ summary: "Get a course by ID" })
  @ApiResponse({
    status: 200,
    description: "Course retrieved successfully",
  })
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.coursesService.findOne(id);
  }

  @ApiOperation({ summary: "Update a course" })
  @ApiResponse({ status: 200, description: "Course updated successfully" })
  @Put(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.coursesService.update(id, body);
  }

  @ApiOperation({ summary: "Delete a course" })
  @ApiResponse({ status: 200, description: "Course deleted successfully" })
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.coursesService.remove(id);
  }
}
