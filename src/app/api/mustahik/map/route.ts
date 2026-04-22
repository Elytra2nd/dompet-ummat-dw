import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.dim_mustahik.findMany({
      where: {
        is_active: true,
        dim_lokasi: {
          // Pastikan sk_lokasi bukan nilai default -1
          sk_lokasi: { not: -1 },
          // Pastikan latitude dan longitude tidak null
          latitude: { not: null },
          longitude: { not: null },
        },
      },
      include: {
        dim_lokasi: true,
      },
    });

    // Fungsi Jittering (0.0005 sekitar 50 meter agar pergeseran terlihat jelas jika zoom dekat)
    const applyJitter = () => (Math.random() - 0.5) * 0.0005;

    const geoData = data
      .map((m) => {
        // Paksa konversi ke Number untuk menangani objek Decimal Prisma
        const latRaw = m.dim_lokasi?.latitude ? Number(m.dim_lokasi.latitude) : null;
        const lngRaw = m.dim_lokasi?.longitude ? Number(m.dim_lokasi.longitude) : null;

        // Jika hasil konversi bukan angka valid atau 0 (Null Island), kita abaikan di tahap filter
        if (latRaw === null || lngRaw === null || latRaw === 0 || lngRaw === 0) {
          return null;
        }

        return {
          id: m.sk_mustahik,
          nama: m.nama,
          lat: latRaw + applyJitter(),
          lng: lngRaw + applyJitter(),
          kategori: m.kategori_pm,
          wilayah: `${m.dim_lokasi?.kecamatan || ""}, ${m.dim_lokasi?.kabupaten_kota || ""}`,
          alamat: m.alamat,
        };
      })
      // Filter untuk menghapus data null (koordinat tidak valid) agar tidak muncul di peta
      .filter((item) => item !== null);

    return NextResponse.json(geoData);
  } catch (error) {
    console.error("Error fetching map data:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data peta" },
      { status: 500 }
    );
  }
}