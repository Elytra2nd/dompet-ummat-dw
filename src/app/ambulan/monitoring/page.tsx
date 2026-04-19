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
  const [mounted, setMounted] = useState(false) // UNTUK FIX ERROR #418
  
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('Semua')

  const fetchAmbulan = async () => {
    try {
      setLoading(true)
      // Gunakan timestamp manual agar tidak memicu hydration error di URL
      const res = await fetch(`/api/operasional/ambulan`, { cache: 'no-store' })
      const d = await res.json()
      setData(Array.isArray(d) ? d : [])
    } catch (error) {
      toast.error("Gagal sinkronisasi data armada")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true) // Menandakan komponen sudah di browser
    fetchAmbulan()
  }, [])

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch = 
        item.dim_pasien_ambulan?.nama_pasien?.toLowerCase().includes(search.toLowerCase()) ||
        item.id_transaksi.toLowerCase().includes(search.toLowerCase());
      const matchKategori = filterKategori === 'Semua' || item.kategori_layanan === filterKategori;
      return matchSearch && matchKategori;
    });
  }, [data, search, filterKategori]);

  // JIKA BELUM MOUNTED, TAMPILKAN LOADING SEDERHANA AGAR TIDAK MISMATCH
  if (!mounted) return <div className="p-8 font-black text-slate-400">LOADING MONITORING...</div>

  return (
    <div className="p-4 md:p-8 space-y-6 font-sans bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <Activity className="text-rose-600 h-8 w-8" /> Monitoring <span className="text-rose-600">Ambulan</span>
          </h1>
          <p className="text-slate-500 font-medium italic">Data Warehouse Real-time Service Log</p>
        </div>
        
        <Button variant="outline" size="sm" onClick={fetchAmbulan} className="font-bold border-2 bg-white">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-3 border-2 shadow-sm">
           <div className="relative p-2 flex items-center">
              <Search className="absolute left-4 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari pasien atau ID..." 
                className="pl-10 border-none shadow-none font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </Card>
        <Card className="border-2 shadow-sm flex items-center px-4 bg-white">
          <Filter className="h-4 w-4 text-slate-400 mr-3" />
          <select 
            className="w-full bg-transparent text-sm font-black text-slate-600 outline-none"
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
          >
            <option value="Semua">Semua Layanan</option>
            <option value="Antar_Pasien">Antar Pasien</option>
            <option value="Jemput_Pasien">Jemput Pasien</option>
            <option value="Layanan_Jenazah">Layanan Jenazah</option>
          </select>
        </Card>
      </div>

      <Card className="border-none shadow-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-900">
              <TableRow className="hover:bg-slate-900">
                <TableHead className="text-white font-black text-[10px] uppercase">Layanan</TableHead>
                <TableHead className="text-white font-black text-[10px] uppercase">Pasien</TableHead>
                <TableHead className="text-white font-black text-[10px] uppercase text-center">Armada</TableHead>
                <TableHead className="text-white font-black text-[10px] uppercase">Tujuan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20 animate-pulse font-bold text-slate-400">SINKRONISASI DATA...</TableCell></TableRow>
              ) : filteredData.map((item) => (
                <TableRow key={item.sk_fakta_layanan_ambulan} className="hover:bg-rose-50/50">
                  <TableCell>
                    <Badge variant="outline" className="font-black text-[9px] uppercase border-rose-200 text-rose-600 bg-rose-50 mb-1">
                      {item.kategori_layanan?.replace(/_/g, ' ')}
                    </Badge>
                    <p className="font-mono text-[10px] font-bold text-slate-400">{item.id_transaksi}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-black text-slate-800 uppercase text-sm">{item.dim_pasien_ambulan?.nama_pasien || 'UMUM'}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{item.dim_pasien_ambulan?.status_ekonomi || '-'}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-black text-[10px]">{item.armada?.split('(')[0]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="h-3 w-3 text-rose-500" />
                      <span className="text-xs font-bold uppercase">{item.dim_lokasi?.kabupaten_kota || 'Pontianak'}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}