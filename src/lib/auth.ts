import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "ERPNext",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const baseUrl = process.env.ERPNEXT_BASE_URL
        if (!baseUrl) {
          console.error("[auth] ERPNEXT_BASE_URL is not configured")
          return null
        }

        try {
          const res = await fetch(`${baseUrl}/api/method/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              usr: credentials.email,
              pwd: credentials.password,
            }),
          })

          if (!res.ok) return null

          const data = await res.json()

          // ERPNext returns { message: "Logged In", full_name: "...", home_page: "..." }
          const loggedIn =
            data?.message === "Logged In" ||
            (typeof data?.message === "string" &&
              data.message.toLowerCase().includes("logged"))

          if (!loggedIn) return null

          return {
            id: credentials.email,
            email: credentials.email,
            name: (data.full_name as string | undefined) ?? credentials.email,
          }
        } catch (err) {
          console.error("[auth] ERPNext login error:", err)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8-hour garage shift
  },
  pages: {
    signIn: "/portal",
    error: "/portal",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}
