import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // UNTUK MARIADB: Jangan gunakan [rows] tapi langsung rows
    const rows = await db.query(`
      SELECT * FROM (
        SELECT 
          id_donatur AS id_bisnis, 
          nama_lengkap AS nama, 
          'Donatur' AS entitas, 
          valid_from, 
          valid_to, 
          is_active,
          CASE 
            WHEN is_active = 1 THEN 'Active (Current)'
            ELSE 'Archived (History)'
          END AS status_record
        FROM dim_donatur
        WHERE sk_donatur > 0

        UNION ALL

        SELECT 
          id_mustahik AS id_bisnis, nama AS nama, 'Mustahik' AS entitas, 
          valid_from, valid_to, is_active,
          CASE WHEN is_active = 1 THEN 'Active (Current)' ELSE 'Archived (History)' END AS status_record
        FROM dim_mustahik
        WHERE sk_mustahik > 0

        UNION ALL

        SELECT 
          id_petugas AS id_bisnis, nama_petugas AS nama, 'Petugas' AS entitas, 
          valid_from, valid_to, is_active,
          CASE WHEN is_active = 1 THEN 'Active (Current)' ELSE 'Archived (History)' END AS status_record
        FROM dim_petugas
        WHERE sk_petugas > 0
      ) AS unified_audit
      ORDER BY valid_from DESC
      LIMIT 1000
    `);

    // Tambahkan log untuk memastikan data terbaca
    console.log(`[MARIADB DEBUG] Berhasil menarik ${rows.length} baris.`);

    // MariaDB mengembalikan data dengan format yang terkadang mengandung metadata, 
    // kita bungkus dengan Array.from atau pastikan itu array murni.
    const cleanData = JSON.parse(JSON.stringify(rows, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json(cleanData);
  } catch (error: any) {
    console.error("AUDIT ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}