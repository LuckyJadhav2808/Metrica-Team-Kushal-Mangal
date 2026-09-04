import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(complaints);
  } catch (error) {
    console.error("GET complaints error:", error);
    return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      digitalInstrumentId,
      instrumentId,
      complaintType = "SHORT_WEIGHT",
      description,
      complainantPhone = "+91 99000 11223",
      severity = "MEDIUM",
    } = body;

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const complaintNumber = `CMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Look up instrument if ID or digital ID was provided
    let inst = null;
    if (instrumentId || digitalInstrumentId) {
      inst = await prisma.instrument.findFirst({
        where: {
          OR: [
            ...(instrumentId ? [{ id: instrumentId }] : []),
            ...(digitalInstrumentId ? [{ digitalInstrumentId }] : []),
          ],
        },
      });
    }

    const complaint = await prisma.complaint.create({
      data: {
        complaintNumber,
        instrumentId: inst?.id,
        digitalInstrumentId: inst?.digitalInstrumentId || digitalInstrumentId,
        category: complaintType,
        description,
        complainantPhone,
        severity,
        status: "LOGGED",
        impactOnRiskScore: 25,
      },
    });

    // If instrument found, adjust risk score and priority flag
    if (inst) {
      const updatedRisk = Math.min(100, inst.riskScore + 30);
      await prisma.instrument.update({
        where: { id: inst.id },
        data: {
          riskScore: updatedRisk,
          priorityFlag: updatedRisk >= 70 ? "CRITICAL" : "HIGH",
          status: "SUSPENDED_TAMPERED",
        },
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        entityType: "Complaint",
        entityId: complaint.id,
        actorName: "Citizen Consumer",
        actorRole: "PUBLIC",
        action: "FILE_COMPLAINT",
        details: `Citizen complaint filed (${complaintType}) for ${digitalInstrumentId || "unspecified instrument"}: ${description.substring(0, 80)}`,
      },
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error("POST complaint error:", error);
    return NextResponse.json({ error: "Failed to record complaint" }, { status: 500 });
  }
}
