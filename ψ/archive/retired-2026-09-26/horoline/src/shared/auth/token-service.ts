import { sign, verify } from "hono/jwt";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required. Generate: openssl rand -hex 32");
}
const TOKEN_EXPIRY = "7d";

export interface TokenPayload {
  sub: string; // userId
  anonymousId: string;
  iat?: number;
  exp?: number;
}

export async function generateToken(userId: string, anonymousId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      sub: userId,
      anonymousId,
      iat: now,
      exp: now + 60 * 60 * 24 * 7, // 7 days
    },
    JWT_SECRET,
  );
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const payload = await verify(token, JWT_SECRET, "HS256");
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export function getJwtSecret(): string {
  return JWT_SECRET as string;
}
