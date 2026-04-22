"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Memanggil komponen peta secara dinamis (No SSR)
const MapComponent = dynamic(() => import('@/components/map/MustahikMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Memuat Data Spasial Mustahik...</p>
      </div>
    </div>
  )
});

export default function MustahikSpasialPage() {
  const [allPoints, setAllPoints] = useState([]);
  const [filteredPoints, setFilteredPoints] = useState([]);
  const [filter, setFilter] = useState("Semua");

  useEffect(() => {
    async function fetchMapData() {
      const res = await fetch('/api/mustahik/map');
      const data = await res.json();
      setAllPoints(data);
      setFilteredPoints(data);
    }
    fetchMapData();
  }, []);

  // Logika Filter Kategori
  useEffect(() => {
    if (filter === "Semua") {
      setFilteredPoints(allPoints);
    } else {
      setFilteredPoints(allPoints.filter((p: any) => p.kategori === filter));
    }
  }, [filter, allPoints]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header Bagian Presentation Layer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Analisis Spasial Mustahik
          </h1>
          <p className="text-gray-500 mt-1">
            Visualisasi persebaran penerima manfaat Dompet Ummat Kalimantan Barat.
          </p>
        </div>

        {/* Kontrol Filter */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border">
          <span className="text-sm font-medium text-gray-600 ml-2">Filter Kategori:</span>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 p-2 outline-none"
          >
            <option value="Semua">Semua Golongan</option>
            <option value="Fakir">Fakir</option>
            <option value="Miskin">Miskin</option>
            <option value="Fisabilillah">Fisabilillah</option>
            <option value="Muallaf">Muallaf</option>
          </select>
        </div>
      </div>

      {/* Area Peta (Artifact Utama) */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden h-[650px]">
          <MapComponent points={filteredPoints} />
        </div>
      </div>

      {/* Ringkasan Data Bawah Peta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider">Total Titik</p>
          <p className="text-2xl font-bold text-blue-900">{filteredPoints.length} Lokasi</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Cakupan Wilayah</p>
          <p className="text-2xl font-bold text-gray-800">Kalimantan Barat</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <p className="text-green-600 text-sm font-semibold uppercase tracking-wider">Status Data</p>
          <p className="text-2xl font-bold text-green-900">Real-time SSOT</p>
        </div>
      </div>
    </div>
  );
}