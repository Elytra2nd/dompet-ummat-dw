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
import MustahikDrilldownChart from './MustahikDrilldownChart'

interface SpatialItem {
  wilayah: string
  jumlahMustahik: number
}

interface PointItem {
  id: number
  kabupaten: string
  kecamatan: string
  desaKelurahan: string
  latitude: number
  longitude: number
}

export default function SpatialMustahikMap() {
  const [level, setLevel] = useState<'kabupaten' | 'kecamatan'>('kabupaten')
  const [selectedKabupaten, setSelectedKabupaten] = useState<string | null>(null)
  const [spatialData, setSpatialData] = useState<SpatialItem[]>([])
  const [pointData, setPointData] = useState<PointItem[]>([])
  const [geojsonData, setGeojsonData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGeojson = async () => {
      const url =
        level === 'kabupaten'
          ? '/geojson/kalbar-kabupaten.geojson'
          : '/geojson/kalbar-kecamatan.geojson'

      const res = await fetch(url)
      const data = await res.json()
      setGeojsonData(data)
    }

    loadGeojson()
  }, [level])

  useEffect(() => {
    const fetchSpatial = async () => {
      setLoading(true)

      const params = new URLSearchParams()
      params.set('level', level)
      if (selectedKabupaten) params.set('kabupaten', selectedKabupaten)

      const res = await fetch(`/api/mustahik/spatial?${params.toString()}`)
      const json = await res.json()
      setSpatialData(json.data || [])
      setLoading(false)
    }

    fetchSpatial()
  }, [level, selectedKabupaten])

  useEffect(() => {
    const fetchPoints = async () => {
      const params = new URLSearchParams()
      if (selectedKabupaten) params.set('kabupaten', selectedKabupaten)

      const res = await fetch(`/api/mustahik/points?${params.toString()}`)
      const json = await res.json()
      setPointData(json || [])
    }

    fetchPoints()
  }, [selectedKabupaten])

  const dataMap = useMemo(() => {
    const map = new Map<string, number>()
    spatialData.forEach((item) => {
      map.set(item.wilayah.toLowerCase(), item.jumlahMustahik)
    })
    return map
  }, [spatialData])

  const getColor = (value: number) => {
    if (value > 200) return '#1d4ed8'
    if (value > 100) return '#3b82f6'
    if (value > 50) return '#60a5fa'
    if (value > 20) return '#93c5fd'
    return '#dbeafe'
  }

  const onEachFeature = (feature: any, layer: any) => {
    const rawName =
      feature?.properties?.name ||
      feature?.properties?.kabupaten_kota ||
      feature?.properties?.kecamatan ||
      'Tidak Diketahui'

    const wilayah = String(rawName)
    const value = dataMap.get(wilayah.toLowerCase()) || 0

    layer.bindPopup(`
      <div>
        <strong>${wilayah}</strong><br/>
        Jumlah Mustahik: ${value}
      </div>
    `)

    layer.on({
      click: () => {
        if (level === 'kabupaten') {
          setSelectedKabupaten(wilayah)
          setLevel('kecamatan')
        }
      },
    })
  }

  const geoStyle = (feature: any) => {
    const rawName =
      feature?.properties?.name ||
      feature?.properties?.kabupaten_kota ||
      feature?.properties?.kecamatan ||
      'Tidak Diketahui'

    const value = dataMap.get(String(rawName).toLowerCase()) || 0

    return {
      fillColor: getColor(value),
      weight: 1,
      opacity: 1,
      color: '#475569',
      fillOpacity: 0.7,
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-md">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Peta Sebaran Mustahik
          </h2>
          <p className="text-sm text-slate-500">
            Analisis Spatial OLAP: roll-up dan drill-down wilayah mustahik
          </p>
        </div>

        <div className="flex gap-2">
          {selectedKabupaten && (
            <button
              onClick={() => {
                setSelectedKabupaten(null)
                setLevel('kabupaten')
              }}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Reset Drill-down
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-md">
            <div className="mb-3 text-sm font-semibold text-slate-600">
              Level: {level === 'kabupaten' ? 'Kabupaten/Kota' : 'Kecamatan'}
              {selectedKabupaten ? ` — ${selectedKabupaten}` : ''}
            </div>

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

                {geojsonData && (
                  <GeoJSON
                    data={geojsonData}
                    style={geoStyle}
                    onEachFeature={onEachFeature}
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
                      <div className="text-sm">
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

        <div>
          <MustahikDrilldownChart
            title={
              level === 'kabupaten'
                ? 'Jumlah Mustahik per Kabupaten/Kota'
                : `Drill-down Kecamatan di ${selectedKabupaten}`
            }
            data={spatialData}
          />

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-md">
            <h3 className="mb-4 text-lg font-bold text-slate-800">Legenda</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-3"><span className="h-4 w-4 rounded bg-[#1d4ed8]" /> &gt; 200 mustahik</div>
              <div className="flex items-center gap-3"><span className="h-4 w-4 rounded bg-[#3b82f6]" /> 101 - 200</div>
              <div className="flex items-center gap-3"><span className="h-4 w-4 rounded bg-[#60a5fa]" /> 51 - 100</div>
              <div className="flex items-center gap-3"><span className="h-4 w-4 rounded bg-[#93c5fd]" /> 21 - 50</div>
              <div className="flex items-center gap-3"><span className="h-4 w-4 rounded bg-[#dbeafe]" /> 0 - 20</div>
              <div className="mt-4 flex items-center gap-3">
                <span className="h-4 w-4 rounded-full bg-red-500" />
                Titik lokasi mustahik
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-md">
            <h3 className="mb-2 text-lg font-bold text-slate-800">Status</h3>
            <p className="text-sm text-slate-600">
              {loading ? 'Memuat agregasi spasial...' : `Menampilkan ${spatialData.length} wilayah dan ${pointData.length} titik.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}