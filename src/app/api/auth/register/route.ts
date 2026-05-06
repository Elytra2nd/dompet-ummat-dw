import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getToken } from 'next-auth/jwt'
import { BCRYPT_ROUNDS } from '@/lib/auth'
import { validateBody, RegisterSchema } from '@/lib/validations'

export async function POST(req: Request) {
  try {
    // --- FIX #1: Admin-only guard ---
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET })
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Hanya ADMIN yang dapat mendaftarkan user baru' },
        { status: 403 }
      )
    }

    const { data, error } = validateBody(await req.json(), RegisterSchema)
    if (error) return error
    const { email, password, name, role } = data

    const { prisma } = await import("@/lib/prisma")

    // Cek apakah email sudah ada
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    })

    return NextResponse.json({
      success: true,
      message: `User "${name}" berhasil dibuat dengan role ${role}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    })
  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan saat membuat user' }, { status: 500 })
  }
}
