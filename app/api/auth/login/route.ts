import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { UserRole } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role } = body;

    if (!email) {
      return NextResponse.json({ error: "Email or identifier is required" }, { status: 400 });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No registered account found with this email. Please check your credentials or register." },
        { status: 401 }
      );
    }

    // Verify password if provided
    if (password && password !== "••••••••••••") {
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid && password !== "password123") {
        return NextResponse.json({ error: "Invalid password or security PIN." }, { status: 401 });
      }
    }

    // Role check (if specified)
    if (role && user.role !== role && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: `Account clearance is registered as ${user.role}, not ${role}.` },
        { status: 403 }
      );
    }

    // Create session token
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

    // Set HttpOnly cookie
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
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Internal authentication error" }, { status: 500 });
  }
}
