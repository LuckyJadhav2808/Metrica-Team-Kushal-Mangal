import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const circle = searchParams.get("circle");

    const where: any = { role: "LMO" };
    if (circle) where.jurisdictionCircle = circle;

    const officers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        designation: true,
        phone: true,
        organizationName: true,
        jurisdictionCircle: true,
        officerBadgeId: true,
        avatarLetter: true,
        createdAt: true,
        applications: {
          select: {
            id: true,
            status: true,
            applicationNumber: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(officers);
  } catch (error) {
    console.error("GET officers error:", error);
    return NextResponse.json({ error: "Failed to fetch officers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password = "GovPass@2026",
      officerBadgeId,
      designation = "Legal Metrology Inspector (Grade-I)",
      jurisdictionCircle = "Delhi North District Circle",
      organizationName = "APMC Mandi Hub",
      phone = "",
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Officer name and official email are required" }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Check if officer already exists
    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: `An officer with email ${trimmedEmail} is already registered.` },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const generatedBadge = officerBadgeId || `LMO-DL-${jurisdictionCircle.split(" ")[1]?.[0] || "N"}-${Math.floor(100 + Math.random() * 900)}`;

    const newOfficer = await prisma.user.create({
      data: {
        name,
        email: trimmedEmail,
        passwordHash,
        role: "LMO",
        designation,
        jurisdictionCircle,
        organizationName,
        phone,
        officerBadgeId: generatedBadge,
        avatarLetter: name.charAt(0).toUpperCase(),
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        designation: true,
        phone: true,
        organizationName: true,
        jurisdictionCircle: true,
        officerBadgeId: true,
        avatarLetter: true,
        createdAt: true,
      },
    });

    // Record Immutable Audit Log
    await prisma.auditLog.create({
      data: {
        entityType: "User",
        entityId: newOfficer.id,
        actorName: "State Controller Office",
        actorRole: "ADMIN",
        action: "ADMIN_COMMISSION_OFFICER",
        details: `Commissioned Field Officer ${newOfficer.name} (${newOfficer.officerBadgeId}) assigned to ${newOfficer.jurisdictionCircle}`,
      },
    });

    return NextResponse.json({
      ok: true,
      officer: newOfficer,
      initialCredentials: {
        email: newOfficer.email,
        password: password,
      },
    });
  } catch (error) {
    console.error("POST officer commission error:", error);
    return NextResponse.json({ error: "Failed to commission officer" }, { status: 500 });
  }
}
