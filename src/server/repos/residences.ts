import { getDb, tx } from "../db/client";
import { DomainError } from "./errors";

export type ResidenceRow = {
  id: number;
  code: string;
  address: string;
  monthly_fee_cents: number;
  notes: string;
  active: number;
  residents: number;
};

export function listResidences(): ResidenceRow[] {
  return getDb()
    .prepare(
      `SELECT r.*, (SELECT COUNT(*) FROM residence_residents rr WHERE rr.residence_id = r.id) AS residents
       FROM residences r ORDER BY r.code`,
    )
    .all() as ResidenceRow[];
}

export function getResidence(id: number): ResidenceRow | undefined {
  return listResidences().find((r) => r.id === id);
}

export function saveResidence(input: { id?: number; code: string; address: string; monthlyFee: number; notes: string; active: boolean }): void {
  const db = getDb();
  const dup = db.prepare("SELECT 1 FROM residences WHERE code = ? AND id != ?").get(input.code, input.id ?? 0);
  if (dup) throw new DomainError("A residence with that code already exists.");
  if (input.id) {
    db.prepare("UPDATE residences SET code=?, address=?, monthly_fee_cents=?, notes=?, active=? WHERE id=?").run(
      input.code, input.address, input.monthlyFee, input.notes, input.active ? 1 : 0, input.id,
    );
  } else {
    db.prepare("INSERT INTO residences (code, address, monthly_fee_cents, notes, active) VALUES (?,?,?,?,?)").run(
      input.code, input.address, input.monthlyFee, input.notes, input.active ? 1 : 0,
    );
  }
}

export function deleteResidence(id: number): void {
  const db = getDb();
  tx(db, () => {
    const used = db
      .prepare(
        `SELECT (SELECT COUNT(*) FROM charges WHERE residence_id = ?) + (SELECT COUNT(*) FROM reservations WHERE residence_id = ?)
         + (SELECT COUNT(*) FROM residence_residents WHERE residence_id = ?) AS n`,
      )
      .get(id, id, id) as { n: number };
    if (used.n > 0) throw new DomainError("Residence has residents or history. Deactivate it instead.");
    db.prepare("DELETE FROM residences WHERE id = ?").run(id);
  });
}

/** Idempotent: residences that already have a charge for the period are skipped. */
export function generateMaintenanceCharges(period: string, dueDate: string): number {
  const res = getDb()
    .prepare(
      `INSERT OR IGNORE INTO charges (residence_id, type, period, description, amount_cents, due_date)
       SELECT id, 'maintenance', ?, 'Maintenance ' || ?, monthly_fee_cents, ?
       FROM residences WHERE active = 1 AND monthly_fee_cents > 0`,
    )
    .run(period, period, dueDate);
  return Number(res.changes);
}
