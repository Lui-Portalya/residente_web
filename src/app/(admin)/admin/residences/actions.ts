"use server";

import { revalidatePath } from "next/cache";
import { attempt } from "@/server/action-utils";
import { requireAdmin } from "@/server/auth/guard";
import { deleteResidence, generateMaintenanceCharges, saveResidence } from "@/server/repos/residences";
import { parseForm, type FormState } from "@/lib/validation/common";
import { generateChargesSchema, residenceSchema } from "@/lib/validation/schemas";

export async function saveResidenceAction(_p: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseForm(residenceSchema, fd);
  if ("state" in parsed) return parsed.state;
  const res = attempt(() => saveResidence(parsed.data));
  revalidatePath("/admin/residences");
  return res;
}

export async function deleteResidenceAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(fd.get("id"));
  if (Number.isInteger(id) && id > 0) {
    try { deleteResidence(id); } catch { /* has history: stays; admin can deactivate */ }
  }
  revalidatePath("/admin/residences");
}

export async function generateChargesAction(_p: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseForm(generateChargesSchema, fd);
  if ("state" in parsed) return parsed.state;
  const res = attempt(() => {
    const n = generateMaintenanceCharges(parsed.data.period, parsed.data.dueDate);
    return `${n} charge(s) created for ${parsed.data.period}.`;
  });
  revalidatePath("/admin/residences");
  return res;
}
