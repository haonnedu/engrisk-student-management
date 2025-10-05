import {
  Controller,
  Get,
  UseGuards,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { GradesService } from "./grades.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateGradeDto } from "./dto/create-grade.dto";
  import { UpdateGradeDto } from "./dto/update-grade.dto";

@ApiTags("Grades")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("grades")
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @ApiOperation({ summary: "Create grade" })
  @Post()
  create(@Body() createDto: CreateGradeDto) {
    return this.gradesService.create(createDto);
  }

  @Get()
  findAll() {
    return this.gradesService.findAll();
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
