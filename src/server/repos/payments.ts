import { getDb, tx, type Db } from "../db/client";
import { DomainError } from "./errors";

export type ChargeRow = {
  id: number;
  type: "maintenance" | "common_area";
  description: string;
  amount_cents: number;
  paid_cents: number;
  due_date: string;
  status: "pending" | "paid" | "void";
};

const CHARGE_SELECT = `SELECT c.id, c.type, c.description, c.amount_cents, c.due_date, c.status,
  COALESCE((SELECT SUM(p.amount_cents) FROM payments p WHERE p.charge_id = c.id), 0) AS paid_cents FROM charges c`;

export function listCharges(residenceId: number, status?: "pending" | "paid"): ChargeRow[] {
  return getDb()
    .prepare(`${CHARGE_SELECT} WHERE c.residence_id = ? ${status ? "AND c.status = ?" : "AND c.status != 'void'"} ORDER BY c.due_date DESC, c.id DESC`)
    .all(...(status ? [residenceId, status] : [residenceId])) as ChargeRow[];
}

export function balanceCents(residenceId: number): number {
  return listCharges(residenceId, "pending").reduce((s, c) => s + c.amount_cents - c.paid_cents, 0);
}

export type PaymentRow = {
  id: number;
  charge_description: string;
  amount_cents: number;
  method: string;
  reference: string;
  paid_at: string;
};

export function listPayments(residenceId: number, limit = 50): PaymentRow[] {
  return getDb()
    .prepare(
      `SELECT p.id, c.description AS charge_description, p.amount_cents, p.method, p.reference, p.paid_at
       FROM payments p JOIN charges c ON c.id = p.charge_id WHERE p.residence_id = ? ORDER BY p.paid_at DESC, p.id DESC LIMIT ?`,
    )
    .all(residenceId, limit) as PaymentRow[];
}

export function registerPayment(
  input: { residenceId: number; userId: number; chargeId: number; amount: number; method: string; reference: string; paidAt: string; note: string },
  db: Db = getDb(),
): void {
  tx(db, () => {
    const charge = db
      .prepare(`${CHARGE_SELECT} WHERE c.id = ? AND c.residence_id = ?`)
      .get(input.chargeId, input.residenceId) as ChargeRow | undefined;
    if (!charge) throw new DomainError("Charge not found.");
    if (charge.status !== "pending") throw new DomainError("That charge is not payable.");
    const remaining = charge.amount_cents - charge.paid_cents;
    if (input.amount <= 0 || input.amount > remaining) {
      throw new DomainError(`Amount must be between 0.01 and the remaining balance (${(remaining / 100).toFixed(2)}).`);
    }
    db.prepare(
      "INSERT INTO payments (charge_id, residence_id, registered_by, amount_cents, method, reference, paid_at, note) VALUES (?,?,?,?,?,?,?,?)",
    ).run(input.chargeId, input.residenceId, input.userId, input.amount, input.method, input.reference, input.paidAt, input.note);
    if (input.amount === remaining) db.prepare("UPDATE charges SET status = 'paid' WHERE id = ?").run(input.chargeId);
  });
}
