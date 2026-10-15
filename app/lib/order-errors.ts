import { NextResponse } from "next/server"
import { OrderError } from "./orders"

// Known problems (sold out, wrong status...) are explained to the visitor; anything
// unexpected is logged and reported as a generic failure.
export function orderErrorResponse(error: unknown, action: string) {
  if (error instanceof OrderError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  console.error(`${action} failed`, error)
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
}
