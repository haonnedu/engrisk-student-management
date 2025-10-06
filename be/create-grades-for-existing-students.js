const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createGradesForExistingStudents() {
  try {
    console.log("Finding existing students and enrollments...");

    // Get all enrollments
    const enrollments = await prisma.enrollment.findMany({
      include: {
        student: true,
        course: true,
        section: true,
      },
    });

    console.log(`Found ${enrollments.length} enrollments`);

    // Define all grade types
    const gradeTypes = [
      "ASSIGNMENT",
      "QUIZ",
      "EXAM",
      "FINAL",
      "HW",
      "SP",
      "PP",
      "TEST_1L",
      "TEST_1RW",
      "TEST_2L",
      "TEST_2RW",
      "TEST_3L",
      "TEST_3RW",
    ];

    for (const enrollment of enrollments) {
      console.log(
        `Processing enrollment for student ${enrollment.student.studentId} in course ${enrollment.course.courseCode}`
      );

      // Check if grades already exist for this student-course combination
      const existingGrades = await prisma.grade.findMany({
        where: {
          studentId: enrollment.studentId,
          courseId: enrollment.courseId,
        },
      });

      if (existingGrades.length > 0) {
        console.log(
          `  Grades already exist for ${enrollment.student.studentId}, skipping...`
        );
        continue;
      }

      // Create grades for all grade types
      for (const gradeType of gradeTypes) {
        try {
          await prisma.grade.create({
            data: {
              studentId: enrollment.studentId,
              courseId: enrollment.courseId,
              grade: 0,
              gradeType: gradeType,
              comments: `Auto-generated for ${gradeType}`,
            },
          });
          console.log(`    Created ${gradeType} grade`);
        } catch (error) {
          console.log(`    Error creating ${gradeType} grade:`, error.message);
        }
      }
    }

    console.log("Grade creation completed!");
  } catch (error) {
    console.error("Error during grade creation:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createGradesForExistingStudents();
