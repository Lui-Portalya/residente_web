"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { parseForm, type FormState } from "@/lib/validation/common";
import { loginSchema } from "@/lib/validation/schemas";
import { verifyPassword, hashPassword } from "@/server/auth/password";
import { createSession, destroySession } from "@/server/auth/session";
import { clearFailures, isLocked, recordFailure } from "@/server/auth/rate-limit";
import { findLoginUser } from "@/server/repos/users";

// Verified against when the email is unknown, so timing doesn't reveal which emails exist.
const DUMMY_HASH = hashPassword("dummy-password");

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(loginSchema, formData);
  if ("state" in parsed) return parsed.state;
  const { email, password } = parsed.data;

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const key = `${email.toLowerCase()}|${ip}`;
  if (isLocked(key)) return { error: "Too many attempts. Try again in a few minutes." };

  const user = findLoginUser(email);
  const ok = verifyPassword(password, user?.password_hash ?? DUMMY_HASH) && !!user;
  if (!user || !ok) {
    recordFailure(key);
    return { error: "Invalid email or password." };
  }
  clearFailures(key);
  await createSession(user.id);
  redirect(user.role === "admin" ? "/admin" : "/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
