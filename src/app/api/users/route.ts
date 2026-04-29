import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// GET: Ambil semua user (tanpa password hash)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal mengambil data user', details: error.message }, { status: 500 })
  }
}

// POST: Buat user baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, role } = body

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, password, dan role harus diisi' }, { status: 400 })
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar digunakan' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Buat user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ success: true, data: newUser })
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal membuat user', details: error.message }, { status: 500 })
  }
}
