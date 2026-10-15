// The signed-in customer's own profile. The id always comes from the session,
// never from the request, so nobody can read or change someone else's record.
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { authOptions } from "../../lib/auth"
import { customers, db } from "../../lib/db"
import { getProfile } from "../../lib/profile"
import { resolveRegion } from "../../lib/regions"
import { validationError } from "../../lib/admin"
import { addressSchema, personalSchema } from "../../lib/validations/profile"

async function currentCustomerId() {
  const session = await getServerSession(authOptions)
  return session?.user.id || null
}

export async function GET() {
  const id = await currentCustomerId()
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await getProfile(id)
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(profile)
}

// Either the personal details or the delivery address, chosen with "section".
// email and role can never be changed here.
const bodySchema = z.discriminatedUnion("section", [
  z.object({ section: z.literal("personal") }).extend(personalSchema.shape),
  z.object({ section: z.literal("address") }).extend(addressSchema.shape),
])

export async function PUT(request: Request) {
  const id = await currentCustomerId()
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error.issues)
  const data = parsed.data

  if (data.section === "personal") {
    await db
      .update(customers)
      .set({ name: data.name, phone: data.phone || null })
      .where(eq(customers.id, id))
  } else {
    // the district must really belong to the chosen city and province; names come from our data
    const region = resolveRegion(data)
    if (!region) {
      return NextResponse.json(
        { error: "districtId: This district does not match the selected city and province" },
        { status: 400 }
      )
    }
    await db
      .update(customers)
      .set({
        address: data.address,
        province: region.province.name,
        city: region.regency.name,
        district: region.district.name,
        provinceCode: region.province.id,
        cityCode: region.regency.id,
        districtCode: region.district.id,
        postalCode: data.postalCode || null,
      })
      .where(eq(customers.id, id))
  }

  const profile = await getProfile(id)
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(profile)
}
