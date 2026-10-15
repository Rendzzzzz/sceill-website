import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "../../lib/auth"
import { getProfile } from "../../lib/profile"
import { ProfileForms } from "./ProfileForms"

export const metadata: Metadata = {
  title: "My profile",
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login?callbackUrl=/user/profile")

  const profile = await getProfile(session.user.id)
  // signed in with a token whose account no longer exists (e.g. it was deleted)
  if (!profile) redirect("/login")

  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
  const initial = (profile.name || profile.email).charAt(0).toUpperCase()

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <header className="flex items-center gap-5">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-ink font-display text-4xl text-cream"
          aria-hidden="true"
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-dark">My account</p>
          <h1 className="truncate text-4xl leading-tight sm:text-5xl">{profile.name || "Your profile"}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted">
            <span className="truncate">{profile.email}</span>
            <span>Member since {memberSince}</span>
            {profile.role === "admin" && (
              <span className="rounded-md bg-gold px-2 py-0.5 text-[10px] uppercase tracking-widest text-white">
                Admin
              </span>
            )}
          </p>
        </div>
      </header>

      {!profile.address && (
        <p className="mt-8 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm" role="status">
          Add your delivery address below so you can check out.
        </p>
      )}

      <ProfileForms profile={profile} />
    </main>
  )
}
