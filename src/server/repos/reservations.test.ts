import { beforeEach, describe, expect, it } from "vitest";
import { freshDb, seedBasics } from "../test-db";
import { cancelReservation, createReservation } from "./reservations";
import type { Db } from "../db/client";

const NOW = "2030-01-01T07:00";
let db: Db;
const book = (o: Partial<{ areaId: number; residenceId: number; date: string; start: string }> = {}) =>
  createReservation({ areaId: 1, residenceId: 1, userId: 1, date: "2030-01-02", start: "09:00", ...o }, db, NOW);

beforeEach(() => { db = freshDb(); seedBasics(db); });

describe("reservations", () => {
  it("books a slot and creates a fee charge", () => {
    const id = book();
    const c = db.prepare("SELECT amount_cents, type FROM charges WHERE reservation_id = ?").get(id);
    expect(c).toMatchObject({ amount_cents: 500, type: "common_area" });
  });
  it("creates no charge for free areas", () => {
    book({ areaId: 2 });
    expect(db.prepare("SELECT COUNT(*) AS n FROM charges").get()).toMatchObject({ n: 0 });
  });
  it("rejects double booking but allows other areas/slots", () => {
    book();
    expect(() => book({ residenceId: 2 })).toThrow(/already booked/);
    expect(() => book({ start: "10:00" })).not.toThrow();
    expect(() => book({ areaId: 2 })).not.toThrow();
  });
  it("rejects out-of-hours, misaligned and past slots", () => {
    expect(() => book({ start: "07:00" })).toThrow(/slot/);
    expect(() => book({ start: "11:30" })).toThrow(/slot/);
    expect(() => book({ start: "12:00" })).toThrow(/slot/);
    expect(() => book({ date: "2029-12-31" })).toThrow(/future/);
  });
  it("cancel frees the slot, voids the unpaid fee, and is scoped to the owner", () => {
    const id = book();
    expect(() => cancelReservation(id, 2, db, NOW)).toThrow(/not found/);
    cancelReservation(id, 1, db, NOW);
    expect(db.prepare("SELECT status FROM charges WHERE reservation_id = ?").get(id)).toMatchObject({ status: "void" });
    expect(() => book({ residenceId: 2 })).not.toThrow();
  });
});
