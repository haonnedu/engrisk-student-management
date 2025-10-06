const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedHomework() {
  try {
    console.log("Seeding homework data...");

    // Get students and sections
    const students = await prisma.student.findMany({
      take: 2, // Get first 2 students
    });

    const sections = await prisma.classSection.findMany({
      take: 1, // Get first section
    });

    if (students.length === 0 || sections.length === 0) {
      console.log(
        "No students or sections found. Please seed students and sections first."
      );
      return;
    }

    const section = sections[0];

    // Sample homework data
    const homeworkData = [
      {
        title: "Grammar Exercise 1",
        description: "Complete the grammar exercises on page 15",
        points: 85,
        maxPoints: 100,
        dueDate: new Date("2025-01-15T23:59:59.000Z"),
      },
      {
        title: "Vocabulary Quiz",
        description: "Study vocabulary from Unit 1 and complete the quiz",
        points: 92,
        maxPoints: 100,
        dueDate: new Date("2025-01-16T23:59:59.000Z"),
      },
      {
        title: "Reading Comprehension",
        description: "Read the passage and answer comprehension questions",
        points: 78,
        maxPoints: 100,
        dueDate: new Date("2025-01-17T23:59:59.000Z"),
      },
      {
        title: "Writing Assignment",
        description: "Write a 200-word essay about your favorite hobby",
        points: 88,
        maxPoints: 100,
        dueDate: new Date("2025-01-18T23:59:59.000Z"),
      },
      {
        title: "Listening Exercise",
        description: "Listen to the audio and answer the questions",
        points: 75,
        maxPoints: 100,
        dueDate: new Date("2025-01-19T23:59:59.000Z"),
      },
    ];

    // Create homework for each student
    for (const student of students) {
      console.log(`Creating homework for student ${student.studentId}...`);

      for (const homework of homeworkData) {
        await prisma.homework.create({
          data: {
            studentId: student.id,
            sectionId: section.id,
            ...homework,
          },
        });
        console.log(`  Created: ${homework.title}`);
      }
    }

    console.log("Homework seeding completed!");
  } catch (error) {
    console.error("Error seeding homework:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedHomework();
