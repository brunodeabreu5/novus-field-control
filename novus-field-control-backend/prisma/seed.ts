import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient, AdminRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@novusfield.com").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123456";
  const fullName = process.env.SEED_ADMIN_NAME || "Platform Admin";

  const existing = await prisma.controlAdmin.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    console.log(`Seed admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.controlAdmin.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: AdminRole.owner,
    },
  });

  console.log(`Created control admin: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
