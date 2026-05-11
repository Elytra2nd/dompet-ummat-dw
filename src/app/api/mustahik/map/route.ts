import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function buildValidFromWhere(
  searchParams: URLSearchParams
): { gte: Date; lte: Date } | undefined {
  const filterType = searchParams.get('filterType') ?? 'none'

  if (filterType === 'year') {
    const startYear = searchParams.get('startYear')
    const endYear = searchParams.get('endYear')
    if (!startYear || !endYear) return undefined
    return {
      gte: new Date(`${startYear}-01-01T00:00:00.000Z`),
      lte: new Date(`${endYear}-12-31T23:59:59.999Z`),
    }
  }

  if (filterType === 'month') {
    const startMonth = searchParams.get('startMonth')
    const endMonth = searchParams.get('endMonth')
    if (!startMonth || !endMonth) return undefined
    const [ey, em] = endMonth.split('-').map(Number)
    const lastDay = new Date(ey, em, 0)
    const lastDayStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
    return {
      gte: new Date(`${startMonth}-01T00:00:00.000Z`),
      lte: new Date(`${lastDayStr}T23:59:59.999Z`),
    }
  }

  if (filterType === 'day') {
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (!startDate || !endDate) return undefined
    return {
      gte: new Date(`${startDate}T00:00:00.000Z`),
      lte: new Date(`${endDate}T23:59:59.999Z`),
    }
  }

  return undefined
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const validFromWhere = buildValidFromWhere(searchParams)

    const data = await prisma.dim_mustahik.findMany({
      where: {
        is_active: true,
        ...(validFromWhere ? { valid_from: validFromWhere } : {}),
        dim_lokasi: {
          sk_lokasi: { not: -1 },
          latitude: { not: null },
          longitude: { not: null },
        },
      },
      take: 5000,
      include: {
        dim_lokasi: true,
      },
    });

    const applyJitter = () => (Math.random() - 0.5) * 0.0005;

    const geoData = data
      .map((m) => {
        const latRaw = m.dim_lokasi?.latitude ? Number(m.dim_lokasi.latitude) : null;
        const lngRaw = m.dim_lokasi?.longitude ? Number(m.dim_lokasi.longitude) : null;

        if (latRaw === null || lngRaw === null || latRaw === 0 || lngRaw === 0) {
          return null;
        }

        // ✅ FIX: Sertakan field tanggal dari valid_from
        // valid_from adalah kolom SCD Type 2 yang menyimpan tanggal record mulai berlaku
        // Format: "YYYY-MM-DD" untuk kompatibilitas dengan FilterBar
        const tanggal = m.valid_from
          ? m.valid_from.toISOString().slice(0, 10)
          : null

        return {
          id: m.sk_mustahik,
          nama: m.nama,
          lat: latRaw + applyJitter(),
          lng: lngRaw + applyJitter(),
          kategori: m.kategori_pm,
          wilayah: `${m.dim_lokasi?.kecamatan || ""}, ${m.dim_lokasi?.kabupaten_kota || ""}`,
          alamat: m.alamat,
          provinsi: m.dim_lokasi?.provinsi || "Tidak Diketahui",
          kabupaten: m.dim_lokasi?.kabupaten_kota || "Tidak Diketahui",
          kecamatan: m.dim_lokasi?.kecamatan || "Tidak Diketahui",
          desa: m.dim_lokasi?.desa_kelurahan || "Tidak Diketahui",
          tanggal,  // ✅ Ditambahkan — "YYYY-MM-DD" atau null
        };
      })
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