import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("verifies the right password only", () => {
    const h = hashPassword("s3cret-pass");
    expect(verifyPassword("s3cret-pass", h)).toBe(true);
    expect(verifyPassword("wrong", h)).toBe(false);
  });
  it("salts hashes and rejects malformed values", () => {
    expect(hashPassword("a")).not.toBe(hashPassword("a"));
    expect(verifyPassword("a", "garbage")).toBe(false);
  });
});
