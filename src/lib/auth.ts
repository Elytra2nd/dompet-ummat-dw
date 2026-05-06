import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { prisma } = await import("@/lib/prisma")

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isMatch = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isMatch) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Jika URL relatif, gabungkan dengan baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Jika URL sudah absolute dan dari domain yang sama, izinkan
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string;
        (session.user as any).id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  }
}

/**
 * Standardized bcrypt rounds — use this constant everywhere instead of magic numbers.
 */
export const BCRYPT_ROUNDS = 12

/**
 * Sanitize error for client response.
 * Logs full error server-side, returns generic message to client.
 */
export function handleApiError(error: unknown, context: string): { message: string; status: number } {
  const msg = error instanceof Error ? error.message : String(error)
  console.error(`[API Error] ${context}:`, msg)

  // Prisma unique constraint violation — safe to expose
  if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2002') {
    return { message: 'Data sudah ada (duplikat)', status: 400 }
  }

  return { message: 'Terjadi kesalahan server', status: 500 }
}