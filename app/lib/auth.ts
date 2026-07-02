// app/lib/auth.ts
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import { supabase } from "./supabase/client"

export const authOptions: NextAuthOptions = {
  providers: [
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
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        const { data: customer } = await supabase
          .from('customers')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (customer) {
          session.user.role = customer.role || 'user'
        }
      }
      return session
    },
    async signIn({ user, account }) {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (!existing) {
        await supabase
          .from('customers')
          .insert({
            id: user.id,
            email: user.email,
            name: user.name,
          })
      }
      return true
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
  },
}