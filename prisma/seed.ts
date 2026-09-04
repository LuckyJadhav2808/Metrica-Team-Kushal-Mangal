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

  // 2. Seed Circle Officers
  const officer2 = await prisma.user.upsert({
    where: { email: "sunita.sharma.lmo@gov.in" },
    update: {},
    create: {
      email: "sunita.sharma.lmo@gov.in",
      passwordHash: defaultPasswordHash,
      role: "LMO",
      name: "Sunita Sharma",
      designation: "Legal Metrology Officer (Grade-I)",
      phone: "+91 98103 44556",
      organizationName: "Delhi Directorate of Legal Metrology",
      jurisdictionCircle: "Delhi Central District Circle",
      officerBadgeId: "LMO-DL-C-412",
      avatarLetter: "S",
    },
  });

  const officer3 = await prisma.user.upsert({
    where: { email: "amitabh.roy.lmo@gov.in" },
    update: {},
    create: {
      email: "amitabh.roy.lmo@gov.in",
      passwordHash: defaultPasswordHash,
      role: "LMO",
      name: "Amitabh Roy",
      designation: "Legal Metrology Officer (Grade-I)",
      phone: "+91 98104 55667",
      organizationName: "Delhi Directorate of Legal Metrology",
      jurisdictionCircle: "Delhi East District Circle",
      officerBadgeId: "LMO-DL-E-591",
      avatarLetter: "A",
    },
  });

  const officer4 = await prisma.user.upsert({
    where: { email: "vikram.rao.lmo@gov.in" },
    update: {},
    create: {
      email: "vikram.rao.lmo@gov.in",
      passwordHash: defaultPasswordHash,
      role: "LMO",
      name: "Vikramaditya Rao",
      designation: "Senior Metrology Enforcement Inspector",
      phone: "+91 98105 66778",
      organizationName: "Delhi Directorate of Legal Metrology",
      jurisdictionCircle: "Delhi South District Circle",
      officerBadgeId: "LMO-DL-S-903",
      avatarLetter: "V",
    },
  });

  // 3. Seed Instruments
  const inst1 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-AZ01" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-AZ01",
      serialNumber: "AZP-ELC-2024-881",
      modelName: "Apex Precision Counter Scale (Series 400)",
      category: "ELECTRONIC_COUNTER_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 30.0,
      minCapacity: 0.1,
      verificationInterval: 0.005,
      manufacturerName: "Apex Metrology Instruments India Ltd",
      ownerId: merchantUser.id,
      ownerName: "Ramesh Patel",
      ownerAddress: "Green Valley Groceries, Stall 14-B, Azadpur Mandi",
      pincode: "110033",
      jurisdictionCircle: "Delhi North District Circle",
      status: "VERIFIED_ACTIVE",
      riskScore: 12,
      trustScore: 94,
      priorityFlag: "LOW",
      lastVerifiedAt: "2026-01-10",
      validUntil: "2026-12-31",
    },
  });

  const inst2 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-GZ02" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-GZ02",
      serialNumber: "GZP-PLT-2023-412",
      modelName: "Bharat Heavy Platform Weighing System",
      category: "PLATFORM_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 150.0,
      minCapacity: 1.0,
      verificationInterval: 0.02,
      manufacturerName: "Bharat Scales Ltd",
      ownerName: "Baldev Wholesalers",
      ownerAddress: "Yard 9 Shed C, Ghazipur Mandi",
      pincode: "110096",
      jurisdictionCircle: "Delhi East District Circle",
      status: "SUSPENDED_TAMPERED",
      riskScore: 88,
      trustScore: 24,
      priorityFlag: "CRITICAL",
      lastVerifiedAt: "2025-02-14",
      validUntil: "2026-02-15",
    },
  });

  const inst3 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-OK03" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-OK03",
      serialNumber: "OKH-CNT-2024-109",
      modelName: "MetroDigital Counter Scale Pro",
      category: "ELECTRONIC_COUNTER_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 15.0,
      minCapacity: 0.05,
      verificationInterval: 0.002,
      manufacturerName: "Precision Meters India",
      ownerName: "Krishna Fruit Agency",
      ownerAddress: "Gate 2, Okhla Mandi",
      pincode: "110020",
      jurisdictionCircle: "Delhi South District Circle",
      status: "EXPIRED",
      riskScore: 58,
      trustScore: 52,
      priorityFlag: "HIGH",
      lastVerifiedAt: "2025-01-15",
      validUntil: "2026-01-15",
    },
  });

  const inst4 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-55201" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-55201",
      serialNumber: "SN-55201",
      modelName: "Commercial Bench Scale (Metrica Mark IV)",
      category: "ELECTRONIC_COUNTER_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 30.0,
      minCapacity: 0.1,
      verificationInterval: 0.005,
      manufacturerName: "Apex Metrology Instruments India Ltd",
      ownerName: "Sunshine Groceries",
      ownerAddress: "Unit 4, Subzi Mandi, Azadpur",
      pincode: "110033",
      jurisdictionCircle: "Delhi North District Circle",
      status: "VERIFIED_ACTIVE",
      riskScore: 14,
      trustScore: 92,
      priorityFlag: "LOW",
      lastVerifiedAt: "2025-11-01",
      validUntil: "2026-10-31",
    },
  });

  // 4. Seed Certificates
  await prisma.certificate.upsert({
    where: { certificateNumber: "CERT-DoCA-2026-9912" },
    update: {},
    create: {
      certificateNumber: "CERT-DoCA-2026-9912",
      instrumentId: inst1.id,
      digitalInstrumentId: inst1.digitalInstrumentId,
      issueDate: "2026-01-10",
      validUntil: "2026-12-31",
      status: "ACTIVE_VALID",
      physicalSealNumber: "DL-LM-884-2026-A",
      digitalSignatureHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      signedByOfficerName: "Rajesh Kumar (LMO-DL-N-884)",
      qrPayloadUrl: "/qr/IND-MET-2026-AZ01",
    },
  });

  await prisma.certificate.upsert({
    where: { certificateNumber: "CERT-DoCA-2026-55201" },
    update: {},
    create: {
      certificateNumber: "CERT-DoCA-2026-55201",
      instrumentId: inst4.id,
      digitalInstrumentId: inst4.digitalInstrumentId,
      issueDate: "2025-11-01",
      validUntil: "2026-10-31",
      status: "ACTIVE_VALID",
      physicalSealNumber: "IND-SEAL-55201-B",
      digitalSignatureHash: "7d793037a0760186574b0282f2f435e70ec0154cda3b0a24856f9e8a71fd73e8",
      signedByOfficerName: "Rajesh Kumar (LMO-DL-N-884)",
      qrPayloadUrl: "/qr/55201",
    },
  });

  // 5. Seed Citizen Complaints
  await prisma.complaint.upsert({
    where: { complaintNumber: "CMP-2026-1042" },
    update: {},
    create: {
      complaintNumber: "CMP-2026-1042",
      instrumentId: inst2.id,
      digitalInstrumentId: inst2.digitalInstrumentId,
      category: "SHORT_WEIGHT",
      description: "Scale in Shed C shows 50kg bag as 52.8kg during wholesale delivery. Discrepancy confirmed with test weight.",
      complainantPhone: "+91 98112 77889",
      severity: "HIGH",
      status: "LOGGED",
      impactOnRiskScore: 30,
    },
  });

  await prisma.complaint.upsert({
    where: { complaintNumber: "CMP-2026-1043" },
    update: {},
    create: {
      complaintNumber: "CMP-2026-1043",
      instrumentId: inst2.id,
      digitalInstrumentId: inst2.digitalInstrumentId,
      category: "BROKEN_SEAL",
      description: "Lead holographic seal on sensor terminal is torn and hanging loose. Seal number illegible.",
      complainantPhone: "+91 99554 22110",
      severity: "CRITICAL",
      status: "LOGGED",
      impactOnRiskScore: 35,
    },
  });

  await prisma.complaint.upsert({
    where: { complaintNumber: "CMP-2026-1044" },
    update: {},
    create: {
      complaintNumber: "CMP-2026-1044",
      instrumentId: inst3.id,
      digitalInstrumentId: inst3.digitalInstrumentId,
      category: "EXPIRED_STAMP",
      description: "Counter scale stamping sticker shows expiry of Jan 2026. Vendor continues retail sales.",
      complainantPhone: "+91 98770 33441",
      severity: "MEDIUM",
      status: "LOGGED",
      impactOnRiskScore: 20,
    },
  });

  // 6. Seed Verification Applications
  await prisma.verificationApplication.upsert({
    where: { applicationNumber: "APP-2026-9041" },
    update: {},
    create: {
      applicationNumber: "APP-2026-9041",
      instrumentId: inst3.id,
      instrumentSerial: inst3.serialNumber,
      applicantName: "Krishna Fruit Agency",
      applicantPhone: "+91 98200 44551",
      type: "RE_VERIFICATION",
      readinessScore: 82,
      feeAmount: 200.0,
      paymentRefNumber: "PAY-UPI-2026-99881",
      paymentStatus: "PAID",
      assignedOfficerId: officer4.id,
      assignedOfficerName: officer4.name,
      scheduledDate: "2026-09-08",
      scheduledSlot: "10:00 AM - 01:00 PM",
      status: "ASSIGNED",
    },
  });

  await prisma.verificationApplication.upsert({
    where: { applicationNumber: "APP-2026-9042" },
    update: {},
    create: {
      applicationNumber: "APP-2026-9042",
      instrumentId: inst1.id,
      instrumentSerial: inst1.serialNumber,
      applicantName: "Ramesh Patel",
      applicantPhone: "+91 98201 55667",
      type: "INITIAL_VERIFICATION",
      readinessScore: 95,
      feeAmount: 150.0,
      paymentRefNumber: "PAY-UPI-2026-11223",
      paymentStatus: "PAID",
      assignedOfficerId: lmoUser.id,
      assignedOfficerName: lmoUser.name,
      scheduledDate: "2026-09-06",
      scheduledSlot: "02:00 PM - 05:00 PM",
      status: "IN_PROGRESS",
    },
  });

  console.log("Database seeded successfully with Mandi scales, officers, certificates, and grievances.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
