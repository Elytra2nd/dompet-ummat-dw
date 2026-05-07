'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Truck, 
  Settings2, 
  History, 
  ArrowLeft, 
  Plus,
  Clock,
  TrendingUp,
  Loader2,
  Search,
  Edit3,
  Trash2,
  X,
  Save,
  AlertCircle,
  HandHeart,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  DollarSign
} from 'lucide-react'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from 'next/link'
import { toast } from 'sonner'
import ImportButton from '@/components/import/ImportButton'
import Pagination from '@/components/ui/pagination-numbered'

export default function RiwayatAktivitasPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  const [mounted, setMounted] = useState(false)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    sk_fakta_aktivitas_ambulan: 0,
    jam: 'Pagi__06_00_12_00_',
    armada: 'Ambulan_1__KB_1234_XX_',
    kategori_aktivitas: 'Bahan_Bakar',
    biaya_operasional: '',
  })

  // Helper Formatter untuk cegah ketidaksamaan render server/client
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val)
  }

  const fetchAktivitas = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/ambulan/aktivitas')
      const d = await res.json()
      setData(d)
    } catch (error) {
      toast.error("Gagal sinkronisasi data warehouse")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchAktivitas()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const method = isEditing ? 'PUT' : 'POST'
    try {
      const res = await fetch('/api/ambulan/aktivitas', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success(isEditing ? "Data diperbarui" : "Aktivitas biaya dicatat")
        setIsFormOpen(false)
        fetchAktivitas()
      }
    } catch (error) {
      toast.error("Gagal menyimpan data")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sk: number) => {
    try {
      const res = await fetch(`/api/ambulan/aktivitas?sk=${sk}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("Log biaya dihapus")
        fetchAktivitas()
      }
    } catch (error) {
      toast.error("Gagal menghapus log")
    }
  }

  const startEdit = (log: any) => {
    setFormData({
      sk_fakta_aktivitas_ambulan: log.sk_fakta_aktivitas_ambulan,
      jam: log.jam,
      armada: log.armada,
      kategori_aktivitas: log.kategori_aktivitas,
      biaya_operasional: log.biaya_operasional.toString(),
    })
    setIsEditing(true)
    setIsFormOpen(true)
  }

  const kategoriOptions = useMemo(() => {
    if (!data?.recentLogs) return []
    const set = new Set(data.recentLogs.map((l: any) => l.kategori_aktivitas).filter(Boolean))
    return Array.from(set).sort() as string[]
  }, [data])

  const filteredLogs = useMemo(() => {
    if (!data?.recentLogs) return []
    return data.recentLogs.filter((log: any) => {
      const matchSearch = 
        log.id_transaksi?.toLowerCase().includes(search.toLowerCase()) ||
        log.kategori_aktivitas?.toLowerCase().includes(search.toLowerCase())
      const matchKategori = !filterKategori || log.kategori_aktivitas === filterKategori
      return matchSearch && matchKategori
    })
  }, [data, search, filterKategori])

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage))
  const currentLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Cegah render sebelum mounted di client (Solusi Error #418)
  if (!mounted) return null

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans text-slate-900">
      {/* HEADER BAR */}
      <div className="mb-6 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 text-slate-500 font-semibold hover:bg-slate-50">
            <Link href="/ambulan"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard Ambulan</Link>
          </Button>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-slate-900">
                <History className="h-7 w-7 text-rose-600 shrink-0" />
                Log Aktivitas & <span className="text-rose-600">Biaya</span>
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mt-1">
                Internal Operational Tracking • BIDA Warehouse
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ImportButton modul="ambulan_aktivitas" onImportSuccess={fetchAktivitas} />
              <Link href="/ambulan/aktivitas">
                <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm font-semibold text-sm h-10 w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> Catat Biaya Baru
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-8">
      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total Biaya</p>
              <h3 className="text-xl sm:text-2xl font-bold mt-1 text-rose-600">
                {loading ? <Loader2 className="animate-spin h-5 w-5 text-slate-200" /> : formatIDR(data?.totalExp || 0)}
              </h3>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-rose-500 shrink-0"><DollarSign size={22} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total Aktivitas</p>
              <h3 className="text-xl sm:text-2xl font-bold mt-1 text-slate-900">{loading ? '...' : data?.totalCount || 0} <span className="text-xs font-normal text-slate-400">record</span></h3>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl text-slate-600 shrink-0"><History size={22} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Rerata / Aktivitas</p>
              <h3 className="text-xl sm:text-2xl font-bold mt-1 text-amber-600">
                {loading ? '...' : data?.totalCount ? formatIDR(Math.round((data?.totalExp || 0) / data.totalCount)) : 'Rp 0'}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-500 shrink-0"><TrendingUp size={22} /></div>
          </CardContent>
        </Card>
      </div>

      {/* FORM EDIT (Hanya terbuka untuk Koreksi Data/isEditing) */}
      {isFormOpen && isEditing && (
        <Card className="border-none shadow-lg animate-in fade-in zoom-in-95 duration-200 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight">
              <Settings2 className="h-4 w-4 text-rose-500" /> Koreksi Log Aktivitas
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)} className="rounded-full text-slate-400" aria-label="Tutup form"><X className="h-4 w-4"/></Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Unit Armada</Label>
                <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium" value={formData.armada} onChange={(e) => setFormData({...formData, armada: e.target.value})}>
                  <option value="Ambulan_1__KB_1234_XX_">Unit 1 (KB 1234 XX)</option>
                  <option value="Ambulan_2__KB_5678_YY_">Unit 2 (KB 5678 YY)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Kategori</Label>
                <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium" value={formData.kategori_aktivitas} onChange={(e) => setFormData({...formData, kategori_aktivitas: e.target.value})}>
                  <option value="Bahan_Bakar">Bahan Bakar (BBM)</option>
                  <option value="Servis_Rutin">Servis / Ganti Oli</option>
                  <option value="Perbaikan">Perbaikan / Sparepart</option>
                  <option value="Cuci_Mobil">Cuci Armada</option>
                  <option value="Lainnya">Lain-lain</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Biaya (Rp)</Label>
                <Input required type="number" className="font-bold" value={formData.biaya_operasional} onChange={(e) => setFormData({...formData, biaya_operasional: e.target.value})} />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold uppercase text-[10px] tracking-widest h-10">
                  {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="mr-2 h-4 w-4" />} Update Record
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TABLE SECTION */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl">
        <CardHeader className="border-b py-4 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari ID transaksi atau kategori..." 
                className="h-10 pl-10 text-sm font-medium w-full bg-white" 
                value={search} 
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} 
              />
            </div>
            <div className="relative">
              <Filter className="absolute top-3 left-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={filterKategori}
                onChange={(e) => { setFilterKategori(e.target.value); setCurrentPage(1) }}
                className="h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 appearance-none cursor-pointer min-w-[180px]"
              >
                <option value="">Semua Kategori</option>
                {kategoriOptions.map((k) => (
                  <option key={k} value={k}>{k.replace(/_/g, ' ')}</option>
                ))}
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
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 py-4 w-[250px] text-left px-6">ID & Kategori</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 hidden md:table-cell min-w-[200px] text-left">Unit Armada</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 min-w-[150px] text-left">Biaya Operasional</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 w-[150px] text-center pr-8">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !data ? (
                  <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="mx-auto animate-spin text-rose-400" /></TableCell></TableRow>
                ) : currentLogs.length > 0 ? (
                  currentLogs.map((log: any) => (
                    <TableRow key={log.sk_fakta_aktivitas_ambulan} className="group hover:bg-rose-50/30 transition-colors">
                      <TableCell className="px-6 py-4 text-left">
                        <p className="font-bold text-xs text-slate-900 uppercase">{log.kategori_aktivitas?.replace(/_/g, ' ') || 'Umum'}</p>
                        <p className="text-[10px] font-mono font-semibold text-slate-400 mt-0.5 tracking-tighter uppercase">{log.id_transaksi}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-left">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
                          <Truck size={14} className="text-slate-400"/> {log.armada?.split('__')[0].replace(/_/g, ' ') || 'Unit Ready'}
                        </div>
                      </TableCell>
                      <TableCell className="text-left">
                        <p className="font-bold text-sm text-rose-600">
                          {formatIDR(log.biaya_operasional || 0)}
                        </p>
                      </TableCell>
                      <TableCell className="text-center pr-6">
                        <div className="flex justify-end gap-1 items-center">
                          <Link href={`/ambulan/aktivitas/${log.sk_fakta_aktivitas_ambulan}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" aria-label="Lihat detail"><Eye size={16} /></Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" aria-label="Edit data" onClick={() => startEdit(log)}><Edit3 size={16}/></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50" aria-label="Hapus data"><Trash2 size={16}/></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl border-2">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-bold text-lg">Hapus Record Biaya?</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm text-slate-500 font-medium leading-relaxed">
                                  Data dengan ID <strong>{log.id_transaksi}</strong> akan dihapus permanen dari tabel fakta aktivitas warehouse.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-lg font-bold uppercase text-[10px]">Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(log.sk_fakta_aktivitas_ambulan)} className="bg-rose-600 hover:bg-rose-700 rounded-lg text-white font-bold uppercase text-[10px]">Ya, Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-400 italic font-medium uppercase text-xs">Tidak ada log aktivitas ditemukan.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-slate-100">
            {loading && !data ? (
              <div className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-rose-400 mx-auto" /></div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-10 text-center text-slate-400 italic text-sm">Tidak ada log aktivitas ditemukan.</div>
            ) : (
              currentLogs.map((log: any) => (
                <div key={log.sk_fakta_aktivitas_ambulan} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm uppercase">{log.kategori_aktivitas?.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{log.id_transaksi}</p>
                      <p className="text-base font-bold text-rose-600 mt-2">{formatIDR(log.biaya_operasional || 0)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Link href={`/ambulan/aktivitas/${log.sk_fakta_aktivitas_ambulan}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600" aria-label="Lihat detail"><Eye size={15} /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => startEdit(log)}><Edit3 size={15}/></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" aria-label="Hapus data"><Trash2 size={15}/></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-bold text-rose-600">Hapus Record?</AlertDialogTitle>
                            <AlertDialogDescription>Data <strong>{log.id_transaksi}</strong> akan dihapus permanen.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(log.sk_fakta_aktivitas_ambulan)} className="bg-rose-600 hover:bg-rose-700">Ya, Hapus</AlertDialogAction>
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
          {!loading && filteredLogs.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredLogs.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
