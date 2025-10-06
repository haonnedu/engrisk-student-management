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
import { AttendanceService } from "./attendance.service";
import { CreateAttendanceDto } from "./dto/create-attendance.dto";
import { UpdateAttendanceDto } from "./dto/update-attendance.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("attendance")
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.create(createAttendanceDto);
  }

  @Get()
  findAll(
    @Query("sectionId") sectionId?: string,
    @Query("month") month?: string
  ) {
    return this.attendanceService.findAll(sectionId, month);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.attendanceService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto
  ) {
    return this.attendanceService.update(id, updateAttendanceDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.attendanceService.remove(id);
  }

  @Post("set")
  setAttendance(
    @Body()
    body: {
      sectionId: string;
      studentId: string;
      date: string;
      status: string;
      note?: string;
    }
  ) {
    return this.attendanceService.setAttendance(
      body.sectionId,
      body.studentId,
      body.date,
      body.status,
      body.note
    );
  }

  @Post("generate")
  generateAttendance(
    @Body() body: { sectionId: string; startDate: string; endDate: string }
  ) {
    return this.attendanceService.generateAttendance(
      body.sectionId,
      body.startDate,
      body.endDate
    );
  }
}
