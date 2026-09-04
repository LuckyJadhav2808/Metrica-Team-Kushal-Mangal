import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { UserRole } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      role = "OWNER",
      organizationName,
      jurisdictionCircle = "Delhi North District Circle",
      phone = "",
      officerBadgeId,
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password || "password123");

    // Create User in DB
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        name,
        designation: role === "OWNER" ? "Commercial Licensee" : "Licensed Manufacturer",
        phone,
        organizationName,
        jurisdictionCircle,
        officerBadgeId,
        avatarLetter: name.charAt(0).toUpperCase(),
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        entityType: "User",
        entityId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "REGISTER",
        details: `Self-registered as ${user.role} (${user.organizationName || user.name})`,
      },
    });

    // Sign JWT session token
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      name: user.name,
      designation: user.designation,
      organizationName: user.organizationName,
      jurisdictionCircle: user.jurisdictionCircle,
      officerBadgeId: user.officerBadgeId,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        designation: user.designation,
        phone: user.phone,
        organizationName: user.organizationName,
        jurisdictionCircle: user.jurisdictionCircle,
        officerBadgeId: user.officerBadgeId,
        avatarLetter: user.avatarLetter,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: "Internal registration error" }, { status: 500 });
  }
}
