import { PartialType } from "@nestjs/swagger";
import { CreateGradeTypeDto } from "./create-grade-type.dto";

export class UpdateGradeTypeDto extends PartialType(CreateGradeTypeDto) {}
