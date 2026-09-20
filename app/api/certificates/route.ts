import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const instrumentId = searchParams.get("instrumentId");
    const certificateNumber = searchParams.get("certificateNumber");

    const where: any = {};
    if (certificateNumber) where.certificateNumber = certificateNumber;
    if (instrumentId) {
      where.OR = [
        { instrumentId },
        { digitalInstrumentId: instrumentId },
      ];
    }

    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        instrument: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(certificates);
  } catch (error) {
    console.warn("GET certificates notice (database not initialized, returning empty):", error);
    return NextResponse.json([]);
  }
}
