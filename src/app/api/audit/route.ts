import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT * FROM (
        -- Histori Donatur (Filter SK > 0 untuk menghindari data sistem/negatif)
        SELECT 
          id_donatur AS id_bisnis, 
          nama_lengkap AS nama, 
          'Donatur' AS entitas, 
          valid_from, 
          valid_to, 
          is_active,
          CASE 
            WHEN is_active = 1 THEN 'Active (Current)'
            WHEN is_active = 0 THEN 'Archived (History)'
            ELSE 'Unknown'
          END AS status_record
        FROM dim_donatur
        WHERE sk_donatur > 0

        UNION ALL

        -- Histori Mustahik
        SELECT 
          id_mustahik AS id_bisnis, 
          nama AS nama, 
          'Mustahik' AS entitas, 
          valid_from, 
          valid_to, 
          is_active,
          CASE 
            WHEN is_active = 1 THEN 'Active (Current)'
            ELSE 'Archived (History)'
          END AS status_record
        FROM dim_mustahik
        WHERE sk_mustahik > 0

        UNION ALL

        -- Histori Petugas / Amil
        SELECT 
          id_petugas AS id_bisnis, 
          nama_petugas AS nama, 
          'Petugas' AS entitas, 
          valid_from, 
          valid_to, 
          is_active,
          CASE 
            WHEN is_active = 1 THEN 'Active (Current)'
            ELSE 'Archived (History)'
          END AS status_record
        FROM dim_petugas
        WHERE sk_petugas > 0

        UNION ALL

        -- Histori Pasien Ambulan
        SELECT 
          id_pasien AS id_bisnis, 
          nama_pasien AS nama, 
          'Pasien' AS entitas, 
          valid_from, 
          valid_to, 
          is_active,
          CASE 
            WHEN is_active = 1 THEN 'Active (Current)'
            ELSE 'Archived (History)'
          END AS status_record
        FROM dim_pasien_ambulan
        WHERE sk_pasien > 0
      ) AS unified_audit
      -- Urutkan berdasarkan valid_from terbaru agar hasil edit langsung muncul di atas
      ORDER BY valid_from DESC
      LIMIT 1000
    `);

    // 2. Logging untuk debugging di terminal
    console.log(`[DW Audit] Menampilkan ${Array.isArray(rows) ? rows.length : 0} baris histori.`);

    const data = Array.isArray(rows) ? rows : [];

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Audit Log Warehouse Error:", error.message);
    return NextResponse.json({ 
      error: "Gagal memuat histori data terpadu",
      details: error.message 
    }, { status: 500 });
  }
}