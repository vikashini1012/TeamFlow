import "dotenv/config";
import prisma from "../src/lib/prisma";

const run = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("TeamFlow database connection: OK");
  } catch (error) {
    console.error("TeamFlow database connection: FAILED");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

void run();
