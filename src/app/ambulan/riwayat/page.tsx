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
  Eye // Ikon Detail Baru
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

export default function RiwayatAktivitasPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    sk_fakta_aktivitas_ambulan: 0,
    jam: 'Pagi__06_00_12_00_',
    armada: 'Ambulan_1__KB_1234_XX_',
    kategori_aktivitas: 'Bahan_Bakar',
    biaya_operasional: '',
  })

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

  useEffect(() => { fetchAktivitas() }, [])

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

  const filteredLogs = useMemo(() => {
    if (!data?.recentLogs) return []
    return data.recentLogs.filter((log: any) => 
      log.id_transaksi?.toLowerCase().includes(search.toLowerCase()) ||
      log.kategori_aktivitas?.toLowerCase().includes(search.toLowerCase())
    )
  }, [data, search])

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen font-sans text-slate-900">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
               <Link href="/ambulan"><ArrowLeft size={18}/></Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight uppercase">Log Aktivitas & <span className="text-rose-600">Biaya</span></h1>
          </div>
          <p className="text-slate-500 text-sm pl-10 italic">Manajemen pengeluaran operasional (Internal Armada)</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Link href="/ambulan/layanan" className="flex-1 md:flex-initial">
            <Button variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-bold shadow-sm uppercase text-[10px]">
              <HandHeart className="mr-2 h-4 w-4" /> Layanan Pasien
            </Button>
          </Link>
          <Button onClick={() => { setIsEditing(false); setIsFormOpen(true); }} className="flex-1 md:flex-initial bg-rose-600 hover:bg-rose-700 text-white shadow-sm font-bold uppercase text-[10px]">
            <Plus className="mr-2 h-4 w-4" /> Catat Biaya
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl">
          <div className="h-1.5 bg-rose-500 w-full" />
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Akumulasi Biaya</p>
              <h3 className="text-3xl font-black mt-1 text-slate-900 tracking-tighter">
                {loading ? "..." : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(data?.totalExp || 0)}
              </h3>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-rose-500"><TrendingUp size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl">
          <div className="h-1.5 bg-slate-900 w-full" />
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frekuensi Aktivitas</p>
              <h3 className="text-3xl font-black mt-1 text-slate-900 tracking-tighter">{loading ? "..." : data?.totalCount || 0} Record</h3>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl text-slate-900"><History size={24} /></div>
          </CardContent>
        </Card>
      </div>

      {/* FORM SECTION */}
      {isFormOpen && (
        <Card className="border-none shadow-lg animate-in fade-in zoom-in-95 duration-200 bg-white rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-rose-500" /> {isEditing ? 'Koreksi Log Aktivitas' : 'Input Aktivitas Baru'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)} className="rounded-full text-slate-400"><X className="h-4 w-4"/></Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600">Unit Armada</Label>
                <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium" value={formData.armada} onChange={(e) => setFormData({...formData, armada: e.target.value})}>
                  <option value="Ambulan_1__KB_1234_XX_">Unit 1 (KB 1234 XX)</option>
                  <option value="Ambulan_2__KB_5678_YY_">Unit 2 (KB 5678 YY)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600">Kategori</Label>
                <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium" value={formData.kategori_aktivitas} onChange={(e) => setFormData({...formData, kategori_aktivitas: e.target.value})}>
                  <option value="Bahan_Bakar">Bahan Bakar (BBM)</option>
                  <option value="Servis_Rutin">Servis / Ganti Oli</option>
                  <option value="Perbaikan">Perbaikan / Sparepart</option>
                  <option value="Cuci_Mobil">Cuci Armada</option>
                  <option value="Lainnya">Lain-lain</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600">Biaya (Rp)</Label>
                <Input required type="number" placeholder="Contoh: 150000" className="font-medium" value={formData.biaya_operasional} onChange={(e) => setFormData({...formData, biaya_operasional: e.target.value})} />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={loading} className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold uppercase text-[10px]">
                  {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="mr-2 h-4 w-4" />} Simpan Record
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TABLE SECTION */}
      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-xl">
        <div className="p-4 border-b bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input placeholder="Cari ID transaksi atau kategori..." className="pl-10 bg-white border-slate-200" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 py-4">ID & Kategori</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Unit Armada</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Biaya Operasional</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 text-right pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !data ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400 animate-pulse uppercase text-xs font-bold tracking-widest">Sinkronisasi Warehouse...</TableCell></TableRow>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log: any) => (
                  <TableRow key={log.sk_fakta_aktivitas_ambulan} className="hover:bg-slate-50 transition-colors border-b last:border-0 group">
                    <TableCell>
                      <p className="font-bold text-xs text-slate-900 uppercase">{log.kategori_aktivitas?.replace(/_/g, ' ') || 'Umum'}</p>
                      <p className="text-[10px] font-mono font-semibold text-slate-400 mt-0.5 tracking-tighter uppercase">{log.id_transaksi}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase">
                        <Truck size={14} className="text-slate-400"/> {log.armada?.split('__')[0].replace(/_/g, ' ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-sm text-rose-600 group-hover:scale-105 transition-transform origin-left">
                        Rp {new Intl.NumberFormat('id-ID').format(log.biaya_operasional || 0)}
                      </p>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex justify-end gap-1 items-center">
                        {/* TOMBOL DETAIL BARU */}
                        <Link href={`/ambulan/aktivitas/${log.sk_fakta_aktivitas_ambulan}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                            <Eye size={16} />
                          </Button>
                        </Link>

                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => startEdit(log)}>
                          <Edit3 size={16}/>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                              <Trash2 size={16}/>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-xl border-2">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-black uppercase text-lg">Hapus Record Biaya?</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm text-slate-500 font-medium">
                                Data ID <strong>{log.id_transaksi}</strong> akan dihapus permanen dari tabel fakta aktivitas internal.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-lg font-bold uppercase text-[10px]">Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(log.sk_fakta_aktivitas_ambulan)} className="bg-rose-600 hover:bg-rose-700 rounded-lg text-white font-bold uppercase text-[10px]">Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400 italic font-medium uppercase text-xs">Tidak ada aktivitas yang ditemukan.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}