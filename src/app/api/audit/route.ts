import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Pastikan query benar
    // Di MySQL/TiDB, hasil db.query mengembalikan [rows, fields]
    const [rows] = await db.query(`
      SELECT 
        nama_donatur, 
        alamat, 
        tgl_mulai, 
        tgl_akhir, 
        is_active,
        CASE 
          WHEN is_active = 1 THEN 'Active (Current)'
          ELSE 'Archived (History)'
        END as status_record
      FROM dim_donatur 
      ORDER BY nama_donatur, tgl_mulai DESC 
      LIMIT 50
    `);

    // 2. LOG UNTUK DEBUGGING (Cek di terminal laragon)
    console.log("Data dari DB:", rows);

    // 3. VALIDASI: Jika rows bukan array, paksa jadi array kosong
    const data = Array.isArray(rows) ? rows : [];

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Database Error:", error.message);
    // Jika error, kirim array kosong agar frontend tidak crash
    return NextResponse.json([]);
  }
}