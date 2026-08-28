import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE = "zhub_session";
const SESSION_DAYS = 30;

export type SessionUser = { id: string; username: string; email: string };

export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_DAYS * 86400_000;
  await db.execute({
    sql: "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
    args: [sessionId, userId, expiresAt],
  });
  const token = await new SignJWT({ sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(SECRET);
  return token;
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DAYS * 86400,
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const sessionId = payload.sessionId as string;
    const row = await db.execute({
      sql: `SELECT u.id, u.username, u.email FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.id = ? AND s.expires_at > ?`,
      args: [sessionId, Date.now()],
    });
    if (!row.rows.length) return null;
    const r = row.rows[0];
    return { id: r[0] as string, username: r[1] as string, email: r[2] as string };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      await db.execute({
        sql: "DELETE FROM sessions WHERE id = ?",
        args: [payload.sessionId as string],
      });
    } catch {}
  }
  jar.delete(COOKIE);
}
