import type { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { migrate } from "./migrate.ts";

// Loaded through getBuiltinModule so bundlers never try to resolve "node:sqlite".
const sqlite = process.getBuiltinModule("node:sqlite");

export type Db = DatabaseSync;

export function openDb(path: string): Db {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new sqlite.DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 5000");
  if (path !== ":memory:") db.exec("PRAGMA journal_mode = WAL");
  migrate(db);
  return db;
}

const g = globalThis as unknown as { __residenteDb?: Db };

export function getDb(): Db {
  g.__residenteDb ??= openDb(resolve(process.env.DATABASE_PATH ?? "./data/residente.db"));
  return g.__residenteDb;
}

/** Runs fn inside BEGIN IMMEDIATE so concurrent writers serialize. */
export function tx<T>(db: Db, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const out = fn();
    db.exec("COMMIT");
    return out;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
