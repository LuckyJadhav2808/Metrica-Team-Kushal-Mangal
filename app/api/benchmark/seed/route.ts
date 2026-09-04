import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 1. Ensure the 4 primary institutional users exist
    const defaultPasswordHash = await hashPassword("password123");

    const adminUser = await prisma.user.upsert({
      where: { email: "controller.lm@nic.in" },
      update: {},
      create: {
        email: "controller.lm@nic.in",
        passwordHash: defaultPasswordHash,
        role: "ADMIN",
        name: "Dr. S. K. Verma",
        designation: "Controller of Legal Metrology",
        phone: "+91 11 2338 1234",
        jurisdictionCircle: "Central Directorate, Krishi Bhawan, New Delhi",
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
        phone: "+91 98100 45678",
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
        phone: "+91 98234 11223",
        organizationName: "Green Valley Groceries Pvt Ltd",
        jurisdictionCircle: "Delhi North District Circle",
        avatarLetter: "P",
      },
    });

    const mfgUser = await prisma.user.upsert({
      where: { email: "regulatory@apexmetrology.com" },
      update: {},
      create: {
        email: "regulatory@apexmetrology.com",
        passwordHash: defaultPasswordHash,
        role: "MANUFACTURER",
        name: "Anand Swaminathan",
        designation: "Chief Regulatory Officer",
        phone: "+91 80 4455 6677",
        organizationName: "Apex Metrology Instruments Ltd",
        jurisdictionCircle: "National Manufacturing Division",
        officerBadgeId: "IND-MFG-LIC-2024",
        avatarLetter: "A",
      },
    });

    // 2. Clean previous transactional tables to avoid foreign-key conflicts
    await prisma.certificate.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.verificationApplication.deleteMany();
    await prisma.instrument.deleteMany();
    await prisma.auditLog.deleteMany();

    // 3. Realistic 12 Indian Legal Metrology Benchmark Instruments
    const benchmarkInstruments = [
      {
        digitalInstrumentId: "IND-MET-2026-AZP01",
        serialNumber: "ESSAE-DS215-99412",
        modelName: "Essae-Teraoka DS-215 Electronic Counter Scale",
        category: "ELECTRONIC_COUNTER_SCALE",
        accuracyClass: "CLASS_III",
        nominalUnit: "KG",
        maxCapacity: 30.0,
        minCapacity: 0.1,
        verificationInterval: 0.005,
        manufacturerName: "Essae-Teraoka Ltd",
        ownerId: merchantUser.id,
        ownerName: "Green Valley Groceries Pvt Ltd (Ramesh Patel)",
        ownerAddress: "Shop 14, APMC Fruit & Vegetable Yard, Azadpur Mandi, Delhi",
        pincode: "110033",
        jurisdictionCircle: "Delhi North District Circle",
        status: "VERIFIED",
        riskScore: 8,
        trustScore: 98,
        priorityFlag: "LOW",
        lastVerifiedAt: "2026-01-15T10:30:00.000Z",
        validUntil: "2027-01-14T23:59:59.000Z",
      },
      {
        digitalInstrumentId: "IND-MET-2026-AZP02",
        serialNumber: "ESSAE-DS215-99488",
        modelName: "Essae-Teraoka DS-215 Counter Scale",
        category: "ELECTRONIC_COUNTER_SCALE",
        accuracyClass: "CLASS_III",
        nominalUnit: "KG",
        maxCapacity: 30.0,
        minCapacity: 0.1,
        verificationInterval: 0.005,
        manufacturerName: "Essae-Teraoka Ltd",
        ownerId: merchantUser.id,
        ownerName: "Golden Harvest Grain Traders",
        ownerAddress: "Shed 12, APMC Market Yard, Azadpur, Delhi",
        pincode: "110033",
        jurisdictionCircle: "Delhi North District Circle",
        status: "RE_VERIFICATION_DUE",
        riskScore: 52,
        trustScore: 74,
        priorityFlag: "MEDIUM",
        lastVerifiedAt: "2025-02-10T11:00:00.000Z",
        validUntil: "2026-02-09T23:59:59.000Z",
      },
      {
        digitalInstrumentId: "IND-MET-2026-AZP03",
        serialNumber: "ESSAE-DS852-11029",
        modelName: "Essae-Teraoka DS-852 Heavy Platform Scale",
        category: "PLATFORM_SCALE",
        accuracyClass: "CLASS_III",
        nominalUnit: "KG",
        maxCapacity: 300.0,
        minCapacity: 1.0,
        verificationInterval: 0.05,
        manufacturerName: "Essae-Teraoka Ltd",
        ownerName: "National Agro Commodity Wholesale Logistics",
        ownerAddress: "Platform Bay 4, Wholesale Potato Yard, Azadpur Mandi",
        pincode: "110033",
        jurisdictionCircle: "Delhi North District Circle",
        status: "VERIFIED",
        riskScore: 12,
        trustScore: 94,
        priorityFlag: "LOW",
        lastVerifiedAt: "2026-02-01T09:15:00.000Z",
        validUntil: "2027-01-31T23:59:59.000Z",
      },
      {
        digitalInstrumentId: "IND-MET-2026-GZP04",
        serialNumber: "EAGLE-PHX-44910",
        modelName: "Eagle Scales Phoenix Series Heavy Bench Scale",
        category: "PLATFORM_SCALE",
        accuracyClass: "CLASS_III",
        nominalUnit: "KG",
        maxCapacity: 150.0,
        minCapacity: 0.5,
        verificationInterval: 0.02,
        manufacturerName: "Eagle Digital Systems Pvt Ltd",
        ownerName: "Ghazipur Wholesale Vegetable Commission Agents",
        ownerAddress: "Stall 48, Mandi Gate 2, Ghazipur Wholesale Market, Delhi",
        pincode: "110096",
        jurisdictionCircle: "Delhi North District Circle",
        status: "FLAGGED_INSPECTION_REQUIRED",
        riskScore: 88,
        trustScore: 35,
        priorityFlag: "CRITICAL",
        lastVerifiedAt: "2025-05-18T14:20:00.000Z",
        validUntil: "2026-05-17T23:59:59.000Z",
      },
      {
        digitalInstrumentId: "IND-MET-2026-OKH05",
        serialNumber: "AVERY-E1205-88301",
        modelName: "Avery Weigh-Tronix E1205 Electronic Weighbridge",
        category: "WEIGHBRIDGE",
        accuracyClass: "CLASS_III",
        nominalUnit: "KG",
        maxCapacity: 50000.0,
        minCapacity: 100.0,
        verificationInterval: 10.0,
        manufacturerName: "Avery India Ltd",
        ownerName: "Okhla Multi-Modal Logistics & Freight Terminal",
        ownerAddress: "Inland Container Depot Road, Okhla Phase-II, New Delhi",
        pincode: "110020",
        jurisdictionCircle: "Delhi Central Circle",
        status: "VERIFIED",
        riskScore: 14,
        trustScore: 92,
        priorityFlag: "LOW",
        lastVerifiedAt: "2026-01-08T16:45:00.000Z",
        validUntil: "2027-01-07T23:59:59.000Z",
      },
      {
        digitalInstrumentId: "IND-MET-2026-OKH06",
        serialNumber: "AVERY-ZM510-44918",
        modelName: "Avery Weigh-Tronix ZM510 Pitless Weighbridge",
        category: "WEIGHBRIDGE",
        accuracyClass: "CLASS_III",
        nominalUnit: "KG",
        maxCapacity: 60000.0,
        minCapacity: 200.0,
        verificationInterval: 10.0,
        manufacturerName: "Avery India Ltd",
        ownerName: "Tughlakabad Freight Corridors Ltd",
        ownerAddress: "Gate 3, CONCOR ICD Terminal, Tughlakabad, New Delhi",
        pincode: "110044",
        jurisdictionCircle: "Delhi Central Circle",
        status: "RE_VERIFICATION_DUE",
        riskScore: 68,
        trustScore: 62,
        priorityFlag: "HIGH",
        lastVerifiedAt: "2025-03-01T10:00:00.000Z",
        validUntil: "2026-02-28T23:59:59.000Z",
      },
      {
        digitalInstrumentId: "IND-MET-2026-CHK07",
        serialNumber: "CITIZEN-CT600-00412",
        modelName: "Citizen CT-600 High Precision Gold & Diamond Scale",
        category: "PRECISION_BALANCE",
        accuracyClass: "CLASS_II",
        nominalUnit: "G",
        maxCapacity: 600.0,
        minCapacity: 0.05,
        verificationInterval: 0.01,
        manufacturerName: "Citizen Scale India Pvt Ltd",
        ownerName: "Tanishq Jewellers Flagship Showroom",
        ownerAddress: "1284, Dariba Kalan, Chandni Chowk, Old Delhi",
        pincode: "110006",
        jurisdictionCircle: "Delhi Central Circle",
        status: "VERIFIED",
        riskScore: 4,
        trustScore: 99,
        priorityFlag: "LOW",
        lastVerifiedAt: "2026-02-14T11:30:00.000Z",
        validUntil: "2027-02-13T23:59:59.000Z",
      },
      {
        digitalInstrumentId: "IND-MET-2026-CP008",
        serialNumber: "CAS-SW2-88192",
        modelName: "CAS SW-II Electronic Retail Counter Scale",
        category: "ELECTRONIC_COUNTER_SCALE",
        accuracyClass: "CLASS_III",
        nominalUnit: "KG",
        maxCapacity: 15.0,
        minCapacity: 0.05,
        verificationInterval: 0.002,
        manufacturerName: "CAS India Metrology Pvt Ltd",
        ownerName: "Organic India Retail Flagship Store",
        ownerAddress: "Shop 18, Block B, Connaught Place Inner Circle, New Delhi",
        pincode: "110001",
        jurisdictionCircle: "Delhi Central Circle",
        status: "VERIFIED",
        riskScore: 10,
        trustScore: 95,
        priorityFlag: "LOW",
        lastVerifiedAt: "2026-01-20T14:10:00.000Z",
        validUntil: "2027-01-19T23:59:59.000Z",
      },
      {
        digitalInstrumentId: "IND-MET-2026-NEH09",
        serialNumber: "METTLER-BBA231-1029",
        modelName: "Mettler Toledo BBA231 Industrial Bench Scale",
        category: "PLATFORM_SCALE",
        accuracyClass: "CLASS_III",
        nominalUnit: "KG",
        maxCapacity: 60.0,
        minCapacity: 0.2,
        verificationInterval: 0.01,
        manufacturerName: "Mettler Toledo India",
        ownerName: "Silicon Logistics & Electronics Hub",
        ownerAddress: "Basement 2, Eros Corporate Tower, Nehru Place, New Delhi",
        pincode: "110019",
        jurisdictionCircle: "Delhi Central Circle",
        status: "REGISTERED_PENDING_VERIFICATION",
        riskScore: 20,
        trustScore: 85,
        priorityFlag: "LOW",
      },
      {
        digitalInstrumentId: "IND-MET-2026-NAR10",
        serialNumber: "EAGLE-HD500-77182",
        modelName: "Eagle Scales Heavy Duty Platform Scale",
        category: "PLATFORM_SCALE",
        accuracyClass: "CLASS_III",
        nominalUnit: "KG",
        maxCapacity: 500.0,
        minCapacity: 1.0,
        verificationInterval: 0.1,
        manufacturerName: "Eagle Digital Systems Pvt Ltd",
        ownerName: "Kisan Grain Storage & Processing Hub",
        ownerAddress: "Warehouse 7, Narela Food Grain APMC Mandi, Delhi",
        pincode: "110040",
        jurisdictionCircle: "Delhi North District Circle",
        status: "INSPECTION_SCHEDULED",
        riskScore: 35,
        trustScore: 80,
        priorityFlag: "MEDIUM",
      },
      {
        digitalInstrumentId: "IND-MET-2026-KHM11",
        serialNumber: "SARTORIUS-ENTRIS-990",
        modelName: "Sartorius Entris II Precision Balance",
        category: "PRECISION_BALANCE",
        accuracyClass: "CLASS_II",
        nominalUnit: "G",
        maxCapacity: 1200.0,
        minCapacity: 0.1,
        verificationInterval: 0.02,
        manufacturerName: "Sartorius India Pvt Ltd",
        ownerName: "The Gourmet Grocer & Spice Guild",
        ownerAddress: "Shop 42, Middle Lane, Khan Market, New Delhi",
        pincode: "110003",
        jurisdictionCircle: "Delhi Central Circle",
        status: "VERIFIED",
        riskScore: 6,
        trustScore: 97,
        priorityFlag: "LOW",
        lastVerifiedAt: "2026-02-18T15:00:00.000Z",
        validUntil: "2027-02-17T23:59:59.000Z",
      },
      {
        digitalInstrumentId: "IND-MET-2026-AZP12",
        serialNumber: "ESSAE-DS215-88102",
        modelName: "Essae-Teraoka DS-215 Counter Scale",
        category: "ELECTRONIC_COUNTER_SCALE",
        accuracyClass: "CLASS_III",
        nominalUnit: "KG",
        maxCapacity: 30.0,
        minCapacity: 0.1,
        verificationInterval: 0.005,
        manufacturerName: "Essae-Teraoka Ltd",
        ownerName: "Fresh Choice Fruit Stall (Retail Vendor)",
        ownerAddress: "Kiosk 4, Gate 2 Entry, Azadpur APMC Mandi, Delhi",
        pincode: "110033",
        jurisdictionCircle: "Delhi North District Circle",
        status: "REJECTED_MPE_EXCEEDED",
        riskScore: 92,
        trustScore: 28,
        priorityFlag: "CRITICAL",
        lastVerifiedAt: "2026-02-25T11:15:00.000Z",
      },
    ];

    const createdInstruments = [];
    for (const instData of benchmarkInstruments) {
      const inst = await prisma.instrument.create({
        data: instData,
      });
      createdInstruments.push(inst);
    }

    // 4. Create Statutory Verification Applications
    const instAzp01 = createdInstruments.find((i) => i.digitalInstrumentId === "IND-MET-2026-AZP01")!;
    const instAzp02 = createdInstruments.find((i) => i.digitalInstrumentId === "IND-MET-2026-AZP02")!;
    const instNeh09 = createdInstruments.find((i) => i.digitalInstrumentId === "IND-MET-2026-NEH09")!;
    const instNar10 = createdInstruments.find((i) => i.digitalInstrumentId === "IND-MET-2026-NAR10")!;
    const instAzp12 = createdInstruments.find((i) => i.digitalInstrumentId === "IND-MET-2026-AZP12")!;
    const instChk07 = createdInstruments.find((i) => i.digitalInstrumentId === "IND-MET-2026-CHK07")!;
    const instGzp04 = createdInstruments.find((i) => i.digitalInstrumentId === "IND-MET-2026-GZP04")!;

    // App 1: Completed verified app for AZP01
    const appAzp01 = await prisma.verificationApplication.create({
      data: {
        applicationNumber: "APP-DoCA-2026-9001",
        instrumentId: instAzp01.id,
        instrumentSerial: instAzp01.serialNumber,
        applicantName: "Ramesh Patel",
        applicantPhone: "+91 98234 11223",
        type: "INITIAL_VERIFICATION",
        readinessScore: 95,
        feeAmount: 150.0,
        paymentRefNumber: "BHIM-UPI-9941029148",
        paymentStatus: "PAID",
        assignedOfficerId: lmoUser.id,
        assignedOfficerName: "Rajesh Kumar (LMO-DL-N-884)",
        scheduledDate: "2026-01-15",
        scheduledSlot: "10:00 - 12:00",
        status: "COMPLETED_VERIFIED",
      },
    });

    // App 2: Scheduled verification for NAR10 (Tomorrow)
    await prisma.verificationApplication.create({
      data: {
        applicationNumber: "APP-DoCA-2026-9042",
        instrumentId: instNar10.id,
        instrumentSerial: instNar10.serialNumber,
        applicantName: "Kisan Grain Storage (Manager S. Sharma)",
        applicantPhone: "+91 98110 33445",
        type: "RE_VERIFICATION",
        readinessScore: 88,
        feeAmount: 300.0,
        paymentRefNumber: "UPI-AXIS-00294119",
        paymentStatus: "PAID",
        assignedOfficerId: lmoUser.id,
        assignedOfficerName: "Rajesh Kumar (LMO-DL-N-884)",
        scheduledDate: "2026-09-06",
        scheduledSlot: "11:00 - 13:00",
        status: "SCHEDULED",
      },
    });

    // App 3: Pending Assignment for NEH09
    await prisma.verificationApplication.create({
      data: {
        applicationNumber: "APP-DoCA-2026-9088",
        instrumentId: instNeh09.id,
        instrumentSerial: instNeh09.serialNumber,
        applicantName: "Silicon Logistics Ltd",
        applicantPhone: "+91 98188 77221",
        type: "INITIAL_VERIFICATION",
        readinessScore: 85,
        feeAmount: 200.0,
        paymentRefNumber: "HDFC-PAY-44102948",
        paymentStatus: "PAID",
        status: "PENDING_ASSIGNMENT",
      },
    });

    // App 4: Re-verification under review for AZP02
    await prisma.verificationApplication.create({
      data: {
        applicationNumber: "APP-DoCA-2026-9104",
        instrumentId: instAzp02.id,
        instrumentSerial: instAzp02.serialNumber,
        applicantName: "Golden Harvest Grain Traders",
        applicantPhone: "+91 98101 22998",
        type: "RE_VERIFICATION",
        readinessScore: 78,
        feeAmount: 150.0,
        paymentRefNumber: "PAYTM-9920148102",
        paymentStatus: "PAID",
        status: "UNDER_REVIEW",
      },
    });

    // 5. Create Realistic Field Inspection Test Dockets (Verifications)
    // Verification 1: Passed verification for AZP01
    const verifAzp01 = await prisma.verification.create({
      data: {
        applicationId: appAzp01.id,
        instrumentId: instAzp01.id,
        officerId: lmoUser.id,
        officerName: "Rajesh Kumar",
        inspectionDate: new Date("2026-01-15T10:30:00.000Z"),
        result: "PASS",
        appliedSealNumber: "IND-DL-2024-8921",
        ocrSerialMatched: true,
        mpeTolerancePassed: true,
        observationsJson: JSON.stringify({
          visualInspection: "PASSED",
          plateLegibility: "CLEAR",
          zeroLoadError_g: 0.0,
          halfCapacityError_g: 0.0,
          maxCapacityError_g: 2.0,
          mpeLimit_g: 5.0,
          repeatabilityTest: "PASSED",
          eccentricityTest: "PASSED",
          tamperSealIntegrity: "INTACT",
        }),
        summaryNotes: "Instrument fully complies with Legal Metrology (General) Rules, 2011 Seventh Schedule (MPE Class III). Holographic seal applied.",
      },
    });

    // Verification 2: Failed verification for AZP12 (MPE exceeded)
    await prisma.verification.create({
      data: {
        applicationId: appAzp01.id, // linked to historical docket
        instrumentId: instAzp12.id,
        officerId: lmoUser.id,
        officerName: "Rajesh Kumar",
        inspectionDate: new Date("2026-02-25T11:15:00.000Z"),
        result: "FAIL",
        ocrSerialMatched: true,
        mpeTolerancePassed: false,
        observationsJson: JSON.stringify({
          visualInspection: "FAILED",
          plateLegibility: "WORN",
          zeroLoadError_g: 4.0,
          halfCapacityError_g: 14.0,
          maxCapacityError_g: 24.0,
          mpeLimit_g: 10.0,
          repeatabilityTest: "FAILED",
          eccentricityTest: "FAILED",
          tamperSealIntegrity: "SEAL_COMPROMISED",
        }),
        summaryNotes: "CRITICAL NON-COMPLIANCE: Error of +24.0g at 15kg load exceeds Maximum Permissible Error tolerance (+10.0g) under OIML R-76. Stamping refused under Section 24.",
      },
    });

    // 6. Create Form VIII Verification Certificates
    await prisma.certificate.create({
      data: {
        certificateNumber: "CERT-DoCA-2026-DL-8921",
        instrumentId: instAzp01.id,
        digitalInstrumentId: instAzp01.digitalInstrumentId,
        verificationId: verifAzp01.id,
        issueDate: "2026-01-15",
        validUntil: "2027-01-14",
        status: "ACTIVE_VALID",
        physicalSealNumber: "IND-DL-2024-8921",
        digitalSignatureHash: "sha256_88b19f048e4209cb1149e088a21f70914bc8a31e",
        signedByOfficerName: "Rajesh Kumar (LMO-DL-N-884)",
        qrPayloadUrl: `/qr/${instAzp01.digitalInstrumentId}`,
      },
    });

    await prisma.certificate.create({
      data: {
        certificateNumber: "CERT-DoCA-2026-DL-0491",
        instrumentId: instChk07.id,
        digitalInstrumentId: instChk07.digitalInstrumentId,
        issueDate: "2026-02-14",
        validUntil: "2027-02-13",
        status: "ACTIVE_VALID",
        physicalSealNumber: "IND-DL-JEW-0491",
        digitalSignatureHash: "sha256_77c21094dae3199bc4410a8812f00941ab78c011",
        signedByOfficerName: "Dr. S. K. Verma (Controller)",
        qrPayloadUrl: `/qr/${instChk07.digitalInstrumentId}`,
      },
    });

    // 7. Create Statutory Consumer Complaints / Grievances (NCH / INGRAM Format)
    await prisma.complaint.create({
      data: {
        complaintNumber: "NCH-DoCA-2026-0081",
        instrumentId: instAzp12.id,
        digitalInstrumentId: instAzp12.digitalInstrumentId,
        category: "SHORT_WEIGHT",
        description: "Consumer bought 2 kg apples from Kiosk 4 Azadpur Mandi. Checked weight at APMC reference Dharamkanta; true weight was 1.91 kg (90g short-weighted).",
        complainantPhone: "+91 98112 44990",
        severity: "HIGH",
        status: "VERIFIED_BREACH",
        impactOnRiskScore: 35,
      },
    });

    await prisma.complaint.create({
      data: {
        complaintNumber: "NCH-DoCA-2026-0104",
        instrumentId: instGzp04.id,
        digitalInstrumentId: instGzp04.digitalInstrumentId,
        category: "BROKEN_SEAL",
        description: "Public consumer scanned QR code on scale at Ghazipur stall 48 and reported that the official lead tamper seal was snipped and replaced with wire.",
        complainantPhone: "+91 98711 00223",
        severity: "CRITICAL",
        status: "INVESTIGATION_DISPATCHED",
        impactOnRiskScore: 40,
      },
    });

    await prisma.complaint.create({
      data: {
        complaintNumber: "NCH-DoCA-2026-0119",
        instrumentId: instAzp02.id,
        digitalInstrumentId: instAzp02.digitalInstrumentId,
        category: "EXPIRED_STAMP",
        description: "Verification stamping validity appears to have expired on this scale. Merchant was requested for certificate copy but refused.",
        complainantPhone: "+91 99100 88776",
        severity: "MEDIUM",
        status: "PENDING_REVIEW",
        impactOnRiskScore: 20,
      },
    });

    // 8. Create Audit Logs
    await prisma.auditLog.create({
      data: {
        entityType: "SystemBenchmark",
        entityId: "BENCHMARK-APMC-DELHI",
        actorName: "System Administrator",
        actorRole: "ADMIN",
        action: "LOAD_BENCHMARK_DATASET",
        details: "Loaded 12 realistic Indian metrology benchmark instruments across Azadpur, Ghazipur, Okhla, and Chandni Chowk mandis.",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Realistic Metrology Benchmark Dataset loaded successfully into database.",
      counts: {
        instruments: 12,
        applications: 4,
        verifications: 2,
        certificates: 2,
        complaints: 3,
      },
    });
  } catch (error) {
    console.error("Benchmark seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed benchmark dataset", details: String(error) },
      { status: 500 }
    );
  }
}
