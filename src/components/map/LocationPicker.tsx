'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner' // Import dari sonner
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const markerIcon = new L.Icon({
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export default function LocationPicker({
  mustahikList,
}: {
  mustahikList: any[]
}) {
  const [selectedMustahik, setSelectedMustahik] = useState('')
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)

  function MapEvents() {
    useMapEvents({
      click(e) {
        setCoord(e.latlng)
        toast.info(
          `Koordinat terpilih: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`,
        )
      },
    })
    return coord ? <Marker position={coord} icon={markerIcon} /> : null
  }

  const handleSubmit = async () => {
    if (!selectedMustahik || !coord) {
      return toast.error('Pilih mustahik dan titik lokasi di peta!')
    }

    setLoading(true)
    try {
      const res = await fetch('/api/mustahik/update-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sk_mustahik: selectedMustahik,
          latitude: coord.lat,
          longitude: coord.lng,
        }),
      })

      if (res.ok) {
        toast.success('Berhasil!', {
          description: 'Lokasi mustahik telah diperbarui di Data Warehouse.',
        })
        setCoord(null)
        setSelectedMustahik('')
      } else {
        throw new Error()
      }
    } catch (error) {
      toast.error('Gagal menyimpan data ke database.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-emerald-100 shadow-lg">
        <CardHeader className="bg-emerald-50/50">
          <CardTitle className="text-emerald-800">
            Form Mapping Mustahik
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="mustahik">Cari Mustahik (Belum Ada Lokasi)</Label>
            <Select
              onValueChange={setSelectedMustahik}
              value={selectedMustahik}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih nama mustahik..." />
              </SelectTrigger>
              <SelectContent>
                {mustahikList.length > 0 ? (
                  mustahikList.map((m) => (
                    <SelectItem
                      key={m.sk_mustahik}
                      value={m.sk_mustahik.toString()}
                    >
                      {m.nama}
                    </SelectItem>
                  ))
                ) : (
                  <div className="text-muted-foreground p-2 text-center text-sm">
                    Semua data sudah terpetakan
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input
                value={coord?.lat.toFixed(8) || ''}
                readOnly
                className="bg-slate-50 font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input
                value={coord?.lng.toFixed(8) || ''}
                readOnly
                className="bg-slate-50 font-mono text-xs"
              />
            </div>
          </div>

          <Button
            className="w-full bg-emerald-600 transition-all hover:bg-emerald-700"
            onClick={handleSubmit}
            disabled={loading || !coord || !selectedMustahik}
          >
            {loading ? 'Memproses Database...' : 'Simpan ke Data Warehouse'}
          </Button>
        </CardContent>
      </Card>

      <Card className="relative h-125 overflow-hidden border-emerald-100 shadow-lg">
        <div className="absolute top-2 left-12 z-1000 rounded bg-white/90 p-2 text-[10px] font-bold text-emerald-700 uppercase shadow-md">
          Klik pada peta untuk menentukan titik
        </div>
        <MapContainer
          center={[-0.0263, 109.3425]}
          zoom={12}
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapEvents />
        </MapContainer>
      </Card>
    </div>
  )
}
