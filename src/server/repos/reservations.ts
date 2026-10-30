import { getDb, tx, type Db } from "../db/client";
import { addDays, fromMinutes, isDate, localNow, toMinutes } from "@/lib/dates";
import { getArea } from "./areas";
import { DomainError } from "./errors";

export type ReservationRow = {
  id: number;
  common_area_id: number;
  area_name: string;
  residence_id: number;
  residence_code: string;
  user_id: number;
  start_at: string;
  end_at: string;
  status: "confirmed" | "cancelled";
};

const SELECT = `SELECT v.id, v.common_area_id, a.name AS area_name, v.residence_id, r.code AS residence_code,
  v.user_id, v.start_at, v.end_at, v.status
  FROM reservations v JOIN common_areas a ON a.id = v.common_area_id JOIN residences r ON r.id = v.residence_id`;

export function createReservation(
  input: { areaId: number; residenceId: number; userId: number; date: string; start: string },
  db: Db = getDb(),
  now: string = localNow(),
): number {
  const area = getArea(input.areaId);
  if (!area || !area.active) throw new DomainError("That area is not available.");
  if (!isDate(input.date)) throw new DomainError("Invalid date.");

  const startMin = toMinutes(input.start);
  const endMin = startMin + area.slot_minutes;
  const open = toMinutes(area.open_time);
  const close = toMinutes(area.close_time);
  if (startMin < open || endMin > close || (startMin - open) % area.slot_minutes !== 0) {
    throw new DomainError(`Choose a ${area.slot_minutes}-minute slot between ${area.open_time} and ${area.close_time}.`);
  }
  const startAt = `${input.date}T${input.start}`;
  const endAt = `${input.date}T${fromMinutes(endMin)}`;
  if (startAt <= now) throw new DomainError("You can only book future slots.");

  return tx(db, () => {
    const clash = db
      .prepare("SELECT 1 FROM reservations WHERE common_area_id = ? AND status = 'confirmed' AND start_at < ? AND end_at > ?")
      .get(input.areaId, endAt, startAt);
    if (clash) throw new DomainError("That slot is already booked.");
    const res = db
      .prepare("INSERT INTO reservations (common_area_id, residence_id, user_id, start_at, end_at) VALUES (?,?,?,?,?)")
      .run(input.areaId, input.residenceId, input.userId, startAt, endAt);
    const id = Number(res.lastInsertRowid);
    if (area.fee_cents > 0) {
      db.prepare(
        `INSERT INTO charges (residence_id, type, reservation_id, description, amount_cents, due_date)
         VALUES (?, 'common_area', ?, ?, ?, ?)`,
      ).run(input.residenceId, id, `${area.name} ${startAt.replace("T", " ")}`, area.fee_cents, input.date);
    }
    return id;
  });
}

/** residenceId restricts cancellation to that residence's own bookings (residents); admins pass undefined. */
export function cancelReservation(id: number, residenceId?: number, db: Db = getDb(), now: string = localNow()): void {
  tx(db, () => {
    const r = db.prepare("SELECT residence_id, start_at, status FROM reservations WHERE id = ?").get(id) as
      | { residence_id: number; start_at: string; status: string }
      | undefined;
    if (!r || (residenceId !== undefined && r.residence_id !== residenceId)) throw new DomainError("Reservation not found.");
    if (r.status === "cancelled") return;
    if (residenceId !== undefined && r.start_at <= now) throw new DomainError("Past reservations cannot be cancelled.");
    db.prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?").run(id);
    // Void the fee only if nothing has been paid against it.
    db.prepare(
      `UPDATE charges SET status = 'void' WHERE reservation_id = ? AND status = 'pending'
       AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.charge_id = charges.id)`,
    ).run(id);
  });
}

export function listForAreaRange(areaId: number, from: string, daysCount: number): ReservationRow[] {
  return getDb()
    .prepare(`${SELECT} WHERE v.common_area_id = ? AND v.status = 'confirmed' AND v.start_at >= ? AND v.start_at < ? ORDER BY v.start_at`)
    .all(areaId, `${from}T00:00`, `${addDays(from, daysCount)}T00:00`) as ReservationRow[];
}

export function listUpcoming(opts: { residenceId?: number; areaId?: number; limit?: number }): ReservationRow[] {
  const where = ["v.status = 'confirmed'", "v.end_at > ?"];
  const params: (string | number)[] = [localNow()];
  if (opts.residenceId) { where.push("v.residence_id = ?"); params.push(opts.residenceId); }
  if (opts.areaId) { where.push("v.common_area_id = ?"); params.push(opts.areaId); }
  return getDb().prepare(`${SELECT} WHERE ${where.join(" AND ")} ORDER BY v.start_at LIMIT ?`).all(...params, opts.limit ?? 50) as ReservationRow[];
}
