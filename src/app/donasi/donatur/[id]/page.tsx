'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Pagination from '@/components/ui/pagination-numbered'
import {
  ArrowLeft, Building2, History, Wallet, MapPin, User, Search,
  Loader2, TrendingUp, Calendar, Hash, Receipt, ChevronUp, ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'

const ITEMS_PER_PAGE = 10

export default function DetailDonaturPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Filters & Pagination
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  const formatTanggalDW = (sk: number | string) => {
    if (!sk) return '-'
    const s = sk.toString()
    if (s.length !== 8) return s
    return `${s.substring(6, 8)}/${s.substring(4, 6)}/${s.substring(0, 4)}`
  }

  const getYear = (sk: number | string) => {
    if (!sk) return null
    const s = sk.toString()
    if (s.length !== 8) return null
    return s.substring(0, 4)
  }

  useEffect(() => {
    fetch(`/api/donatur/${id}`)
      .then(res => res.json())
      .then(d => {
        if (d.error) toast.error(d.error)
        else setData(d)
        setLoading(false)
      })
  }, [id])

  // Aggregate stats from fact_donasi
  const stats = useMemo(() => {
    if (!data?.donatur?.fact_donasi) return null
    const txns = data.donatur.fact_donasi
    const total = txns.reduce((sum: number, t: any) => sum + Number(t.nominal_valid || 0), 0)
    const years = new Set(txns.map((t: any) => getYear(t.sk_tgl_bersih)).filter(Boolean))
    const lastTxn = txns[0] // already sorted desc by API
    return {
      total,
      count: txns.length,
      yearCount: years.size,
      lastDate: lastTxn ? formatTanggalDW(lastTxn.sk_tgl_bersih) : '-',
      avg: txns.length > 0 ? total / txns.length : 0,
      years: Array.from(years).sort().reverse() as string[],
    }
  }, [data])

  // Filter + sort transactions
  const filteredTxns = useMemo(() => {
    if (!data?.donatur?.fact_donasi) return []
    let txns = [...data.donatur.fact_donasi]

    if (yearFilter !== 'all') {
      txns = txns.filter((t: any) => getYear(t.sk_tgl_bersih) === yearFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      txns = txns.filter((t: any) =>
        t.id_transaksi_donasi?.toLowerCase().includes(q) ||
        t.no_ref?.toLowerCase().includes(q) ||
        t.dim_program_donasi?.nama_program?.toLowerCase().includes(q)
      )
    }

    txns.sort((a: any, b: any) => {
      const diff = Number(b.sk_tgl_bersih || 0) - Number(a.sk_tgl_bersih || 0)
      return sortDir === 'desc' ? diff : -diff
    })

    return txns
  }, [data, search, yearFilter, sortDir])

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredTxns.length / ITEMS_PER_PAGE))
  const paginatedTxns = filteredTxns.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, yearFilter])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Memuat data donatur...</p>
      </div>
    </div>
  )

  if (!data) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <p className="text-sm font-bold text-slate-700">Data donatur tidak ditemukan</p>
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mt-4">
          <ArrowLeft size={14} className="mr-1.5" /> Kembali
        </Button>
      </div>
    </div>
  )

  const { donatur, history } = data

  // Format Rupiah
  const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n)

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      {/* TOP NAV BAR */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="-ml-2 text-slate-500 font-semibold hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft size={14} className="mr-1.5" /> Kembali ke Daftar
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/donasi/donatur">Donatur</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-slate-700">{donatur.nama_lengkap || donatur.nama || donatur.id_donatur}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* PROFILE HEADER */}
        <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="shrink-0 mx-auto sm:mx-0">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                  <User size={36} className="text-white" strokeWidth={2} />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-2">
                  <Badge size="sm" variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-mono">
                    {donatur.id_donatur}
                  </Badge>
                  {donatur.tipe && (
                    <Badge size="sm" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {donatur.tipe}
                    </Badge>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                  {donatur.nama_lengkap || donatur.nama || '-'}
                </h1>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Building2 size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Perusahaan / Afiliasi</p>
                      <p className="font-semibold text-slate-700 truncate">{donatur.perusahaan || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Alamat</p>
                      <p className="font-semibold text-slate-700 leading-snug">{donatur.alamat || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QUICK STATS */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon={<Wallet size={16} />}
              label="Total Donasi"
              value={formatRupiah(stats.total)}
              accent="emerald"
              prominent
            />
            <StatCard
              icon={<Receipt size={16} />}
              label="Jumlah Transaksi"
              value={stats.count.toLocaleString('id-ID')}
              accent="blue"
            />
            <StatCard
              icon={<Calendar size={16} />}
              label="Tahun Aktif"
              value={`${stats.yearCount} Tahun`}
              accent="indigo"
            />
            <StatCard
              icon={<TrendingUp size={16} />}
              label="Donasi Terakhir"
              value={stats.lastDate}
              accent="amber"
            />
          </div>
        )}

        {/* RIWAYAT DONASI TABLE */}
        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
          {/* Table Header (light) */}
          <div className="border-b border-slate-200 px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Wallet size={16} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Riwayat Donasi</h2>
                  <p className="text-[11px] text-slate-500">
                    {filteredTxns.length} dari {stats?.count || 0} transaksi
                  </p>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Cari transaksi atau program..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-9 pl-9 text-sm w-full sm:w-64"
                  />
                </div>
                {stats && stats.years.length > 0 && (
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="h-9 w-full sm:w-[120px] text-sm">
                      <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tahun</SelectItem>
                      {stats.years.map((y: string) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-slate-50 border-slate-200">
                  <TableHead
                    className="font-bold text-[10px] uppercase tracking-wider text-slate-500 cursor-pointer select-none w-[140px]"
                    onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                  >
                    <span className="inline-flex items-center gap-1">
                      Tgl. Transaksi
                      {sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                    </span>
                  </TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Program Penyaluran</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 w-[180px]">No. Referensi</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 text-right w-[180px]">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTxns.length > 0 ? (
                  paginatedTxns.map((txn: any) => (
                    <TableRow key={txn.sk_fakta_donasi || txn.id_transaksi_donasi} className="hover:bg-emerald-50/40 border-slate-100">
                      <TableCell className="font-mono text-xs font-semibold text-slate-700 align-top">
                        {formatTanggalDW(txn.sk_tgl_bersih)}
                      </TableCell>
                      <TableCell className="align-top">
                        <p className="font-semibold text-sm text-slate-800 leading-tight">
                          {txn.dim_program_donasi?.nama_program || 'Program Umum'}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {txn.id_transaksi_donasi}
                        </p>
                      </TableCell>
                      <TableCell className="align-top">
                        {txn.no_ref ? (
                          <Badge size="sm" variant="outline" className="bg-white text-slate-600 border-slate-200 font-mono">
                            {txn.no_ref}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <p className="font-bold text-slate-900 text-sm tabular-nums">
                          {formatRupiah(Number(txn.nominal_valid))}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <EmptyState
                        title={search || yearFilter !== 'all' ? 'Tidak ada hasil' : 'Belum ada riwayat donasi'}
                        description={
                          search || yearFilter !== 'all'
                            ? 'Coba ubah kata kunci atau filter tahun.'
                            : 'Data donasi akan tampil setelah donatur melakukan transaksi.'
                        }
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {paginatedTxns.length > 0 ? (
              paginatedTxns.map((txn: any) => (
                <div key={txn.sk_fakta_donasi || txn.id_transaksi_donasi} className="p-4 hover:bg-emerald-50/40">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-slate-800 leading-tight">
                        {txn.dim_program_donasi?.nama_program || 'Program Umum'}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                        {txn.id_transaksi_donasi}
                      </p>
                    </div>
                    <p className="font-bold text-slate-900 text-sm tabular-nums shrink-0">
                      {formatRupiah(Number(txn.nominal_valid))}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-2">
                    <span className="font-mono font-semibold text-slate-500">
                      {formatTanggalDW(txn.sk_tgl_bersih)}
                    </span>
                    {txn.no_ref && (
                      <Badge size="sm" variant="outline" className="bg-white text-slate-600 border-slate-200 font-mono">
                        {txn.no_ref}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title={search || yearFilter !== 'all' ? 'Tidak ada hasil' : 'Belum ada riwayat donasi'}
                description={
                  search || yearFilter !== 'all'
                    ? 'Coba ubah kata kunci atau filter tahun.'
                    : 'Data donasi akan tampil setelah donatur melakukan transaksi.'
                }
              />
            )}
          </div>

          {/* Pagination */}
          {filteredTxns.length > ITEMS_PER_PAGE && (
            <div className="border-t border-slate-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredTxns.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </Card>

        {/* RIWAYAT PERUBAHAN DATA (SCD Type 2) */}
        {history && history.length > 0 && (
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-4 sm:px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <History size={16} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Riwayat Perubahan Data</h2>
                  <p className="text-[11px] text-slate-500">
                    {history.length} versi tersimpan (SCD Type 2)
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <ol className="relative border-l-2 border-slate-200 ml-2 space-y-5">
                {history.map((h: any, i: number) => (
                  <li key={i} className="ml-5">
                    <span className="absolute -left-[7px] flex h-3 w-3 items-center justify-center">
                      <span className="h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                    </span>
                    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 hover:border-blue-200 hover:bg-white transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-bold text-slate-800">
                              {h.nama_lengkap || h.nama || '-'}
                            </p>
                            <Badge size="sm" variant="outline" className="bg-slate-100 text-slate-500 border-slate-200">
                              v{history.length - i}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {h.perusahaan || 'Pribadi / Umum'}
                            {h.alamat && (
                              <span className="text-slate-400"> • {h.alamat}</span>
                            )}
                          </p>
                        </div>
                        <div className="shrink-0 sm:text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Periode Berlaku</p>
                          <p className="text-xs font-mono font-semibold text-blue-700">
                            {new Date(h.valid_from).toLocaleDateString('id-ID')} → {new Date(h.valid_to).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// ─── StatCard component ──────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  accent,
  prominent = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: 'emerald' | 'blue' | 'indigo' | 'amber'
  prominent?: boolean
}) {
  const accentMap = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${accentMap[accent]}`}>
            {icon}
          </div>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className={`font-bold text-slate-900 tabular-nums leading-tight break-all ${prominent ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
