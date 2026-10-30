import { beforeEach, describe, expect, it } from "vitest";
import { freshDb, seedBasics } from "../test-db";
import { balanceCents, listCharges, registerPayment } from "./payments";
import { generateMaintenanceCharges } from "./residences";
import type { Db } from "../db/client";

let db: Db;
const pay = (o: Partial<{ residenceId: number; chargeId: number; amount: number }> = {}) =>
  registerPayment({ residenceId: 1, userId: 1, chargeId: 1, amount: 10000, method: "cash", reference: "", paidAt: "2030-01-01", note: "", ...o }, db);

beforeEach(() => { db = freshDb(); seedBasics(db); });

describe("maintenance charges", () => {
  it("generates once per residence and period (idempotent)", () => {
    expect(generateMaintenanceCharges("2030-01", "2030-01-10")).toBe(2);
    expect(generateMaintenanceCharges("2030-01", "2030-01-10")).toBe(0);
    expect(generateMaintenanceCharges("2030-02", "2030-02-10")).toBe(2);
  });
});

describe("payments", () => {
  beforeEach(() => { generateMaintenanceCharges("2030-01", "2030-01-10"); });

  it("full payment marks the charge paid", () => {
    pay();
    expect(listCharges(1, "paid")).toHaveLength(1);
    expect(balanceCents(1)).toBe(0);
  });
  it("partial payments reduce the balance until settled", () => {
    pay({ amount: 4000 });
    expect(balanceCents(1)).toBe(6000);
    expect(() => pay({ amount: 7000 })).toThrow(/Amount must be/);
    pay({ amount: 6000 });
    expect(listCharges(1, "pending")).toHaveLength(0);
  });
  it("cannot pay another residence's charge or a paid charge", () => {
    expect(() => pay({ residenceId: 2 })).toThrow(/not found/);
    pay();
    expect(() => pay()).toThrow(/not payable/);
  });
});
