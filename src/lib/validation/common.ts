import { z } from "zod";

export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export function parseForm<S extends z.ZodType>(
  schema: S,
  formData: FormData,
): { data: z.output<S> } | { state: FormState } {
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") raw[k] = v;
  const res = schema.safeParse(raw);
  if (res.success) return { data: res.data };
  return { state: { error: "Please fix the highlighted fields.", fieldErrors: z.flattenError(res.error).fieldErrors } };
}

export const money = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter an amount like 25.00")
  .transform((s) => Math.round(Number(s) * 100));
export const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");
export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
export const checkbox = z.preprocess((v) => v === "on" || v === "1" || v === "true", z.boolean());
export const id = z.coerce.number().int().positive();
