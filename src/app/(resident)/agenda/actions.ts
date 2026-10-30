"use server";

import { revalidatePath } from "next/cache";
import { attempt } from "@/server/action-utils";
import { requireResident } from "@/server/auth/guard";
import { DomainError } from "@/server/repos/errors";
import { cancelReservation, createReservation } from "@/server/repos/reservations";
import { parseForm, type FormState } from "@/lib/validation/common";
import { reservationSchema } from "@/lib/validation/schemas";

export async function reserveAction(_p: FormState, fd: FormData): Promise<FormState> {
  const { user, residence } = await requireResident();
  const parsed = parseForm(reservationSchema, fd);
  if ("state" in parsed) return parsed.state;
  const res = attempt(() => {
    if (!residence) throw new DomainError("No residence assigned.");
    createReservation({ ...parsed.data, residenceId: residence.id, userId: user.id });
    return "Booked.";
  });
  revalidatePath("/agenda");
  revalidatePath("/");
  return res;
}

export async function cancelOwnReservationAction(fd: FormData): Promise<void> {
  const { residence } = await requireResident();
  const id = Number(fd.get("id"));
  if (!residence || !Number.isInteger(id) || id <= 0) return;
  try { cancelReservation(id, residence.id); } catch (e) { if (!(e instanceof DomainError)) throw e; }
  revalidatePath("/agenda");
  revalidatePath("/");
}
