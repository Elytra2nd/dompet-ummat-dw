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
  Trash2
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
    kategori_donatur: 'PERSONAL',
  })

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
        toast.success(isEditing ? 'Data diperbarui' : 'Donatur terdaftar')
        resetForm()
        fetchDonatur()
      }
    } catch (e) { toast.error('Gagal proses data') } 
    finally { setLoading(false) }
  }

  // Fungsi Hapus yang dipanggil oleh AlertDialogAction
  const handleDelete = async (sk: number, nama: string) => {
    try {
      const res = await fetch(`/api/donasi/donatur?sk=${sk}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`Donatur ${nama} dinonaktifkan`)
        fetchDonatur()
      }
    } catch (e) { toast.error('Gagal menghapus') }
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
    setFormData({ sk_donatur: 0, nama_donatur: '', no_hp: '', alamat: '', kategori_donatur: 'PERSONAL' })
  }

  const filteredDonatur = donatur.filter((d) => {
    const nama = (d.nama_lengkap || '').toLowerCase()
    const kontak = d.kontak_utama || ''
    return nama.includes(search.toLowerCase()) || kontak.includes(search)
  })

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* HEADER TETAP SAMA */}
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 text-slate-500 font-bold hover:bg-slate-50">
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
        {/* FORM (KODE SAMA SEPERTI SEBELUMNYA) */}
        {isAdding && (
            <Card className="animate-in fade-in slide-in-from-top-4 border-2 border-indigo-100 shadow-xl overflow-hidden">
                <CardHeader className="bg-indigo-50/50 py-4 border-b">
                    <CardTitle className="flex items-center justify-between text-sm font-black text-indigo-700 uppercase tracking-widest">
                        <span className="flex items-center gap-2">
                        <Heart className="h-4 w-4" /> {isEditing ? 'Update Data Donatur' : 'Registrasi Donatur Baru'}
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-400 hover:text-indigo-600" onClick={resetForm}><X className="h-4 w-4" /></Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        <div className="md:col-span-2 space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Nama Lengkap</Label>
                            <Input required className="font-bold border-slate-200 focus:border-indigo-500" value={formData.nama_donatur} onChange={(e) => setFormData({...formData, nama_donatur: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">No. WhatsApp</Label>
                            <Input required value={formData.no_hp} onChange={(e) => setFormData({...formData, no_hp: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Kategori</Label>
                            <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold" value={formData.kategori_donatur} onChange={(e) => setFormData({...formData, kategori_donatur: e.target.value})}>
                                <option value="PERSONAL">PERSONAL</option>
                                <option value="INSTITUSI">INSTITUSI</option>
                                <option value="KOMUNITAS">KOMUNITAS</option>
                            </select>
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Alamat</Label>
                            <Input value={formData.alamat} onChange={(e) => setFormData({...formData, alamat: e.target.value})} />
                        </div>
                        <div className="flex items-end">
                            <Button type="submit" disabled={loading} className="w-full bg-indigo-600 font-black uppercase tracking-tighter hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEditing ? 'Update Data' : 'Simpan ke DW')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        )}

        {/* TABLE SECTION DENGAN ALERT DIALOG */}
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="border-b py-4 bg-slate-50/50">
            <div className="relative max-w-sm">
              <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
              <Input placeholder="Cari donatur..." className="pl-10 font-bold border-slate-200 focus:border-indigo-500 transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500">ID Donatur</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500">Profil</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500 text-right pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !donatur.length ? (
                  <TableRow><TableCell colSpan={3} className="h-40 text-center"><Loader2 className="mx-auto animate-spin text-indigo-400" /></TableCell></TableRow>
                ) : filteredDonatur.map((d) => (
                  <TableRow key={d.sk_donatur} className="group hover:bg-indigo-50/30 transition-colors">
                    <TableCell className="font-mono text-[11px] font-black text-indigo-500">{d.id_donatur}</TableCell>
                    <TableCell>
                      <p className="font-black text-slate-900 uppercase leading-none mb-1 tracking-tight">{d.nama_lengkap}</p>
                      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2"><Phone className="h-3 w-3"/> {d.kontak_utama}</div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" onClick={() => startEdit(d)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>

                        {/* IMPLEMENTASI ALERT DIALOG UNTUK HAPUS */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl border-2 shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-black text-slate-900 text-xl uppercase tracking-tighter">Konfirmasi Penonaktifan</AlertDialogTitle>
                              <AlertDialogDescription className="font-medium text-slate-500 text-sm leading-relaxed">
                                Apakah Anda yakin ingin menonaktifkan <strong>{d.nama_lengkap}</strong>? <br />
                                Data ini akan disembunyikan dari aplikasi namun tetap tersimpan di histori <strong>Data Warehouse</strong>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-4 gap-2">
                              <AlertDialogCancel className="rounded-xl font-black border-2 text-slate-400 uppercase text-[10px] tracking-widest">Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(d.sk_donatur, d.nama_lengkap)}
                                className="bg-rose-600 hover:bg-rose-700 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-100"
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