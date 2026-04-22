"use client";

import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Filter, MapPin } from 'lucide-react'; // Tambahkan icon untuk UI

// Import Recharts untuk Drilldown Chart
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

// Konfigurasi Icon Marker
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const BAR_COLORS = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'];

interface MapProps {
    points: any[];
}

export default function MustahikMap({ points }: MapProps) {
    const defaultCenter: [number, number] = [-0.0263, 109.3425]; // Fokus ke Kalbar
    
    // --- STATE FILTER ---
    const [selectedKategori, setSelectedKategori] = useState("Semua");

    // --- LOGIKA FILTER DATA ---
    const filteredPoints = useMemo(() => {
        if (selectedKategori === "Semua") return points;
        return points.filter(p => p.kategori === selectedKategori);
    }, [points, selectedKategori]);

    // --- PROSES DATA UNTUK CHART (Berdasarkan data yang sudah difilter) ---
    const chartData = useMemo(() => {
        const aggregation: Record<string, number> = {};
        
        filteredPoints.forEach((p) => {
            const wilayah = p.wilayah?.split(',').pop()?.trim() || "Lainnya";
            aggregation[wilayah] = (aggregation[wilayah] || 0) + 1;
        });

        return Object.entries(aggregation)
            .map(([wilayah, jumlahMustahik]) => ({ wilayah, jumlahMustahik }))
            .sort((a, b) => b.jumlahMustahik - a.jumlahMustahik)
            .slice(0, 5); 
    }, [filteredPoints]);

    // List kategori unik untuk dropdown filter
    const kategoriList = useMemo(() => {
        const set = new Set(points.map(p => p.kategori));
        return ["Semua", ...Array.from(set)];
    }, [points]);

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-700">
            
            {/* TOOLBAR FILTER */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                        <Filter className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Filter Spasial</h4>
                        <p className="text-xs font-bold text-slate-700">Otomasi Berdasarkan Warehouse</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Kategori PM:</label>
                    <select 
                        value={selectedKategori}
                        onChange={(e) => setSelectedKategori(e.target.value)}
                        className="text-xs font-bold bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none p-2 cursor-pointer"
                    >
                        {kategoriList.map(kat => (
                            <option key={kat} value={kat}>{kat}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* BAGIAN PETA */}
                <div className="lg:col-span-2 relative bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden" style={{ minHeight: '500px' }}>
                    <MapContainer
                        center={defaultCenter}
                        zoom={8}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; Dompet Ummat Kalbar'
                        />

                        <MarkerClusterGroup
                            chunkedLoading
                            maxClusterRadius={60}
                            showCoverageOnHover={true}
                        >
                            {filteredPoints.map((p) => (
                                <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}>
                                    <Popup>
                                        <div className="text-sm p-1 font-sans">
                                            <p className="font-black text-slate-800 uppercase tracking-tight">{p.nama}</p>
                                            <p className="text-emerald-600 text-[10px] font-black uppercase my-1">{p.kategori}</p>
                                            <p className="text-slate-500 text-xs leading-tight">{p.alamat}</p>
                                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-slate-400 text-[10px] italic">
                                                <MapPin className="h-2 w-2" /> {p.wilayah}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MarkerClusterGroup>
                    </MapContainer>
                </div>

                {/* BAGIAN CHART */}
                <div className="rounded-2xl bg-white p-5 shadow-md border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
                        Statistik <span className="text-emerald-600">Wilayah</span>
                    </h3>
                    <p className="mb-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {selectedKategori === "Semua" ? "Seluruh Kategori" : `Kategori: ${selectedKategori}`}
                    </p>

                    {chartData.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center text-sm text-slate-400 italic">
                            Tidak ada data di wilayah ini
                        </div>
                    ) : (
                        <div className="flex-1 w-full min-h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="wilayah"
                                        width={100}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        formatter={(value) => [value, 'Mustahik']}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            fontSize: '11px',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                    <Bar dataKey="jumlahMustahik" radius={[0, 4, 4, 0]} barSize={20}>
                                        {chartData.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={BAR_COLORS[index % BAR_COLORS.length]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Hasil Filter</span>
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{filteredPoints.length} Data</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}