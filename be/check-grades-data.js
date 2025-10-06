const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkGradesData() {
  try {
    console.log("=== CHECKING GRADES DATA ===");

    // Check enrollments
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
        section: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
          },
        },
      },
    });

    console.log(`Found ${enrollments.length} enrollments:`);
    enrollments.forEach((enrollment) => {
      console.log(
        `  - Student: ${enrollment.student.firstName} ${enrollment.student.lastName} (${enrollment.student.studentId})`
      );
      console.log(
        `    Section: ${enrollment.section?.name || "No section"} (${
          enrollment.section?.code || "N/A"
        })`
      );
      console.log(
        `    Course: ${enrollment.course.title} (${enrollment.course.courseCode})`
      );
      console.log(`    SectionId: ${enrollment.sectionId || "null"}`);
      console.log("---");
    });

    // Check grades
    const grades = await prisma.grade.findMany({
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
          },
        },
      },
    });

    console.log(`\nFound ${grades.length} grades:`);
    grades.forEach((grade) => {
      console.log(
        `  - Student: ${grade.student.firstName} ${grade.student.lastName} (${grade.student.studentId})`
      );
      console.log(
        `    Course: ${grade.course.title} (${grade.course.courseCode})`
      );
      console.log(`    Grade Type: ${grade.gradeType}, Score: ${grade.grade}`);
      console.log("---");
    });

    // Check specific class
    const classSection = await prisma.classSection.findFirst({
      where: { code: "ENG101-A" },
      include: {
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

    if (classSection) {
      console.log(`\nClass: ${classSection.name} (${classSection.code})`);
      console.log(`Enrollments: ${classSection.enrollments.length}`);
      classSection.enrollments.forEach((enrollment) => {
        console.log(
          `  - ${enrollment.student.firstName} ${enrollment.student.lastName} (${enrollment.student.studentId})`
        );
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGradesData();
