import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  let conn;
  try {
    conn = await db.getConnection();

    // 1. Ambil Total Penghimpunan dari fact_donasi
    const donasiRows = await conn.query(
      'SELECT SUM(nominal_valid) as total FROM fact_donasi'
    );

    // 2. Ambil Jumlah Donatur Unik dari dim_donatur
    const donaturRows = await conn.query(
      'SELECT COUNT(*) as total FROM dim_donatur WHERE is_active = 1'
    );

    // 3. Ambil Jumlah Layanan Ambulans
    const ambulanRows = await conn.query(
      'SELECT SUM(jumlah_layanan) as total FROM fact_layanan_ambulan'
    );

    const penyaluranRows = await conn.query(
      'SELECT SUM(dana_tersalur) as total FROM fact_penyaluran'
    );

    const mustahikRows = await conn.query(
      'SELECT COUNT(*) as total FROM dim_mustahik WHERE is_active = 1'
    );

    return NextResponse.json({
      totalDonasi: donasiRows[0].total || 0,
      jumlahDonatur: Number(donaturRows[0].total) || 0,
      jumlahMustahik: Number(mustahikRows[0].total) || 0,
      dana_tersalur: penyaluranRows[0].total || 0,
      layananAmbulan: ambulanRows[0].total || 0,
      pertumbuhan: 12.5,
    });
  } catch (error) {
    console.error("DW Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data DW" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}