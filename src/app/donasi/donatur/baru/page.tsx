'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Heart, Loader2, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Suspense } from 'react'

const kategoriOptions = [
  { label: 'Individu', value: 'Individu' },
  { label: 'Lembaga / Korporasi', value: 'Lembaga_Korporasi' },
  { label: 'Komunitas', value: 'Komunitas' },
  { label: 'To Be Determined', value: 'To_Be_Determined' },
  { label: 'Not Applicable', value: 'Not_Applicable' },
  { label: 'Data Corrupted', value: 'Data_Corrupted' },
]

function AddDonaturFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')
  
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  const [formData, setFormData] = useState({
    sk_donatur: 0,
    nama_donatur: '',
    no_hp: '',
    alamat: '',
    perusahaan: '',
    kategori_donatur: 'Individu',
  })

  useEffect(() => {
    if (editId) {
      setIsEditing(true)
      // Fetch data donatur untuk edit
      fetch(`/api/donatur/${encodeURIComponent(editId)}`)
        .then(res => res.json())
        .then(json => {
          const donatur = json.donatur
          if (donatur) {
            setFormData({
              sk_donatur: donatur.sk_donatur,
              nama_donatur: donatur.nama_lengkap || '',
              no_hp: donatur.kontak_utama || '',
              alamat: donatur.alamat || '',
              perusahaan: donatur.perusahaan || '',
              kategori_donatur: donatur.tipe || 'Individu',
            })
          }
        })
    }
  }, [editId])

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
      
      const result = await res.json()

      if (res.ok) {
        toast.success(isEditing ? 'Data berhasil diperbarui' : 'Donatur baru terdaftar')
        router.push('/donasi/donatur')
      } else {
        toast.error(result.error || 'Gagal menyimpan data')
      }
    } catch (e) { 
      toast.error('Terjadi kesalahan koneksi database') 
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-4 sm:px-8 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 text-slate-500 font-bold hover:bg-slate-50">
            <Link href="/donasi/donatur"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Link>
          </Button>
          <div className="flex flex-col gap-2">
            <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-black text-slate-900">
              <Heart className="h-8 w-8 text-indigo-600" /> {isEditing ? 'Update Profil' : 'Registrasi Baru'} <span className="text-indigo-600">Donatur</span>
            </h1>
            <p className="text-sm font-medium text-slate-500">
              {isEditing ? 'Riwayat perubahan akan tersimpan otomatis.' : 'Daftarkan donatur baru ke dalam sistem.'}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-8">
        <Card className="border-2 border-indigo-100 shadow-xl bg-white overflow-hidden">
          <CardHeader className="bg-indigo-50/50 border-b py-4">
            <CardTitle className="text-sm font-black text-indigo-700 uppercase tracking-widest">
              Formulir Data Donatur
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-600">Nama Lengkap / Instansi</Label>
                <Input required className="h-11" value={formData.nama_donatur} onChange={(e) => setFormData({...formData, nama_donatur: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-600">No. WhatsApp / Kontak</Label>
                <Input required className="h-10" value={formData.no_hp} onChange={(e) => setFormData({...formData, no_hp: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-600">Kategori</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  value={formData.kategori_donatur}
                  onChange={(e) => setFormData({...formData, kategori_donatur: e.target.value})}
                >
                  {kategoriOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-600">Instansi / Perusahaan (Opsional)</Label>
                <Input className="h-10" placeholder="Contoh: PT. ABC / Komunitas XYZ" value={formData.perusahaan} onChange={(e) => setFormData({...formData, perusahaan: e.target.value})} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-600">Alamat Lengkap</Label>
                <Input className="h-10" value={formData.alamat} onChange={(e) => setFormData({...formData, alamat: e.target.value})} />
              </div>
              <div className="md:col-span-2 pt-4">
                <Button type="submit" disabled={loading} className="w-full h-11 bg-indigo-600 font-bold text-sm hover:bg-indigo-700">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isEditing ? 'Simpan Perubahan' : 'Simpan Donatur'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AddDonaturPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>}>
      <AddDonaturFormContent />
    </Suspense>
  )
}
