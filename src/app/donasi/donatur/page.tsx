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
  X
} from 'lucide-react'
import Link from 'next/link'

// Sesuai dengan Model Prisma dim_donatur
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
  const [search, setSearch] = useState('')

  // Form State
  const [newDonatur, setNewDonatur] = useState({
    nama_donatur: '',
    no_hp: '',
    alamat: '',
    kategori_donatur: 'PERSONAL',
  })

  useEffect(() => {
    fetchDonatur()
  }, [])

  const fetchDonatur = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/donasi/donatur')
      const data = await res.json()
      if (Array.isArray(data)) {
        setDonatur(data)
      }
    } catch (e) {
      toast.error('Gagal memuat data dari Data Warehouse')
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
        body: JSON.stringify(newDonatur),
      })
      if (res.ok) {
        toast.success('Donatur baru berhasil didaftarkan ke OLAP Core')
        setIsAdding(false)
        setNewDonatur({
          nama_donatur: '',
          no_hp: '',
          alamat: '',
          kategori_donatur: 'PERSONAL',
        })
        fetchDonatur()
      } else {
        throw new Error('Gagal simpan')
      }
    } catch (e) {
      toast.error('Gagal menyimpan data ke TiDB')
    } finally {
      setLoading(false)
    }
  }

  const filteredDonatur = donatur.filter((d) => {
    const nama = (d.nama_lengkap || '').toLowerCase()
    const kontak = d.kontak_utama || ''
    const searchLower = search.toLowerCase()
    return nama.includes(searchLower) || kontak.includes(searchLower)
  })

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* HEADER SECTION */}
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-6">
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="-ml-2 text-slate-500 hover:text-indigo-600 font-bold"
            >
              <Link href="/donasi/masuk">
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                <Users className="h-8 w-8 text-indigo-600" />
                Database <span className="text-indigo-600">Donatur</span>
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Pusat data Muzakki & Munfiq Dompet Ummat Kalimantan Barat
              </p>
            </div>
            <Button
              onClick={() => setIsAdding(!isAdding)}
              className={`${isAdding ? 'bg-slate-200 text-slate-700' : 'bg-indigo-600 text-white'} font-bold shadow-md transition-all`}
            >
              {isAdding ? (
                <><X className="mr-2 h-4 w-4" /> Batal</>
              ) : (
                <><Plus className="mr-2 h-4 w-4" /> Tambah Donatur</>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-8">
        {/* FORM TAMBAH */}
        {isAdding && (
          <Card className="animate-in fade-in slide-in-from-top-4 border-2 border-indigo-100 shadow-xl overflow-hidden">
            <CardHeader className="bg-indigo-50/50 py-4 border-b">
              <CardTitle className="flex items-center gap-2 text-sm font-black text-indigo-700 uppercase tracking-wider">
                <Heart className="h-4 w-4" /> Registrasi Donatur Baru
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Nama Lengkap / Instansi</Label>
                  <Input
                    placeholder="Masukkan nama sesuai KTP/ID"
                    required
                    value={newDonatur.nama_donatur}
                    onChange={(e) => setNewDonatur({ ...newDonatur, nama_donatur: e.target.value })}
                    className="font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">No. WhatsApp</Label>
                  <Input
                    placeholder="08..."
                    required
                    value={newDonatur.no_hp}
                    onChange={(e) => setNewDonatur({ ...newDonatur, no_hp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Kategori</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                    value={newDonatur.kategori_donatur}
                    onChange={(e) => setNewDonatur({ ...newDonatur, kategori_donatur: e.target.value })}
                  >
                    <option value="PERSONAL">PERSONAL</option>
                    <option value="INSTITUSI">INSTITUSI</option>
                    <option value="KOMUNITAS">KOMUNITAS</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Alamat Lengkap</Label>
                  <Input
                    placeholder="Jl. Juang, Melawi..."
                    value={newDonatur.alamat}
                    onChange={(e) => setNewDonatur({ ...newDonatur, alamat: e.target.value })}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={loading} className="w-full bg-indigo-600 font-bold hover:bg-indigo-700">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan ke DW'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* TABEL DATA */}
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="border-b py-4 bg-slate-50/50">
            <div className="relative max-w-sm">
              <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari donatur..."
                className="pl-10 font-medium border-slate-200 focus:border-indigo-500 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="w-[140px] font-black text-[10px] uppercase">ID Donatur</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">Profil Lengkap</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">Kontak & Lokasi</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-right">Tipe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !donatur.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-400" />
                      <p className="mt-2 text-xs font-bold text-slate-400 animate-pulse">Sinkronisasi Data Warehouse...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredDonatur.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-slate-400 font-medium italic">
                      Data tidak ditemukan dalam database.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDonatur.map((d) => (
                    <TableRow key={d.sk_donatur} className="group hover:bg-indigo-50/30 transition-colors">
                      <TableCell className="font-mono text-[11px] font-black text-indigo-500">
                        {d.id_donatur}
                      </TableCell>
                      <TableCell>
                        <p className="font-black text-slate-900 leading-none mb-1 uppercase tracking-tight">
                          {d.nama_lengkap}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">
                          Muzakki Terdaftar
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <Phone className="h-3 w-3 text-emerald-500" /> {d.kontak_utama}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <MapPin className="h-3 w-3" /> {d.alamat || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`inline-block rounded px-2 py-1 text-[9px] font-black tracking-tighter uppercase ${
                          d.tipe === 'PERSONAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {d.tipe}
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