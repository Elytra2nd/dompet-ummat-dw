import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Pastikan path ke singleton prisma sudah benar

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

    const geoData = data.map((m) => ({
      id: m.sk_mustahik,
      nama: m.nama,
      lat: Number(m.dim_lokasi?.latitude),
      lng: Number(m.dim_lokasi?.longitude),
      kategori: m.kategori_pm,
      wilayah: `${m.dim_lokasi?.kecamatan || ""}, ${m.dim_lokasi?.kabupaten_kota || ""}`,
      alamat: m.alamat,
    }));

    return NextResponse.json(geoData);
  } catch (error) {
    console.error("Error fetching map data:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data peta" },
      { status: 500 }
    );
  }
}