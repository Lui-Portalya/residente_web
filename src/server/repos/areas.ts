import { getDb } from "../db/client";
import { DomainError } from "./errors";

export type AreaRow = {
  id: number;
  name: string;
  description: string;
  capacity: number;
  open_time: string;
  close_time: string;
  slot_minutes: number;
  fee_cents: number;
  active: number;
};

export function listAreas(onlyActive = false): AreaRow[] {
  return getDb()
    .prepare(`SELECT * FROM common_areas ${onlyActive ? "WHERE active = 1" : ""} ORDER BY name`)
    .all() as AreaRow[];
}

export function getArea(id: number): AreaRow | undefined {
  return getDb().prepare("SELECT * FROM common_areas WHERE id = ?").get(id) as AreaRow | undefined;
}

export function saveArea(input: {
  id?: number; name: string; description: string; capacity: number; openTime: string; closeTime: string;
  slotMinutes: number; fee: number; active: boolean;
}): void {
  const db = getDb();
  if (db.prepare("SELECT 1 FROM common_areas WHERE name = ? AND id != ?").get(input.name, input.id ?? 0)) {
    throw new DomainError("An area with that name already exists.");
  }
  const vals = [input.name, input.description, input.capacity, input.openTime, input.closeTime, input.slotMinutes, input.fee, input.active ? 1 : 0] as const;
  if (input.id) {
    db.prepare("UPDATE common_areas SET name=?, description=?, capacity=?, open_time=?, close_time=?, slot_minutes=?, fee_cents=?, active=? WHERE id=?").run(...vals, input.id);
  } else {
    db.prepare("INSERT INTO common_areas (name, description, capacity, open_time, close_time, slot_minutes, fee_cents, active) VALUES (?,?,?,?,?,?,?,?)").run(...vals);
  }
}
