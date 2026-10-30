import { redirect } from "next/navigation";
import { getDb } from "../db/client";
import { getSessionUser, type SessionUser } from "./session";

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}

export type ResidentContext = {
  user: SessionUser;
  residence: { id: number; code: string; address: string; monthly_fee_cents: number } | null;
};

/** Residents are scoped to their own (primary, else first) active residence. */
export async function requireResident(): Promise<ResidentContext> {
  const user = await requireUser();
  if (user.role !== "resident") redirect("/admin");
  const residence = getDb()
    .prepare(
      `SELECT r.id, r.code, r.address, r.monthly_fee_cents FROM residence_residents rr
       JOIN residences r ON r.id = rr.residence_id
       WHERE rr.user_id = ? AND r.active = 1 ORDER BY rr.is_primary DESC, r.id LIMIT 1`,
    )
    .get(user.id) as ResidentContext["residence"] | undefined;
  return { user, residence: residence ?? null };
}
