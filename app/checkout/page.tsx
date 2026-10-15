import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "../lib/auth"
import { getProfile } from "../lib/profile"
import { CheckoutClient } from "./CheckoutClient"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login?callbackUrl=/checkout")

  const profile = await getProfile(session.user.id)
  if (!profile) redirect("/login")

  return (
    <CheckoutClient
      customer={{
        name: profile.name || profile.email,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        district: profile.district,
        city: profile.city,
        province: profile.province,
        postalCode: profile.postalCode,
      }}
    />
  )
}
