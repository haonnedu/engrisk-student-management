import {
  Controller,
  Get,
  Param,
  UseGuards,
  Post,
  Body,
  Patch,
  Delete,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { CoursesService } from "./courses.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";

@ApiTags("Courses")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("courses")
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @ApiOperation({ summary: "Create a new course" })
  @ApiResponse({ status: 201, description: "Course created" })
  @Post()
  create(@Body() createDto: CreateCourseDto) {
    return this.coursesService.create(createDto);
  }

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.coursesService.findOne(id);
  }

  @ApiOperation({ summary: "Update a course" })
  @Patch(":id")
  update(@Param("id") id: string, @Body() updateDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateDto);
  }

  @ApiOperation({ summary: "Delete a course" })
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.coursesService.remove(id);
  }
}
