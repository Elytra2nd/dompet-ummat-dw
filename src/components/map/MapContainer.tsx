'use client'

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix untuk ikon Leaflet default
const markerIcon = new L.Icon({
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface MapProps {
  data: any[]
}

export default function MainMap({ data }: MapProps) {
  // Koordinat tengah Melawi
  const center: [number, number] = [-0.3417, 111.5147]

  // Filter pengaman di sisi Client:
  // Hanya ambil yang benar-benar punya objek dim_lokasi dan koordinat valid (> -1)
  const validData = data.filter(
    (item) =>
      item.dim_lokasi &&
      Math.round(item.dim_lokasi.latitude) !== -1 &&
      item.dim_lokasi.longitude > -1,
  )

  // Debugging di Console Browser
  console.log(`[Map Debug] Total data diterima: ${data.length}`)
  console.log(`[Map Debug] Data lolos filter (> -1): ${validData.length}`)

  if (validData.length > 0) {
    console.log('Sample data koordinat:', {
      nama: validData[0].nama,
      lat: validData[0].dim_lokasi.latitude,
      lng: validData[0].dim_lokasi.longitude,
    })
  }

  return (
    <MapContainer
      center={center}
      zoom={9}
      className="h-125 w-full rounded-xl shadow-inner"
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Satelit (ArcGIS)">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
        </LayersControl.BaseLayer>
      </LayersControl>

      {validData.map((item) => (
        <Marker
          key={item.sk_mustahik}
          position={[item.dim_lokasi.latitude, item.dim_lokasi.longitude]}
          icon={markerIcon}
        >
          <Popup>
            <div className="font-sans">
              <h3 className="font-bold text-blue-700">{item.nama}</h3>
              <div className="mt-1 text-xs text-slate-600">
                <p>
                  <strong>Desa:</strong> {item.dim_lokasi.desa_kelurahan}
                </p>
                <p>
                  <strong>Kec:</strong> {item.dim_lokasi.kecamatan}
                </p>
              </div>
              <div className="mt-2 border-t pt-2 text-[10px] text-slate-400">
                Lat: {item.dim_lokasi.latitude.toFixed(5)}, Lng:{' '}
                {item.dim_lokasi.longitude.toFixed(5)}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
