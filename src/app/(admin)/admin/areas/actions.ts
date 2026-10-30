"use server";

import { revalidatePath } from "next/cache";
import { attempt } from "@/server/action-utils";
import { requireAdmin } from "@/server/auth/guard";
import { saveArea } from "@/server/repos/areas";
import { cancelReservation } from "@/server/repos/reservations";
import { parseForm, type FormState } from "@/lib/validation/common";
import { areaSchema } from "@/lib/validation/schemas";

export async function saveAreaAction(_p: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseForm(areaSchema, fd);
  if ("state" in parsed) return parsed.state;
  const res = attempt(() => saveArea(parsed.data));
  revalidatePath("/admin/areas");
  return res;
}

export async function adminCancelReservationAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(fd.get("id"));
  if (Number.isInteger(id) && id > 0) cancelReservation(id);
  revalidatePath("/admin/areas");
}
