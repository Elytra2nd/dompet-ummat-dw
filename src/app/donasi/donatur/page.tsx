'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table"
import { toast } from "sonner"
import { 
  Users, Plus, Search, Loader2, 
  Mail, Phone, MapPin, Heart, ArrowLeft 
} from 'lucide-react'
import Link from 'next/link'

interface Donatur {
  id_donatur: string;
  nama_donatur: string;
  no_hp: string;
  email: string;
  alamat: string;
  kategori_donatur: string;
}

export default function ManajemenDonaturPage() {
  const [donatur, setDonatur] = useState<Donatur[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [search, setSearch] = useState('')

  // Form State
  const [newDonatur, setNewDonatur] = useState({
    nama_donatur: '',
    no_hp: '',
    email: '',
    alamat: '',
    kategori_donatur: 'Individu'
  })

  useEffect(() => {
    fetchDonatur()
  }, [])

  const fetchDonatur = async () => {
    try {
      const res = await fetch('/api/donasi/donatur')
      const data = await res.json()
      if (Array.isArray(data)) setDonatur(data)
    } catch (e) {
      toast.error("Gagal memuat data donatur")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/donasi/donatur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDonatur)
      })
      if (res.ok) {
        toast.success("Donatur baru berhasil didaftarkan")
        setIsAdding(false)
        setNewDonatur({ nama_donatur: '', no_hp: '', email: '', alamat: '', kategori_donatur: 'Individu' })
        fetchDonatur()
      }
    } catch (e) {
      toast.error("Gagal menyimpan")
    } finally {
      setLoading(false)
    }
  }

  const filteredDonatur = donatur.filter(d => 
    d.nama_donatur.toLowerCase().includes(search.toLowerCase()) ||
    d.no_hp.includes(search)
  )

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* HEADER SECTION */}
      <div className="bg-white border-b mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" asChild className="-ml-2 text-slate-500 hover:text-indigo-600">
              <Link href="/donasi/masuk">
                <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Input Donasi
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                <Users className="h-8 w-8 text-indigo-600" />
                Database <span className="text-indigo-600">Donatur</span>
              </h1>
              <p className="text-slate-500 mt-1 font-medium italic">
                Pusat data Muzakki dan Munfiq Dompet Ummat Kalimantan Barat
              </p>
            </div>
            <Button onClick={() => setIsAdding(!isAdding)} className="bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100">
              {isAdding ? "Batal" : <><Plus className="h-4 w-4 mr-2" /> Tambah Donatur</>}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 space-y-6">
        {/* FORM TAMBAH (COLLAPSIBLE) */}
        {isAdding && (
          <Card className="border-2 border-indigo-100 shadow-xl animate-in fade-in slide-in-from-top-4">
            <CardHeader className="bg-indigo-50/50 border-b py-4">
              <CardTitle className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                <Heart className="h-4 w-4" /> Registrasi Donatur Baru
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Nama Lengkap / Instansi</Label>
                  <Input placeholder="Contoh: H. Ahmad" required value={newDonatur.nama_donatur} onChange={e => setNewDonatur({...newDonatur, nama_donatur: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">No. WhatsApp</Label>
                  <Input placeholder="08..." required value={newDonatur.no_hp} onChange={e => setNewDonatur({...newDonatur, no_hp: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Kategori</Label>
                  <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm" value={newDonatur.kategori_donatur} onChange={e => setNewDonatur({...newDonatur, kategori_donatur: e.target.value})}>
                    <option value="Individu">Individu</option>
                    <option value="Lembaga/Perusahaan">Lembaga/Perusahaan</option>
                    <option value="Komunitas">Komunitas</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs font-bold uppercase">Alamat Lengkap</Label>
                  <Input placeholder="Jl. Juang, Melawi..." value={newDonatur.alamat} onChange={e => setNewDonatur({...newDonatur, alamat: e.target.value})} />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={loading} className="w-full bg-slate-900 h-10">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Data Donatur"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* TABEL DATA */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="py-4 border-b">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari nama atau no. hp..." 
                className="pl-9 h-10" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[120px] font-bold">ID</TableHead>
                  <TableHead className="font-bold">NAMA DONATUR</TableHead>
                  <TableHead className="font-bold">KONTAK & ALAMAT</TableHead>
                  <TableHead className="font-bold">KATEGORI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-400" />
                    </TableCell>
                  </TableRow>
                ) : filteredDonatur.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-slate-500 italic">
                      Data donatur tidak ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDonatur.map((d) => (
                    <TableRow key={d.id_donatur} className="hover:bg-indigo-50/30 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-indigo-600">{d.id_donatur}</TableCell>
                      <TableCell>
                        <p className="font-bold text-slate-800">{d.nama_donatur}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Terdaftar sebagai Muzakki</p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone className="h-3 w-3 text-indigo-400" /> {d.no_hp}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <MapPin className="h-3 w-3 text-slate-400" /> {d.alamat || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          d.kategori_donatur === 'Individu' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {d.kategori_donatur}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}