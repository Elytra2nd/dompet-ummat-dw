import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 1. Validasi keberadaan credentials untuk mengatasi error 'possibly undefined'
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // 2. Cari user berdasarkan email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        // 3. Jika user tidak ditemukan atau password belum diset
        if (!user || !user.password) {
          return null
        }

        // 4. Bandingkan password menggunakan bcrypt
        const isMatch = await bcrypt.compare(
          credentials.password as string, 
          user.password
        )
        
        if (!isMatch) return null

        // 5. Kembalikan data user yang diperlukan (akan masuk ke JWT)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role, // Kita sertakan role agar bisa dipakai di middleware/UI
        }
      }
    })
  ],
  // Menggunakan JWT karena lebih ringan dan cocok untuk integrasi ke dashboard spasial
  session: { strategy: "jwt" },
  callbacks: {
    // Agar Role bisa diakses di sisi client melalui useSession atau auth()
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: "/login", 
  }
})