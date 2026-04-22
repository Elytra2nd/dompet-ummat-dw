"use client";

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

    // --- PROSES DATA UNTUK CHART (AGREGASI WILAYAH) ---
    const chartData = useMemo(() => {
        const aggregation: Record<string, number> = {};
        
        points.forEach((p) => {
            // Ambil nama wilayah (Kabupaten/Kota)
            const wilayah = p.wilayah?.split(',').pop()?.trim() || "Lainnya";
            aggregation[wilayah] = (aggregation[wilayah] || 0) + 1;
        });

        // Ubah ke format yang diterima Recharts dan urutkan
        return Object.entries(aggregation)
            .map(([wilayah, jumlahMustahik]) => ({ wilayah, jumlahMustahik }))
            .sort((a, b) => b.jumlahMustahik - a.jumlahMustahik)
            .slice(0, 5); // Ambil Top 5 Wilayah
    }, [points]);

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* BAGIAN PETA (Artifact Utama - Span 2 Kolom pada layar besar) */}
                <div className="lg:col-span-2 relative bg-white rounded-2xl shadow-md border overflow-hidden" style={{ minHeight: '500px' }}>
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
                            {points.map((p) => (
                                <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}>
                                    <Popup>
                                        <div className="text-sm p-1">
                                            <p className="font-bold text-gray-800">{p.nama}</p>
                                            <p className="text-emerald-600 text-xs font-semibold my-1">{p.kategori}</p>
                                            <p className="text-gray-600 text-xs leading-tight">{p.alamat}</p>
                                            <div className="mt-2 pt-2 border-t border-gray-100">
                                                <span className="text-gray-400 text-[10px] italic">{p.wilayah}</span>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MarkerClusterGroup>
                    </MapContainer>
                </div>

                {/* BAGIAN CHART (Drilldown Statistic - Span 1 Kolom) */}
                <div className="rounded-2xl bg-white p-5 shadow-md border flex flex-col">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
                        Statistik <span className="text-emerald-600">Wilayah</span>
                    </h3>
                    <p className="mb-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Top {chartData.length} Konsentrasi Mustahik
                    </p>

                    {chartData.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center text-sm text-slate-400 italic">
                            Tidak ada data untuk dianalisis
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
                                            fontSize: '12px',
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
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                            <span>Total Data Terproses</span>
                            <span className="text-emerald-600">{points.length} Jiwa</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}