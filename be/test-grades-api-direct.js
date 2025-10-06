const fetch = require("node-fetch");

async function testGradesAPI() {
  try {
    console.log("=== TESTING GRADES API DIRECTLY ===");

    // Test enrollments API
    console.log("1. Testing enrollments API...");
    const enrollmentsResponse = await fetch(
      "http://localhost:3001/api/v1/enrollments?sectionId=cmgen1zhn000dg1awz3rasifa",
      {
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWdlbjF6ZjQwMDAwZzFhd2U3MXFxN2F3IiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1OTcyNjEwNiwiZXhwIjoxNzU5ODEyNTA2fQ.ulKa9D47IrfGrQ_X9ld8mu9o0ExE3wM0o1u3XDLXLs4",
        },
      }
    );

    if (enrollmentsResponse.ok) {
      const enrollmentsData = await enrollmentsResponse.json();
      console.log("Enrollments:", enrollmentsData);

      if (enrollmentsData.data && enrollmentsData.data.length > 0) {
        const studentIds = enrollmentsData.data.map(
          (enrollment) => enrollment.studentId
        );
        console.log("Student IDs:", studentIds);

        // Test grades API
        console.log("\n2. Testing grades API...");
        const gradesResponse = await fetch(
          `http://localhost:3001/api/v1/grades?studentIds=${studentIds.join(
            ","
          )}`,
          {
            headers: {
              Authorization:
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWdlbjF6ZjQwMDAwZzFhd2U3MXFxN2F3IiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1OTcyNjEwNiwiZXhwIjoxNzU5ODEyNTA2fQ.ulKa9D47IrfGrQ_X9ld8mu9o0ExE3wM0o1u3XDLXLs4",
            },
          }
        );

        if (gradesResponse.ok) {
          const gradesData = await gradesResponse.json();
          console.log("Grades response:", JSON.stringify(gradesData, null, 2));
        } else {
          console.log(
            "Grades API failed:",
            gradesResponse.status,
            await gradesResponse.text()
          );
        }
      }
    } else {
      console.log(
        "Enrollments API failed:",
        enrollmentsResponse.status,
        await enrollmentsResponse.text()
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testGradesAPI();
