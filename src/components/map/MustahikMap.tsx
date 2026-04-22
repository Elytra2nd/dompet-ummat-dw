"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster'; // Import library cluster
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Perbaikan icon marker agar muncul dengan benar
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapProps {
  points: any[];
}

export default function MustahikMap({ points }: MapProps) {
  const defaultCenter: [number, number] = [-0.0263, 109.3425]; // Fokus ke Kalbar

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={8} 
      style={{ height: '100%', width: '100%', minHeight: '500px' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; Dompet Ummat Kalbar'
      />

      {/* Membungkus Marker dengan Cluster Group */}
      <MarkerClusterGroup
        chunkedLoading // Optimasi performa untuk ribuan data
        maxClusterRadius={60} // Jarak maksimal antar marker untuk digabung
        showCoverageOnHover={true} // Menampilkan area cakupan saat kursor di atas cluster
      >
        {points.map((p) => (
          <Marker 
            key={p.id} 
            position={[p.lat, p.lng]} 
            icon={icon}
          >
            <Popup>
              <div className="text-sm p-1">
                <p className="font-bold text-gray-800">{p.nama}</p>
                <p className="text-blue-600 text-xs font-semibold my-1">{p.kategori}</p>
                <p className="text-gray-600 text-xs leading-tight">{p.alamat}</p>
                <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                   <span className="text-gray-400 text-[10px] italic">{p.wilayah}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}