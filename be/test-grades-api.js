const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testGradesAPI() {
  try {
    console.log("=== TESTING GRADES API ===");

    // Get a grade to test with
    const grade = await prisma.grade.findFirst({
      include: {
        student: true,
        course: true,
      },
    });

    if (!grade) {
      console.log("No grades found in database");
      return;
    }

    console.log(`Found grade: ${grade.id}`);
    console.log(`Student: ${grade.student.firstName} ${grade.student.lastName}`);
    console.log(`Course: ${grade.course.title}`);
    console.log(`Current grade: ${grade.grade}`);
    console.log(`Grade type: ${grade.gradeType}`);

    // Test updating the grade
    console.log("\nTesting grade update...");
    const updatedGrade = await prisma.grade.update({
      where: { id: grade.id },
      data: { grade: 85 },
    });

    console.log(`Updated grade to: ${updatedGrade.grade}`);

    // Test the API endpoint
    console.log("\nTesting API endpoint...");
    const fetch = require('node-fetch');
    
    try {
      const response = await fetch(`http://localhost:3001/api/v1/grades/${grade.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWdlbjF6ZjQwMDAwZzFhd2U3MXFxN2F3IiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1OTcyNjEwNiwiZXhwIjoxNzU5ODEyNTA2fQ.ulKa9D47IrfGrQ_X9ld8mu9o0ExE3wM0o1u3XDLXLs4'
        },
        body: JSON.stringify({ grade: 90 })
      });

      if (response.ok) {
        const result = await response.json();
        console.log("API test successful:", result);
      } else {
        console.log("API test failed:", response.status, await response.text());
      }
    } catch (error) {
      console.log("API test error:", error.message);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testGradesAPI();
