import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mustahik/search?q=<query>
 * Pencarian mustahik berdasarkan nama, NIK, atau ID mustahik.
 * Digunakan oleh MustahikSelector pada form transaksi keluar (penyaluran).
 * Mengembalikan max 15 hasil aktif, diurutkan berdasarkan relevansi nama.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') ?? '').trim()

    if (q.length < 2) {
      return NextResponse.json([])
    }

    const results = await prisma.dim_mustahik.findMany({
      where: {
        is_active: true,
        OR: [
          { nama: { contains: q } },
          { nik: { contains: q } },
          { id_mustahik: { contains: q } },
        ],
      },
      select: {
        id_mustahik: true,
        nama: true,
        nik: true,
        desa: true,
        kabupaten_kota: true,
        kategori_pm: true,
      },
      orderBy: { nama: 'asc' },
      take: 15,
    })

    // Format agar sesuai dengan interface MustahikSelector
    const formatted = results.map((m) => ({
      id_mustahik: m.id_mustahik,
      nama: m.nama ?? '-',
      nik: m.nik ?? '-',
      desa: m.desa ?? m.kabupaten_kota ?? '-',
    }))

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error('MUSTAHIK_SEARCH_ERROR:', error)
    return NextResponse.json(
      { error: 'Gagal mencari data mustahik' },
      { status: 500 },
    )
  }
}
