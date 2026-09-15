import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RegisterInstrumentSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const status = searchParams.get("status");
    const ownerId = searchParams.get("ownerId");

    const where: any = {};
    if (status) where.status = status;
    if (ownerId) where.ownerId = ownerId;
    if (search) {
      where.OR = [
        { digitalInstrumentId: { contains: search } },
        { serialNumber: { contains: search } },
        { modelName: { contains: search } },
        { ownerName: { contains: search } },
      ];
    }

    const instruments = await prisma.instrument.findMany({
      where,
      include: {
        certificates: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(instruments);
  } catch (error) {
    console.error("GET instruments error:", error);
    return NextResponse.json({ error: "Failed to fetch instruments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const validationResult = RegisterInstrumentSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      serialNumber,
      modelName,
      category,
      accuracyClass,
      nominalUnit,
      maxCapacity,
      minCapacity,
      verificationInterval,
      manufacturerName,
      ownerId,
      ownerName,
      ownerAddress,
      pincode,
      jurisdictionCircle,
      status,
    } = validationResult.data;

    // Generate unique Digital Instrument ID
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString();
    const digitalInstrumentId = `IND-MET-2026-${randomHex}`;

    const instrument = await prisma.instrument.create({
      data: {
        digitalInstrumentId,
        serialNumber,
        modelName,
        category,
        accuracyClass,
        nominalUnit,
        maxCapacity: maxCapacity ?? 30.0,
        minCapacity: minCapacity ?? 0.1,
        verificationInterval: verificationInterval ?? 0.005,
        manufacturerName,
        ownerId,
        ownerName,
        ownerAddress,
        pincode,
        jurisdictionCircle,
        status,
        riskScore: 15,
        trustScore: 85,
        priorityFlag: "LOW",
      },
    });

    // Record in Audit Log
    await prisma.auditLog.create({
      data: {
        entityType: "Instrument",
        entityId: instrument.id,
        actorName: ownerName || "Licensee",
        actorRole: "OWNER",
        action: "REGISTER_INSTRUMENT",
        details: `Registered ${instrument.modelName} (SN: ${instrument.serialNumber}) with ID ${instrument.digitalInstrumentId}`,
      },
    });

    return NextResponse.json(instrument, { status: 201 });
  } catch (error) {
    console.error("POST instruments error:", error);
    return NextResponse.json({ error: "Failed to create instrument" }, { status: 500 });
  }
}
