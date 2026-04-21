'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Activity, MapPin, User, Truck, Clock, Search, 
  AlertCircle, Filter, RefreshCw, Plus, Edit3, Trash2, X, Save, Eye,
  ChevronLeft, ChevronRight,
  Loader2
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
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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
      toast.error("Gagal sinkronisasi data")
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
    setLoading(true)
    const method = isEditing ? 'PUT' : 'POST'
    try {
      const res = await fetch('/api/operasional/ambulan', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success(isEditing ? "Data diperbarui" : "Layanan berhasil dicatat")
        setIsFormOpen(false)
        fetchAmbulan()
      }
    } catch (error) {
      toast.error("Gagal memproses data")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sk: number) => {
    try {
      const res = await fetch(`/api/operasional/ambulan?sk=${sk}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("Catatan layanan dihapus")
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

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (!mounted) return null

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50/50 min-h-screen font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="text-rose-500 h-6 w-6" /> Monitoring Ambulan
          </h1>
          <p className="text-slate-500 text-sm">Manajemen data transaksi layanan operasional</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAmbulan} className="bg-white shadow-sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sinkronkan
          </Button>
          <Button onClick={() => { setIsEditing(false); setIsFormOpen(true); }} className="bg-rose-600 hover:bg-rose-700 shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Catat Layanan
          </Button>
        </div>
      </div>

      {/* FORM SECTION */}
      {isFormOpen && (
        <Card className="border-none shadow-md animate-in fade-in zoom-in-95 duration-200">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Truck className="h-4 w-4 text-rose-500" /> {isEditing ? 'Koreksi Data' : 'Tambah Layanan Baru'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)} className="rounded-full h-8 w-8"><X className="h-4 w-4"/></Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600">SK Pasien</Label>
                <Input required type="number" value={formData.sk_pasien} onChange={(e) => setFormData({...formData, sk_pasien: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600">SK Lokasi Tujuan</Label>
                <Input required type="number" value={formData.sk_lokasi} onChange={(e) => setFormData({...formData, sk_lokasi: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600">Armada</Label>
                <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={formData.armada} onChange={(e) => setFormData({...formData, armada: e.target.value})}>
                  <option value="Ambulan_1__KB_1234_XX_">Unit 1 (KB 1234 XX)</option>
                  <option value="Ambulan_2__KB_5678_YY_">Unit 2 (KB 5678 YY)</option>
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button type="submit" disabled={loading} className="bg-slate-900 px-8">
                  {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Simpan Ke Warehouse
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* FILTER & TABLE */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <div className="p-4 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input placeholder="Cari pasien atau ID..." className="pl-10 bg-white" value={search} onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}} />
          </div>
          <div className="flex items-center gap-2 bg-white border rounded-md px-3 h-10">
            <Filter className="h-4 w-4 text-slate-400" />
            <select className="text-sm bg-transparent outline-none min-w-[150px]" value={filterKategori} onChange={(e) => {setFilterKategori(e.target.value); setCurrentPage(1);}}>
              <option value="Semua">Semua Kategori</option>
              <option value="Antar_Pasien">Antar Pasien</option>
              <option value="Jemput_Pasien">Jemput Pasien</option>
              <option value="Layanan_Jenazah">Layanan Jenazah</option>
            </select>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-xs">Layanan</TableHead>
                <TableHead className="font-bold text-xs">Data Pasien</TableHead>
                <TableHead className="font-bold text-xs">Logistik</TableHead>
                <TableHead className="font-bold text-xs text-right pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400">Memuat data...</TableCell></TableRow>
              ) : currentItems.map((item) => (
                <TableRow key={item.sk_fakta_layanan_ambulan} className="hover:bg-slate-50 transition-colors">
                  <TableCell>
                    <Badge variant="secondary" className="mb-1 font-semibold text-[10px] bg-rose-50 text-rose-700 hover:bg-rose-50 border-none">
                      {item.kategori_layanan?.replace(/_/g, ' ')}
                    </Badge>
                    <p className="text-[10px] font-mono text-slate-400">{item.id_transaksi}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-sm text-slate-900">{item.dim_pasien_ambulan?.nama_pasien || 'Pasien Umum'}</p>
                    <p className="text-xs text-slate-500">{item.dim_pasien_ambulan?.status_ekonomi || '-'}</p>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-slate-600 gap-1"><Truck size={12}/> {item.armada?.split('__')[0].replace(/_/g, ' ')}</div>
                      <div className="flex items-center text-xs text-slate-400 gap-1"><MapPin size={12} className="text-rose-400"/> {item.dim_lokasi?.kabupaten_kota || 'Pontianak'}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-1">
                      <Link href={`/operasional/ambulan/${item.sk_fakta_layanan_ambulan}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600"><Eye size={16} /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => startEdit(item)}><Edit3 size={16} /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Catatan Layanan?</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">Tindakan ini permanen. Data ID <strong>{item.id_transaksi}</strong> akan dihapus dari tabel fakta warehouse.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.sk_fakta_layanan_ambulan)} className="bg-rose-600">Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* PAGINATION */}
          <div className="p-4 border-t flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500">Halaman {currentPage} dari {totalPages || 1}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(p-1, 1))} disabled={currentPage === 1}><ChevronLeft size={16}/></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight size={16}/></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}