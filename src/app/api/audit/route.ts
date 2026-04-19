import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Query disesuaikan dengan skema: valid_from, valid_to, dan is_active
    // Kita urutkan berdasarkan nama dan valid_from DESC agar data terbaru muncul di atas
    const [rows] = await db.query(`
      SELECT 
        id_donatur,
        nama_lengkap, 
        alamat, 
        perusahaan,
        tipe,
        kontak_utama,
        valid_from, 
        valid_to, 
        is_active,
        CASE 
          WHEN is_active = 1 AND valid_to >= CURDATE() THEN 'Active (Current)'
          WHEN is_active = 0 THEN 'Deleted (Soft Delete)'
          ELSE 'Archived (History)'
        END as status_record
      FROM dim_donatur 
      ORDER BY nama_lengkap ASC, valid_from DESC 
      LIMIT 100
    `);

    // 2. Debugging untuk melihat apakah valid_from/to terbaca
    console.log("Jejak Audit Warehouse:", rows);

    // 3. Validasi Array
    const data = Array.isArray(rows) ? rows : [];

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Audit Log Error:", error.message);
    return NextResponse.json({ 
      error: "Gagal memuat histori data",
      details: error.message 
    }, { status: 500 });
  }
}