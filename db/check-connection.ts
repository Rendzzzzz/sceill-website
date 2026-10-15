// Runs before `db:push` and `db:studio`. drizzle-kit stops silently when it cannot reach
// the database, so this says in plain words what is wrong.
import { loadEnvConfig } from "@next/env"
import { Client } from "pg"
import { getConnectionOptions } from "./connection"

loadEnvConfig(process.cwd())

async function main() {
  let options
  try {
    options = getConnectionOptions()
  } catch (error) {
    return fail((error as Error).message)
  }

  const where = `${options.user}@${options.host}:${options.port}/${options.database}`
  const client = new Client({ ...options, connectionTimeoutMillis: 8000 })

  try {
    await client.connect()
    await client.query("select 1")
    console.log(`Database connection OK (${where})`)
  } catch (error) {
    const e = error as NodeJS.ErrnoException & { code?: string }
    const code = e.code ?? ""
    const user = options.user

    if (code === "ECONNREFUSED") {
      fail(
        `Cannot connect to ${options.host}:${options.port}. PostgreSQL is not running there.\n` +
          `  Start it:  LC_ALL=en_US.UTF-8 brew services start postgresql@16\n` +
          `  Check it:  pg_isready -h ${options.host} -p ${options.port}`
      )
    } else if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
      fail(`The database address "${options.host}" was not found. Check the host in DATABASE_URL, and your internet connection.`)
    } else if (code === "28000" || /role ".*" does not exist/.test(e.message)) {
      fail(
        `The database user "${user}" does not exist.\n` +
          `  DATABASE_URL in .env.local uses the user "${user}". On a local Homebrew PostgreSQL the user is your Mac username (run: whoami).\n` +
          `  Example:  DATABASE_URL=postgres://$(whoami)@localhost:5432/${options.database}\n` +
          `  List existing users:  psql -d postgres -c "\\du"`
      )
    } else if (code === "28P01") {
      fail(`The password for user "${user}" is wrong. Check DATABASE_URL (special characters must be URL-encoded: @ is %40, / is %2F).`)
    } else if (code === "3D000") {
      fail(`The database "${options.database}" does not exist yet. Create it:  createdb ${options.database}`)
    } else if (/self.signed|certificate|SSL/i.test(e.message)) {
      fail(`The encrypted connection was refused: ${e.message}\n  For a hosted database check DATABASE_CA (see docs/07-deployment.md).`)
    } else if (/pg_hba\.conf|encryption/i.test(e.message)) {
      fail(`The server requires an encrypted connection. Add ?sslmode=require to DATABASE_URL.`)
    } else if (/timeout/i.test(e.message)) {
      fail(`Timed out connecting to ${options.host}:${options.port}. Check the host and port, and that the database service is running.`)
    } else {
      fail(`Cannot connect to ${where}: ${e.message}`)
    }
  } finally {
    await client.end().catch(() => {})
  }
}

function fail(message: string): never {
  console.error(`\nDatabase problem: ${message}\n`)
  process.exit(1)
}

main()
