// src/hooks/useGeoJson.ts

import { useEffect, useState } from 'react'
import type { DrillState } from '@/types/spatial'

function buildGeoJsonUrl(drill: DrillState): string {
  const { level, selectedKabupaten, selectedKecamatan } = drill

  if (level === 'kabupaten') {
    return '/data/kalbar/kabupaten.geojson'
  }

  if (level === 'kecamatan' && selectedKabupaten) {
    const slug = selectedKabupaten.trim().replace(/\s+/g, '_')
    return `/data/kalbar/kecamatan/${slug}.geojson`
  }

  if (level === 'kelurahan' && selectedKecamatan) {
    const slug = selectedKecamatan.trim().replace(/\s+/g, '_')
    return `/data/kalbar/kelurahan/${slug}.geojson`
  }

  // fallback
  return '/data/kalbar/kabupaten.geojson'
}

export function useGeoJson(drill: DrillState) {
  const [geojson, setGeojson] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const url = buildGeoJsonUrl(drill)

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`File tidak ditemukan: ${url}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setGeojson(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true // cleanup: hindari set state setelah unmount
    }
  }, [drill.level, drill.selectedKabupaten, drill.selectedKecamatan])

  return { geojson, loading, error }
}