import { NextResponse } from "next/server"
import { registerSchema } from "../../lib/validations/auth"
import { resolveRegion } from "../../lib/regions"
import {
  createCustomerWithPassword,
  findCustomerByEmail,
  hashPassword,
  isDuplicateError,
} from "../../lib/customers"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form")
      fieldErrors[key] ??= issue.message
    }
    return NextResponse.json({ error: "Please check your details", fieldErrors }, { status: 400 })
  }

  const { name, email, password, provinceId, regencyId, districtId, address } = parsed.data

  // the district must really belong to the chosen city and province
  const region = resolveRegion({ provinceId, regencyId, districtId })
  if (!region) {
    return NextResponse.json(
      {
        error: "Please check your details",
        fieldErrors: { districtId: "This district does not match the selected city and province" },
      },
      { status: 400 }
    )
  }

  const exists = {
    error: "An account with this email already exists. Try signing in instead.",
    fieldErrors: { email: "This email is already registered" },
  }

  try {
    if (await findCustomerByEmail(email)) {
      return NextResponse.json(exists, { status: 409 })
    }

    const customer = await createCustomerWithPassword({
      name,
      email,
      passwordHash: await hashPassword(password),
      address: {
        address,
        province: region.province.name,
        city: region.regency.name,
        district: region.district.name,
        provinceCode: region.province.id,
        cityCode: region.regency.id,
        districtCode: region.district.id,
      },
    })
    return NextResponse.json({ id: customer.id, email: customer.email }, { status: 201 })
  } catch (error) {
    // the unique email index caught two sign-ups with the same email racing each other
    if (isDuplicateError(error)) {
      return NextResponse.json(exists, { status: 409 })
    }
    console.error("register failed", error)
    return NextResponse.json(
      { error: "We could not create your account right now. Please try again." },
      { status: 500 }
    )
  }
}
