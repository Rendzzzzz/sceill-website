import { NextResponse } from "next/server"
import {
  PROVINCE_ID,
  REGENCY_ID,
  getDistricts,
  getProvinces,
  getRegencies,
} from "../../lib/regions"

// GET /api/regions?type=provinces
// GET /api/regions?type=regencies&parent=<provinceId>
// GET /api/regions?type=districts&parent=<regencyId>
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const parent = searchParams.get("parent") ?? ""

  let items = null
  if (type === "provinces") items = getProvinces()
  else if (type === "regencies" && PROVINCE_ID.test(parent)) items = getRegencies(parent)
  else if (type === "districts" && REGENCY_ID.test(parent)) items = getDistricts(parent)
  else return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  if (!items) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // the data never changes between deploys, so let browsers and the CDN keep it
  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } }
  )
}
