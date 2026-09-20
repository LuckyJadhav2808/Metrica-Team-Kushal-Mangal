import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { UserRole } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    // Default primary email for each role in seed database
    const roleEmailMap: Record<string, string> = {
      ADMIN: "controller.lm@nic.in",
      LMO: "rajesh.kumar.lmo@gov.in",
      OWNER: "ramesh.patel@greenvalley.in",
      MANUFACTURER: "regulatory@apexmetrology.com",
    };

    const targetEmail = roleEmailMap[role];
    let user: any = null;

    try {
      if (targetEmail) {
        user = await prisma.user.findUnique({
          where: { email: targetEmail },
        });
      }

      // Fallback: find any user with this role
      if (!user) {
        user = await prisma.user.findFirst({
          where: { role },
        });
      }
    } catch (dbErr) {
      console.warn("DB lookup error in switch-role, using ephemeral persona fallback:", dbErr);
    }

    // If still not found, construct an ephemeral persona session
    const userData = user
      ? {
          id: user.id,
          email: user.email,
          role: user.role as UserRole,
          name: user.name,
          designation: user.designation,
          phone: user.phone,
          organizationName: user.organizationName,
          jurisdictionCircle: user.jurisdictionCircle,
          officerBadgeId: user.officerBadgeId,
          avatarLetter: user.avatarLetter,
        }
      : {
          id: `usr-${role.toLowerCase()}-01`,
          email: `${role.toLowerCase()}@metrica.gov.in`,
          role: role as UserRole,
          name: role === "LMO" ? "Rajesh Kumar" : role === "OWNER" ? "Ramesh Patel" : role === "MANUFACTURER" ? "Anand Swaminathan" : "Dr. S. K. Verma",
          designation: role === "LMO" ? "Legal Metrology Inspector (Grade-I)" : role === "OWNER" ? "Commercial Licensee" : role === "MANUFACTURER" ? "Chief Regulatory Officer" : "Controller of Legal Metrology",
          phone: "+91 98100 00000",
          organizationName: role === "OWNER" ? "Green Valley Groceries" : "Department of Consumer Affairs",
          jurisdictionCircle: "Delhi North District Circle",
          officerBadgeId: role === "LMO" ? "LMO-DL-N-884" : undefined,
          avatarLetter: role.charAt(0),
        };

    const token = await signSessionToken({
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      name: userData.name,
      designation: userData.designation,
      organizationName: userData.organizationName,
      jurisdictionCircle: userData.jurisdictionCircle,
      officerBadgeId: userData.officerBadgeId,
    });

    const response = NextResponse.json({
      ok: true,
      user: userData,
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
    console.error("Switch role error:", error);
    return NextResponse.json({ error: "Could not switch role" }, { status: 500 });
  }
}
