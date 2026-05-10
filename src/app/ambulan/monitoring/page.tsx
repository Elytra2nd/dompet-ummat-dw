'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Activity, MapPin, User, Truck, Clock, Search, ArrowLeft,
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
import ImportButton from '@/components/import/ImportButton'
import Pagination from '@/components/ui/pagination-numbered'

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
      const res = await fetch(`/api/ambulan/monitoring`, { cache: 'no-store' })
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
    setLoading(true)
    const method = isEditing ? 'PUT' : 'POST'
    try {
      const res = await fetch('/api/ambulan/monitoring', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success(isEditing ? "Versi data diperbarui" : "Layanan baru berhasil dicatat")
        setIsFormOpen(false)
        fetchAmbulan()
      }
    } catch (error) {
      toast.error("Gagal memproses data fakta")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sk: number) => {
    try {
      const res = await fetch(`/api/ambulan/monitoring?sk=${sk}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("Catatan layanan berhasil dihapus")
        fetchAmbulan()
      }
    } catch (error) {
      toast.error("Gagal menghapus data dari warehouse")
    }
  }

  const startEdit = (item: AmbulanLog) => {
    setFormData({
      sk_fakta_layanan_ambulan: item.sk_fakta_layanan_ambulan,
      sk_pasien: item.sk_pasien?.toString() || '',
      sk_tanggal: item.sk_tanggal_layanan?.toString() || new Date().toISOString().split('T')[0].replace(/-/g, ''),
      jam: item.jam || 'Pagi__06_00_12_00_',
      armada: item.armada || 'Ambulan_1__KB_1234_XX_',
      kategori: item.kategori_layanan || 'Antar_Pasien',
      sk_lokasi: item.sk_lokasi?.toString() || '1'
    })
    setIsEditing(true)
    setIsFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch = 
        item.dim_pasien_ambulan?.nama_pasien?.toLowerCase().includes(search.toLowerCase()) ||
        item.id_transaksi?.toLowerCase().includes(search.toLowerCase());
      const matchKategori = filterKategori === 'Semua' || item.kategori_layanan === filterKategori;
      return matchSearch && matchKategori;
    });
  }, [data, search, filterKategori]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans text-slate-900">
      {/* HEADER BAR */}
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 text-slate-500 font-semibold hover:bg-slate-50">
            <Link href="/ambulan"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard Ambulan</Link>
          </Button>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-slate-900">
                <Activity className="h-7 w-7 text-rose-600 shrink-0" />
                Monitoring <span className="text-rose-600">Layanan</span>
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mt-1">
                Rekapitulasi Transaksi Bantuan Pasien & Masyarakat
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={fetchAmbulan} className="h-10 text-sm bg-white shadow-sm font-semibold">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sync
              </Button>
              <ImportButton modul="ambulan_layanan" onImportSuccess={fetchAmbulan} />
              <Link href="/ambulan/layanan">
                <Button className="bg-rose-600 hover:bg-rose-700 shadow-sm text-white font-semibold text-sm h-10 w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> Catat Layanan Baru
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-8">
      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-none shadow-sm bg-white rounded-xl">
          <CardContent className="p-4 text-center">
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Total Layanan</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{loading ? '-' : data.length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-rose-50 rounded-xl">
          <CardContent className="p-4 text-center">
            <p className="text-[9px] font-semibold text-rose-500 uppercase tracking-widest">Antar Pasien</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">{data.filter(i => i.kategori_layanan === 'Antar_Pasien').length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50 rounded-xl">
          <CardContent className="p-4 text-center">
            <p className="text-[9px] font-semibold text-amber-500 uppercase tracking-widest">Jemput Pasien</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{data.filter(i => i.kategori_layanan === 'Jemput_Pasien').length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-slate-100 rounded-xl">
          <CardContent className="p-4 text-center">
            <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Jenazah</p>
            <p className="text-2xl font-bold text-slate-700 mt-1">{data.filter(i => i.kategori_layanan === 'Layanan_Jenazah').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* FORM EDIT SECTION (Tetap muncul saat Edit diklik) */}
      {isFormOpen && isEditing && (
        <Card className="border-none shadow-lg animate-in fade-in zoom-in-95 duration-200 bg-white rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-indigo-500" /> Koreksi Data Transaksi
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)} className="rounded-full h-8 w-8" aria-label="Tutup form"><X className="h-4 w-4"/></Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600 uppercase">SK Pasien</Label>
                <Input required type="number" value={formData.sk_pasien} onChange={(e) => setFormData({...formData, sk_pasien: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600 uppercase">SK Lokasi</Label>
                <Input required type="number" value={formData.sk_lokasi} onChange={(e) => setFormData({...formData, sk_lokasi: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600 uppercase">Armada</Label>
                <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium" value={formData.armada} onChange={(e) => setFormData({...formData, armada: e.target.value})}>
                  <option value="Ambulan_1__KB_1234_XX_">Unit 1 (KB 1234 XX)</option>
                  <option value="Ambulan_2__KB_5678_YY_">Unit 2 (KB 5678 YY)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600 uppercase">Shift Waktu</Label>
                <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium" value={formData.jam} onChange={(e) => setFormData({...formData, jam: e.target.value})}>
                  <option value="Pagi__06_00_12_00_">Pagi (06:00-12:00)</option>
                  <option value="Siang__12_00_15_00_">Siang (12:00-15:00)</option>
                  <option value="Sore__15_00_18_00_">Sore (15:00-18:00)</option>
                  <option value="Malam__18_00_06_00_">Malam (18:00-06:00)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600 uppercase">Kategori Layanan</Label>
                <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium" value={formData.kategori} onChange={(e) => setFormData({...formData, kategori: e.target.value})}>
                  <option value="Antar_Pasien">Antar Pasien</option>
                  <option value="Jemput_Pasien">Jemput Pasien</option>
                  <option value="Layanan_Jenazah">Layanan Jenazah</option>
                  <option value="Gawat_Darurat">Gawat Darurat</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button type="submit" disabled={loading} className="bg-slate-900 text-white px-8 font-bold uppercase text-[10px]">
                  {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="mr-2 h-4 w-4" />} Update Record
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl">
        <CardHeader className="border-b py-4 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari nama pasien atau ID Transaksi..." 
                className="h-10 pl-10 text-sm font-medium w-full bg-white" 
                value={search} 
                onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}} 
              />
            </div>
            <div className="relative">
              <Filter className="absolute top-3 left-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <select 
                className="h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 appearance-none cursor-pointer min-w-[180px]" 
                value={filterKategori} 
                onChange={(e) => {setFilterKategori(e.target.value); setCurrentPage(1);}}
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Antar_Pasien">Antar Pasien</option>
                <option value="Jemput_Pasien">Jemput Pasien</option>
                <option value="Layanan_Jenazah">Layanan Jenazah</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b">
                <TableRow>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 py-4 w-[200px] text-left px-6">Layanan & ID</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 min-w-[200px] text-left">Identitas Pasien</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 hidden md:table-cell min-w-[150px] text-left">Unit & Lokasi</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 w-[150px] text-center pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && data.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-16 text-slate-400 font-medium animate-pulse uppercase text-xs tracking-widest">Sinkronisasi Data...</TableCell></TableRow>
                ) : currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <TableRow key={item.sk_fakta_layanan_ambulan} className="hover:bg-slate-50/80 transition-colors border-b last:border-0 group">
                      <TableCell className="px-6 text-left">
                        <Badge size="sm" variant="outline" className="mb-1 bg-rose-50 text-rose-700 border-rose-200">
                          {item.kategori_layanan?.replace(/_/g, ' ') || 'Umum'}
                        </Badge>
                        <p className="text-[10px] font-mono font-semibold text-slate-400 tracking-tighter uppercase">{item.id_transaksi}</p>
                      </TableCell>
                      <TableCell className="text-left">
                        <p className="font-semibold text-sm text-slate-900 uppercase group-hover:text-rose-600 transition-colors">{item.dim_pasien_ambulan?.nama_pasien || 'PASIEN UMUM'}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{item.dim_pasien_ambulan?.status_ekonomi || 'Non-Subsidi'}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-left">
                        <div className="space-y-1">
                          <div className="flex items-center text-[11px] text-slate-700 font-semibold gap-1.5 uppercase">
                             <Truck size={13} className="text-slate-400"/> {item.armada?.split('__')[0].replace(/_/g, ' ') || 'Unit Standar'}
                          </div>
                          <div className="flex items-center text-[10px] text-slate-400 font-bold gap-1.5 uppercase">
                             <MapPin size={12} className="text-rose-400"/> {item.dim_lokasi?.kabupaten_kota || 'PONTIANAK'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center pr-4">
                        <div className="flex justify-end gap-1 items-center">
                          <Link href={`/ambulan/${item.sk_fakta_layanan_ambulan}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" aria-label="Lihat detail"><Eye size={16} /></Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" aria-label="Edit data" onClick={() => startEdit(item)}><Edit3 size={16} /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50" aria-label="Hapus data"><Trash2 size={16} /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-xl border-2">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-bold text-lg flex items-center gap-2">
                                  <AlertCircle className="text-rose-600" /> Hapus Record?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 text-sm font-medium leading-relaxed">
                                  Data ID <strong>{item.id_transaksi}</strong> akan dihapus permanen dari tabel fakta layanan warehouse.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-lg font-bold uppercase text-[10px]">Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item.sk_fakta_layanan_ambulan)} className="bg-rose-600 hover:bg-rose-700 rounded-lg text-white font-bold uppercase text-[10px]">Ya, Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <EmptyState
                        asTableRow={false}
                        title="Belum ada layanan ambulan"
                        description="Tambahkan data layanan baru untuk memulai monitoring."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-slate-100">
            {loading && data.length === 0 ? (
              <div className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-rose-400 mx-auto" /></div>
            ) : currentItems.length === 0 ? (
              <div className="py-10 text-center text-slate-400 italic text-sm">Belum ada data.</div>
            ) : (
              currentItems.map((item) => (
                <div key={item.sk_fakta_layanan_ambulan} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Badge size="sm" className="mb-1 bg-rose-50 text-rose-700 border-none">
                        {item.kategori_layanan?.replace(/_/g, ' ') || 'Umum'}
                      </Badge>
                      <p className="font-bold text-slate-900 truncate uppercase">{item.dim_pasien_ambulan?.nama_pasien || 'PASIEN UMUM'}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-bold uppercase">
                        <Truck size={11} />{item.armada?.split('__')[0].replace(/_/g, ' ')}
                        <span>•</span>
                        <MapPin size={11} className="text-rose-400" />{item.dim_lokasi?.kabupaten_kota || 'PONTIANAK'}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Link href={`/ambulan/${item.sk_fakta_layanan_ambulan}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600" aria-label="Lihat detail"><Eye size={16} /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" aria-label="Edit layanan" onClick={() => startEdit(item)}><Edit3 size={16} /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" aria-label="Hapus data"><Trash2 size={16} /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-bold text-rose-600">Hapus Record?</AlertDialogTitle>
                            <AlertDialogDescription>Data <strong>{item.id_transaksi}</strong> akan dihapus permanen.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.sk_fakta_layanan_ambulan)} className="bg-rose-600 hover:bg-rose-700">Ya, Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PAGINATION */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredData.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
