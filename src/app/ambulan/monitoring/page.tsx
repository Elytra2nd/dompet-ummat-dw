'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Activity, MapPin, User, Truck, Clock, Search, 
  AlertCircle, Filter, RefreshCw, Plus, Edit3, Trash2, X, Save, Eye
} from 'lucide-react'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface AmbulanLog {
  sk_fakta_layanan_ambulan: number;
  id_transaksi: string;
  kategori_layanan: string;
  armada: string;
  sk_pasien: number;
  sk_lokasi: number;
  sk_tanggal_layanan: number;
  jam: string;
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
  const [mounted, setMounted] = useState(false)
  
  // STATE CRUD
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    sk_fakta_layanan_ambulan: 0,
    sk_pasien: '',
    sk_tanggal: new Date().toISOString().split('T')[0].replace(/-/g, ''),
    jam: 'Pagi__06_00_12_00_',
    armada: 'Ambulan_1__KB_1234_XX_',
    kategori: 'Antar_Pasien',
    sk_lokasi: '1'
  })

  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('Semua')

  const fetchAmbulan = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/operasional/ambulan`, { cache: 'no-store' })
      const d = await res.json()
      setData(Array.isArray(d) ? d : [])
    } catch (error) {
      toast.error("Gagal sinkronisasi data warehouse")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchAmbulan()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = isEditing ? 'PUT' : 'POST'
    try {
      const res = await fetch('/api/operasional/ambulan', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success(isEditing ? "Data warehouse diperbarui" : "Layanan baru dicatat ke fakta")
        setIsFormOpen(false)
        fetchAmbulan()
      }
    } catch (error) {
      toast.error("Gagal menyimpan ke warehouse")
    }
  }

  const handleDelete = async (sk: number) => {
    try {
      const res = await fetch(`/api/operasional/ambulan?sk=${sk}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("Log layanan berhasil dihapus")
        fetchAmbulan()
      }
    } catch (error) {
      toast.error("Gagal menghapus data")
    }
  }

  const startEdit = (item: AmbulanLog) => {
    setFormData({
      sk_fakta_layanan_ambulan: item.sk_fakta_layanan_ambulan,
      sk_pasien: item.sk_pasien.toString(),
      sk_tanggal: item.sk_tanggal_layanan.toString(),
      jam: item.jam,
      armada: item.armada,
      kategori: item.kategori_layanan,
      sk_lokasi: item.sk_lokasi.toString()
    })
    setIsEditing(true)
    setIsFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch = 
        item.dim_pasien_ambulan?.nama_pasien?.toLowerCase().includes(search.toLowerCase()) ||
        item.id_transaksi.toLowerCase().includes(search.toLowerCase());
      const matchKategori = filterKategori === 'Semua' || item.kategori_layanan === filterKategori;
      return matchSearch && matchKategori;
    });
  }, [data, search, filterKategori]);

  if (!mounted) return null

  return (
    <div className="p-4 md:p-8 space-y-6 font-sans bg-slate-50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <Activity className="text-rose-600 h-8 w-8" /> Monitoring <span className="text-rose-600">Ambulan</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Transactional Fact Table • BIDA Platform</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAmbulan} className="font-bold border-2 bg-white">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sync Data
          </Button>
          <Button onClick={() => { setIsEditing(false); setIsFormOpen(true); }} className="bg-rose-600 hover:bg-rose-700 font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_0px_rgba(159,18,57,1)]">
            <Plus className="mr-2 h-4 w-4" /> Catat Layanan
          </Button>
        </div>
      </div>

      {/* FORM INPUT SECTION */}
      {isFormOpen && (
        <Card className="border-4 border-slate-900 rounded-none shadow-none animate-in fade-in slide-in-from-top-4 bg-white">
          <CardHeader className="bg-rose-50/50 py-3 border-b-2 border-slate-900 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase text-rose-700 tracking-widest flex items-center gap-2">
              <Truck className="h-4 w-4" /> {isEditing ? 'Koreksi Data Layanan' : 'Input Layanan Baru'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)} className="h-6 w-6"><X className="h-4 w-4"/></Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">SK Pasien (Dimensi)</Label>
                <Input required type="number" className="font-bold" value={formData.sk_pasien} onChange={(e) => setFormData({...formData, sk_pasien: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Tujuan (SK Lokasi)</Label>
                <Input required type="number" className="font-bold" value={formData.sk_lokasi} onChange={(e) => setFormData({...formData, sk_lokasi: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Armada Unit</Label>
                <select className="flex h-10 w-full rounded-none border-2 border-slate-900 bg-white px-3 py-2 text-sm font-black uppercase" value={formData.armada} onChange={(e) => setFormData({...formData, armada: e.target.value})}>
                  <option value="Ambulan_1__KB_1234_XX_">Unit Ambulan 1</option>
                  <option value="Ambulan_2__KB_5678_YY_">Unit Ambulan 2</option>
                  <option value="Ambulan_Jenazah__KB_9999_ZZ_">Unit Jenazah</option>
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end gap-2 border-t-2 border-slate-100 pt-4">
                <Button type="submit" className="bg-slate-900 font-black uppercase text-[10px] px-8 rounded-none">
                  <Save className="mr-2 h-4 w-4" /> {isEditing ? 'Sync to Warehouse' : 'Simpan Transaksi'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* FILTER & SEARCH */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-3 border-2 border-slate-200 shadow-none rounded-none">
           <div className="relative p-1 flex items-center bg-white">
              <Search className="absolute left-4 h-4 w-4 text-slate-400" />
              <Input placeholder="Cari Pasien atau ID Transaksi..." className="pl-12 border-none shadow-none font-bold text-slate-700 h-10 focus-visible:ring-0" value={search} onChange={(e) => setSearch(e.target.value)} />
           </div>
        </Card>
        <Card className="border-2 border-slate-200 shadow-none rounded-none flex items-center px-4 bg-white">
          <Filter className="h-4 w-4 text-slate-400 mr-3" />
          <select className="w-full bg-transparent text-[10px] font-black text-slate-600 outline-none uppercase" value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}>
            <option value="Semua">Semua Layanan</option>
            <option value="Antar_Pasien">Antar Pasien</option>
            <option value="Jemput_Pasien">Jemput Pasien</option>
            <option value="Layanan_Jenazah">Layanan Jenazah</option>
          </select>
        </Card>
      </div>

      {/* DATA TABLE */}
      <Card className="border-2 border-slate-900 shadow-none rounded-none overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-900 border-b-2 border-slate-900">
              <TableRow className="hover:bg-slate-900 border-none">
                <TableHead className="text-white font-black text-[10px] uppercase py-4">Layanan & ID</TableHead>
                <TableHead className="text-white font-black text-[10px] uppercase">Informasi Pasien</TableHead>
                <TableHead className="text-white font-black text-[10px] uppercase">Logistik & Unit</TableHead>
                <TableHead className="text-white font-black text-[10px] uppercase text-right pr-8">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20 font-black text-slate-300 uppercase tracking-widest animate-pulse">Retrieving Fact Data...</TableCell></TableRow>
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <TableRow key={item.sk_fakta_layanan_ambulan} className="hover:bg-rose-50/50 transition-colors border-b border-slate-100 group">
                    <TableCell>
                      <Badge variant="outline" className="font-black text-[9px] uppercase border-rose-200 text-rose-600 bg-rose-50 mb-1 rounded-none px-2">
                        {item.kategori_layanan?.replace(/_/g, ' ')}
                      </Badge>
                      <p className="font-mono text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.id_transaksi}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-black text-slate-800 uppercase text-sm leading-tight group-hover:text-rose-600 transition-colors">{item.dim_pasien_ambulan?.nama_pasien || 'PASIEN UMUM'}</p>
                      <p className="text-[9px] text-slate-400 font-black mt-1 uppercase tracking-widest">{item.dim_pasien_ambulan?.status_ekonomi || 'NON-SUBSIDI'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-600 uppercase flex items-center gap-1">
                          <Truck className="h-3 w-3 text-slate-400"/> {item.armada?.split('__')[0].replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                          <MapPin className="h-3 w-3 text-rose-500"/> {item.dim_lokasi?.kabupaten_kota || 'PONTIANAK'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2 items-center">
                        {/* DETAIL */}
                        <Link href={`/operasional/ambulan/${item.sk_fakta_layanan_ambulan}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* EDIT */}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => startEdit(item)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>

                        {/* HAPUS */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-none border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(225,29,72,1)]">
                            <AlertDialogHeader>
                              <div className="flex items-center gap-3 text-rose-600 mb-2">
                                <div className="p-2 bg-rose-50 rounded-full"><AlertCircle className="h-6 w-6" /></div>
                                <AlertDialogTitle className="font-black text-xl uppercase tracking-tighter">Hapus Log Layanan?</AlertDialogTitle>
                              </div>
                              <AlertDialogDescription className="font-bold text-slate-600 text-sm">
                                Tindakan ini akan menghapus permanen catatan <span className="text-slate-900 underline">{item.id_transaksi}</span>. Data fakta di warehouse akan hilang selamanya.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-4 gap-2">
                              <AlertDialogCancel className="font-black uppercase text-[10px] rounded-none border-2 border-slate-900">Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.sk_fakta_layanan_ambulan)} className="bg-rose-600 hover:bg-rose-700 font-black uppercase text-[10px] rounded-none px-6">Ya, Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-slate-300 uppercase tracking-widest italic">No Fact Data Found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}