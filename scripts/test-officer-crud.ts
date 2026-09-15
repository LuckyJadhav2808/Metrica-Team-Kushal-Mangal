import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../lib/auth";

async function testOfficerCRUD() {
  console.log("Testing Officer CRUD logic...");

  // 1. Commission / Create
  const testEmail = `test.officer.${Date.now()}@metrica.gov.in`;
  const password = "GovPass@2026";
  const passwordHash = await hashPassword(password);

  const newOfficer = await prisma.user.create({
    data: {
      name: "Inspector Vikram Rathore",
      email: testEmail,
      passwordHash,
      role: "LMO",
      designation: "Legal Metrology Inspector (Grade-I)",
      jurisdictionCircle: "Delhi West District Circle",
      organizationName: "Najafgarh APMC Mandi",
      phone: "+91 98765 43210",
      officerBadgeId: "LMO-DL-W-999",
      avatarLetter: "V",
    },
  });

  console.log("✔ Created Officer:", newOfficer.name, newOfficer.email, newOfficer.officerBadgeId);

  // Verify login password
  const isPassValid = await verifyPassword(password, newOfficer.passwordHash);
  if (!isPassValid) throw new Error("Initial password verification failed");
  console.log("✔ Password validation verified");

  // 2. Update Officer & Reset Password
  const newPassword = "NewGovPassword@2026";
  const newHash = await hashPassword(newPassword);

  const updatedOfficer = await prisma.user.update({
    where: { id: newOfficer.id },
    data: {
      designation: "Senior Metrology Enforcement Officer",
      jurisdictionCircle: "Delhi North District Circle",
      passwordHash: newHash,
    },
  });

  console.log("✔ Updated Officer:", updatedOfficer.name, updatedOfficer.designation, updatedOfficer.jurisdictionCircle);

  const isNewPassValid = await verifyPassword(newPassword, updatedOfficer.passwordHash);
  if (!isNewPassValid) throw new Error("Updated password verification failed");
  console.log("✔ Reset password validation verified");

  // 3. Decommission / Delete Officer
  await prisma.user.delete({
    where: { id: newOfficer.id },
  });

  const checkDeleted = await prisma.user.findUnique({
    where: { id: newOfficer.id },
  });

  if (checkDeleted) throw new Error("Officer deletion failed");
  console.log("✔ Officer successfully decommissioned and removed");

  console.log("\nALL OFFICER CRUD TESTS PASSED!");
}

testOfficerCRUD()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
