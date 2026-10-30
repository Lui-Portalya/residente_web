import { openDb, type Db } from "./db/client";

/** Fresh in-memory DB installed as the process-wide singleton, for tests. */
export function freshDb(): Db {
  const db = openDb(":memory:");
  (globalThis as unknown as { __residenteDb?: Db }).__residenteDb = db;
  return db;
}

export function seedBasics(db: Db) {
  db.prepare("INSERT INTO users (id,email,name,password_hash,role) VALUES (1,'a@x.com','A','x','resident'),(2,'b@x.com','B','x','resident')").run();
  db.prepare("INSERT INTO residences (id,code,monthly_fee_cents) VALUES (1,'A-1',10000),(2,'A-2',20000)").run();
  db.prepare("INSERT INTO common_areas (id,name,open_time,close_time,slot_minutes,fee_cents) VALUES (1,'Pool','08:00','12:00',60,500),(2,'Park','08:00','12:00',60,0)").run();
}
