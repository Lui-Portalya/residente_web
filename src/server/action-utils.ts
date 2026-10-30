import { DomainError } from "./repos/errors";
import type { FormState } from "@/lib/validation/common";

/** Runs a mutation, turning DomainErrors into form state and letting anything else surface. */
export function attempt(fn: () => string | void): FormState {
  try {
    return { ok: true, message: fn() ?? "Saved." };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}
