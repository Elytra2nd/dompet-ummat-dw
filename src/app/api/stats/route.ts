import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

function toNumber(val: any): number {
  if (val === null || val === undefined) return 0
  return parseFloat(val.toString())
}

function toIntDate(date: Date): number {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return Number(`${yyyy}${mm}${dd}`)
}

/**
 * Konversi filter ke where clause bertipe Date (untuk kolom DateTime seperti valid_from)
 * Mengembalikan undefined jika filterType === 'none' atau params tidak lengkap
 */
function buildDateWhereAsDate(
  searchParams: URLSearchParams
): { gte: Date; lte: Date } | undefined {
  const filterType = searchParams.get('filterType') ?? 'none'

  if (filterType === 'year') {
    const startYear = searchParams.get('startYear')
    const endYear = searchParams.get('endYear')
    if (!startYear || !endYear) return undefined
    return {
      gte: new Date(`${startYear}-01-01T00:00:00.000Z`),
      lte: new Date(`${endYear}-12-31T23:59:59.999Z`),
    }
  }

  if (filterType === 'month') {
    const startMonth = searchParams.get('startMonth') // "YYYY-MM"
    const endMonth = searchParams.get('endMonth')     // "YYYY-MM"
    if (!startMonth || !endMonth) return undefined
    const [ey, em] = endMonth.split('-').map(Number)
    const lastDay = new Date(ey, em, 0)
    const lastDayStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
    return {
      gte: new Date(`${startMonth}-01T00:00:00.000Z`),
      lte: new Date(`${lastDayStr}T23:59:59.999Z`),
    }
  }

  if (filterType === 'day') {
    const startDate = searchParams.get('startDate') // "YYYY-MM-DD"
    const endDate = searchParams.get('endDate')     // "YYYY-MM-DD"
    if (!startDate || !endDate) return undefined
    return {
      gte: new Date(`${startDate}T00:00:00.000Z`),
      lte: new Date(`${endDate}T23:59:59.999Z`),
    }
  }

  return undefined
}

/**
 * Konversi filter dari query params ke where clause sk_tgl_bersih (integer YYYYMMDD)
 * Mengembalikan undefined jika filterType === 'none' atau params tidak lengkap
 */
function buildDateWhere(
  searchParams: URLSearchParams
): { gte: number; lte: number } | undefined {
  const filterType = searchParams.get('filterType') ?? 'none'

  if (filterType === 'year') {
    const startYear = searchParams.get('startYear')
    const endYear = searchParams.get('endYear')
    if (!startYear || !endYear) return undefined
    return {
      gte: Number(`${startYear}0101`),
      lte: Number(`${endYear}1231`),
    }
  }

  if (filterType === 'month') {
    const startMonth = searchParams.get('startMonth') // "YYYY-MM"
    const endMonth = searchParams.get('endMonth')     // "YYYY-MM"
    if (!startMonth || !endMonth) return undefined
    const [sy, sm] = startMonth.split('-').map(Number)
    const [ey, em] = endMonth.split('-').map(Number)
    const lastDay = toIntDate(new Date(ey, em, 0))
    return {
      gte: Number(`${sy}${String(sm).padStart(2, '0')}01`),
      lte: lastDay,
    }
  }

  if (filterType === 'day') {
    const startDate = searchParams.get('startDate') // "YYYY-MM-DD"
    const endDate = searchParams.get('endDate')     // "YYYY-MM-DD"
    if (!startDate || !endDate) return undefined
    return {
      gte: Number(startDate.replace(/-/g, '')),
      lte: Number(endDate.replace(/-/g, '')),
    }
  }

  return undefined // filterType === 'none'
}


/**
 * Bangun where clause untuk filter wilayah via join dim_mustahik.
 * Dipakai di fact_penyaluran (via sk_mustahik) untuk filter dana tersalur per wilayah.
 */
