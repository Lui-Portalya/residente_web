"use server";

import { revalidatePath } from "next/cache";
import { attempt } from "@/server/action-utils";
import { requireAdmin } from "@/server/auth/guard";
import { createUser, resetPassword, updateUser } from "@/server/repos/users";
import { parseForm, type FormState } from "@/lib/validation/common";
import { passwordResetSchema, userCreateSchema, userUpdateSchema } from "@/lib/validation/schemas";

export async function createUserAction(_p: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseForm(userCreateSchema, fd);
  if ("state" in parsed) return parsed.state;
  const res = attempt(() => { createUser(parsed.data); return "User created."; });
  revalidatePath("/admin/users");
  return res;
}

export async function updateUserAction(_p: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = parseForm(userUpdateSchema, fd);
  if ("state" in parsed) return parsed.state;
  const res = attempt(() => updateUser(parsed.data, admin.id));
  revalidatePath("/admin/users");
  return res;
}

export async function resetPasswordAction(_p: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseForm(passwordResetSchema, fd);
  if ("state" in parsed) return parsed.state;
  return attempt(() => { resetPassword(parsed.data.id, parsed.data.password); return "Password reset; user was signed out."; });
}
