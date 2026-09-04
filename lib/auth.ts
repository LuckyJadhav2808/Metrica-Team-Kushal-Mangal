import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { UserRole } from "./types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "metrica-sovereign-legal-metrology-auth-token-key-2026"
);

export const AUTH_COOKIE_NAME = "metrica_session";

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  designation: string;
  organizationName?: string | null;
  jurisdictionCircle?: string;
  officerBadgeId?: string | null;
}

// 1. Password utilities
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

export async function verifyPassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

// 2. JWT token signing (Valid for 7 days)
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

// 3. JWT token verification
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// 4. Read session from Next.js server cookie
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
