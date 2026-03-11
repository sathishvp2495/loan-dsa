import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import { env } from "../src/config/env.js";

const prisma = new PrismaClient();

async function upsertUser(input: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}) {
  const passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.user.upsert({
    where: { email: input.email.toLowerCase() },
    update: {
      fullName: input.fullName,
      passwordHash,
      role: input.role,
      isActive: true
    },
    create: {
      email: input.email.toLowerCase(),
      fullName: input.fullName,
      passwordHash,
      role: input.role,
      isActive: true
    }
  });
}

async function main() {
  await upsertUser({
    email: env.ADMIN_SEED_EMAIL,
    password: env.ADMIN_SEED_PASSWORD,
    fullName: "System Admin",
    role: "ADMIN"
  });

  await upsertUser({
    email: env.AGENT_SEED_EMAIL,
    password: env.AGENT_SEED_PASSWORD,
    fullName: "Primary Agent",
    role: "AGENT"
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
