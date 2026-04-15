import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mengambil semua daftar kriteria penilaian dari tabel dimensi
    const questions = await prisma.dim_pertanyaan_survey.findMany({
      orderBy: {
        kode_pertanyaan: 'asc' // Diurutkan agar urutan form konsisten
      },
      select: {
        sk_pertanyaan: true,
        kode_pertanyaan: true,
        grup_pertanyaan: true,
        teks_pertanyaan: true
      }
    })

    // Jika tabel masih kosong, berikan feedback agar user tahu harus mengisi master data
    if (questions.length === 0) {
      return NextResponse.json(
        { message: "Belum ada data pertanyaan survey di database." },
        { status: 200 }
      )
    }

    return NextResponse.json(questions)

  } catch (error: any) {
    console.error("ERROR_GET_PERTANYAAN:", error)
    return NextResponse.json(
      { error: "Gagal mengambil daftar pertanyaan survey", details: error.message },
      { status: 500 }
    )
  }
}