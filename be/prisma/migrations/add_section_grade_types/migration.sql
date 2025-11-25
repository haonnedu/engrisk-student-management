-- CreateTable
CREATE TABLE IF NOT EXISTS "section_grade_types" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "gradeTypeId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_grade_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "section_grade_types_sectionId_gradeTypeId_key" ON "section_grade_types"("sectionId", "gradeTypeId");

-- AddForeignKey
ALTER TABLE "section_grade_types" ADD CONSTRAINT IF NOT EXISTS "section_grade_types_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "class_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_grade_types" ADD CONSTRAINT IF NOT EXISTS "section_grade_types_gradeTypeId_fkey" FOREIGN KEY ("gradeTypeId") REFERENCES "grade_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

