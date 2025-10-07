const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createAdminAndSeed() {
  try {
    console.log("Creating admin user...");

    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || "ChangeMe123!",
      10
    );

    const user = await prisma.user.create({
      data: {
        email: "admin@example.com",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    const admin = await prisma.admin.create({
      data: {
        userId: user.id,
        firstName: "Admin",
        lastName: "User",
        position: "System Administrator",
      },
    });

    console.log("Admin user created:", user);
    console.log("Admin profile created:", admin);

    // Create sample courses
    console.log("Creating sample courses...");
    const courses = [
      {
        courseCode: "ENG101",
        title: "English Foundation",
        description: "Basic English language skills",
        credits: 3,
        duration: 12,
        maxStudents: 25,
        status: "ACTIVE",
      },
      {
        courseCode: "ENG102",
        title: "Intermediate English",
        description: "Intermediate English language skills",
        credits: 3,
        duration: 12,
        maxStudents: 25,
        status: "ACTIVE",
      },
      {
        courseCode: "ENG201",
        title: "Advanced English",
        description: "Advanced English language skills",
        credits: 4,
        duration: 16,
        maxStudents: 20,
        status: "ACTIVE",
      },
    ];

    for (const courseData of courses) {
      await prisma.course.create({ data: courseData });
    }

    console.log("Sample courses created");

    // Create sample students
    console.log("Creating sample students...");
    const students = [
      {
        userId: (
          await prisma.user.create({
            data: {
              email: "student1@example.com",
              password: hashedPassword,
              role: "STUDENT",
            },
          })
        ).id,
        studentId: "STU001",
        firstName: "Nguyễn",
        lastName: "Văn A",
        engName: "John",
        dateOfBirth: new Date("2000-01-15"),
        phone: "0123456789",
        status: "ACTIVE",
      },
      {
        userId: (
          await prisma.user.create({
            data: {
              email: "student2@example.com",
              password: hashedPassword,
              role: "STUDENT",
            },
          })
        ).id,
        studentId: "STU002",
        firstName: "Trần",
        lastName: "Thị B",
        engName: "Jane",
        dateOfBirth: new Date("2000-03-20"),
        phone: "0987654321",
        status: "ACTIVE",
      },
    ];

    for (const studentData of students) {
      await prisma.student.create({ data: studentData });
    }

    console.log("Sample students created");

    // Create sample class sections
    console.log("Creating sample class sections...");
    const eng101Course = await prisma.course.findFirst({
      where: { courseCode: "ENG101" },
    });

    const classSection = await prisma.classSection.create({
      data: {
        name: "English Foundation A",
        code: "ENG101-A",
        timeDescription: "Monday, Wednesday, Friday 9:00-11:00",
        day1: 1,
        day2: 3,
        teacherName: "Ms. Smith",
        book: "English Grammar in Use",
        courseId: eng101Course.id,
      },
    });

    console.log("Sample class section created:", classSection);

    // Create enrollments and auto-generate grades
    console.log("Creating enrollments and auto-generating grades...");
    const allStudents = await prisma.student.findMany();

    for (const student of allStudents) {
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: student.id,
          courseId: eng101Course.id,
          sectionId: classSection.id,
          status: "ENROLLED",
        },
      });

      // Auto-create default grades for all grade types
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

      for (const gradeType of gradeTypes) {
        await prisma.grade.create({
          data: {
            studentId: student.id,
            courseId: eng101Course.id,
            grade: 0,
            gradeType: gradeType,
            comments: `Auto-generated for ${gradeType}`,
          },
        });
      }

      console.log(
        `Enrollment and grades created for student ${student.studentId}`
      );
    }

    console.log("Setup completed successfully!");
  } catch (error) {
    console.error("Error during setup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminAndSeed();