function buildMustahikWilayahWhere(searchParams: URLSearchParams): Record<string, string> | undefined {
  const provinsi = searchParams.get('provinsi')
  const kabupaten = searchParams.get('kabupaten')
  const kecamatan = searchParams.get('kecamatan')
  if (!provinsi && !kabupaten && !kecamatan) return undefined
  const where: Record<string, string> = {}
  if (provinsi) where.provinsi = provinsi
  if (kabupaten) where.kabupaten_kota = kabupaten
  if (kecamatan) where.kelurahan_kecamatan = kecamatan
  return where
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const filterType = searchParams.get('filterType') ?? 'none'
const dateWhere = buildDateWhere(searchParams)
    const dimDateWhere = buildDateWhereAsDate(searchParams)
    const wilayahWhere = buildMustahikWilayahWhere(searchParams)

    // DEBUG: pastikan filter terbaca dengan benar di terminal Next.js
    console.log('[stats] filterType  :', filterType)
    console.log('[stats] searchParams:', Object.fromEntries(searchParams.entries()))
    console.log('[stats] dateWhere   :', dateWhere)

    // Where clause untuk fact_donasi
    const donasiWhere = dateWhere ? { sk_tgl_bersih: dateWhere } : {}

    // Pertumbuhan bulan ini vs bulan lalu hanya relevan saat tidak ada filter
    const hitungPertumbuhan = filterType === 'none'

    const now = new Date()
    const awalBulanIni   = toIntDate(new Date(now.getFullYear(), now.getMonth(), 1))
    const akhirBulanIni  = toIntDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    const awalBulanLalu  = toIntDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    const akhirBulanLalu = toIntDate(new Date(now.getFullYear(), now.getMonth(), 0))

    console.log('[stats] donasiWhere :', JSON.stringify(donasiWhere))

    const [
      donasiAgg,
      donasiSekarang,
      donasiSebelumnya,
      donaturCount,
      ambulanAgg,
      penyaluranAgg,
      mustahikCount,
    ] = await Promise.all([

      // Total donasi — ikut filter
      prisma.fact_donasi.aggregate({
        _sum: { nominal_valid: true },
        where: donasiWhere,
      }),

      // Donasi bulan ini — hanya dihitung saat filterType none
      hitungPertumbuhan
        ? prisma.fact_donasi.aggregate({
            _sum: { nominal_valid: true },
            where: { sk_tgl_bersih: { gte: awalBulanIni, lte: akhirBulanIni } },
          })
        : Promise.resolve({ _sum: { nominal_valid: null } }),

      // Donasi bulan lalu — hanya dihitung saat filterType none
      hitungPertumbuhan
        ? prisma.fact_donasi.aggregate({
            _sum: { nominal_valid: true },
            where: { sk_tgl_bersih: { gte: awalBulanLalu, lte: akhirBulanLalu } },
          })
        : Promise.resolve({ _sum: { nominal_valid: null } }),

      // Donatur — filter pakai valid_from (DateTime)
      prisma.dim_donatur.count({
        where: {
          is_active: true,
          ...(dimDateWhere ? { valid_from: dimDateWhere } : {}),
        },
      }),

      // Layanan ambulan — sesuaikan jika ada kolom tanggal
      prisma.fact_layanan_ambulan.aggregate({ _sum: { jumlah_layanan: true } }),

      // Dana tersalur — filter waktu + wilayah (via join dim_mustahik)
      prisma.fact_penyaluran.aggregate({
        _sum: { dana_tersalur: true },
        where: {
          ...(dateWhere ? { sk_fakta_penyaluran: dateWhere } : {}),
          ...(wilayahWhere
            ? { dim_mustahik: { is: wilayahWhere } }
            : {}),
        },
      }),

      // Mustahik — filter pakai valid_from (DateTime)
      prisma.dim_mustahik.count({
        where: {
          is_active: true,
          ...(dimDateWhere ? { valid_from: dimDateWhere } : {}),
        },
      }),
    ])

    const sekarang   = toNumber(donasiSekarang._sum.nominal_valid)
    const sebelumnya = toNumber(donasiSebelumnya._sum.nominal_valid)

    console.log('[stats] totalDonasi raw :', toNumber(donasiAgg._sum.nominal_valid))
    console.log('[stats] bulan ini       :', sekarang)
    console.log('[stats] bulan lalu      :', sebelumnya)

    let pertumbuhan = 0
    let statusPertumbuhan: 'naik' | 'turun' | 'stabil' | 'data_tidak_cukup' = 'data_tidak_cukup'

    if (hitungPertumbuhan) {
      if (sebelumnya > 0 && sekarang > 0) {
        pertumbuhan = ((sekarang - sebelumnya) / sebelumnya) * 100
        statusPertumbuhan = pertumbuhan > 0 ? 'naik' : pertumbuhan < 0 ? 'turun' : 'stabil'
      } else if (sebelumnya === 0 && sekarang === 0) {
        statusPertumbuhan = 'stabil'
      }
    }

    return NextResponse.json({
      totalDonasi:      toNumber(donasiAgg._sum.nominal_valid),
      jumlahDonatur:    donaturCount,
      jumlahMustahik:   mustahikCount,
      danaTersalur:     toNumber(penyaluranAgg._sum?.dana_tersalur),
      layananAmbulan:   toNumber(ambulanAgg._sum.jumlah_layanan),
      pertumbuhan:      Number(pertumbuhan.toFixed(2)),
      statusPertumbuhan,
    })

  } catch (error: any) {
    console.error('[stats] Error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data DW' }, { status: 500 })
  }
}