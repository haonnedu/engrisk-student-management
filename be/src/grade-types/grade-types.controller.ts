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
import { GradeTypesService } from "./grade-types.service";
import { CreateGradeTypeDto, UpdateGradeTypeDto } from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";

@ApiTags("grade-types")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("grade-types")
export class GradeTypesController {
  constructor(private readonly gradeTypesService: GradeTypesService) {}

  @Post()
  create(@Body() createGradeTypeDto: CreateGradeTypeDto) {
    return this.gradeTypesService.create(createGradeTypeDto);
  }

  @Get()
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("isActive") isActive?: string
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    const isActiveBool = isActive ? isActive === "true" : undefined;

    return this.gradeTypesService.findAll(
      pageNum,
      limitNum,
      search,
      isActiveBool
    );
  }

  @Get("active")
  getActiveGradeTypes() {
    return this.gradeTypesService.getActiveGradeTypes();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.gradeTypesService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateGradeTypeDto: UpdateGradeTypeDto
  ) {
    return this.gradeTypesService.update(id, updateGradeTypeDto);
  }

  @Patch("sort/update")
  updateSortOrder(@Body() body: { gradeTypeIds: string[] }) {
    return this.gradeTypesService.updateSortOrder(body.gradeTypeIds);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.gradeTypesService.remove(id);
  }
}
