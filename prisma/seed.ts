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

  console.log("Users seeded successfully.");

  // 2. Seed Instruments
  const inst1 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-X8829" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-X8829",
      serialNumber: "SN-8829-X",
      modelName: "Precision Commercial Bench Scale",
      category: "ELECTRONIC_COUNTER_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 30.0,
      minCapacity: 0.1,
      verificationInterval: 0.005,
      manufacturerName: "Apex Metrology Ltd",
      ownerId: merchantUser.id,
      ownerName: "Green Valley Groceries",
      ownerAddress: "Shop 14, APMC Market Yard",
      jurisdictionCircle: "Delhi North District Circle",
      status: "VERIFIED_ACTIVE",
      riskScore: 5,
      trustScore: 98,
      priorityFlag: "LOW",
      lastVerifiedAt: "2025-11-15",
      validUntil: "2026-11-14",
    },
  });

  const inst2 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-P4412" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-P4412",
      serialNumber: "SN-APX-4412",
      modelName: "Apex Platform Heavy Weighing Scale",
      category: "PLATFORM_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 150.0,
      minCapacity: 0.5,
      verificationInterval: 0.02,
      manufacturerName: "Apex Metrology Ltd",
      ownerId: merchantUser.id,
      ownerName: "Green Valley Groceries",
      ownerAddress: "Shop 14, APMC Market Yard",
      jurisdictionCircle: "Delhi North District Circle",
      status: "REGISTERED_PENDING_VERIFICATION",
      riskScore: 20,
      trustScore: 80,
      priorityFlag: "MEDIUM",
    },
  });

  const inst3 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-B1090" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-B1090",
      serialNumber: "SN-APX-1090",
      modelName: "Commercial Mandi Bulk Balance",
      category: "ELECTRONIC_COUNTER_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 50.0,
      minCapacity: 0.2,
      verificationInterval: 0.01,
      manufacturerName: "Apex Metrology Ltd",
      ownerId: merchantUser.id,
      ownerName: "Green Valley Groceries",
      ownerAddress: "Shop 14, APMC Market Yard",
      jurisdictionCircle: "Delhi North District Circle",
      status: "EXPIRING_SOON",
      riskScore: 65,
      trustScore: 60,
      priorityFlag: "HIGH",
      lastVerifiedAt: "2024-10-01",
      validUntil: "2025-10-01",
    },
  });

  console.log("Instruments seeded.");

  // 3. Seed Stamping Application (Assigned to LMO for today)
  await prisma.verificationApplication.upsert({
    where: { applicationNumber: "APP-2026-90412" },
    update: {},
    create: {
      applicationNumber: "APP-2026-90412",
      instrumentId: inst2.id,
      instrumentSerial: inst2.serialNumber,
      applicantName: "Green Valley Groceries (Ramesh Patel)",
      applicantPhone: "+91 98201 55667",
      type: "INITIAL_VERIFICATION",
      readinessScore: 85,
      feeAmount: 150.0,
      paymentRefNumber: "CHALLAN-BHARATKOSH-8821",
      paymentStatus: "PAID",
      assignedOfficerId: lmoUser.id,
      assignedOfficerName: "Rajesh Kumar (LMO Grade-I)",
      scheduledDate: new Date().toISOString().split("T")[0],
      scheduledSlot: "10:00 AM - 01:00 PM",
      status: "SCHEDULED",
    },
  });

  // 4. Seed Active Certificate for inst1
  await prisma.certificate.upsert({
    where: { certificateNumber: "CERT-DoCA-2025-8829" },
    update: {},
    create: {
      certificateNumber: "CERT-DoCA-2025-8829",
      instrumentId: inst1.id,
      digitalInstrumentId: inst1.digitalInstrumentId,
      issueDate: "2025-11-15",
      validUntil: "2026-11-14",
      status: "ACTIVE_VALID",
      physicalSealNumber: "HOL-DEL-8829",
      digitalSignatureHash: "HMAC-SHA256-B892F01A4E907C",
      signedByOfficerName: "Rajesh Kumar (LMO Grade-I)",
      qrPayloadUrl: `/qr/${inst1.digitalInstrumentId}`,
    },
  });

  // 5. Seed Audit Log
  await prisma.auditLog.create({
    data: {
      entityType: "System",
      entityId: "SYS-INIT",
      actorName: "System Initialization Engine",
      actorRole: "ADMIN",
      action: "INIT_DATABASE",
      details: "Database populated with initial Legal Metrology records and credentials.",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
