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
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Daftar semua tabel yang akan di-backup
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

  const handleBackup = async () => {
    try {
      setStatus('preparing')
      setErrorMsg('')
      setProgress('Menghubungi server...')

      // Mulai countdown estimasi
      const startTime = Date.now()

      setProgress('Mengambil data dari 17 tabel...')

      const res = await fetch('/api/backup')

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.details || err.error || 'Backup gagal')
      }

      setStatus('downloading')
      setProgress('Membuat file Excel...')

      const blob = await res.blob()
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

      // Trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || `backup_dompet_ummat_${new Date().toISOString().slice(0, 10)}.xlsx`
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

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl shadow-lg shadow-sky-200">
            <HardDriveDownload className="h-7 w-7 text-white" />
          </div>
          Backup Data Warehouse
        </h1>
        <p className="text-slate-500 mt-2 ml-14">
          Unduh seluruh data mentah dari database ke file Excel. Berbeda dari laporan — ini adalah dump lengkap tanpa agregasi.
        </p>
      </div>

      {/* Warning Card */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Shield className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-amber-900">Informasi Keamanan</p>
            <p className="text-sm text-amber-700 mt-1">
              File backup mengandung <strong>seluruh data warehouse</strong> termasuk data personal (NIK, nama, alamat, koordinat).
              Simpan file ini dengan aman dan jangan disebarluaskan. Hanya Administrator yang dapat mengakses fitur ini.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Backup Action Card */}
      <Card className="border-2 border-slate-200 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-5 w-5 text-indigo-600" />
            Full Database Backup
          </CardTitle>
          <CardDescription>
            Mengekspor 17 tabel (10 Dimensi + 7 Fakta) ke dalam 1 file Excel dengan sheet terpisah per tabel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Action Button */}
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              onClick={handleBackup}
              disabled={status === 'preparing' || status === 'downloading'}
              className="h-14 px-8 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
            >
              {status === 'preparing' || status === 'downloading' ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {status === 'preparing' ? 'Memproses...' : 'Mengunduh...'}
                </>
              ) : (
                <>
                  <ArrowDownToLine className="h-5 w-5 mr-2" />
                  Unduh Backup Sekarang
                </>
              )}
            </Button>

            {/* Status Indicator */}
            {status === 'success' && (
              <div className="flex items-center gap-2 text-emerald-600 animate-in fade-in">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-bold">{progress}</span>
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-600 animate-in fade-in">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-bold">{errorMsg}</span>
              </div>
            )}
            {(status === 'preparing' || status === 'downloading') && (
              <span className="text-sm text-slate-500 font-medium">{progress}</span>
            )}
          </div>

          {/* Output Format Info */}
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
            <FileSpreadsheet className="h-8 w-8 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-900">Format Output</p>
              <p className="text-xs text-slate-500">
                File <code className="px-1 py-0.5 bg-slate-200 rounded text-[11px]">.xlsx</code> dengan {DIMENSION_TABLES.length + FACT_TABLES.length + 1} sheet 
                (17 tabel + 1 ringkasan). Header berwarna, filter otomatis, dan baris pertama dibekukan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dimension Tables */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-sky-500" />
              Tabel Dimensi ({DIMENSION_TABLES.length})
            </CardTitle>
            <CardDescription>Data master / referensi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {DIMENSION_TABLES.map(table => (
                <div key={table.name} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <table.icon className="h-4 w-4 text-sky-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{table.label}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{table.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fact Tables */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Tabel Fakta ({FACT_TABLES.length})
            </CardTitle>
            <CardDescription>Data transaksi / operasional</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {FACT_TABLES.map(table => (
                <div key={table.name} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <table.icon className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{table.label}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{table.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
