'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Printer, Search, Loader2, ArrowLeft, HeartHandshake } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatRupiah } from '@/lib/utils-ambulan'

type DonaturItem = {
  id_donatur: string
  nama_donatur: string
  no_hp: string
  alamat_lengkap: string
}

type RiwayatItem = {
  tanggal: string
  jenis_transaksi: string
  sub_donasi: string
  jumlah: number
}

type LaporanData = {
  donatur: { nama_donatur: string; alamat_lengkap: string; no_hp: string }
  periode: string
  riwayat: RiwayatItem[]
  rekap: { zakat: number; infak: number; wakaf: number; kurban: number }
}

export default function LaporanIndividuPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<DonaturItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const [selectedDonatur, setSelectedDonatur] = useState<DonaturItem | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  
  const [laporan, setLaporan] = useState<LaporanData | null>(null)
  const [isLoadingLaporan, setIsLoadingLaporan] = useState(false)
  
  const searchRef = useRef<HTMLDivElement>(null)

  // Auto-close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setIsSearching(true)
        try {
          const res = await fetch(`/api/donatur/search?q=${encodeURIComponent(searchTerm)}`)
          const data = await res.json()
          setSearchResults(data)
          setShowDropdown(true)
        } catch (error) {
          console.error(error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
        setShowDropdown(false)
      }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const handleSelectDonatur = (d: DonaturItem) => {
    setSelectedDonatur(d)
    setSearchTerm(d.nama_donatur)
    setShowDropdown(false)
    setLaporan(null) // Reset laporan if donatur changed
  }

  const generateLaporan = async () => {
    if (!selectedDonatur) return
    setIsLoadingLaporan(true)
    try {
      const res = await fetch(`/api/reports/individu?id=${selectedDonatur.id_donatur}&year=${selectedYear}`)
      if (!res.ok) throw new Error('Gagal memuat laporan')
      const data = await res.json()
      setLaporan(data)
    } catch (error) {
      alert('Gagal mengambil data histori donasi.')
    } finally {
      setIsLoadingLaporan(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
        }
      `}} />

      <div className="min-h-screen bg-slate-50 pb-12 font-sans print:bg-white print:p-0">
        
        {/* NON-PRINTABLE CONTROL AREA */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 print:hidden">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-slate-500 hover:text-indigo-600">
              <Link href="/reports"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Pusat Laporan</Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Printer className="h-7 w-7 text-indigo-600 shrink-0" /> Laporan Individu Donatur
            </h1>
            <p className="mt-1 text-slate-500 text-sm">Buat laporan histori donasi siap cetak (A4) per donatur.</p>
          </div>

          <Card className="shadow-md border-slate-200 mb-8">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex-1 w-full relative" ref={searchRef}>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Cari Donatur (Nama / No. HP)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Ketik minimal 2 huruf..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-indigo-600" />}
                  </div>

                  {/* Dropdown Results */}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {searchResults.map(d => (
                        <div 
                          key={d.id_donatur} 
                          className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-0 border-slate-100"
                          onClick={() => handleSelectDonatur(d)}
                        >
                          <div className="font-bold text-slate-800 text-sm">{d.nama_donatur}</div>
                          <div className="text-xs text-slate-500">{d.no_hp} • {d.alamat_lengkap}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div className="w-full sm:w-32">
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2">Tahun</label>
                    <select 
                      className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm"
                      value={selectedYear}
                      onChange={e => setSelectedYear(e.target.value)}
                    >
                      {[...Array(5)].map((_, i) => {
                        const yr = (new Date().getFullYear() - i).toString();
                        return <option key={yr} value={yr}>{yr}</option>
                      })}
                    </select>
                  </div>

                  <Button 
                    onClick={generateLaporan} 
                    disabled={!selectedDonatur || isLoadingLaporan}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 font-bold h-10"
                  >
                    {isLoadingLaporan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Tampilkan Data'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {laporan && (
            <div className="mb-4 flex justify-end">
              <Button onClick={handlePrint} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 shadow-lg" size="lg">
                <Printer className="mr-2 h-5 w-5" /> Cetak / Simpan PDF
              </Button>
            </div>
          )}
        </div>

        {/* PRINTABLE AREA */}
        {laporan && (
          <div id="print-area" className="mx-auto max-w-[210mm] bg-white p-10 shadow-2xl border border-slate-200 min-h-[297mm]">
            
            {/* Kop Laporan */}
            <div className="flex justify-between items-start border-b-2 border-slate-300 pb-6 mb-6">
              <div className="space-y-4">
                <div className="bg-black text-white px-3 py-1 inline-block">
                  <p className="font-black text-xs">RAHASIA/PRIBADI</p>
                  <p className="text-[10px]">Private/Confidential</p>
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase">Laporan</h2>
                  <p className="text-sm">Periode Laporan Januari - Desember {laporan.periode}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                {/* Simulated Logo - Replace with actual image if available */}
                <div className="flex items-center gap-2 mb-1">
                  <HeartHandshake className="h-10 w-10 text-cyan-500" />
                  <div className="leading-tight">
                    <p className="text-xl font-black text-cyan-500 uppercase tracking-tighter">DOMPET</p>
                    <p className="text-xl font-black text-cyan-500 uppercase tracking-tighter">UMMAT</p>
                  </div>
                </div>
                <p className="text-sm font-medium tracking-[0.1em]">friends of humanity</p>
              </div>
            </div>

            {/* Identitas Donatur */}
            <div className="mb-8 pl-4 border-l-4 border-red-600">
              <h3 className="text-lg font-black text-red-700 uppercase">{laporan.donatur.nama_donatur}</h3>
              <p className="text-sm text-red-800">{laporan.donatur.alamat_lengkap}</p>
            </div>

            <div className="mb-4 text-sm">
              <p>Jika ada kesalahan nama dan alamat mohon menghubungi</p>
              <p>Call center Dompet Ummat: 0561-7918676</p>
            </div>

            {/* Tabel Riwayat */}
            <table className="w-full border-collapse border border-slate-300 text-sm mb-12">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-300 py-2 px-3 text-center font-bold">Tgl. Transaksi</th>
                  <th className="border border-slate-300 py-2 px-3 text-center font-bold">Jenis Transaksi</th>
                  <th className="border border-slate-300 py-2 px-3 text-center font-bold">Sub Donasi</th>
                  <th className="border border-slate-300 py-2 px-3 text-center font-bold">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {laporan.riwayat.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="border border-slate-300 py-8 text-center italic text-slate-500">Tidak ada donasi pada periode ini.</td>
                  </tr>
                ) : (
                  laporan.riwayat.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-300 py-2 px-3 text-center text-red-700">
                        {new Date(item.tanggal).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\//g, '-')}
                      </td>
                      <td className="border border-slate-300 py-2 px-3 text-center text-red-700">{item.jenis_transaksi}</td>
                      <td className="border border-slate-300 py-2 px-3 text-center text-red-700">{item.sub_donasi}</td>
                      <td className="border border-slate-300 py-2 px-3 text-right text-red-700 font-medium">
                        {item.jumlah.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Rekapitulasi */}
            <div className="mb-2">
              <p className="text-sm font-bold uppercase">REKAPITULASI PEMBAYARAN SEJAK JANUARI - DESEMBER {laporan.periode}</p>
            </div>
            
            <table className="w-full border-collapse border border-slate-300 text-center text-sm mb-8">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-300 py-2 font-bold w-1/4">ZAKAT</th>
                  <th className="border border-slate-300 py-2 font-bold w-1/4">INFAK</th>
                  <th className="border border-slate-300 py-2 font-bold w-1/4">WAKAF</th>
                  <th className="border border-slate-300 py-2 font-bold w-1/4">CICILAN KURBAN/AKIKAH</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 py-3 font-bold text-red-600">
                    {laporan.rekap.zakat.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="border border-slate-300 py-3 font-bold text-red-600">
                    {laporan.rekap.infak.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="border border-slate-300 py-3 font-bold text-red-600">
                    {laporan.rekap.wakaf.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="border border-slate-300 py-3 font-bold text-red-600">
                    {laporan.rekap.kurban.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Footer */}
            <div className="flex gap-6 mt-16 text-xs italic text-justify leading-relaxed">
              <div className="flex-1 space-y-2">
                <p>
                  Laporan konsolidasi ini sebagai bukti pembayaran ziswaf (zakat, infak, wakaf) dan cicilan kurban. Jika ada donasi Bapak/Ibu yang tidak tercantum segera menghubungi call center kami.
                </p>
                <div className="border border-slate-300 p-4 rounded-xl relative mt-4">
                  <p>Terima kasih atas kepercayaan Bapak/Ibu kepada lembaga kami.</p>
                  <p className="font-bold">"Semoga Allah memberikan pahala atas segala pemberianmu dan menjadikan buatmu suci dan mensucikan serta Allah memberkahi hartamu yang tersisa"</p>
                </div>
              </div>
              <div className="w-1/3">
                <p className="font-bold not-italic text-sm flex items-center gap-1"><span className="w-3 h-3 bg-green-600 inline-block"></span> Kantor Pusat</p>
                <p className="not-italic mt-1">Jl. Karimata No. 2A, Pontianak 78116</p>
                <p className="not-italic">Tel. 0561.7918676 // Faks. 0561.768190</p>
                <p className="not-italic">SMS Center : 081 345 653 365</p>
              </div>
            </div>

            <div className="mt-12 text-[10px] text-slate-500">
              Halaman : 1 dari 1 total halaman
            </div>

          </div>
        )}
      </div>
    </>
  )
}
