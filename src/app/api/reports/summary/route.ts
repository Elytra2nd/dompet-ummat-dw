import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Ambil timestamp awal bulan ini untuk menghitung pertumbuhan
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      donatur, 
      mustahik, 
      ambulan,
      donaturBaru,
      mustahikBaru,
      layananBulanIni
    ] = await Promise.all([
      // Total Aktif
      prisma.dim_donatur.count({ where: { is_active: true } }),
      prisma.dim_mustahik.count({ where: { is_active: true } }),
      prisma.fact_layanan_ambulan.count(),
      
      // Pertumbuhan Bulan Ini (Data Lineage Insight)
      prisma.dim_donatur.count({ 
        where: { 
          is_active: true,
          valid_from: { gte: startOfMonth } 
        } 
      }),
      prisma.dim_mustahik.count({ 
        where: { 
          is_active: true,
          valid_from: { gte: startOfMonth } 
        } 
      }),
      // Operasional Bulan Ini
      prisma.$queryRaw<{count: number}[]>`
        SELECT COUNT(*) as count 
        FROM fact_layanan_ambulan 
        WHERE LEFT(CAST(sk_tanggal_layanan AS CHAR), 6) = ${new Date().toISOString().slice(0, 7).replace('-', '')}
      `
    ])

    // Ambil info terakhir kali warehouse di-update (Record terbaru)
    const lastUpdate = await prisma.fact_layanan_ambulan.findFirst({
      orderBy: { sk_fakta_layanan_ambulan: 'desc' },
      select: { id_transaksi: true }
    })

    return NextResponse.json({
      totals: {
        donatur,
        mustahik,
        ambulan,
      },
      growth: {
        donatur_new: donaturBaru,
        mustahik_new: mustahikBaru,
        ambulan_this_month: Number(layananBulanIni[0]?.count || 0)
      },
      system: {
        status: "Operational",
        last_sync: new Date().toISOString(),
        last_transaction_id: lastUpdate?.id_transaksi || "N/A"
      }
    })
  } catch (error: any) {
    console.error("SUMMARY ERROR:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}