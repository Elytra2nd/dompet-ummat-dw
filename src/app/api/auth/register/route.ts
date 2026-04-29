import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { email, password, name, role } = await req.json()

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Semua field wajib diisi (email, password, name, role)' }, { status: 400 })
    }

    if (!['ADMIN', 'STAFF', 'SURVEYOR'].includes(role)) {
      return NextResponse.json({ error: 'Role harus ADMIN, STAFF, atau SURVEYOR' }, { status: 400 })
    }

    const { prisma } = await import("@/lib/prisma")

    // Cek apakah email sudah ada
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
