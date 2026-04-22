import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.dim_mustahik.findMany({
      where: {
        is_active: true,
        dim_lokasi: {
          latitude: { not: null },
          longitude: { not: null },
        },
      },
      include: {
        dim_lokasi: true,
      },
    });

    // Fungsi Jittering untuk memberikan sedikit pergeseran acak
    // Nilai 0.0001 - 0.0005 cukup untuk memisahkan marker tanpa mengubah lokasi secara signifikan
    const applyJitter = () => (Math.random() - 0.5) * 0.0003;

    const geoData = data.map((m) => {
      const baseLat = Number(m.dim_lokasi?.latitude);
      const baseLng = Number(m.dim_lokasi?.longitude);

      return {
        id: m.sk_mustahik,
        nama: m.nama,
        // Tambahkan jitter agar marker yang koordinatnya sama persis bisa terlihat terpisah
        lat: baseLat + applyJitter(),
        lng: baseLng + applyJitter(),
        kategori: m.kategori_pm,
        wilayah: `${m.dim_lokasi?.kecamatan || ""}, ${m.dim_lokasi?.kabupaten_kota || ""}`,
        alamat: m.alamat,
      };
    });

    return NextResponse.json(geoData);
  } catch (error) {
    console.error("Error fetching map data:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data peta" },
      { status: 500 }
    );
  }
}