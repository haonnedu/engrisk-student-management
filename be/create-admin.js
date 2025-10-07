const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log("Creating admin user...");

    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || "123456",
      10
    );

    const admin = await prisma.user.create({
      data: {
        email: "admin@example.com",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log("Admin user created:", admin);

    // Also create admin profile
    const adminProfile = await prisma.admin.create({
      data: {
        userId: admin.id,
        firstName: "Admin",
        lastName: "User",
        position: "System Administrator",
      },
    });

    console.log("Admin profile created:", adminProfile);
  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
