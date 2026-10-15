// app/lib/auth.ts
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import {
  findCustomerByEmail,
  findCustomerById,
  findOrCreateOAuthCustomer,
  getPasswordHash,
  verifyPassword,
} from "./customers"
import { loginSchema } from "./validations/auth"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null
        const { email, password } = parsed.data

        const customer = await findCustomerByEmail(email)
        const hash = customer ? await getPasswordHash(customer.id) : null

        // verifyPassword runs a comparison even when there is no account,
        // so response time does not reveal which emails are registered
        const valid = await verifyPassword(password, hash)
        if (!customer || !valid) return null

        return { id: customer.id, email: customer.email, name: customer.name }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true
      if (!user.email) return false

      // make sure a customers row exists for the Google/Apple account
      await findOrCreateOAuthCustomer({ email: user.email, name: user.name })
      return true
    },
    async jwt({ token, user, trigger }) {
      // the profile page calls update() after a name change; re-read it from the
      // database instead of trusting whatever the browser sent
      if (trigger === "update" && token.id) {
        const customer = await findCustomerById(token.id)
        if (customer?.name) token.name = customer.name
        return token
      }

      // `user` is only present on the sign-in request. Store our own customer
      // id and role in the token (a provider's user.id is not our customers.id).
      if (user?.email) {
        const customer = await findCustomerByEmail(user.email)
        if (customer) {
          token.id = customer.id
          token.role = customer.role || "user"
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? ""
        session.user.role = token.role ?? "user"
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 14,
  },
}
