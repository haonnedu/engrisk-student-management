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
} from "@nestjs/common";
import { HomeworkService } from "./homework.service";
import { CreateHomeworkDto, UpdateHomeworkDto } from "./dto";
import { BulkCreateHomeworkDto } from "./dto/bulk-create-homework.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("homework")
@UseGuards(JwtAuthGuard)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

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
}
