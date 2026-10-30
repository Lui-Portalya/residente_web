import { resolve } from "node:path";
import { openDb } from "../src/server/db/client.ts";

openDb(resolve(process.env.DATABASE_PATH ?? "./data/residente.db"));
console.log("Database is up to date.");
