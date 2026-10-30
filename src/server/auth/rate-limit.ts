import { getDb } from "../db/client";

const WINDOW_SECONDS = 15 * 60;
const MAX_FAILURES = 5;

const now = () => Math.floor(Date.now() / 1000);

export function isLocked(key: string): boolean {
  const db = getDb();
  db.prepare("DELETE FROM login_attempts WHERE at < ?").run(now() - WINDOW_SECONDS);
  const row = db.prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE key = ?").get(key) as { n: number };
  return row.n >= MAX_FAILURES;
}

export function recordFailure(key: string): void {
  getDb().prepare("INSERT INTO login_attempts (key, at) VALUES (?, ?)").run(key, now());
}

export function clearFailures(key: string): void {
  getDb().prepare("DELETE FROM login_attempts WHERE key = ?").run(key);
}
