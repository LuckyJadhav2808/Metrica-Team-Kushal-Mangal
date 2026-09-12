import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding comprehensive legal metrology database...");

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

  const officer1 = await prisma.user.upsert({
    where: { email: "rajesh.kumar.lmo@gov.in" },
    update: {},
    create: {
      email: "rajesh.kumar.lmo@gov.in",
      passwordHash: defaultPasswordHash,
      role: "LMO",
      name: "Rajesh Kumar",
      designation: "Legal Metrology Inspector (Grade-I)",
      phone: "+91 98102 33445",
      organizationName: "Azadpur Mandi & Jahangirpuri Hub",
      jurisdictionCircle: "Delhi North District Circle",
      officerBadgeId: "LMO-DL-N-884",
      avatarLetter: "R",
    },
  });

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
      organizationName: "Chandni Chowk & Daryaganj Hub",
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
      organizationName: "Ghazipur Mandi & Mayur Vihar Hub",
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
      organizationName: "Okhla Mandi & Nehru Place Hub",
      jurisdictionCircle: "Delhi South District Circle",
      officerBadgeId: "LMO-DL-S-903",
      avatarLetter: "V",
    },
  });

  const officerMumbai1 = await prisma.user.upsert({
    where: { email: "nitin.deshmukh.lmo@gov.in" },
    update: {},
    create: {
      email: "nitin.deshmukh.lmo@gov.in",
      passwordHash: defaultPasswordHash,
      role: "LMO",
      name: "Nitin Deshmukh",
      designation: "Legal Metrology Officer (Grade-I)",
      phone: "+91 98202 11223",
      organizationName: "Vashi APMC Mega Terminal Hub",
      jurisdictionCircle: "Navi Mumbai & Konkan Circle",
      officerBadgeId: "LMO-MH-MUM-712",
      avatarLetter: "N",
    },
  });

  const officerMumbai2 = await prisma.user.upsert({
    where: { email: "priya.kulkarni.lmo@gov.in" },
    update: {},
    create: {
      email: "priya.kulkarni.lmo@gov.in",
      passwordHash: defaultPasswordHash,
      role: "LMO",
      name: "Priya Kulkarni",
      designation: "Senior Metrology Enforcement Inspector",
      phone: "+91 98203 22334",
      organizationName: "Crawford Market & South Mumbai Hub",
      jurisdictionCircle: "South Mumbai District Circle",
      officerBadgeId: "LMO-MH-MUM-805",
      avatarLetter: "P",
    },
  });

  const officerPune1 = await prisma.user.upsert({
    where: { email: "sachin.patil.lmo@gov.in" },
    update: {},
    create: {
      email: "sachin.patil.lmo@gov.in",
      passwordHash: defaultPasswordHash,
      role: "LMO",
      name: "Sachin Patil",
      designation: "Legal Metrology Officer (Grade-I)",
      phone: "+91 98204 33445",
      organizationName: "Gultekdi Market Yard APMC Hub",
      jurisdictionCircle: "Pune Central Circle",
      officerBadgeId: "LMO-MH-PUN-331",
      avatarLetter: "S",
    },
  });

  const officerPune2 = await prisma.user.upsert({
    where: { email: "anita.more.lmo@gov.in" },
    update: {},
    create: {
      email: "anita.more.lmo@gov.in",
      passwordHash: defaultPasswordHash,
      role: "LMO",
      name: "Anita More",
      designation: "Enforcement Inspector (Grade-II)",
      phone: "+91 98205 44556",
      organizationName: "Pimpri-Chinchwad & Bhosari MIDC Hub",
      jurisdictionCircle: "Pimpri-Chinchwad Industrial Circle",
      officerBadgeId: "LMO-MH-PUN-449",
      avatarLetter: "A",
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

  const merchantVashi = await prisma.user.upsert({
    where: { email: "sanjay.shinde@vashitraders.in" },
    update: {},
    create: {
      email: "sanjay.shinde@vashitraders.in",
      passwordHash: defaultPasswordHash,
      role: "OWNER",
      name: "Sanjay Shinde",
      designation: "Wholesale Licensee",
      phone: "+91 98210 99887",
      organizationName: "Vashi Agro Commodities Pvt Ltd",
      jurisdictionCircle: "Navi Mumbai & Konkan Circle",
      avatarLetter: "S",
    },
  });

  const merchantPune = await prisma.user.upsert({
    where: { email: "dnyaneshwar.kadam@marketyardpune.in" },
    update: {},
    create: {
      email: "dnyaneshwar.kadam@marketyardpune.in",
      passwordHash: defaultPasswordHash,
      role: "OWNER",
      name: "Dnyaneshwar Kadam",
      designation: "Grain Commission Agent",
      phone: "+91 98220 11223",
      organizationName: "Shri Chhatrapati Grain Merchants",
      jurisdictionCircle: "Pune Central Circle",
      avatarLetter: "D",
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

  // 2. Seed 16 Realistic Commercial Instruments Across All 4 Circles
  console.log("Seeding 16 commercial instruments across Delhi Mandis...");

  // North District (Azadpur Mandi)
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
    where: { digitalInstrumentId: "IND-MET-2026-AZ02" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-AZ02",
      serialNumber: "AZP-YRD-2024-992",
      modelName: "Heavy Duty Yard Counter Scale (50kg)",
      category: "ELECTRONIC_COUNTER_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 50.0,
      minCapacity: 0.2,
      verificationInterval: 0.01,
      manufacturerName: "Apex Metrology Ltd",
      ownerName: "Kailash Mandi Traders",
      ownerAddress: "Shed 4, Azadpur Mandi, Delhi - 110033",
      pincode: "110033",
      jurisdictionCircle: "Delhi North District Circle",
      status: "SUSPENDED_TAMPERED",
      riskScore: 85,
      trustScore: 20,
      priorityFlag: "CRITICAL",
      lastVerifiedAt: "2025-06-10",
      validUntil: "2026-06-10",
    },
  });

  const inst3 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-AZ03" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-AZ03",
      serialNumber: "AZP-PLT-2025-019",
      modelName: "Titan Industrial Platform Scale 300kg",
      category: "PLATFORM_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 300.0,
      minCapacity: 1.0,
      verificationInterval: 0.05,
      manufacturerName: "Bharat Scales Ltd",
      ownerName: "Subhash Onion Wholesalers",
      ownerAddress: "Yard 2 Shed A, Azadpur Mandi, Delhi - 110033",
      pincode: "110033",
      jurisdictionCircle: "Delhi North District Circle",
      status: "REGISTERED_PENDING_VERIFICATION",
      riskScore: 25,
      trustScore: 78,
      priorityFlag: "LOW",
    },
  });

  const inst4 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-AZ04" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-AZ04",
      serialNumber: "AZP-WB-2024-50T",
      modelName: "Static Pitless Vehicle Weighbridge (50 Ton)",
      category: "WEIGHBRIDGE",
      accuracyClass: "CLASS_IV",
      nominalUnit: "KG",
      maxCapacity: 50000.0,
      minCapacity: 200.0,
      verificationInterval: 10.0,
      manufacturerName: "Essae-Teraoka Weighing Systems",
      ownerName: "Azadpur Cold Storage Logistics Ingate",
      ownerAddress: "Gate 1, Main Ingate, Azadpur Mandi, Delhi - 110033",
      pincode: "110033",
      jurisdictionCircle: "Delhi North District Circle",
      status: "REGISTERED_PENDING_VERIFICATION",
      riskScore: 18,
      trustScore: 88,
      priorityFlag: "LOW",
    },
  });

  const inst5 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-55201" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-55201",
      serialNumber: "SN-55201",
      modelName: "Commercial Retail Counter Scale 30kg",
      category: "ELECTRONIC_COUNTER_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 30.0,
      minCapacity: 0.1,
      verificationInterval: 0.005,
      manufacturerName: "Apex Metrology Instruments India Ltd",
      ownerName: "Sunshine Groceries",
      ownerAddress: "Stall 9, APMC Subzi Mandi, Azadpur, Delhi - 110033",
      pincode: "110033",
      jurisdictionCircle: "Delhi North District Circle",
      status: "VERIFIED_ACTIVE",
      riskScore: 8,
      trustScore: 96,
      priorityFlag: "LOW",
      lastVerifiedAt: "2025-11-01",
      validUntil: "2026-10-31",
    },
  });

  // Central District (Chandni Chowk Gold Souk & Daryaganj)
  const inst6 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-JW01" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-JW01",
      serialNumber: "SN-JW-2026-004",
      modelName: "Precision Gold & Diamond Balance (Class II)",
      category: "JEWELRY_PRECISION_BALANCE",
      accuracyClass: "CLASS_II",
      nominalUnit: "GRAM",
      maxCapacity: 220.0,
      minCapacity: 0.01,
      verificationInterval: 0.0001,
      manufacturerName: "Precision Meters India Ltd",
      ownerName: "Shree Jewellers & Bullion Merchants",
      ownerAddress: "Shop 12, Dariba Kalan, Chandni Chowk, Delhi - 110006",
      pincode: "110006",
      jurisdictionCircle: "Delhi Central District Circle",
      status: "VERIFIED_ACTIVE",
      riskScore: 6,
      trustScore: 98,
      priorityFlag: "LOW",
      lastVerifiedAt: "2026-02-01",
      validUntil: "2027-01-31",
    },
  });

  const inst7 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-JW02" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-JW02",
      serialNumber: "SN-MMTC-2025-88",
      modelName: "Class I Micro-Analytical Assay Balance",
      category: "JEWELRY_PRECISION_BALANCE",
      accuracyClass: "CLASS_I",
      nominalUnit: "GRAM",
      maxCapacity: 50.0,
      minCapacity: 0.001,
      verificationInterval: 0.00001,
      manufacturerName: "Precision Meters India Ltd",
      ownerName: "MMTC Hallmarking & Assay Refinement Center",
      ownerAddress: "Bullion Complex, Chandni Chowk, Delhi - 110006",
      pincode: "110006",
      jurisdictionCircle: "Delhi Central District Circle",
      status: "VERIFIED_ACTIVE",
      riskScore: 4,
      trustScore: 99,
      priorityFlag: "LOW",
      lastVerifiedAt: "2026-01-15",
      validUntil: "2027-01-14",
    },
  });

  const inst8 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-CH03" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-CH03",
      serialNumber: "SN-DRY-2023-118",
      modelName: "Spice & Condiment Bench Scale 20kg",
      category: "ELECTRONIC_COUNTER_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 20.0,
      minCapacity: 0.1,
      verificationInterval: 0.005,
      manufacturerName: "Apex Metrology Ltd",
      ownerName: "Daryaganj Wholesale Spice Mill",
      ownerAddress: "Ansari Road, Daryaganj, Delhi - 110002",
      pincode: "110002",
      jurisdictionCircle: "Delhi Central District Circle",
      status: "EXPIRED",
      riskScore: 62,
      trustScore: 45,
      priorityFlag: "HIGH",
      lastVerifiedAt: "2025-01-20",
      validUntil: "2026-01-19",
    },
  });

  const inst9 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-CH04" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-CH04",
      serialNumber: "KB-PLT-2025-091",
      modelName: "Khari Baoli Commercial Heavy Platform Balance",
      category: "PLATFORM_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 100.0,
      minCapacity: 0.5,
      verificationInterval: 0.02,
      manufacturerName: "Bharat Scales Ltd",
      ownerName: "Khari Baoli Dry Fruits Trading Co",
      ownerAddress: "Fatehpuri, Khari Baoli, Delhi - 110006",
      pincode: "110006",
      jurisdictionCircle: "Delhi Central District Circle",
      status: "REGISTERED_PENDING_VERIFICATION",
      riskScore: 15,
      trustScore: 82,
      priorityFlag: "LOW",
    },
  });

  // East District (Ghazipur Mandi & Anand Vihar)
  const inst10 = await prisma.instrument.upsert({
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

  const inst11 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-GZ03" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-GZ03",
      serialNumber: "GZP-CRN-2024-008",
      modelName: "Digital Crane Hanging Scale 200kg",
      category: "PLATFORM_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 200.0,
      minCapacity: 1.0,
      verificationInterval: 0.05,
      manufacturerName: "Apex Metrology Ltd",
      ownerName: "Ghazipur Livestock & Poultry Wholesale Depot",
      ownerAddress: "Shed 11, Ghazipur Wholesale Complex, Delhi - 110096",
      pincode: "110096",
      jurisdictionCircle: "Delhi East District Circle",
      status: "REGISTERED_PENDING_VERIFICATION",
      riskScore: 30,
      trustScore: 75,
      priorityFlag: "MEDIUM",
    },
  });

  const inst12 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-GZ04" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-GZ04",
      serialNumber: "GZP-HPR-2024-77",
      modelName: "Automated Grain Discontinuous Totalizer (Hopper)",
      category: "PLATFORM_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 1000.0,
      minCapacity: 10.0,
      verificationInterval: 0.2,
      manufacturerName: "Essae-Teraoka Ltd",
      ownerName: "East Delhi Grain Storage Depot",
      ownerAddress: "Plot 4, Ghazipur Food Complex, Delhi - 110096",
      pincode: "110096",
      jurisdictionCircle: "Delhi East District Circle",
      status: "VERIFIED_ACTIVE",
      riskScore: 10,
      trustScore: 92,
      priorityFlag: "LOW",
      lastVerifiedAt: "2026-01-25",
      validUntil: "2026-12-31",
    },
  });

  const inst13 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-GZ05" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-GZ05",
      serialNumber: "AV-WB-2024-40T",
      modelName: "Commercial Road Vehicle Weighbridge (40 Ton)",
      category: "WEIGHBRIDGE",
      accuracyClass: "CLASS_IV",
      nominalUnit: "KG",
      maxCapacity: 40000.0,
      minCapacity: 200.0,
      verificationInterval: 10.0,
      manufacturerName: "Essae Weighing Systems",
      ownerName: "Anand Vihar Freight Terminal Weighbridge",
      ownerAddress: "ISBT Freight Complex, Anand Vihar, Delhi - 110092",
      pincode: "110092",
      jurisdictionCircle: "Delhi East District Circle",
      status: "REGISTERED_PENDING_VERIFICATION",
      riskScore: 20,
      trustScore: 85,
      priorityFlag: "LOW",
    },
  });

  // South District (Okhla Mandi & Nehru Place)
  const inst14 = await prisma.instrument.upsert({
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

  const inst15 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-OK04" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-OK04",
      serialNumber: "BPCL-NOZ-2025-04",
      modelName: "Electronic Fuel Dispenser Multi-Product Nozzle",
      category: "FUEL_DISPENSER_NOZZLE",
      accuracyClass: "LIQUID_0_3",
      nominalUnit: "LITER",
      maxCapacity: 50.0,
      minCapacity: 2.0,
      verificationInterval: 0.01,
      manufacturerName: "Gilbarco Veeder-Root India",
      ownerName: "Bharat Petroleum Retail Outlet #4910",
      ownerAddress: "Okhla Industrial Area Phase-II, Delhi - 110020",
      pincode: "110020",
      jurisdictionCircle: "Delhi South District Circle",
      status: "VERIFIED_ACTIVE",
      riskScore: 5,
      trustScore: 97,
      priorityFlag: "LOW",
      lastVerifiedAt: "2026-02-10",
      validUntil: "2026-08-09",
    },
  });

  const inst16 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-OK05" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-OK05",
      serialNumber: "OKH-PLT-2025-500",
      modelName: "Industrial Heavy Platform Balance 500kg",
      category: "PLATFORM_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 500.0,
      minCapacity: 2.0,
      verificationInterval: 0.1,
      manufacturerName: "Bharat Scales Ltd",
      ownerName: "South Delhi Agri Logistics Cargo Depot",
      ownerAddress: "Shed 8, Okhla Freight Terminal, Delhi - 110020",
      pincode: "110020",
      jurisdictionCircle: "Delhi South District Circle",
      status: "REGISTERED_PENDING_VERIFICATION",
      riskScore: 22,
      trustScore: 80,
      priorityFlag: "LOW",
    },
  });

  // 3. Seed Form-A Gazette Certificates
  console.log("Seeding statutory Form-A certificates...");

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
    where: { certificateNumber: "CERT-DoCA-2026-JW01" },
    update: {},
    create: {
      certificateNumber: "CERT-DoCA-2026-JW01",
      instrumentId: inst6.id,
      digitalInstrumentId: inst6.digitalInstrumentId,
      issueDate: "2026-02-01",
      validUntil: "2027-01-31",
      status: "ACTIVE_VALID",
      physicalSealNumber: "DL-LM-902-2026-GOLD",
      digitalSignatureHash: "a1c8f498902be71f28b4c9e830f14d872b9a7812cd4e0f11928374a5b6c7d8e9",
      signedByOfficerName: "Sunita Sharma (LMO-DL-C-412)",
      qrPayloadUrl: "/qr/IND-MET-2026-JW01",
    },
  });

  await prisma.certificate.upsert({
    where: { certificateNumber: "CERT-DoCA-2026-JW02" },
    update: {},
    create: {
      certificateNumber: "CERT-DoCA-2026-JW02",
      instrumentId: inst7.id,
      digitalInstrumentId: inst7.digitalInstrumentId,
      issueDate: "2026-01-15",
      validUntil: "2027-01-14",
      status: "ACTIVE_VALID",
      physicalSealNumber: "DL-LM-C-ASSAY-99",
      digitalSignatureHash: "9f834abc8217def3410982345671bcda908124ef1234a56b89c7d8e901f23456",
      signedByOfficerName: "Sunita Sharma (LMO-DL-C-412)",
      qrPayloadUrl: "/qr/IND-MET-2026-JW02",
    },
  });

  await prisma.certificate.upsert({
    where: { certificateNumber: "CERT-DoCA-2026-GZ04" },
    update: {},
    create: {
      certificateNumber: "CERT-DoCA-2026-GZ04",
      instrumentId: inst12.id,
      digitalInstrumentId: inst12.digitalInstrumentId,
      issueDate: "2026-01-25",
      validUntil: "2026-12-31",
      status: "ACTIVE_VALID",
      physicalSealNumber: "DL-LM-E-GZ04-SEAL",
      digitalSignatureHash: "4b92c81902be71f28b4c9e830f14d872b9a7812cd4e0f11928374a5b6c7d8e90",
      signedByOfficerName: "Amitabh Roy (LMO-DL-E-591)",
      qrPayloadUrl: "/qr/IND-MET-2026-GZ04",
    },
  });

  await prisma.certificate.upsert({
    where: { certificateNumber: "CERT-DoCA-2026-OK04" },
    update: {},
    create: {
      certificateNumber: "CERT-DoCA-2026-OK04",
      instrumentId: inst15.id,
      digitalInstrumentId: inst15.digitalInstrumentId,
      issueDate: "2026-02-10",
      validUntil: "2026-08-09",
      status: "ACTIVE_VALID",
      physicalSealNumber: "DL-LM-S-BPCL-SEAL-04",
      digitalSignatureHash: "7b189c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85",
      signedByOfficerName: "Vikramaditya Rao (LMO-DL-S-903)",
      qrPayloadUrl: "/qr/IND-MET-2026-OK04",
    },
  });

  await prisma.certificate.upsert({
    where: { certificateNumber: "CERT-DoCA-2026-55201" },
    update: {},
    create: {
      certificateNumber: "CERT-DoCA-2026-55201",
      instrumentId: inst5.id,
      digitalInstrumentId: inst5.digitalInstrumentId,
      issueDate: "2025-11-01",
      validUntil: "2026-10-31",
      status: "ACTIVE_VALID",
      physicalSealNumber: "IND-SEAL-55201-B",
      digitalSignatureHash: "7d793037a0760186574b0282f2f435e70ec0154cda3b0a24856f9e8a71fd73e8",
      signedByOfficerName: "Rajesh Kumar (LMO-DL-N-884)",
      qrPayloadUrl: "/qr/55201",
    },
  });

  // 4. Seed Verification Applications Across Officers
  console.log("Seeding verification applications and officer dockets...");

  await prisma.verificationApplication.upsert({
    where: { applicationNumber: "APP-2026-9041" },
    update: {},
    create: {
      applicationNumber: "APP-2026-9041",
      instrumentId: inst14.id,
      instrumentSerial: inst14.serialNumber,
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
      assignedOfficerId: officer1.id,
      assignedOfficerName: officer1.name,
      scheduledDate: "2026-09-06",
      scheduledSlot: "02:00 PM - 05:00 PM",
      status: "IN_PROGRESS",
    },
  });

  await prisma.verificationApplication.upsert({
    where: { applicationNumber: "APP-2026-9043" },
    update: {},
    create: {
      applicationNumber: "APP-2026-9043",
      instrumentId: inst3.id,
      instrumentSerial: inst3.serialNumber,
      applicantName: "Subhash Onion Wholesalers",
      applicantPhone: "+91 98110 33441",
      type: "INITIAL_VERIFICATION",
      readinessScore: 88,
      feeAmount: 350.0,
      paymentRefNumber: "PAY-BHARAT-2026-0901",
      paymentStatus: "PAID",
      status: "PAYMENT_COMPLETED_PENDING_ASSIGNMENT",
    },
  });

  await prisma.verificationApplication.upsert({
    where: { applicationNumber: "APP-2026-9044" },
    update: {},
    create: {
      applicationNumber: "APP-2026-9044",
      instrumentId: inst4.id,
      instrumentSerial: inst4.serialNumber,
      applicantName: "Azadpur Cold Storage Logistics Ingate",
      applicantPhone: "+91 11 2769 0041",
      type: "INITIAL_VERIFICATION",
      readinessScore: 90,
      feeAmount: 2500.0,
      paymentRefNumber: "PAY-TR5-2026-4412",
      paymentStatus: "PAID",
      assignedOfficerId: officer1.id,
      assignedOfficerName: officer1.name,
      scheduledDate: "2026-09-09",
      scheduledSlot: "09:00 AM - 12:00 PM",
      status: "SCHEDULED",
    },
  });

  await prisma.verificationApplication.upsert({
    where: { applicationNumber: "APP-2026-9045" },
    update: {},
    create: {
      applicationNumber: "APP-2026-9045",
      instrumentId: inst9.id,
      instrumentSerial: inst9.serialNumber,
      applicantName: "Khari Baoli Dry Fruits Trading Co",
      applicantPhone: "+91 98711 00223",
      type: "RE_VERIFICATION",
      readinessScore: 78,
      feeAmount: 200.0,
      paymentRefNumber: "PAY-UPI-2026-88123",
      paymentStatus: "PAID",
      status: "PAYMENT_COMPLETED_PENDING_ASSIGNMENT",
    },
  });

  await prisma.verificationApplication.upsert({
    where: { applicationNumber: "APP-2026-9046" },
    update: {},
    create: {
      applicationNumber: "APP-2026-9046",
      instrumentId: inst11.id,
      instrumentSerial: inst11.serialNumber,
      applicantName: "Ghazipur Livestock & Poultry Wholesale Depot",
      applicantPhone: "+91 98991 44552",
      type: "INITIAL_VERIFICATION",
      readinessScore: 85,
      feeAmount: 300.0,
      paymentRefNumber: "PAY-UPI-2026-77112",
      paymentStatus: "PAID",
      assignedOfficerId: officer3.id,
      assignedOfficerName: officer3.name,
      scheduledDate: "2026-09-07",
      scheduledSlot: "01:00 PM - 04:00 PM",
      status: "SCHEDULED",
    },
  });

  await prisma.verificationApplication.upsert({
    where: { applicationNumber: "APP-2026-9047" },
    update: {},
    create: {
      applicationNumber: "APP-2026-9047",
      instrumentId: inst13.id,
      instrumentSerial: inst13.serialNumber,
      applicantName: "Anand Vihar Freight Terminal Weighbridge",
      applicantPhone: "+91 11 2215 9901",
      type: "INITIAL_VERIFICATION",
      readinessScore: 92,
      feeAmount: 2500.0,
      paymentRefNumber: "PAY-TR5-2026-9901",
      paymentStatus: "PAID",
      status: "PAYMENT_COMPLETED_PENDING_ASSIGNMENT",
    },
  });

  await prisma.verificationApplication.upsert({
    where: { applicationNumber: "APP-2026-9048" },
    update: {},
    create: {
      applicationNumber: "APP-2026-9048",
      instrumentId: inst16.id,
      instrumentSerial: inst16.serialNumber,
      applicantName: "South Delhi Agri Logistics Cargo Depot",
      applicantPhone: "+91 98101 22334",
      type: "RE_VERIFICATION",
      readinessScore: 84,
      feeAmount: 400.0,
      paymentRefNumber: "PAY-UPI-2026-44991",
      paymentStatus: "PAID",
      assignedOfficerId: officer4.id,
      assignedOfficerName: officer4.name,
      scheduledDate: "2026-09-07",
      scheduledSlot: "10:00 AM - 01:00 PM",
      status: "IN_PROGRESS",
    },
  });

  // 5. Seed Citizen Complaints
  console.log("Seeding citizen grievances...");

  await prisma.complaint.upsert({
    where: { complaintNumber: "CMP-2026-1042" },
    update: {},
    create: {
      complaintNumber: "CMP-2026-1042",
      instrumentId: inst10.id,
      digitalInstrumentId: inst10.digitalInstrumentId,
      category: "SHORT_WEIGHT",
      description: "Scale in Shed C shows 50kg wholesale grain bag as 52.8kg during receipt. Verified with independent test weights.",
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
      instrumentId: inst10.id,
      digitalInstrumentId: inst10.digitalInstrumentId,
      category: "BROKEN_SEAL",
      description: "Lead holographic wire seal on load cell junction box is snapped and missing. Display calibration jumper exposed.",
      complainantPhone: "+91 99554 22110",
      severity: "CRITICAL",
      status: "LOGGED",
      impactOnRiskScore: 35,
    },
  });

  await prisma.complaint.upsert({
    where: { complaintNumber: "CMP-2026-2001" },
    update: {},
    create: {
      complaintNumber: "CMP-2026-2001",
      instrumentId: inst2.id,
      digitalInstrumentId: inst2.digitalInstrumentId,
      category: "BROKEN_SEAL",
      description: "Holographic wire seal was found severed and re-tied with plastic wire. Vendor refused weight verification on yard scale.",
      complainantPhone: "+91 98765 43210",
      severity: "CRITICAL",
      status: "LOGGED",
      impactOnRiskScore: 35,
    },
  });

  await prisma.complaint.upsert({
    where: { complaintNumber: "CMP-2026-3012" },
    update: {},
    create: {
      complaintNumber: "CMP-2026-3012",
      instrumentId: inst14.id,
      digitalInstrumentId: inst14.digitalInstrumentId,
      category: "EXPIRED_CERTIFICATE",
      description: "Display card at fruit counter shows stamping date from 2025. Certificate validity has lapsed over 8 months.",
      complainantPhone: "+91 98109 88776",
      severity: "MEDIUM",
      status: "LOGGED",
      impactOnRiskScore: 20,
    },
  });

  // 6. Seed Mumbai MMR Commercial Instruments
  console.log("Seeding Mumbai MMR commercial instruments...");

  const instMum1 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-MUM01" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-MUM01",
      serialNumber: "VSH-PLT-2025-410",
      modelName: "Apex Heavy Duty Platform Scale (300kg)",
      category: "PLATFORM_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 300.0,
      minCapacity: 1.0,
      verificationInterval: 0.05,
      manufacturerName: "Apex Metrology Instruments India Ltd",
      ownerName: "Sanjay Shinde",
      ownerAddress: "Vashi Agro Commodities Pvt Ltd, Sector 19, Turbhe APMC, Navi Mumbai",
      pincode: "400703",
      jurisdictionCircle: "Navi Mumbai & Konkan Circle",
      status: "VERIFIED_ACTIVE",
      riskScore: 12,
      trustScore: 92,
      priorityFlag: "LOW",
      lastVerifiedAt: "2026-02-15",
      validUntil: "2026-12-31",
      ownerId: merchantVashi.id,
    },
  });

  const instMum2 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-MUM02" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-MUM02",
      serialNumber: "VSH-GRN-2024-912",
      modelName: "Apex Bulk Produce Platform Weigher (500kg)",
      category: "PLATFORM_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 500.0,
      minCapacity: 2.0,
      verificationInterval: 0.1,
      manufacturerName: "Apex Metrology Instruments India Ltd",
      ownerName: "Navi Mumbai Grain Wholesalers Association",
      ownerAddress: "Grain Terminal Bay 4, APMC Market 2, Vashi, Navi Mumbai",
      pincode: "400703",
      jurisdictionCircle: "Navi Mumbai & Konkan Circle",
      status: "EXPIRED",
      riskScore: 68,
      trustScore: 42,
      priorityFlag: "HIGH",
      lastVerifiedAt: "2025-01-20",
      validUntil: "2025-12-31",
    },
  });

  const instMum3 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-MUM03" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-MUM03",
      serialNumber: "CRW-ELC-2025-104",
      modelName: "Apex Digital Retail Scale (Series 200)",
      category: "ELECTRONIC_COUNTER_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 15.0,
      minCapacity: 0.05,
      verificationInterval: 0.002,
      manufacturerName: "Apex Metrology Instruments India Ltd",
      ownerName: "Farooq Merchant Provisions",
      ownerAddress: "Stall 48-C, Central Hall, Crawford Market, South Mumbai",
      pincode: "400001",
      jurisdictionCircle: "South Mumbai District Circle",
      status: "VERIFIED_ACTIVE",
      riskScore: 8,
      trustScore: 98,
      priorityFlag: "LOW",
      lastVerifiedAt: "2026-03-01",
      validUntil: "2027-02-28",
    },
  });

  const instMum4 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-MUM04" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-MUM04",
      serialNumber: "KLB-BLN-2026-003",
      modelName: "Precision Micro-Balance Hallmarking Scale",
      category: "ELECTRONIC_COUNTER_SCALE",
      accuracyClass: "CLASS_II",
      nominalUnit: "G",
      maxCapacity: 3000.0,
      minCapacity: 0.1,
      verificationInterval: 0.01,
      manufacturerName: "Apex Metrology Instruments India Ltd",
      ownerName: "Kalbadevi Bullion & Jewelry Refiners",
      ownerAddress: "Shop 12, Zaveri Bazaar Lane, Kalbadevi, Mumbai",
      pincode: "400001",
      jurisdictionCircle: "South Mumbai District Circle",
      status: "VERIFIED_ACTIVE",
      riskScore: 5,
      trustScore: 99,
      priorityFlag: "LOW",
      lastVerifiedAt: "2026-01-05",
      validUntil: "2027-01-04",
    },
  });

  const instMum5 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-MUM05" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-MUM05",
      serialNumber: "DDR-FLW-2024-332",
      modelName: "Apex Commercial Rapid Scale (Series 300)",
      category: "ELECTRONIC_COUNTER_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 30.0,
      minCapacity: 0.1,
      verificationInterval: 0.005,
      manufacturerName: "Apex Metrology Instruments India Ltd",
      ownerName: "Dadar Wholesale Flower Traders",
      ownerAddress: "Platform 2, Meenatai Thackeray Flower Mandi, Dadar West, Mumbai",
      pincode: "400028",
      jurisdictionCircle: "Central Mumbai District Circle",
      status: "SUSPENDED_TAMPERED",
      riskScore: 84,
      trustScore: 21,
      priorityFlag: "CRITICAL",
      lastVerifiedAt: "2025-06-10",
      validUntil: "2026-06-09",
    },
  });

  const instMum6 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-MUM06" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-MUM06",
      serialNumber: "ADH-LOG-2025-780",
      modelName: "Apex Heavy Freight Industrial Weigher (2000kg)",
      category: "PLATFORM_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 2000.0,
      minCapacity: 5.0,
      verificationInterval: 0.5,
      manufacturerName: "Apex Metrology Instruments India Ltd",
      ownerName: "Andheri Cargo Logistics & Parcel Depot",
      ownerAddress: "Plot 88, Marol Industrial MIDC, Andheri East, Mumbai",
      pincode: "400069",
      jurisdictionCircle: "Mumbai Suburban Western Circle",
      status: "EXPIRING_SOON",
      riskScore: 52,
      trustScore: 65,
      priorityFlag: "HIGH",
      lastVerifiedAt: "2025-09-18",
      validUntil: "2026-09-17",
    },
  });

  // 7. Seed Pune District Commercial Instruments
  console.log("Seeding Pune District commercial instruments...");

  const instPun1 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-PUN01" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-PUN01",
      serialNumber: "GLT-VEG-2024-044",
      modelName: "Apex High-Throughput Produce Scale (60kg)",
      category: "ELECTRONIC_COUNTER_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 60.0,
      minCapacity: 0.2,
      verificationInterval: 0.01,
      manufacturerName: "Apex Metrology Instruments India Ltd",
      ownerName: "Pune Agro Trading Syndicate",
      ownerAddress: "Shed 4, Gate 1, Shri Chhatrapati Shivaji Market Yard, Gultekdi, Pune",
      pincode: "411037",
      jurisdictionCircle: "Pune Central Circle",
      status: "SUSPENDED_TAMPERED",
      riskScore: 88,
      trustScore: 19,
      priorityFlag: "CRITICAL",
      lastVerifiedAt: "2025-05-12",
      validUntil: "2026-05-11",
    },
  });

  const instPun2 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-PUN02" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-PUN02",
      serialNumber: "GLT-GRN-2025-212",
      modelName: "Apex Heavy Bag Platform Scale (150kg)",
      category: "PLATFORM_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 150.0,
      minCapacity: 0.5,
      verificationInterval: 0.02,
      manufacturerName: "Apex Metrology Instruments India Ltd",
      ownerName: "Dnyaneshwar Kadam",
      ownerAddress: "Shri Chhatrapati Grain Merchants, Gala 89, Market Yard, Gultekdi, Pune",
      pincode: "411037",
      jurisdictionCircle: "Pune Central Circle",
      status: "VERIFIED_ACTIVE",
      riskScore: 14,
      trustScore: 91,
      priorityFlag: "LOW",
      lastVerifiedAt: "2026-02-10",
      validUntil: "2027-02-09",
      ownerId: merchantPune.id,
    },
  });

  const instPun3 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-PUN03" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-PUN03",
      serialNumber: "HDP-AGR-2024-601",
      modelName: "Apex Bulk Agri Produce Weigher (500kg)",
      category: "PLATFORM_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 500.0,
      minCapacity: 2.0,
      verificationInterval: 0.1,
      manufacturerName: "Apex Metrology Instruments India Ltd",
      ownerName: "Hadapsar Grain Commission Agency",
      ownerAddress: "Shed B, Hadapsar Agro Produce Sub-Market, Pune-Solapur Road, Pune",
      pincode: "411028",
      jurisdictionCircle: "Pune East Circle",
      status: "EXPIRED",
      riskScore: 65,
      trustScore: 48,
      priorityFlag: "HIGH",
      lastVerifiedAt: "2025-01-14",
      validUntil: "2026-01-13",
    },
  });

  const instPun4 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-PUN04" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-PUN04",
      serialNumber: "BHS-WBR-2025-001",
      modelName: "Apex Industrial Vehicle Weighbridge (50 Tonnes)",
      category: "WEIGHBRIDGE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 50000.0,
      minCapacity: 200.0,
      verificationInterval: 10.0,
      manufacturerName: "Apex Metrology Instruments India Ltd",
      ownerName: "Bhosari MIDC Logistics Weighbridge Station",
      ownerAddress: "Plot W-42, Telco Road, Bhosari Industrial Area, Pimpri-Chinchwad, Pune",
      pincode: "411018",
      jurisdictionCircle: "Pimpri-Chinchwad Industrial Circle",
      status: "VERIFIED_ACTIVE",
      riskScore: 16,
      trustScore: 94,
      priorityFlag: "LOW",
      lastVerifiedAt: "2026-01-28",
      validUntil: "2027-01-27",
    },
  });

  const instPun5 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-PUN05" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-PUN05",
      serialNumber: "PMP-ENG-2025-884",
      modelName: "Apex Precision Assembly Scale (30kg)",
      category: "ELECTRONIC_COUNTER_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 30.0,
      minCapacity: 0.1,
      verificationInterval: 0.005,
      manufacturerName: "Apex Metrology Instruments India Ltd",
      ownerName: "Pimpri Auto Precision Tooling Works",
      ownerAddress: "Gate 3, PCMC Industrial Complex, Pimpri, Pune",
      pincode: "411018",
      jurisdictionCircle: "Pimpri-Chinchwad Industrial Circle",
      status: "VERIFIED_ACTIVE",
      riskScore: 22,
      trustScore: 88,
      priorityFlag: "LOW",
      lastVerifiedAt: "2025-11-20",
      validUntil: "2026-11-19",
    },
  });

  const instPun6 = await prisma.instrument.upsert({
    where: { digitalInstrumentId: "IND-MET-2026-PUN06" },
    update: {},
    create: {
      digitalInstrumentId: "IND-MET-2026-PUN06",
      serialNumber: "SWR-DRY-2025-331",
      modelName: "Apex Sanitary Bulk Milk Platform (1000kg)",
      category: "PLATFORM_SCALE",
      accuracyClass: "CLASS_III",
      nominalUnit: "KG",
      maxCapacity: 1000.0,
      minCapacity: 5.0,
      verificationInterval: 0.2,
      manufacturerName: "Apex Metrology Instruments India Ltd",
      ownerName: "Katraj Dairy Farmers Cooperative Receiving Depot",
      ownerAddress: "Pune-Satara Road, Swargate-Katraj Hub, Pune",
      pincode: "411009",
      jurisdictionCircle: "Pune South Circle",
      status: "VERIFIED_ACTIVE",
      riskScore: 11,
      trustScore: 96,
      priorityFlag: "LOW",
      lastVerifiedAt: "2026-02-18",
      validUntil: "2027-02-17",
    },
  });

  // 8. Seed Applications & Complaints for Mumbai and Pune
  console.log("Seeding Maharashtra verification applications and complaints...");

  await prisma.verificationApplication.upsert({
    where: { applicationNumber: "APP-2026-MUM101" },
    update: {},
    create: {
      applicationNumber: "APP-2026-MUM101",
      instrumentId: instMum2.id,
      instrumentSerial: instMum2.serialNumber,
      applicantName: "Navi Mumbai Grain Wholesalers Association",
      applicantPhone: "+91 98200 44556",
      type: "RE_VERIFICATION",
      readinessScore: 89,
      feeAmount: 750.0,
      paymentRefNumber: "PAY-MH-2026-8801",
      paymentStatus: "PAID",
      assignedOfficerId: officerMumbai1.id,
      assignedOfficerName: officerMumbai1.name,
      scheduledDate: "2026-09-18",
      scheduledSlot: "10:00 AM - 01:00 PM",
      status: "IN_PROGRESS",
    },
  });

  await prisma.verificationApplication.upsert({
    where: { applicationNumber: "APP-2026-PUN101" },
    update: {},
    create: {
      applicationNumber: "APP-2026-PUN101",
      instrumentId: instPun3.id,
      instrumentSerial: instPun3.serialNumber,
      applicantName: "Hadapsar Grain Commission Agency",
      applicantPhone: "+91 98221 88990",
      type: "RE_VERIFICATION",
      readinessScore: 78,
      feeAmount: 600.0,
      paymentRefNumber: "PAY-MH-2026-9912",
      paymentStatus: "PAID",
      assignedOfficerId: officerPune1.id,
      assignedOfficerName: officerPune1.name,
      scheduledDate: "2026-09-20",
      scheduledSlot: "02:00 PM - 05:00 PM",
      status: "IN_PROGRESS",
    },
  });

  await prisma.complaint.upsert({
    where: { complaintNumber: "CMP-2026-MUM01" },
    update: {},
    create: {
      complaintNumber: "CMP-2026-MUM01",
      instrumentId: instMum5.id,
      digitalInstrumentId: instMum5.digitalInstrumentId,
      category: "SHORT_WEIGHT",
      description: "Counter scale at Dadar Flower Mandi Platform 2 shows 1kg rose bundle as 1.18kg during morning wholesale auction rush. Display unit flickers intermittently.",
      complainantPhone: "+91 98205 77112",
      severity: "CRITICAL",
      status: "LOGGED",
      impactOnRiskScore: 35,
    },
  });

  await prisma.complaint.upsert({
    where: { complaintNumber: "CMP-2026-PUN01" },
    update: {},
    create: {
      complaintNumber: "CMP-2026-PUN01",
      instrumentId: instPun1.id,
      digitalInstrumentId: instPun1.digitalInstrumentId,
      category: "SHORT_WEIGHT",
      description: "Scale in Shed 4 Gultekdi Market Yard had a 300g calibration bias. Inspection revealed a magnet taped under the pan assembly.",
      complainantPhone: "+91 98223 66554",
      severity: "CRITICAL",
      status: "LOGGED",
      impactOnRiskScore: 40,
    },
  });

  await prisma.complaint.upsert({
    where: { complaintNumber: "CMP-2026-PUN02" },
    update: {},
    create: {
      complaintNumber: "CMP-2026-PUN02",
      instrumentId: instPun3.id,
      digitalInstrumentId: instPun3.digitalInstrumentId,
      category: "EXPIRED_CERTIFICATE",
      description: "Platform weigher stamping expired over 8 months ago. Commercial trading continues without quarterly statutory re-verification.",
      complainantPhone: "+91 98224 55443",
      severity: "HIGH",
      status: "LOGGED",
      impactOnRiskScore: 20,
    },
  });

  console.log("Database seeded successfully with 28 multi-city Mandi scales (Delhi, Mumbai, Pune), officers, applications, and complaints.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
