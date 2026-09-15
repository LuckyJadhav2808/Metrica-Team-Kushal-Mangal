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
        email: trimmedEmail,
        password,
      },
    });
  } catch (error: any) {
    console.error("POST officer error:", error);
    return NextResponse.json({ error: error.message || "Failed to commission officer" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      email,
      password,
      officerBadgeId,
      designation,
      jurisdictionCircle,
      organizationName,
      phone,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Officer ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();
    if (officerBadgeId) updateData.officerBadgeId = officerBadgeId;
    if (designation) updateData.designation = designation;
    if (jurisdictionCircle) updateData.jurisdictionCircle = jurisdictionCircle;
    if (organizationName) updateData.organizationName = organizationName;
    if (phone !== undefined) updateData.phone = phone;
    if (name) updateData.avatarLetter = name.charAt(0).toUpperCase();

    // If password reset requested
    if (password && password.trim().length > 0) {
      updateData.passwordHash = await hashPassword(password);
    }

    const updatedOfficer = await prisma.user.update({
      where: { id },
      data: updateData,
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
        entityId: updatedOfficer.id,
        actorName: "State Controller Office",
        actorRole: "ADMIN",
        action: "ADMIN_UPDATE_OFFICER",
        details: `Updated Field Officer profile for ${updatedOfficer.name} (${updatedOfficer.officerBadgeId}). Circle: ${updatedOfficer.jurisdictionCircle}${password ? " (Password Reset)" : ""}`,
      },
    });

    return NextResponse.json({
      ok: true,
      officer: updatedOfficer,
      passwordReset: !!password,
    });
  } catch (error) {
    console.error("PUT officer update error:", error);
    return NextResponse.json({ error: "Failed to update officer profile" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Officer ID is required" }, { status: 400 });
    }

    const officer = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, officerBadgeId: true, jurisdictionCircle: true },
    });

    if (!officer) {
      return NextResponse.json({ error: "Officer not found" }, { status: 404 });
    }

    // Reassign any active pending applications to unassigned
    await prisma.verificationApplication.updateMany({
      where: { assignedOfficerId: id },
      data: {
        assignedOfficerId: null,
        assignedOfficerName: null,
        status: "PENDING_PAYMENT_VERIFIED",
      },
    });

    // Delete officer record
    await prisma.user.delete({
      where: { id },
    });

    // Record Immutable Audit Log
    await prisma.auditLog.create({
      data: {
        entityType: "User",
        entityId: id,
        actorName: "State Controller Office",
        actorRole: "ADMIN",
        action: "ADMIN_DECOMMISSION_OFFICER",
        details: `Decommissioned Field Officer ${officer.name} (${officer.officerBadgeId}). Caseload unassigned for circle redistribution.`,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Officer ${officer.name} successfully decommissioned.`,
    });
  } catch (error) {
    console.error("DELETE officer error:", error);
    return NextResponse.json({ error: "Failed to decommission officer" }, { status: 500 });
  }
}
