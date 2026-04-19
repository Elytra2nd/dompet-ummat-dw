'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Activity, 
  MapPin, 
  User, 
  Truck, 
  Clock, 
  Search,
  AlertCircle,
  Filter,
  RefreshCw
} from 'lucide-react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface AmbulanLog {
  sk_fakta_layanan_ambulan: number;
  id_transaksi: string;
  kategori_layanan: string;
  armada: string;
  dim_pasien_ambulan?: {
    nama_pasien: string;
    status_ekonomi: string;
  };
  dim_lokasi?: {
    kabupaten_kota: string;
  };
}

export default function MonitoringAmbulanPage() {
  const [data, setData] = useState<AmbulanLog[]>([])
  const [loading, setLoading] = useState(true)
  
  // STATE SEARCH & FILTER
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('Semua')

  const fetchAmbulan = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/operasional/ambulan?t=${new Date().getTime()}`)
      const d = await res.json()
      setData(Array.isArray(d) ? d : [])
    } catch (error) {
      console.error("Gagal fetch data ambulan:", error)
      toast.error("Gagal sinkronisasi data armada")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAmbulan()
  }, [])

  // 2. LOGIKA SEARCH & FILTERING (Client-side)
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch = 
        item.dim_pasien_ambulan?.nama_pasien?.toLowerCase().includes(search.toLowerCase()) ||
        item.id_transaksi.toLowerCase().includes(search.toLowerCase());
      
      const matchKategori = filterKategori === 'Semua' || item.kategori_layanan === filterKategori;
      
      return matchSearch && matchKategori;
    });
  }, [data, search, filterKategori]);

  return (
    <div className="p-4 md:p-8 space-y-6 font-sans bg-slate-50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <Activity className="text-rose-600 h-8 w-8" /> Monitoring <span className="text-rose-600">Ambulan</span>
          </h1>
          <p className="text-slate-500 font-medium">Log layanan armada Dompet Ummat secara terpadu.</p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchAmbulan}
          className="font-bold border-2 hover:bg-rose-50 bg-white"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Log
        </Button>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-3 border-2 shadow-sm">
           <div className="relative p-2 flex items-center">
              <Search className="absolute left-4 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari berdasarkan nama pasien atau ID Transaksi..." 
                className="pl-10 border-none shadow-none focus-visible:ring-0 font-bold text-slate-700"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </Card>
        <Card className="border-2 shadow-sm flex items-center px-4 bg-white">
          <Filter className="h-4 w-4 text-slate-400 mr-3" />
          <select 
            className="w-full bg-transparent text-sm font-black text-slate-600 outline-none cursor-pointer"
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
          >
            <option value="Semua">Semua Layanan</option>
            <option value="Antar_Pasien">Antar Pasien</option>
            <option value="Jemput_Pasien">Jemput Pasien</option>
            <option value="Layanan_Jenazah">Layanan Jenazah</option>
            <option value="Gawat_Darurat">Gawat Darurat</option>
          </select>
        </Card>
      </div>

      {/* STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-rose-500">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Total Perjalanan</p>
                <h3 className="text-3xl font-black text-slate-800">{filteredData.length}</h3>
              </div>
              <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><Truck /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN TABLE */}
      <Card className="border-none shadow-xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-900 text-white py-4">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Clock className="h-4 w-4 text-rose-400" /> Live Service Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow>
                <TableHead className="font-black text-[10px] uppercase w-[200px]">Layanan & ID</TableHead>
                <TableHead className="font-black text-[10px] uppercase">Pasien</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-center">Armada</TableHead>
                <TableHead className="font-black text-[10px] uppercase">Lokasi Tujuan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sinkronisasi Warehouse...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <TableRow key={item.sk_fakta_layanan_ambulan} className="group hover:bg-rose-50/30 transition-colors">
                    <TableCell>
                      <Badge variant="secondary" className="mb-1 font-black text-[9px] uppercase bg-rose-100 text-rose-700 border-none">
                        {item.kategori_layanan?.replace(/_/g, ' ')}
                      </Badge>
                      <p className="font-mono text-[10px] font-bold text-indigo-600 leading-none">{item.id_transaksi}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border-2 border-white shadow-sm">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 uppercase text-sm leading-tight">{item.dim_pasien_ambulan?.nama_pasien || 'UMUM / TANPA NAMA'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{item.dim_pasien_ambulan?.status_ekonomi || 'Data Tidak Tersedia'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-black text-[10px] text-slate-600 border-slate-200">
                        {item.armada?.split('(')[0] || 'Unit Utama'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-tighter truncate max-w-[150px]">
                          {item.dim_lokasi?.kabupaten_kota || 'Area Pontianak'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <AlertCircle className="h-10 w-10 opacity-20" />
                      <p className="font-bold text-sm italic">Log perjalanan tidak ditemukan.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}