import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const officerId = searchParams.get("officerId");

    const where: any = {};
    if (status) where.status = status;
    if (officerId) where.assignedOfficerId = officerId;

    const applications = await prisma.verificationApplication.findMany({
      where,
      include: {
        instrument: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("GET applications error:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      instrumentId,
      applicantName,
      applicantPhone = "+91 98000 00000",
      type = "INITIAL_VERIFICATION",
      readinessScore = 85,
    } = body;

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

    const applicationNumber = `APP-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const application = await prisma.verificationApplication.create({
      data: {
        applicationNumber,
        instrumentId: inst.id,
        instrumentSerial: inst.serialNumber,
        applicantName,
        applicantPhone,
        type,
        readinessScore: Number(readinessScore) || 85,
        feeAmount: 150.0,
        paymentRefNumber: `CHALLAN-BHARATKOSH-${Math.floor(1000 + Math.random() * 9000)}`,
        paymentStatus: "PAID",
        status: "PENDING_ASSIGNMENT",
      },
      include: {
        instrument: true,
      },
    });

    // Update instrument status
    await prisma.instrument.update({
      where: { id: inst.id },
      data: { status: "REGISTERED_PENDING_VERIFICATION" },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("POST applications error:", error);
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicationId, officerId, officerName, scheduledDate, scheduledSlot } = body;

    if (!applicationId) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 });
    }

    const targetApp = await prisma.verificationApplication.findFirst({
      where: {
        OR: [
          { id: applicationId },
          { applicationNumber: applicationId },
        ],
      },
    });

    if (!targetApp) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (officerId) updateData.assignedOfficerId = officerId;
    if (officerName) updateData.assignedOfficerName = officerName;
    if (scheduledDate) updateData.scheduledDate = scheduledDate;
    if (scheduledSlot) updateData.scheduledSlot = scheduledSlot;
    if (body.paymentStatus) updateData.paymentStatus = body.paymentStatus;
    if (body.paymentRefNumber) updateData.paymentRefNumber = body.paymentRefNumber;
    if (body.status) updateData.status = body.status;
    else if (officerId || scheduledDate) updateData.status = "SCHEDULED";

    const updated = await prisma.verificationApplication.update({
      where: { id: targetApp.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH applications error:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
