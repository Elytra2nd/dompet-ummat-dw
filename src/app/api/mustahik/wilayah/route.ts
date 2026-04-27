import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Ambil parameter filter (ini akan datang dari klik di GeoJSON/Chart)
    // Kita paksa menjadi .toUpperCase() agar sinkron dengan Data Warehouse
    const kabParam = searchParams.get('kabupaten')?.toUpperCase()
    const kecParam = searchParams.get('kecamatan')?.toUpperCase()

    // 1. Tentukan Kondisi WHERE (Filtering)
    const whereCondition: any = { is_active: true }
    
    if (kabParam) {
      whereCondition.kabupaten_kota = kabParam
    }
    
    if (kecParam) {
      whereCondition.kelurahan_kecamatan = kecParam
    }

    // 2. Tentukan Level Drill-down (Grouping)
    // Jika belum pilih Kab -> Group by Kab
    // Jika sudah pilih Kab -> Group by Kec
    // Jika sudah pilih Kec -> Group by Desa
    let groupByField: 'kabupaten_kota' | 'kelurahan_kecamatan' | 'desa' = 'kabupaten_kota'
    
    if (kecParam) {
      groupByField = 'desa'
    } else if (kabParam) {
      groupByField = 'kelurahan_kecamatan'
    }

    // 3. Eksekusi Query ke Database
    const results = await prisma.dim_mustahik.groupBy({
      by: [groupByField],
      _count: { _all: true },
      where: whereCondition,
    })

    // 4. Transformasi Hasil
    // Kita pastikan output selalu memiliki key 'label' agar frontend tidak bingung
    const data = results
      .filter((item) => item[groupByField]) // Buang baris jika kolomnya null
      .map((item) => ({
        label: item[groupByField] as string, // Nilainya sudah pasti KAPITAL dari DB
        total: item._count._all,
      }))
      .sort((a, b) => b.total - a.total)

    return NextResponse.json({
      success: true,
      currentLevel: groupByField,
      filterApplied: {
        kabupaten: kabParam || null,
        kecamatan: kecParam || null
      },
      data,
    })

  } catch (error: any) {
    console.error('API_DEMOGRAPHIC_DRILLDOWN_ERROR:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal memuat data drill-down',
        detail: error?.message,
      },
      { status: 500 }
    )
  }
}