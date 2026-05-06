'use client'

import React, { useState } from 'react'
import {
  HardDriveDownload,
  Database,
  Table2,
  Shield,
  Clock,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Server,
  ArrowDownToLine,
  Calendar,
  FileArchive,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const DIMENSION_TABLES = [
  { name: 'dim_date', label: 'Kalender (Date Dimension)', icon: Clock },
  { name: 'dim_donatur', label: 'Database Donatur', icon: Table2 },
  { name: 'dim_jalur_pembayaran', label: 'Jalur Pembayaran', icon: Table2 },
  { name: 'dim_lokasi', label: 'Data Lokasi/Spasial', icon: Table2 },
  { name: 'dim_mustahik', label: 'Database Mustahik', icon: Table2 },
  { name: 'dim_pasien_ambulan', label: 'Data Pasien Ambulan', icon: Table2 },
  { name: 'dim_penyalur_master', label: 'Master Penyalur', icon: Table2 },
  { name: 'dim_pertanyaan_survey', label: 'Bank Pertanyaan Survey', icon: Table2 },
  { name: 'dim_petugas', label: 'Data Petugas/SDM', icon: Table2 },
  { name: 'dim_program_donasi', label: 'Master Program Donasi', icon: Table2 },
]

const FACT_TABLES = [
  { name: 'fact_donasi', label: 'Transaksi Donasi', icon: Database },
  { name: 'fact_penyaluran', label: 'Transaksi Penyaluran', icon: Database },
  { name: 'fact_layanan_ambulan', label: 'Layanan Ambulan', icon: Database },
  { name: 'fact_aktivitas_ambulan', label: 'Aktivitas Ambulan', icon: Database },
  { name: 'fact_skor_kelayakan', label: 'Skor Kelayakan', icon: Database },
  { name: 'fact_survey', label: 'Header Survey', icon: Database },
  { name: 'fact_survey_detail', label: 'Detail Jawaban Survey', icon: Database },
]

type BackupStatus = 'idle' | 'preparing' | 'downloading' | 'success' | 'error'

export default function BackupPage() {
  const [status, setStatus] = useState<BackupStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [progress, setProgress] = useState('')

  // Enterprise Filters
  const [moduleFilter, setModuleFilter] = useState<'all' | 'dimensi' | 'fakta'>('all')
  const [format, setFormat] = useState<'xlsx' | 'zip'>('xlsx')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleBackup = async () => {
    try {
      setStatus('preparing')
      setErrorMsg('')
      setProgress('Menyiapkan koneksi ke warehouse...')

      const startTime = Date.now()
      
      const queryParams = new URLSearchParams({
        modules: moduleFilter,
        format: format,
      })
      if (startDate) queryParams.append('startDate', startDate)
      if (endDate) queryParams.append('endDate', endDate)

      setProgress(`Mengeksekusi query untuk filter: ${moduleFilter.toUpperCase()}...`)

      const res = await fetch(`/api/backup?${queryParams.toString()}`)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.details || err.error || 'Backup gagal')
      }

      setStatus('downloading')
      setProgress(`Membangun file ${format.toUpperCase()}...`)

      const blob = await res.blob()
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || `backup_dompet_ummat.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setStatus('success')
      setProgress(`Backup selesai dalam ${elapsed} detik`)
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message)
      setProgress('')
    }
  }

  const activeTablesCount = 
    moduleFilter === 'all' ? 17 : 
    moduleFilter === 'dimensi' ? 10 : 7

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl shadow-lg shadow-sky-200">
            <HardDriveDownload className="h-7 w-7 text-white" />
          </div>
          Backup Data Warehouse Dompet Ummat
        </h1>
        <p className="text-slate-500 mt-2 ml-14">
          Modul ekskavasi data mentah yang mendukung partisi tabel dan filtering rentang tanggal transaksi untuk performa ekstraksi yang optimal.
        </p>
      </div>

      {/* Warning Card */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Shield className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-amber-900">Protokol Keamanan Level 1</p>
            <p className="text-sm text-amber-700 mt-1">
              File ekstraksi mengandung data historis utuh termasuk PII (Personally Identifiable Information). Pastikan perangkat tujuan mematuhi standar enkripsi perusahaan.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Enterprise Filter & Config */}
      <Card className="border-2 border-indigo-100 shadow-md">
        <CardHeader className="bg-slate-50/50 border-b pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-5 w-5 text-indigo-600" /> Parameter Ekstraksi Data
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Module Selector */}
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest">1. Seleksi Modul</p>
            <div className="flex flex-col gap-2">
              <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${moduleFilter === 'all' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="module" checked={moduleFilter === 'all'} onChange={() => setModuleFilter('all')} className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Seluruh Warehouse</p>
                  <p className="text-[10px] font-bold text-slate-500">17 Tabel (Dimensi & Fakta)</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${moduleFilter === 'dimensi' ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="module" checked={moduleFilter === 'dimensi'} onChange={() => setModuleFilter('dimensi')} className="w-4 h-4 text-sky-500" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Master Data Saja</p>
                  <p className="text-[10px] font-bold text-slate-500">10 Tabel Dimensi</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${moduleFilter === 'fakta' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="module" checked={moduleFilter === 'fakta'} onChange={() => setModuleFilter('fakta')} className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Transaksi Saja</p>
                  <p className="text-[10px] font-bold text-slate-500">7 Tabel Fakta</p>
                </div>
              </label>
            </div>
          </div>

          {/* Time Range */}
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest">2. Rentang Waktu (Khusus Fakta)</p>
            <div className={`space-y-4 p-4 border-2 border-slate-200 rounded-xl transition-opacity ${moduleFilter === 'dimensi' ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2"><Calendar className="h-3 w-3" /> Tanggal Mulai</label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2"><Calendar className="h-3 w-3" /> Tanggal Akhir</label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-10" />
              </div>
              <p className="text-[9px] font-bold text-amber-600 leading-tight bg-amber-50 p-2 rounded">Jika dibiarkan kosong, seluruh histori transaksi akan diekspor.</p>
            </div>
          </div>

          {/* Format Selector */}
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest">3. Format Output</p>
            <div className="flex flex-col gap-2">
              <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${format === 'xlsx' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="format" checked={format === 'xlsx'} onChange={() => setFormat('xlsx')} className="w-4 h-4 text-emerald-600" />
                <FileSpreadsheet className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Excel (.xlsx)</p>
                  <p className="text-[10px] text-slate-500">1 File Multiple Sheets</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${format === 'zip' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="format" checked={format === 'zip'} onChange={() => setFormat('zip')} className="w-4 h-4 text-indigo-600" />
                <FileArchive className="h-6 w-6 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-900">ZIP / CSV (.zip)</p>
                  <p className="text-[10px] text-slate-500">Kumpulan File .csv</p>
                </div>
              </label>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Action Area */}
      <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-900 rounded-2xl shadow-xl">
        <div className="mb-4 md:mb-0">
          <p className="text-sm font-bold text-slate-300">Estimasi Beban Ekstraksi</p>
          <p className="text-2xl font-black text-white">{activeTablesCount} Tabel Terpilih</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button
            size="lg"
            onClick={handleBackup}
            disabled={status === 'preparing' || status === 'downloading'}
            className="h-14 px-8 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white font-black uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02]"
          >
            {status === 'preparing' || status === 'downloading' ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {status === 'preparing' ? 'Memproses...' : 'Mengunduh...'}
              </>
            ) : (
              <>
                <ArrowDownToLine className="h-5 w-5 mr-2" /> Jalankan Ekstraksi
              </>
            )}
          </Button>
          
          {/* Status Indicator */}
          {status === 'success' && (
            <div className="flex items-center gap-2 text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4" /> <span className="text-xs font-bold">{progress}</span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-rose-400 animate-in fade-in">
              <AlertTriangle className="h-4 w-4" /> <span className="text-xs font-bold">{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
