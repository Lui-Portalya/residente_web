"use server";

import { revalidatePath } from "next/cache";
import { attempt } from "@/server/action-utils";
import { requireResident } from "@/server/auth/guard";
import { DomainError } from "@/server/repos/errors";
import { registerPayment } from "@/server/repos/payments";
import { parseForm, type FormState } from "@/lib/validation/common";
import { paymentSchema } from "@/lib/validation/schemas";
import { today } from "@/lib/dates";

export async function registerPaymentAction(_p: FormState, fd: FormData): Promise<FormState> {
  const { user, residence } = await requireResident();
  const parsed = parseForm(paymentSchema, fd);
  if ("state" in parsed) return parsed.state;
  const res = attempt(() => {
    if (!residence) throw new DomainError("No residence assigned.");
    if (parsed.data.paidAt > today()) throw new DomainError("Payment date cannot be in the future.");
    registerPayment({ ...parsed.data, residenceId: residence.id, userId: user.id });
    return "Payment registered.";
  });
  revalidatePath("/payments");
  revalidatePath("/");
  return res;
}
