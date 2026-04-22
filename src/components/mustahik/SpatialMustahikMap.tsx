'use client'

import { useEffect, useMemo, useState } from 'react'
import {
    CircleMarker,
    GeoJSON,
    MapContainer,
    Popup,
    TileLayer,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import { useDrilldown } from '@/hooks/useDrilldown'
import { useGeoJson } from '@/hooks/useGeoJson'
import type { SpatialItem, PointItem } from '@/types/spatial'
import MustahikDrilldownChart from './MustahikDrilldownChart'

// Nama property GeoJSON bisa berbeda tiap file — cek dulu dengan console.log
const FEATURE_NAME_KEYS = [
    'WADMKK',         // Wilayah Administrasi Kabupaten/Kota (Penting!)
    'WADMKC',         // Wilayah Administrasi Kecamatan
    'WADMKD',         // Wilayah Administrasi Kelurahan/Desa
    'WADMPR',
    'nm_kecamatan',   // Cocok dengan GeoJSON kecamatan Anda
    'nm_kelurahan',   // Cocok dengan GeoJSON kelurahan Anda
    'nm_kabupaten',   // Antisipasi untuk file kabupaten
    'kabupaten_kota',
    'Kalimantan_Barat',
    'name',
    'NAME'
]
function getFeatureName(properties: any): string {
    for (const key of FEATURE_NAME_KEYS) {
        if (properties?.[key]) return String(properties[key])
    }
    return 'Tidak Diketahui'
}

const LEVEL_LABEL = {
    kabupaten: 'Kabupaten/Kota',
    kecamatan: 'Kecamatan',
    kelurahan: 'Desa/Kelurahan',
}

const getColor = (value: number) => {
    if (value > 200) return '#1d4ed8'
    if (value > 100) return '#3b82f6'
    if (value > 50) return '#60a5fa'
    if (value > 20) return '#93c5fd'
    return '#dbeafe'
}

export default function SpatialMustahikMap() {
    const { drill, drillDown, rollUp, resetAll, breadcrumbs, isDeepest, canRollUp } = useDrilldown()
    const { geojson, loading: geoLoading, error: geoError } = useGeoJson(drill)

    const [spatialData, setSpatialData] = useState<SpatialItem[]>([])
    const [pointData, setPointData] = useState<PointItem[]>([])
    const [dataLoading, setDataLoading] = useState(true)

    // Fetch data agregasi (jumlah mustahik per wilayah)
    useEffect(() => {
        const fetchSpatial = async () => {
            setDataLoading(true)
            const params = new URLSearchParams()
            params.set('level', drill.level)
            if (drill.selectedKabupaten) params.set('kabupaten', drill.selectedKabupaten)
            if (drill.selectedKecamatan) params.set('kecamatan', drill.selectedKecamatan)

            const res = await fetch(`/api/mustahik/spatial?${params.toString()}`)
            const json = await res.json()
            setSpatialData(json.data || [])
            setDataLoading(false)
        }

        fetchSpatial()
    }, [drill.level, drill.selectedKabupaten, drill.selectedKecamatan])

    // Fetch titik lokasi mustahik
    useEffect(() => {
        const fetchPoints = async () => {
            const params = new URLSearchParams()
            if (drill.selectedKabupaten) params.set('kabupaten', drill.selectedKabupaten)
            if (drill.selectedKecamatan) params.set('kecamatan', drill.selectedKecamatan)

            const res = await fetch(`/api/mustahik/points?${params.toString()}`)
            const json = await res.json()
            setPointData(json || [])
        }

        fetchPoints()
    }, [drill.selectedKabupaten, drill.selectedKecamatan])

    // Map wilayah → jumlah mustahik untuk pewarnaan
    const dataMap = useMemo(() => {
        const map = new Map<string, number>()
        spatialData.forEach((item) => {
            map.set(item.wilayah.toLowerCase(), item.jumlahMustahik)
        })
        return map
    }, [spatialData])

    const geoStyle = (feature: any) => {
        const name = getFeatureName(feature.properties)
        const value = dataMap.get(name.toLowerCase()) || 0
        return {
            fillColor: getColor(value),
            weight: 1,
            opacity: 1,
            color: '#475569',
            fillOpacity: 0.7,
        }
    }

    const onEachFeature = (feature: any, layer: any) => {
        const name = getFeatureName(feature.properties)
        const value = dataMap.get(name.toLowerCase()) || 0

        layer.bindPopup(`
      <div style="min-width:150px">
        <strong>${name}</strong><br/>
        Jumlah Mustahik: <strong>${value}</strong><br/>
        ${!isDeepest ? '<em style="color:#64748b;font-size:12px">Klik untuk drill-down</em>' : ''}
      </div>
    `)

        layer.on({
            click: () => {
                if (!isDeepest) drillDown(name)
            },
            mouseover: (e: any) => e.target.setStyle({ fillOpacity: 0.9, weight: 2 }),
            mouseout: (e: any) => e.target.setStyle({ fillOpacity: 0.7, weight: 1 }),
        })
    }

    const chartTitle = {
        kabupaten: 'Jumlah Mustahik per Kabupaten/Kota',
        kecamatan: `Kecamatan di ${drill.selectedKabupaten}`,
        kelurahan: `Kelurahan di ${drill.selectedKecamatan}`,
    }[drill.level]

    const isLoading = geoLoading || dataLoading

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-md">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Peta Sebaran Mustahik</h2>
                    <p className="text-sm text-slate-500">
                        Analisis Spatial OLAP: roll-up dan drill-down wilayah mustahik
                    </p>
                </div>
                <div className="flex gap-2">
                    {canRollUp && (
                        <button
                            onClick={rollUp}
                            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                        >
                            ← Kembali
                        </button>
                    )}
                    {canRollUp && (
                        <button
                            onClick={resetAll}
                            className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm text-sm">
                {breadcrumbs.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-2">
                        {i > 0 && <span className="text-slate-300">/</span>}
                        <button
                            onClick={crumb.onClick}
                            className={
                                i === breadcrumbs.length - 1
                                    ? 'font-semibold text-blue-600 cursor-default'
                                    : 'text-slate-500 hover:text-slate-800 hover:underline'
                            }
                        >
                            {crumb.label}
                        </button>
                    </span>
                ))}
                <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {LEVEL_LABEL[drill.level]}
                </span>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

                {/* Peta */}
                <div className="xl:col-span-2">
                    <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-md">

                        {geoError && (
                            <div className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                                ⚠️ {geoError}
                            </div>
                        )}

                        {isLoading && (
                            <div className="mb-3 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-600">
                                Memuat peta...
                            </div>
                        )}

                        <div className="h-[600px] w-full rounded-xl">
                            <MapContainer
                                center={[-0.1322, 109.3206]}
                                zoom={8}
                                scrollWheelZoom
                                className="h-full w-full rounded-xl"
                            >
                                <TileLayer
                                    attribution='&copy; OpenStreetMap contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                {geojson && (
                                    <GeoJSON
                                        // Key harus unik agar komponen me-refresh saat level/kecamatan berubah
                                        key={`${drill.level}-${drill.selectedKabupaten}-${drill.selectedKecamatan}`}
                                        data={geojson}
                                        style={geoStyle}
                                        onEachFeature={onEachFeature}
                                        filter={(feature) => {
                                            // Jika sedang di level kelurahan, hanya tampilkan yang nm_kecamatan-nya cocok
                                            if (drill.level === 'kelurahan' && drill.selectedKecamatan) {
                                                const featureKec = feature.properties.nm_kecamatan || feature.properties.WADMKC;
                                                return featureKec === drill.selectedKecamatan;
                                            }
                                            return true;
                                        }}
                                    />
                                )}

                                {pointData.map((point) => (
                                    <CircleMarker
                                        key={point.id}
                                        center={[point.latitude, point.longitude]}
                                        radius={4}
                                        pathOptions={{
                                            color: '#dc2626',
                                            fillColor: '#ef4444',
                                            fillOpacity: 0.8,
                                        }}
                                    >
                                        <Popup>
                                            <div className="text-sm space-y-1">
                                                <div><strong>Kabupaten:</strong> {point.kabupaten}</div>
                                                <div><strong>Kecamatan:</strong> {point.kecamatan}</div>
                                                <div><strong>Desa/Kelurahan:</strong> {point.desaKelurahan}</div>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </MapContainer>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">

                    <MustahikDrilldownChart
                        title={chartTitle}
                        data={spatialData}
                    />

                    {/* Legenda */}
                    <div className="rounded-2xl bg-white p-5 shadow-md">
                        <h3 className="mb-4 text-lg font-bold text-slate-800">Legenda</h3>
                        <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex items-center gap-3"><span className="h-4 w-4 rounded bg-[#1d4ed8]" /> &gt; 200 mustahik</div>
                            <div className="flex items-center gap-3"><span className="h-4 w-4 rounded bg-[#3b82f6]" /> 101 – 200</div>
                            <div className="flex items-center gap-3"><span className="h-4 w-4 rounded bg-[#60a5fa]" /> 51 – 100</div>
                            <div className="flex items-center gap-3"><span className="h-4 w-4 rounded bg-[#93c5fd]" /> 21 – 50</div>
                            <div className="flex items-center gap-3"><span className="h-4 w-4 rounded bg-[#dbeafe]" /> 0 – 20</div>
                            <div className="mt-4 flex items-center gap-3">
                                <span className="h-4 w-4 rounded-full bg-red-500" />
                                Titik lokasi mustahik
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="rounded-2xl bg-white p-5 shadow-md">
                        <h3 className="mb-2 text-lg font-bold text-slate-800">Status</h3>
                        <p className="text-sm text-slate-600">
                            {isLoading
                                ? 'Memuat data...'
                                : `${spatialData.length} wilayah · ${pointData.length} titik lokasi`}
                        </p>
                    </div>

                </div>
            </div>
        </div>
    )
}