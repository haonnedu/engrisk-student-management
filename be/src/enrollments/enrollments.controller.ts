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
import { EnrollmentsService } from "./enrollments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import { UpdateEnrollmentDto } from "./dto/update-enrollment.dto";

@ApiTags("Enrollments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("enrollments")
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @ApiOperation({ summary: "Create enrollment" })
  @Post()
  create(@Body() createDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createDto);
  }

  @Get()
  findAll() {
    return this.enrollmentsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.enrollmentsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateDto: UpdateEnrollmentDto) {
    return this.enrollmentsService.update(id, updateDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.enrollmentsService.remove(id);
  }
}
