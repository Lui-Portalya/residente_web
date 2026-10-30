import { getDb, tx } from "../db/client";
import { hashPassword } from "../auth/password";
import { DomainError } from "./errors";

export type UserRow = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "resident";
  active: number;
  residence_id: number | null;
  residence_code: string | null;
};

export function listUsers(q = ""): UserRow[] {
  const like = `%${q.trim()}%`;
  return getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.active, r.id AS residence_id, r.code AS residence_code
       FROM users u
       LEFT JOIN residence_residents rr ON rr.user_id = u.id
       LEFT JOIN residences r ON r.id = rr.residence_id
       WHERE u.name LIKE ? OR u.email LIKE ? ORDER BY u.name`,
    )
    .all(like, like) as UserRow[];
}

export function getUser(id: number): UserRow | undefined {
  return getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.active, r.id AS residence_id, r.code AS residence_code
       FROM users u LEFT JOIN residence_residents rr ON rr.user_id = u.id
       LEFT JOIN residences r ON r.id = rr.residence_id WHERE u.id = ?`,
    )
    .get(id) as UserRow | undefined;
}

function assignResidence(userId: number, role: string, residenceId?: number) {
  const db = getDb();
  db.prepare("DELETE FROM residence_residents WHERE user_id = ?").run(userId);
  if (role === "resident" && residenceId) {
    const has = db.prepare("SELECT COUNT(*) AS n FROM residence_residents WHERE residence_id = ?").get(residenceId) as { n: number };
    db.prepare("INSERT INTO residence_residents (residence_id, user_id, is_primary) VALUES (?, ?, ?)").run(
      residenceId,
      userId,
      has.n === 0 ? 1 : 0,
    );
  }
}

function emailTaken(email: string, exceptId = 0): boolean {
  return !!getDb().prepare("SELECT 1 FROM users WHERE email = ? AND id != ?").get(email, exceptId);
}

export function createUser(input: { name: string; email: string; role: "admin" | "resident"; password: string; residenceId?: number }): number {
  const db = getDb();
  return tx(db, () => {
    if (emailTaken(input.email)) throw new DomainError("A user with that email already exists.");
    const res = db
      .prepare("INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)")
      .run(input.email, input.name, hashPassword(input.password), input.role);
    const id = Number(res.lastInsertRowid);
    assignResidence(id, input.role, input.residenceId);
    return id;
  });
}

export function updateUser(
  input: { id: number; name: string; email: string; role: "admin" | "resident"; active: boolean; residenceId?: number },
  actingUserId: number,
): void {
  const db = getDb();
  tx(db, () => {
    if (!getUser(input.id)) throw new DomainError("User not found.");
    if (emailTaken(input.email, input.id)) throw new DomainError("A user with that email already exists.");
    if (input.id === actingUserId && (!input.active || input.role !== "admin")) {
      throw new DomainError("You cannot deactivate or demote your own account.");
    }
    db.prepare("UPDATE users SET name = ?, email = ?, role = ?, active = ? WHERE id = ?").run(
      input.name,
      input.email,
      input.role,
      input.active ? 1 : 0,
      input.id,
    );
    if (!input.active) db.prepare("DELETE FROM sessions WHERE user_id = ?").run(input.id);
    assignResidence(input.id, input.role, input.residenceId);
  });
}

export function resetPassword(id: number, password: string): void {
  const db = getDb();
  tx(db, () => {
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(password), id);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  });
}

export function findLoginUser(email: string) {
  return getDb().prepare("SELECT id, role, password_hash FROM users WHERE email = ? AND active = 1").get(email) as
    | { id: number; role: "admin" | "resident"; password_hash: string }
    | undefined;
}
