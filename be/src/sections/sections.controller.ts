import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { ClassesService } from "./sections.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("sections")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("sections")
export class ClassesController {
  constructor(private readonly sectionsService: ClassesService) {}

  @Post()
  create(@Body() body: any) {
    return this.sectionsService.createSection(body);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.sectionsService.getSection(id);
  }

  // Get grade types for a section
  @Get(":id/grade-types")
  getSectionGradeTypes(@Param("id") id: string) {
    return this.sectionsService.getSectionGradeTypes(id);
  }

  // Add grade type to section
  @Post(":id/grade-types/:gradeTypeId")
  addGradeTypeToSection(
    @Param("id") id: string,
    @Param("gradeTypeId") gradeTypeId: string
  ) {
    return this.sectionsService.addGradeTypeToSection(id, gradeTypeId);
  }

  // Remove grade type from section
  @Delete(":id/grade-types/:gradeTypeId")
  removeGradeTypeFromSection(
    @Param("id") id: string,
    @Param("gradeTypeId") gradeTypeId: string
  ) {
    return this.sectionsService.removeGradeTypeFromSection(id, gradeTypeId);
  }

  // Update sort order of grade types in section
  @Patch(":id/grade-types/sort")
  updateSectionGradeTypesSortOrder(
    @Param("id") id: string,
    @Body() body: { sectionGradeTypeIds: string[] }
  ) {
    return this.sectionsService.updateSectionGradeTypesSortOrder(
      id,
      body.sectionGradeTypeIds
    );
  }

  // Toggle active status of grade type in section
  @Patch(":id/grade-types/:gradeTypeId/toggle")
  toggleGradeTypeInSection(
    @Param("id") id: string,
    @Param("gradeTypeId") gradeTypeId: string,
    @Body() body: { isActive: boolean }
  ) {
    return this.sectionsService.toggleGradeTypeInSection(
      id,
      gradeTypeId,
      body.isActive
    );
  }
}
