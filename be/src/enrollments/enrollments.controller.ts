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
import { EnrollmentsService } from "./enrollments.service";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Enrollments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("enrollments")
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @ApiOperation({ summary: "Create a new enrollment" })
  @ApiResponse({ status: 201, description: "Enrollment created successfully" })
  @Post()
  create(@Body() body: any) {
    return this.enrollmentsService.create(body);
  }

  @ApiOperation({ summary: "Get all enrollments" })
  @ApiResponse({
    status: 200,
    description: "Enrollments retrieved successfully",
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "sectionId", required: false, type: String })
  @Get()
  findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string,
    @Query("sectionId") sectionId?: string
  ) {
    return this.enrollmentsService.findAll(page, limit, search, sectionId);
  }

  @ApiOperation({ summary: "Get an enrollment by ID" })
  @ApiResponse({
    status: 200,
    description: "Enrollment retrieved successfully",
  })
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.enrollmentsService.findOne(id);
  }

  @ApiOperation({ summary: "Update an enrollment" })
  @ApiResponse({ status: 200, description: "Enrollment updated successfully" })
  @Put(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.enrollmentsService.update(id, body);
  }

  @ApiOperation({ summary: "Delete an enrollment" })
  @ApiResponse({ status: 200, description: "Enrollment deleted successfully" })
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.enrollmentsService.remove(id);
  }
}
