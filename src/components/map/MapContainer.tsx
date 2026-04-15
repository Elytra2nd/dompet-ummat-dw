'use client'

import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix untuk ikon Leaflet yang sering hilang di Next.js
const markerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface MapProps {
  data: any[]
}

export default function MainMap({ data }: MapProps) {
  const center: [number, number] = [-0.0263, 109.3425] // Default Pontianak/Melawi

  return (
    <MapContainer center={center} zoom={8} className="h-[500px] w-full rounded-xl shadow-inner">
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="Satelit">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
        </LayersControl.BaseLayer>
      </LayersControl>

      {data.map((item) => (
        <Marker 
          key={item.sk_mustahik} 
          position={[item.dim_lokasi.latitude, item.dim_lokasi.longitude]}
          icon={markerIcon}
        >
          <Popup>
            <div className="font-sans">
              <h3 className="font-bold">{item.nama_lengkap}</h3>
              <p className="text-xs text-gray-600">{item.dim_lokasi.desa_kelurahan}, {item.dim_lokasi.kecamatan}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}