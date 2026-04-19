import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Gunakan query yang lebih sederhana untuk tes pertama
    const [rows] = await db.query(`
      SELECT * FROM (
        -- 1. Cabang Donatur
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

        -- 2. Cabang Mustahik (Pastikan nama kolom id_mustahik & nama benar)
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

        -- 3. Cabang Petugas (Pastikan nama kolom id_petugas & nama_petugas benar)
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
      ) AS unified_audit
      ORDER BY valid_from DESC
      LIMIT 500
    `);

    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (error: any) {
    // Log error ini sangat penting untuk dibaca di konsol Vercel
    console.error("CRITICAL AUDIT ERROR:", error.message);
    return NextResponse.json({ 
      error: "Query SQL Gagal", 
      details: error.message 
    }, { status: 500 });
  }
}