const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedCourses() {
  try {
    console.log("Seeding courses...");

    const courses = [
      {
        title: "English for Beginners",
        courseCode: "ENG101",
        description:
          "Basic English course for beginners - Learn basic vocabulary, grammar, and conversation skills",
        credits: 3,
        duration: 12, // 12 weeks
        maxStudents: 20,
        status: "ACTIVE",
      },
      {
        title: "Intermediate English",
        courseCode: "ENG201",
        description:
          "Intermediate English course - Improve speaking, listening, reading, and writing skills",
        credits: 4,
        duration: 16, // 16 weeks
        maxStudents: 18,
        status: "ACTIVE",
      },
      {
        title: "Advanced English",
        courseCode: "ENG301",
        description:
          "Advanced English course - Master complex grammar, academic writing, and professional communication",
        credits: 4,
        duration: 20, // 20 weeks
        maxStudents: 15,
        status: "ACTIVE",
      },
      {
        title: "Business English",
        courseCode: "ENG401",
        description:
          "Business English course - Learn professional communication, presentations, and business writing",
        credits: 3,
        duration: 10, // 10 weeks
        maxStudents: 12,
        status: "ACTIVE",
      },
      {
        title: "IELTS Preparation",
        courseCode: "IELTS101",
        description:
          "IELTS exam preparation course - Comprehensive training for all four test sections",
        credits: 5,
        duration: 24, // 24 weeks
        maxStudents: 10,
        status: "ACTIVE",
      },
      {
        title: "TOEFL Preparation",
        courseCode: "TOEFL101",
        description:
          "TOEFL exam preparation course - Focus on academic English and test-taking strategies",
        credits: 5,
        duration: 20, // 20 weeks
        maxStudents: 10,
        status: "ACTIVE",
      },
      {
        title: "Conversation Practice",
        courseCode: "CONV101",
        description:
          "English conversation practice - Improve speaking fluency and confidence through interactive sessions",
        credits: 2,
        duration: 8, // 8 weeks
        maxStudents: 25,
        status: "ACTIVE",
      },
      {
        title: "English Grammar Mastery",
        courseCode: "GRAM101",
        description:
          "Comprehensive English grammar course - Master all grammar rules and structures",
        credits: 3,
        duration: 14, // 14 weeks
        maxStudents: 20,
        status: "ACTIVE",
      },
    ];

    for (const course of courses) {
      await prisma.course.create({
        data: course,
      });
      console.log(`Created course: ${course.title} (${course.courseCode})`);
    }

    console.log("Courses seeded successfully!");
  } catch (error) {
    console.error("Error seeding courses:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCourses();
