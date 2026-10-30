import { describe, expect, it } from "vitest";
import { areaSchema, paymentSchema, residenceSchema } from "./schemas";
import { parseMoney } from "../money";

describe("schemas", () => {
  it("converts money strings to cents", () => {
    const r = residenceSchema.parse({ code: "A1", monthlyFee: "12.5" });
    expect(r.monthlyFee).toBe(1250);
    expect(parseMoney("0.07")).toBe(7);
    expect(residenceSchema.safeParse({ code: "A1", monthlyFee: "-3" }).success).toBe(false);
  });
  it("area closing must be after opening", () => {
    const base = { name: "Pool", capacity: "5", slotMinutes: "60", fee: "0" };
    expect(areaSchema.safeParse({ ...base, openTime: "10:00", closeTime: "09:00" }).success).toBe(false);
    expect(areaSchema.safeParse({ ...base, openTime: "08:00", closeTime: "09:00" }).success).toBe(true);
  });
  it("payment rejects unknown methods", () => {
    const ok = { chargeId: "1", amount: "5", method: "cash", paidAt: "2030-01-01" };
    expect(paymentSchema.safeParse(ok).success).toBe(true);
    expect(paymentSchema.safeParse({ ...ok, method: "bitcoin" }).success).toBe(false);
  });
});
