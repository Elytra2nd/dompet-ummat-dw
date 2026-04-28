"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Filter, MapPin, ChevronRight, CornerLeftUp } from 'lucide-react';

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

const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const BAR_COLORS = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#059669', '#047857'];

interface MapProps {
    points: any[];
}

// Komponen helper untuk menganimasi kamera peta (flyToBounds) ke titik-titik yang tersaring
function MapUpdater({ points, defaultCenter }: { points: any[], defaultCenter: [number, number] }) {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length === 0) {
            map.flyTo(defaultCenter, 7, { duration: 1.5 });
            return;
        }

        // Kumpulkan semua titik koordinat yang valid (bukan NaN)
        const validPoints = points.filter(p => !isNaN(p.lat) && !isNaN(p.lng));
        if (validPoints.length === 0) return;

        const lats = validPoints.map(p => p.lat);
        const lngs = validPoints.map(p => p.lng);

        const bounds = L.latLngBounds(
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)]
        );

        map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5, maxZoom: 14 });
    }, [points, map, defaultCenter]);

    return null;
}

export default function MustahikMap({ points }: MapProps) {
    const defaultCenter: [number, number] = [-0.0263, 109.3425];
    
    // --- STATE FILTER ---
    const [selectedKategori, setSelectedKategori] = useState("Semua");
    
    // --- STATE DRILL DOWN OLAP ---
    const [drillLevel, setDrillLevel] = useState<'provinsi' | 'kabupaten' | 'kecamatan'>('provinsi');
    const [selectedKab, setSelectedKab] = useState<string | null>(null);
    const [selectedKec, setSelectedKec] = useState<string | null>(null);

    // --- LOGIKA FILTER DATA ---
    const filteredPoints = useMemo(() => {
        let p = points;
        if (selectedKategori !== "Semua") {
            p = p.filter(x => x.kategori === selectedKategori);
        }
        
        // Filter spasial berdasarkan drill down
        if (drillLevel === 'kabupaten' && selectedKab) {
            p = p.filter(x => x.kabupaten === selectedKab);
        } else if (drillLevel === 'kecamatan' && selectedKab && selectedKec) {
            p = p.filter(x => x.kabupaten === selectedKab && x.kecamatan === selectedKec);
        }
        
        return p;
    }, [points, selectedKategori, drillLevel, selectedKab, selectedKec]);

    // --- PROSES DATA UNTUK CHART ---
    const chartData = useMemo(() => {
        const aggregation: Record<string, number> = {};
        
        filteredPoints.forEach((p) => {
            let label = "";
            if (drillLevel === 'provinsi') {
                label = p.kabupaten;
            } else if (drillLevel === 'kabupaten') {
                label = p.kecamatan;
            } else if (drillLevel === 'kecamatan') {
                label = p.desa;
            }
            
            if (!label || label === "Tidak Diketahui" || label === "") label = "Lainnya";
            
            aggregation[label] = (aggregation[label] || 0) + 1;
        });

        return Object.entries(aggregation)
            .map(([wilayah, jumlahMustahik]) => ({ wilayah, jumlahMustahik }))
            .sort((a, b) => b.jumlahMustahik - a.jumlahMustahik)
            .slice(0, 7); 
    }, [filteredPoints, drillLevel]);

    const kategoriList = useMemo(() => {
        const set = new Set(points.map(p => p.kategori));
        return ["Semua", ...Array.from(set)];
    }, [points]);

    // Handler untuk klik bar pada chart
    const handleBarClick = (data: any) => {
        // Recharts <Bar onClick> memberikan data bar yang di-klik secara langsung
        const clickedWilayah = data?.wilayah || data?.payload?.wilayah || (data?.activePayload && data?.activePayload[0]?.payload?.wilayah);
        
        if (!clickedWilayah || clickedWilayah === "Lainnya") return; // Hindari drill down jika nilainya 'Lainnya'

        if (drillLevel === 'provinsi') {
            setSelectedKab(clickedWilayah);
            setDrillLevel('kabupaten');
        } else if (drillLevel === 'kabupaten') {
            setSelectedKec(clickedWilayah);
            setDrillLevel('kecamatan');
        }
    };

    // Breadcrumb Actions
    const handleCrumbProvinsi = () => {
        setDrillLevel('provinsi');
        setSelectedKab(null);
        setSelectedKec(null);
    }
    
    const handleCrumbKabupaten = () => {
        if (selectedKab) {
            setDrillLevel('kabupaten');
            setSelectedKec(null);
        }
    }

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-700">
            
            {/* TOOLBAR FILTER & BREADCRUMBS */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                
                {/* BREADCRUMBS OLAP */}
                <div className="flex items-center flex-wrap gap-2 text-xs font-bold text-slate-500">
                    <button 
                        onClick={handleCrumbProvinsi}
                        className={`flex items-center gap-1 hover:text-indigo-600 transition-colors ${drillLevel === 'provinsi' ? 'text-indigo-600 px-2 py-1 bg-indigo-50 rounded-md' : ''}`}
                    >
                        <MapPin className="h-3 w-3" /> Prov. Kalimantan Barat
                    </button>
                    
                    {(drillLevel === 'kabupaten' || drillLevel === 'kecamatan') && selectedKab && (
                        <>
                            <ChevronRight className="h-3 w-3 text-slate-300" />
                            <button 
                                onClick={handleCrumbKabupaten}
                                className={`hover:text-indigo-600 transition-colors ${drillLevel === 'kabupaten' ? 'text-indigo-600 px-2 py-1 bg-indigo-50 rounded-md' : ''}`}
                            >
                                {selectedKab}
                            </button>
                        </>
                    )}

                    {drillLevel === 'kecamatan' && selectedKec && (
                        <>
                            <ChevronRight className="h-3 w-3 text-slate-300" />
                            <span className="text-indigo-600 px-2 py-1 bg-indigo-50 rounded-md">
                                Kec. {selectedKec}
                            </span>
                        </>
                    )}
                </div>

                {/* FILTER KATEGORI */}
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <Filter className="h-4 w-4 text-emerald-600 ml-2" />
                    <select 
                        value={selectedKategori}
                        onChange={(e) => setSelectedKategori(e.target.value)}
                        className="text-xs font-bold bg-transparent border-none focus:ring-0 outline-none pr-4 cursor-pointer text-slate-700"
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
                        zoom={drillLevel === 'provinsi' ? 7 : drillLevel === 'kabupaten' ? 9 : 11}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                    >
                        <MapUpdater points={filteredPoints} defaultCenter={defaultCenter} />
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
                                            <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1 text-slate-400 text-[10px] italic">
                                                <div className="flex items-center gap-1"><MapPin className="h-2 w-2" /> {p.kabupaten}</div>
                                                <div className="ml-3">- Kec. {p.kecamatan}</div>
                                                <div className="ml-3">- Desa {p.desa}</div>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MarkerClusterGroup>
                    </MapContainer>
                </div>

                {/* BAGIAN CHART DRILL DOWN */}
                <div className="rounded-2xl bg-white p-5 shadow-md border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center justify-between">
                        <div>Statistik <span className="text-emerald-600">Wilayah</span></div>
                        
                        {drillLevel !== 'provinsi' && (
                            <button 
                                onClick={drillLevel === 'kecamatan' ? handleCrumbKabupaten : handleCrumbProvinsi}
                                className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 hover:text-indigo-600 px-2 py-1 rounded transition-colors"
                            >
                                <CornerLeftUp className="h-3 w-3" /> Roll Up
                            </button>
                        )}
                    </h3>
                    <p className="mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Tingkat: {drillLevel === 'provinsi' ? 'Kabupaten/Kota' : drillLevel === 'kabupaten' ? 'Kecamatan' : 'Desa/Kelurahan'}
                    </p>
                    <p className="mb-6 text-[10px] font-bold text-indigo-500 italic">
                        *Klik pada grafik untuk mempersempit wilayah (Drill Down)
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
                                    style={{ cursor: drillLevel !== 'kecamatan' ? 'pointer' : 'default' }}
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
                                    <Bar 
                                        dataKey="jumlahMustahik" 
                                        radius={[0, 4, 4, 0]} 
                                        barSize={20}
                                        onClick={handleBarClick}
                                    >
                                        {chartData.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={BAR_COLORS[index % BAR_COLORS.length]}
                                                className="transition-opacity hover:opacity-80"
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Total Objek Peta</span>
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{filteredPoints.length} Data</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}