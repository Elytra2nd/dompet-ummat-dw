'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix icon leaflet yang sering hilang di Next.js
// Gunakan marker warna merah untuk Ambulans
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  center: [number, number];
}

function LocationMarker({ onLocationSelect, center }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null)
  const map = useMap()

  // Sinkronisasi posisi marker jika center (hasil search) berubah
  useEffect(() => {
    if (center) {
      const newPos = L.latLng(center[0], center[1])
      setPosition(newPos)
      map.flyTo(newPos, 15)
    }
  }, [center, map])

  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })

  return position === null ? null : (
    <Marker position={position} icon={redIcon} />
  )
}

export default function MapPickerAmbulan({ onLocationSelect, center }: MapPickerProps) {
  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker onLocationSelect={onLocationSelect} center={center} />
    </MapContainer>
  )
}