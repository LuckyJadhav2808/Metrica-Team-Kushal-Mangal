import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: session.userId },
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
        },
      });
    } catch (dbErr) {
      console.warn("DB lookup error in /api/auth/me, falling back to JWT session:", dbErr);
    }

    // If not in DB or DB offline, reconstruct user from valid JWT session token
    if (!user) {
      user = {
        id: session.userId,
        email: session.email,
        role: session.role,
        name: session.name,
        designation: session.designation,
        phone: "",
        organizationName: session.organizationName || null,
        jurisdictionCircle: session.jurisdictionCircle || "National",
        officerBadgeId: session.officerBadgeId || null,
        avatarLetter: session.name ? session.name.charAt(0).toUpperCase() : "U",
      };
    }

    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
