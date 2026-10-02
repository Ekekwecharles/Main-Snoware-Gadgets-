import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Neon's pool driver talks to Postgres over WebSockets (needed for transactions).
// Use the `ws` package — Node's built-in WebSocket fails inside the Next.js server bundle.
neonConfig.webSocketConstructor = ws;

const globalForDb = globalThis as unknown as { pool?: Pool };

if (!process.env.DATABASE_URL && process.env.NEXT_PHASE !== "phase-production-build") {
  console.warn("\n⚠️  DATABASE_URL is not set — copy .env.example to .env.local and add your Neon connection string.\n");
}

// The pool connects lazily on first query, so a missing URL only fails when the DB is actually used.
const pool = (globalForDb.pool ??= new Pool({ connectionString: process.env.DATABASE_URL }));

export const db = drizzle({ client: pool, schema });

export { schema };
