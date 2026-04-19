'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
// Import Alert Dialog Components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'
import {
  Users,
  Plus,
  Search,
  Loader2,
  Phone,
  MapPin,
  Heart,
  ArrowLeft,
  X,
  Edit3,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface Donatur {
  sk_donatur: number
  id_donatur: string
  nama_lengkap: string
  kontak_utama: string
  alamat: string
  tipe: string
}

export default function ManajemenDonaturPage() {
  const [donatur, setDonatur] = useState<Donatur[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [search, setSearch] = useState('')

  const [formData, setFormData] = useState({
    sk_donatur: 0,
    nama_donatur: '',
    no_hp: '',
    alamat: '',
    kategori_donatur: 'Individu',
  })

  // Enum sesuai standar Data Warehouse kamu
  const kategoriEnum = [
    'Individu',
    'Lembaga/Korporasi',
    'Komunitas',
    'To Be Determined',
    'Not Applicable',
    'Data Corrupted'
  ]

  useEffect(() => { fetchDonatur() }, [])

  const fetchDonatur = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/donasi/donatur')
      const data = await res.json()
      if (Array.isArray(data)) setDonatur(data)
    } catch (e) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const method = isEditing ? 'PUT' : 'POST'
    try {
      const res = await fetch('/api/donasi/donatur', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast.success(isEditing ? 'Data diperbarui' : 'Donatur baru terdaftar')
        resetForm()
        fetchDonatur()
      }
    } catch (e) { toast.error('Gagal memproses data') } 
    finally { setLoading(false) }
  }

  const handleDelete = async (sk: number, nama: string) => {
    try {
      const res = await fetch(`/api/donasi/donatur?sk=${sk}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`Donatur ${nama} berhasil dinonaktifkan`)
        fetchDonatur()
      }
    } catch (e) { toast.error('Gagal menghapus data') }
  }

  const startEdit = (d: Donatur) => {
    setFormData({
      sk_donatur: d.sk_donatur,
      nama_donatur: d.nama_lengkap,
      no_hp: d.kontak_utama,
      alamat: d.alamat,
      kategori_donatur: d.tipe,
    })
    setIsEditing(true)
    setIsAdding(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setIsAdding(false)
    setIsEditing(false)
    setFormData({ sk_donatur: 0, nama_donatur: '', no_hp: '', alamat: '', kategori_donatur: 'Individu' })
  }

  const filteredDonatur = donatur.filter((d) => {
    const nama = (d.nama_lengkap || '').toLowerCase()
    const kontak = d.kontak_utama || ''
    return nama.includes(search.toLowerCase()) || kontak.includes(search)
  })

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* HEADER SECTION */}
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 text-slate-500 font-bold hover:bg-slate-50 transition-colors">
            <Link href="/donasi/masuk"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Link>
          </Button>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-black text-slate-900">
              <Users className="h-8 w-8 text-indigo-600" /> Database <span className="text-indigo-600">Donatur</span>
            </h1>
            {!isAdding && (
              <Button onClick={() => setIsAdding(true)} className="bg-indigo-600 font-bold shadow-md hover:bg-indigo-700 transition-all">
                <Plus className="mr-2 h-4 w-4" /> Tambah Donatur
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-8">
        {/* FORM SECTION (ADD/EDIT) */}
        {isAdding && (
          <Card className="animate-in fade-in slide-in-from-top-4 border-2 border-indigo-100 shadow-xl overflow-hidden bg-white">
            <CardHeader className="bg-indigo-50/50 py-4 border-b">
              <CardTitle className="flex items-center justify-between text-sm font-black text-indigo-700 uppercase tracking-widest">
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4" /> {isEditing ? 'Update Dimensi Donatur' : 'Registrasi Donatur Baru'}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-400 hover:text-indigo-600" onClick={resetForm}><X className="h-4 w-4" /></Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nama Lengkap</Label>
                  <Input required className="font-bold border-slate-200 focus:border-indigo-500 transition-all" value={formData.nama_donatur} onChange={(e) => setFormData({...formData, nama_donatur: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">No. WhatsApp</Label>
                  <Input required value={formData.no_hp} onChange={(e) => setFormData({...formData, no_hp: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kategori</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={formData.kategori_donatur}
                    onChange={(e) => setFormData({...formData, kategori_donatur: e.target.value})}
                  >
                    {kategoriEnum.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Alamat</Label>
                  <Input value={formData.alamat} onChange={(e) => setFormData({...formData, alamat: e.target.value})} />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={loading} className="w-full bg-indigo-600 font-black uppercase tracking-tighter hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEditing ? 'Simpan Perubahan' : 'Push to Warehouse')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* TABLE SECTION */}
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="border-b py-4 bg-slate-50/50">
            <div className="relative max-w-sm">
              <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari nama atau kontak..." 
                className="pl-10 font-bold border-slate-200 focus:border-indigo-500 transition-all" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500">ID & Tipe</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500">Profil Donatur</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500 text-right pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !donatur.length ? (
                  <TableRow><TableCell colSpan={3} className="h-40 text-center"><Loader2 className="mx-auto animate-spin text-indigo-400" /></TableCell></TableRow>
                ) : filteredDonatur.map((d) => (
                  <TableRow key={d.sk_donatur} className="group hover:bg-indigo-50/30 transition-colors">
                    <TableCell>
                      <p className="font-mono text-[11px] font-black text-indigo-500 mb-1">{d.id_donatur}</p>
                      <span className="px-2 py-0.5 text-[9px] font-black rounded uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        {d.tipe}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="font-black text-slate-900 uppercase leading-none mb-1 tracking-tight">{d.nama_lengkap}</p>
                      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                        <Phone className="h-3 w-3 text-emerald-500"/> {d.kontak_utama}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* EDIT BUTTON */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" 
                          onClick={() => startEdit(d)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>

                        {/* ALERT DIALOG DELETE */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl border-2 shadow-2xl">
                            <AlertDialogHeader>
                              <div className="flex items-center gap-3 text-rose-600 mb-2">
                                <div className="p-2 bg-rose-50 rounded-full">
                                  <AlertTriangle className="h-6 w-6" />
                                </div>
                                <AlertDialogTitle className="font-black text-xl uppercase tracking-tighter">Hapus Donatur?</AlertDialogTitle>
                              </div>
                              <AlertDialogDescription className="font-medium text-slate-500 text-sm leading-relaxed">
                                Anda akan menonaktifkan <strong>{d.nama_lengkap}</strong>. <br />
                                Data ini tetap tersimpan secara historis di <strong>Data Warehouse</strong>, namun tidak akan muncul lagi di modul operasional.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6 gap-2">
                              <AlertDialogCancel className="rounded-xl font-black uppercase text-[10px] tracking-widest border-2 hover:bg-slate-50 transition-all">Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(d.sk_donatur, d.nama_lengkap)}
                                className="bg-rose-600 hover:bg-rose-700 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-100 transition-all"
                              >
                                Ya, Nonaktifkan
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}