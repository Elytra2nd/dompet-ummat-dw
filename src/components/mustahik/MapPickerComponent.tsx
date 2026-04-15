'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void
  center: [number, number] // Menerima koordinat pusat dari form utama
}

// Fix icon marker agar tidak pecah/hilang
const markerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

// Komponen untuk menggerakkan kamera peta secara smooth
function FlyToHandler({ center }: { center: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    if (center[0] !== 0 && center[1] !== 0) {
      // flyTo membuat transisi peta jadi "terbang" lebih keren
      map.flyTo(center, 16, {
        animate: true,
        duration: 1.5, // durasi 1.5 detik agar tidak terlalu kaku
      })
    }
  }, [center, map])

  return null
}

// Komponen helper untuk fix peta blank saat pertama kali load
function MapResizer() {
  const map = useMap()
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize()
    }, 200)
  }, [map])
  return null
}

export default function MapPickerComponent({ onLocationSelect, center }: MapPickerProps) {
  // State internal marker lokal agar marker tetap muncul di titik klik terakhir
  const [position, setPosition] = useState<L.LatLng>(new L.LatLng(center[0], center[1]))

  // Sinkronisasi state internal marker jika center dari prop (pencarian) berubah
  useEffect(() => {
    if (center[0] !== 0) {
      setPosition(new L.LatLng(center[0], center[1]))
    }
  }, [center])

  function LocationMarker() {
    useMapEvents({
      click(e) {
        setPosition(e.latlng)
        onLocationSelect(e.latlng.lat, e.latlng.lng)
      },
    })

    // Tampilkan marker hanya jika koordinat valid
    return position.lat === 0 ? null : (
      <Marker position={position} icon={markerIcon} />
    )
  }

  return (
    <div className="h-full w-full" style={{ minHeight: '350px' }}>
      <MapContainer 
        center={center[0] !== 0 ? center : [-0.0263, 109.3425]} // Default ke Melawi/Pontianak jika 0
        zoom={13} 
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        />
        
        {/* Handler pergerakan kamera otomatis */}
        <FlyToHandler center={center} />
        
        {/* Fix issue peta abu-abu/blank */}
        <MapResizer />
        
        {/* Event click manual */}
        <LocationMarker />
      </MapContainer>
    </div>
  )
}