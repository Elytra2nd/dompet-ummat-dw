import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {

    const [rows] = await db.query(`
      SELECT * FROM (
        -- Histori Donatur
        SELECT 
          id_donatur AS id_bisnis, 
          nama_lengkap AS nama, 
          'Donatur' AS entitas, 
          valid_from, 
          valid_to, 
          is_active,
          CASE 
            WHEN is_active = 1 AND valid_to >= CURDATE() THEN 'Active (Current)'
            WHEN is_active = 0 AND valid_to < '9999-12-31' THEN 'Archived (History)'
            ELSE 'Deleted'
          END AS status_record
        FROM dim_donatur

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
            WHEN is_active = 1 AND valid_to >= CURDATE() THEN 'Active (Current)'
            WHEN is_active = 0 AND valid_to < '9999-12-31' THEN 'Archived (History)'
            ELSE 'Deleted'
          END AS status_record
        FROM dim_mustahik

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
            WHEN is_active = 1 AND valid_to >= CURDATE() THEN 'Active (Current)'
            WHEN is_active = 0 AND valid_to < '9999-12-31' THEN 'Archived (History)'
            ELSE 'Deleted'
          END AS status_record
        FROM dim_petugas

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
            WHEN is_active = 1 AND valid_to >= CURDATE() THEN 'Active (Current)'
            WHEN is_active = 0 AND valid_to < '9999-12-31' THEN 'Archived (History)'
            ELSE 'Deleted'
          END AS status_record
        FROM dim_pasien_ambulan
      ) AS unified_audit
      ORDER BY valid_from DESC, nama ASC
      LIMIT 1000
    `);

    // 2. Logging untuk audit internal
    console.log(`[DW Audit] Menampilkan ${Array.isArray(rows) ? rows.length : 0} jejak histori.`);

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