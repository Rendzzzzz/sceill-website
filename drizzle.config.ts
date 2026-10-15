import { defineConfig } from "drizzle-kit"
import { loadEnvConfig } from "@next/env"
import { getConnectionOptions } from "./db/connection"

// drizzle-kit does not read .env.local on its own, so load it the way Next does
loadEnvConfig(process.cwd())

const options = getConnectionOptions()

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  // drizzle-kit exits silently when given separate options without a password (a
  // local Mac setup), so use the plain URL unless TLS settings are needed
  dbCredentials: "ssl" in options ? { ...options, database: options.database } : { url: process.env.DATABASE_URL! },
})
