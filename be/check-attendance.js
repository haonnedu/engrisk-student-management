const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkAttendance() {
  try {
    console.log("=== ATTENDANCE RECORDS ===");
    const attendance = await prisma.attendance.findMany({
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
      },
    });

    console.log(`Total attendance records: ${attendance.length}`);
    attendance.forEach((record) => {
      console.log(
        `- ${record.student?.firstName} ${record.student?.lastName} (${record.student?.studentId})`
      );
      console.log(
        `  Section: ${record.section?.name} (${record.section?.code})`
      );
      console.log(`  Date: ${record.date}, Status: ${record.status}`);
      console.log(`  Note: ${record.note || "None"}`);
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
        section: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    console.log(`Total enrollments: ${enrollments.length}`);
    enrollments.forEach((enrollment) => {
      console.log(
        `- ${enrollment.student?.firstName} ${enrollment.student?.lastName} (${enrollment.student?.studentId})`
      );
      console.log(
        `  Section: ${enrollment.section?.name} (${enrollment.section?.code})`
      );
      console.log(`  Status: ${enrollment.status}`);
      console.log("---");
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAttendance();
