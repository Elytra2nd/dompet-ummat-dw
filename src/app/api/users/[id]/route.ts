import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { getToken } from 'next-auth/jwt'

// PUT: Update user (termasuk ganti password)
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await req.json()
    const { name, email, password, role } = body

    // Data yang akan diupdate
    const updateData: any = { name, email, role }

    // Jika password diisi, hash password baru
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({ success: true, data: updatedUser })
  } catch (error: any) {
    // Tangani error unik constraint untuk email
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email sudah digunakan oleh user lain' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Gagal mengupdate user', details: error.message }, { status: 500 })
  }
}

// DELETE: Hapus user (dengan proteksi penghapusan diri sendiri)
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    // Ambil token dari sesi saat ini untuk mengetahui ID admin yang sedang login
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    
    if (token && token.sub === id) {
      return NextResponse.json({ error: 'Tindakan ditolak: Anda tidak dapat menghapus akun Anda sendiri' }, { status: 403 })
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'User berhasil dihapus' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal menghapus user', details: error.message }, { status: 500 })
  }
}
