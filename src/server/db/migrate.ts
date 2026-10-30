import type { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function migrate(db: DatabaseSync, dir = join(process.cwd(), "migrations")): string[] {
  db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))");
  const applied = new Set(
    (db.prepare("SELECT version FROM schema_migrations").all() as { version: string }[]).map((r) => r.version),
  );
  const ran: string[] = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (applied.has(file)) continue;
    db.exec("BEGIN");
    try {
      db.exec(readFileSync(join(dir, file), "utf8"));
      db.prepare("INSERT INTO schema_migrations (version) VALUES (?)").run(file);
      db.exec("COMMIT");
      ran.push(file);
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  }
  return ran;
}
