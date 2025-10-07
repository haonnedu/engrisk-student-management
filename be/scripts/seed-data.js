const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting data seeding...");

  try {
    // 1. Create Super Admin User
    console.log("👤 Creating super admin user...");

    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || "ChangeMe123!",
      10
    );

    const superAdmin = await prisma.user.upsert({
      where: { email: "admin@engrisk.com" },
      update: {},
      create: {
        email: "admin@engrisk.com",
        phone: "admin",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        admin: {
          create: {
            firstName: "Super",
            lastName: "Admin",
            position: "System Administrator",
          },
        },
      },
      include: {
        admin: true,
      },
    });

    console.log("✅ Super admin created:", {
      id: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
    });

    // 2. Create Sample Grade Types
    console.log("📊 Creating sample grade types...");

    const gradeTypes = [
      {
        name: "Homework",
        code: "HW",
        description: "Homework assignments and exercises",
        weight: 20,
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Speaking Practice",
        code: "SP",
        description: "Speaking practice and presentations",
        weight: 15,
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "Pronunciation Practice",
        code: "PP",
        description: "Pronunciation exercises and drills",
        weight: 10,
        isActive: true,
        sortOrder: 3,
      },
      {
        name: "Test 1 Listening",
        code: "Test1L",
        description: "First listening test",
        weight: 15,
        isActive: true,
        sortOrder: 4,
      },
      {
        name: "Test 1 Reading & Writing",
        code: "Test1RW",
        description: "First reading and writing test",
        weight: 15,
        isActive: true,
        sortOrder: 5,
      },
      {
        name: "Test 2 Listening",
        code: "Test2L",
        description: "Second listening test",
        weight: 15,
        isActive: true,
        sortOrder: 6,
      },
      {
        name: "Test 2 Reading & Writing",
        code: "Test2RW",
        description: "Second reading and writing test",
        weight: 15,
        isActive: true,
        sortOrder: 7,
      },
      {
        name: "Final Exam",
        code: "Final",
        description: "Final comprehensive exam",
        weight: 25,
        isActive: true,
        sortOrder: 8,
      },
    ];

    for (const gradeType of gradeTypes) {
      await prisma.gradeType.upsert({
        where: { code: gradeType.code },
        update: gradeType,
        create: gradeType,
      });
    }

    console.log("✅ Grade types created:", gradeTypes.length);

    // 3. Create Sample Course
    console.log("📚 Creating sample course...");

    const sampleCourse = await prisma.course.upsert({
      where: { courseCode: "ENG101" },
      update: {},
      create: {
        courseCode: "ENG101",
        title: "English Fundamentals",
        description:
          "Basic English language course covering grammar, vocabulary, and communication skills",
        credits: 3,
        duration: 16, // 16 weeks
        maxStudents: 30,
        status: "ACTIVE",
      },
    });

    console.log("✅ Sample course created:", {
      id: sampleCourse.id,
      code: sampleCourse.courseCode,
      title: sampleCourse.title,
    });

    // 4. Create Sample Class Section
    console.log("🏫 Creating sample class section...");

    const sampleClass = await prisma.classSection.upsert({
      where: { code: "ENG101-A1" },
      update: {},
      create: {
        name: "English Fundamentals - Class A1",
        code: "ENG101-A1",
        timeDescription: "Monday, Wednesday, Friday - 8:00 AM - 10:00 AM",
        day1: 1, // Monday
        day2: 3, // Wednesday
        teacherName: "Ms. Jenny",
        book: "English Fundamentals Book 1",
        courseId: sampleCourse.id,
      },
    });

    console.log("✅ Sample class created:", {
      id: sampleClass.id,
      name: sampleClass.name,
      code: sampleClass.code,
    });

    // 5. Create Sample Students
    console.log("👥 Creating sample students...");

    const sampleStudents = [
      {
        firstName: "Nguyen",
        lastName: "Van An",
        engName: "John",
        studentId: "ST001",
        dateOfBirth: new Date("2000-01-15"),
        phone: "+84901234568",
        address: "123 Le Loi Street, District 1, HCMC",
        emergencyContact: "Nguyen Thi Lan - +84901234569",
        classSchool: "12A1 - THPT Nguyen Du",
        status: "ACTIVE",
      },
      {
        firstName: "Tran",
        lastName: "Thi Binh",
        engName: "Mary",
        studentId: "ST002",
        dateOfBirth: new Date("2000-03-22"),
        phone: "+84901234570",
        address: "456 Nguyen Hue Street, District 1, HCMC",
        emergencyContact: "Tran Van Nam - +84901234571",
        classSchool: "12A2 - THPT Le Hong Phong",
        status: "ACTIVE",
      },
      {
        firstName: "Le",
        lastName: "Van Cuong",
        engName: "David",
        studentId: "ST003",
        dateOfBirth: new Date("1999-12-10"),
        phone: "+84901234572",
        address: "789 Dong Khoi Street, District 1, HCMC",
        emergencyContact: "Le Thi Mai - +84901234573",
        classSchool: "12B1 - THPT Marie Curie",
        status: "ACTIVE",
      },
    ];

    const createdStudents = [];
    for (const studentData of sampleStudents) {
      // Create user for student
      const user = await prisma.user.create({
        data: {
          email: `${studentData.studentId.toLowerCase()}@student.engrisk.com`,
          phone: studentData.phone,
          password: await bcrypt.hash(
            process.env.DEFAULT_STUDENT_PASSWORD || "Student123!",
            10
          ),
          role: "STUDENT",
        },
      });

      // Create student
      const student = await prisma.student.create({
        data: {
          ...studentData,
          userId: user.id,
        },
      });

      createdStudents.push(student);
    }

    console.log("✅ Sample students created:", createdStudents.length);

    // 6. Enroll students in course and class
    console.log("📝 Enrolling students...");

    for (const student of createdStudents) {
      // Enroll in course
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          courseId: sampleCourse.id,
          sectionId: sampleClass.id,
          status: "ENROLLED",
        },
      });

      // Create grades for each student
      const gradeTypes = await prisma.gradeType.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });

      for (const gradeType of gradeTypes) {
        await prisma.grade.create({
          data: {
            studentId: student.id,
            courseId: sampleCourse.id,
            gradeTypeId: gradeType.id,
            grade: 0, // Default grade
          },
        });
      }
    }

    console.log("✅ Students enrolled and grades created");

    console.log("🎉 Data seeding completed successfully!");
    console.log("\n📋 Summary:");
    console.log(
      "- Super Admin: admin@engrisk.com / [use ADMIN_PASSWORD environment variable]"
    );
    console.log("- Grade Types:", gradeTypes.length);
    console.log("- Sample Course: ENG101 - English Fundamentals");
    console.log("- Sample Class: ENG101-A1");
    console.log("- Sample Students:", createdStudents.length);
    console.log("- All students enrolled with default grades");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
