import { z } from "zod";
import { checkbox, date, id, money, time } from "./common";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.email("Enter a valid email"),
  role: z.enum(["admin", "resident"]),
  password: z.string().min(8, "At least 8 characters"),
  residenceId: z.preprocess((v) => (v === "" ? undefined : v), id.optional()),
});

export const userUpdateSchema = z.object({
  id,
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.email("Enter a valid email"),
  role: z.enum(["admin", "resident"]),
  active: checkbox,
  residenceId: z.preprocess((v) => (v === "" ? undefined : v), id.optional()),
});

export const passwordResetSchema = z.object({ id, password: z.string().min(8, "At least 8 characters") });

export const residenceSchema = z.object({
  id: z.preprocess((v) => (v === "" ? undefined : v), id.optional()),
  code: z.string().trim().min(1, "Code is required").max(30),
  address: z.string().trim().max(200).default(""),
  monthlyFee: money,
  notes: z.string().trim().max(500).default(""),
  active: checkbox,
});

export const generateChargesSchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM"),
  dueDate: date,
});

export const areaSchema = z
  .object({
    id: z.preprocess((v) => (v === "" ? undefined : v), id.optional()),
    name: z.string().trim().min(1, "Name is required").max(80),
    description: z.string().trim().max(500).default(""),
    capacity: z.coerce.number().int().min(0).max(100000),
    openTime: time,
    closeTime: time,
    slotMinutes: z.coerce.number().int().min(15).max(1440),
    fee: money,
    active: checkbox,
  })
  .refine((a) => a.closeTime > a.openTime, { path: ["closeTime"], message: "Must be after opening time" });

export const reservationSchema = z.object({
  areaId: id,
  date,
  start: time,
});

export const paymentSchema = z.object({
  chargeId: id,
  amount: money,
  method: z.enum(["cash", "transfer", "card", "other"]),
  reference: z.string().trim().max(100).default(""),
  paidAt: date,
  note: z.string().trim().max(300).default(""),
});
