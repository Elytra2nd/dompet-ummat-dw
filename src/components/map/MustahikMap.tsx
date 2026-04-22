"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
  const defaultCenter: [number, number] = [-0.0263, 109.3425]; // Pontianak

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={8} 
      style={{ height: '100%', width: '100%', minHeight: '500px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; Dompet Ummat Kalbar'
      />
      {points.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold">{p.nama}</p>
              <p className="text-blue-600 text-xs font-semibold">{p.kategori}</p>
              <p className="text-gray-600 text-xs">{p.alamat}</p>
              <p className="text-gray-400 text-[10px] italic mt-1">{p.wilayah}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}