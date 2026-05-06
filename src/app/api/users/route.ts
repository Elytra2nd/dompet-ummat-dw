import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { BCRYPT_ROUNDS, handleApiError } from '@/lib/auth'

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
  } catch (error: unknown) {
    const { message, status } = handleApiError(error, 'GET /api/users')
    return NextResponse.json({ error: message }, { status })
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
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)

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
  } catch (error: unknown) {
    const { message, status } = handleApiError(error, 'POST /api/users')
    return NextResponse.json({ error: message }, { status })
  }
}
