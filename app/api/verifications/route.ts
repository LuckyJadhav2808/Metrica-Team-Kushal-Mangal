import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      applicationId,
      instrumentId,
      officerId,
      officerName,
      result, // "PASS" or "FAIL"
      appliedSealNumber,
      ocrSerialMatched = false,
      mpeTolerancePassed = false,
      observations = [],
      summaryNotes = "",
    } = body;

    if (!applicationId || !instrumentId) {
      return NextResponse.json({ error: "Application ID and Instrument ID are required" }, { status: 400 });
    }

    const inst = await prisma.instrument.findFirst({
      where: {
        OR: [
          { id: instrumentId },
          { digitalInstrumentId: instrumentId },
          { serialNumber: instrumentId },
        ],
      },
    });

    if (!inst) {
      return NextResponse.json({ error: "Instrument not found" }, { status: 404 });
    }

    const app = await prisma.verificationApplication.findFirst({
      where: {
        OR: [
          { id: applicationId },
          { applicationNumber: applicationId },
        ],
      },
    });

    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Resolve valid officer in DB
    const officer = await prisma.user.findFirst({
      where: {
        OR: [
          { id: officerId },
          { role: "LMO" },
        ],
      },
    });

    const validOfficerId = officer?.id || app.assignedOfficerId || inst.ownerId || "usr-lmo-01";
    const validOfficerName = officerName || officer?.name || "Rajesh Kumar (LMO Grade-I)";

    // 1. Create Verification Record
    const verification = await prisma.verification.create({
      data: {
        applicationId: app.id,
        instrumentId: inst.id,
        officerId: validOfficerId,
        officerName: validOfficerName,
        result,
        appliedSealNumber,
        ocrSerialMatched,
        mpeTolerancePassed,
        observationsJson: JSON.stringify(observations),
        summaryNotes,
      },
    });

    let certificate = null;

    if (result === "PASS") {
      const today = new Date();
      const nextYear = new Date();
      nextYear.setFullYear(today.getFullYear() + 1);

      const issueDateStr = today.toISOString().split("T")[0];
      const validUntilStr = nextYear.toISOString().split("T")[0];
      const certNumber = `CERT-DoCA-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      // Cryptographic HMAC-SHA256 Hash
      const signaturePayload = `${certNumber}|${inst.digitalInstrumentId}|${appliedSealNumber}|${issueDateStr}|${officerName}`;
      const digitalSignatureHash = `HMAC-SHA256-${crypto
        .createHmac("sha256", process.env.JWT_SECRET || "metrica-secret")
        .update(signaturePayload)
        .digest("hex")
        .substring(0, 16)
        .toUpperCase()}`;

      certificate = await prisma.certificate.create({
        data: {
          certificateNumber: certNumber,
          instrumentId: inst.id,
          digitalInstrumentId: inst.digitalInstrumentId,
          verificationId: verification.id,
          issueDate: issueDateStr,
          validUntil: validUntilStr,
          status: "ACTIVE_VALID",
          physicalSealNumber: appliedSealNumber || "SEAL-GOVT-001",
          digitalSignatureHash,
          signedByOfficerName: officerName,
          qrPayloadUrl: `/qr/${inst.digitalInstrumentId}`,
        },
      });

      // Update Instrument to Verified
      await prisma.instrument.update({
        where: { id: inst.id },
        data: {
          status: "VERIFIED_ACTIVE",
          riskScore: 5,
          trustScore: 98,
          priorityFlag: "LOW",
          lastVerifiedAt: issueDateStr,
          validUntil: validUntilStr,
        },
      });

      // Update Application to Certified
      await prisma.verificationApplication.update({
        where: { id: app.id },
        data: { status: "PASSED_CERTIFIED" },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          entityType: "Verification",
          entityId: verification.id,
          actorName: officerName,
          actorRole: "LMO",
          action: "CERTIFICATE_ISSUED",
          details: `Stamping completed for ${inst.digitalInstrumentId}. Certificate ${certNumber} issued with seal ${appliedSealNumber}`,
        },
      });
    } else {
      // Rejection Notice
      await prisma.instrument.update({
        where: { id: inst.id },
        data: {
          status: "REJECTION_NOTICE_ISSUED",
          riskScore: 85,
          priorityFlag: "HIGH",
        },
      });

      await prisma.verificationApplication.update({
        where: { id: app.id },
        data: { status: "REJECTION_NOTICE_ISSUED" },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          entityType: "Verification",
          entityId: verification.id,
          actorName: officerName,
          actorRole: "LMO",
          action: "REJECTION_NOTICE_ISSUED",
          details: `Verification failed MPE tolerance check for ${inst.digitalInstrumentId}. Form-B notice issued.`,
        },
      });
    }

    return NextResponse.json({ verification, certificate }, { status: 201 });
  } catch (error) {
    console.error("POST verification error:", error);
    return NextResponse.json({ error: "Failed to record verification" }, { status: 500 });
  }
}
