import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";
  let instrumentCount = 0;
  let errorMessage: string | null = null;

  try {
    instrumentCount = await prisma.instrument.count();
  } catch (error: any) {
    dbStatus = "degraded";
    errorMessage = error?.message || "Database ping failed";
  }

  const responseTimeMs = Date.now() - startTime;
  const memoryUsage = process.memoryUsage();

  const isHealthy = dbStatus === "healthy";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      system: "Metrica Sovereign Legal Metrology Network",
      version: "2026.1.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      responseTimeMs,
      checks: {
        database: {
          status: dbStatus,
          records: instrumentCount,
          error: errorMessage,
        },
        memory: {
          rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
          heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        },
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
