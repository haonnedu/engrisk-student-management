import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ClassesService } from "./sections.service";

@Controller("classes")
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
}
