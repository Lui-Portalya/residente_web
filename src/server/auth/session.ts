import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "../db/client";

export const SESSION_COOKIE = "residente_session";
const TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = { id: number; email: string; name: string; role: "admin" | "resident" };

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  getDb().prepare("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)").run(userId, hashToken(token), expires);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`,
    )
    .get(hashToken(token), Math.floor(Date.now() / 1000));
  return (row as SessionUser | undefined) ?? null;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  jar.delete(SESSION_COOKIE);
}
