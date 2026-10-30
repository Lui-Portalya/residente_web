import { resolve } from "node:path";
import { openDb } from "../src/server/db/client.ts";
import { hashPassword } from "../src/server/auth/password.ts";

// Development data; safe to re-run (existing rows are left alone). Never use these credentials in production.
const ADMIN = { email: process.env.SEED_ADMIN_EMAIL ?? "admin", password: process.env.SEED_ADMIN_PASSWORD ?? "admin123" };
const RESIDENT = { email: "resident", password: "resident123" };

const db = openDb(resolve(process.env.DATABASE_PATH ?? "./data/residente.db"));

function ensureUser(email: string, name: string, password: string, role: "admin" | "resident"): number {
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: number } | undefined;
  if (existing) return existing.id;
  const res = db
    .prepare("INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)")
    .run(email, name, hashPassword(password), role);
  console.log(`Created ${role} "${email}".`);
  return Number(res.lastInsertRowid);
}

ensureUser(ADMIN.email, "Administrator", ADMIN.password, "admin");

// Common areas
const area = db.prepare(
  "INSERT OR IGNORE INTO common_areas (name, description, capacity, open_time, close_time, slot_minutes, fee_cents) VALUES (?,?,?,?,?,?,?)",
);
area.run("Pool", "Outdoor pool", 30, "08:00", "20:00", 60, 0);
area.run("Party Room", "Event hall with kitchen", 50, "10:00", "23:00", 120, 5000);
area.run("Tennis Court", "Hard court, bring your own racket", 4, "07:00", "21:00", 60, 1000);

// A sample residence with a resident, so the resident side can be tried right away
db.prepare("INSERT OR IGNORE INTO residences (code, address, monthly_fee_cents) VALUES ('A-101', 'Tower A, floor 1', 15000)").run();
const residenceId = (db.prepare("SELECT id FROM residences WHERE code = 'A-101'").get() as { id: number }).id;
const residentId = ensureUser(RESIDENT.email, "Sample Resident", RESIDENT.password, "resident");
if (!db.prepare("SELECT 1 FROM residence_residents WHERE user_id = ?").get(residentId)) {
  db.prepare("INSERT INTO residence_residents (residence_id, user_id, is_primary) VALUES (?, ?, 1)").run(residenceId, residentId);
}

// This month's maintenance charge (unique per residence/period, so re-running is a no-op)
const now = new Date();
const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
db.prepare(
  `INSERT OR IGNORE INTO charges (residence_id, type, period, description, amount_cents, due_date)
   VALUES (?, 'maintenance', ?, ?, 15000, ?)`,
).run(residenceId, period, `Maintenance ${period}`, `${period}-28`);

console.log(`Seed complete. Admin: ${ADMIN.email} / ${ADMIN.password}   Resident: ${RESIDENT.email} / ${RESIDENT.password}`);
