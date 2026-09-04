import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Default password hash for all seed accounts
  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 1. Seed Institutional Users
  const adminUser = await prisma.user.upsert({
    where: { email: "controller.lm@nic.in" },
    update: {},
    create: {
      email: "controller.lm@nic.in",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      name: "Dr. S. K. Verma",
      designation: "Controller of Legal Metrology",
      phone: "+91 11 2338 0000",
      organizationName: "Department of Consumer Affairs, DoCA HQ",
      jurisdictionCircle: "All India HQ (Krishi Bhawan)",
      officerBadgeId: "DoCA-DIR-001",
      avatarLetter: "V",
    },
  });

  const lmoUser = await prisma.user.upsert({
    where: { email: "rajesh.kumar.lmo@gov.in" },
    update: {},
    create: {
      email: "rajesh.kumar.lmo@gov.in",
      passwordHash: defaultPasswordHash,
      role: "LMO",
      name: "Rajesh Kumar",
      designation: "Legal Metrology Inspector (Grade-I)",
      phone: "+91 98102 33445",
      organizationName: "Delhi Directorate of Legal Metrology",
      jurisdictionCircle: "Delhi North District Circle",
      officerBadgeId: "LMO-DL-N-884",
      avatarLetter: "R",
    },
  });

  const merchantUser = await prisma.user.upsert({
    where: { email: "ramesh.patel@greenvalley.in" },
    update: {},
    create: {
      email: "ramesh.patel@greenvalley.in",
      passwordHash: defaultPasswordHash,
      role: "OWNER",
      name: "Ramesh Patel",
      designation: "Commercial Licensee",
      phone: "+91 98201 55667",
      organizationName: "Green Valley Groceries",
      jurisdictionCircle: "Delhi North District Circle",
      avatarLetter: "P",
    },
  });

  const mfrUser = await prisma.user.upsert({
    where: { email: "regulatory@apexmetrology.com" },
    update: {},
    create: {
      email: "regulatory@apexmetrology.com",
      passwordHash: defaultPasswordHash,
      role: "MANUFACTURER",
      name: "Anand Swaminathan",
      designation: "Chief Regulatory Officer",
      phone: "+91 80 4400 9900",
      organizationName: "Apex Metrology Instruments India Ltd",
      jurisdictionCircle: "National Manufacturing Division",
      officerBadgeId: "IND/09/2026/88",
      avatarLetter: "A",
    },
  });

  console.log("Users seeded successfully. All demo records purged (only logins preserved).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
