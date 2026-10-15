// Server-only PostgreSQL connection. Never import this from a "use client" file.
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "../../../db/schema"
import { getConnectionOptions } from "../../../db/connection"

type Database = ReturnType<typeof createDatabase>

// One pool for the whole process. In `next dev` modules reload constantly, so
// the pool is kept on globalThis to avoid opening a new set of connections each time.
const globalForDb = globalThis as unknown as { pgPool?: Pool; drizzleDb?: Database }

function createPool() {
  const pool = new Pool({
    ...getConnectionOptions(),
    // On Vercel every serverless instance gets its own pool, and many instances can
    // run at once. Keep each one small so a modest hosted database is not overwhelmed.
    max: process.env.VERCEL ? 2 : 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  })
  // an idle connection dropped by the server must not crash the process
  pool.on("error", (error) => console.error("postgres pool error", error.message))
  return pool
}

function createDatabase() {
  return drizzle((globalForDb.pgPool ??= createPool()), { schema })
}

// The connection is opened on first use, not when this file is loaded. `next build`
// loads every route file to inspect it; if DATABASE_URL were required at that moment, a
// build without the variable would crash with a confusing message. Now the build passes
// and the first real query reports "DATABASE_URL is not set" clearly.
export const db = new Proxy({} as Database, {
  get(_target, property) {
    const instance = (globalForDb.drizzleDb ??= createDatabase())
    const value = Reflect.get(instance, property)
    return typeof value === "function" ? value.bind(instance) : value
  },
})

export * from "../../../db/schema"
