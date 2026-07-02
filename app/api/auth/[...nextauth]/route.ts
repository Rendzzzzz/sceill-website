// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
// Ubah import ke relative path
import { authOptions } from "../../../lib/auth"

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }