const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log("=== CLASSES ===");
    const classes = await prisma.classSection.findMany({
      include: {
        course: true,
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
          },
        },
      },
    });

    classes.forEach((cls) => {
      console.log(`Class: ${cls.name} (${cls.code})`);
      console.log(`  Course: ${cls.course?.title || "No course assigned"}`);
      console.log(`  Enrollments: ${cls.enrollments.length}`);
      cls.enrollments.forEach((enroll) => {
        console.log(
          `    - ${enroll.student.firstName} ${enroll.student.lastName} (${enroll.student.studentId})`
        );
      });
      console.log("---");
    });

    console.log("\n=== ENROLLMENTS ===");
    const enrollments = await prisma.enrollment.findMany({
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        course: true,
        section: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    enrollments.forEach((enroll) => {
      console.log(
        `Enrollment: ${enroll.student.firstName} ${enroll.student.lastName}`
      );
      console.log(
        `  Course: ${enroll.course.title} (${enroll.course.courseCode})`
      );
      console.log(
        `  Section: ${enroll.section?.name || "No section"} (${
          enroll.section?.code || "N/A"
        })`
      );
      console.log(`  SectionId: ${enroll.sectionId || "null"}`);
      console.log("---");
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
