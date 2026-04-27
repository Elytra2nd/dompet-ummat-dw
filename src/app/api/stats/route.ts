import { prisma } from '@/lib/prisma'; // Sesuaikan path dengan lokasi prisma client kamu
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Menggunakan Promise.all agar semua query berjalan secara paralel (lebih cepat)
    const [
      donasiAgg,
      donaturCount,
      ambulanAgg,
      penyaluranAgg,
      mustahikCount
    ] = await Promise.all([
      // 1. Total Penghimpunan dari fact_donasi
      prisma.fact_donasi.aggregate({
        _sum: { nominal_valid: true }
      }),

      // 2. Jumlah Donatur Unik dari dim_donatur
      prisma.dim_donatur.count({
        where: { is_active: true }
      }),

      // 3. Jumlah Layanan Ambulans
      prisma.fact_layanan_ambulan.aggregate({
        _sum: { jumlah_layanan: true }
      }),

      // 4. Total Penyaluran
      prisma.fact_penyaluran.aggregate({
        _sum: { dana_tersalur: true }
      }),

      // 5. Jumlah Mustahik
      prisma.dim_mustahik.count({
        where: { is_active: true }
      })
    ]);

    return NextResponse.json({
      totalDonasi: Number(donasiAgg._sum.nominal_valid || 0),
      jumlahDonatur: donaturCount || 0,
      jumlahMustahik: mustahikCount || 0,
      danaTersalur: Number(penyaluranAgg._sum.dana_tersalur || 0),
      layananAmbulan: Number(ambulanAgg._sum.jumlah_layanan || 0),
      pertumbuhan: 12.5, // Statis sesuai kode awal
    });

  } catch (error: any) {
    console.error("DW Error:", error);
    return NextResponse.json(
      { 
        error: "Gagal mengambil data DW",
        details: error?.message 
      }, 
      { status: 500 }
    );
  }
}