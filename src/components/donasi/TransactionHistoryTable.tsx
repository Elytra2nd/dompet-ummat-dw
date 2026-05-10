'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Loader2, Pencil, Trash2, ChevronLeft, ChevronRight, History, AlertTriangle, Eye, Receipt, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils-ambulan'
import Pagination from '@/components/ui/pagination-numbered'

type Transaction = {
  sk_fakta_donasi: number
  id_transaksi_donasi: string
  nominal_valid: string
  no_ref: string
  dim_donatur?: { nama_lengkap: string }
  dim_program_donasi?: { program_induk: string, sub_program: string }
  dim_jalur_pembayaran?: { metode_bayar: string, bank_asal: string }
}

export default function TransactionHistoryTable() {
  const [data, setData] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  // Search & Filter
  const [search, setSearch] = useState('')
  const [filterProgram, setFilterProgram] = useState('Semua')
  
  // Paginasi
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [limit] = useState(10)

  // Modal Edit
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingData, setEditingData] = useState<Transaction | null>(null)
  const [editNominal, setEditNominal] = useState('')
  const [editKeterangan, setEditKeterangan] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Modal Detail
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailData, setDetailData] = useState<Transaction | null>(null)

  const openDetailModal = (item: Transaction) => {
    setDetailData(item)
    setDetailModalOpen(true)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/donasi/riwayat?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&program=${encodeURIComponent(filterProgram)}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json.data)
      setTotalPages(json.meta.totalPages)
      setTotalItems(json.meta.total)
    } catch (error) {
      toast.error('Gagal mengambil riwayat transaksi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, search, filterProgram])

  const openEditModal = (item: Transaction) => {
    setEditingData(item)
    setEditNominal(item.nominal_valid)
    setEditKeterangan(item.no_ref || '')
    setEditModalOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingData) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/donasi/riwayat/${editingData.sk_fakta_donasi}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nominal_valid: editNominal,
          no_ref: editKeterangan
        })
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success('Transaksi berhasil diupdate')
      setEditModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error('Gagal memperbarui transaksi')
    } finally {
      setIsSaving(false)
    }
  }

  // Modal Hapus
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const confirmDelete = (id: number) => {
    setItemToDelete(id)
    setDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (itemToDelete === null) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/donasi/riwayat/${itemToDelete}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Transaksi berhasil dihapus')
      
      setDeleteModalOpen(false)
      setItemToDelete(null)
      
      // Refresh data
      if (data.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        fetchData()
      }
    } catch (error) {
      toast.error('Gagal menghapus transaksi')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="mt-8 border-none shadow-md">
      <CardHeader className="border-b bg-white">
        <CardTitle className="text-lg font-bold uppercase tracking-tight flex items-center gap-2 text-slate-800">
          <History className="h-5 w-5 text-indigo-600" /> Riwayat Transaksi Terakhir
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari nama donatur..." 
              className="h-10 pl-10 text-sm font-medium w-full bg-white" 
              value={search} 
              onChange={(e) => {setSearch(e.target.value); setPage(1);}} 
            />
          </div>
          <div className="relative">
            <Filter className="absolute top-3 left-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <select 
              className="h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer min-w-[180px]" 
              value={filterProgram} 
              onChange={(e) => {setFilterProgram(e.target.value); setPage(1);}}
            >
              <option value="Semua">Semua Program</option>
              {['Kesehatan','Pendidikan','Ekonomi','Sosial Kemanusiaan','Dakwah & Advokasi'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {/* Desktop Table - hidden on xs */}
          <table className="hidden sm:table w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b">
              <tr>
                <th className="px-6 py-4 w-[180px] text-left">ID Transaksi</th>
                <th className="px-6 py-4 min-w-[200px] text-left">Donatur</th>
                <th className="px-6 py-4 min-w-[150px] text-left">Program</th>
                <th className="px-6 py-4 min-w-[150px] text-right">Nominal</th>
                <th className="px-6 py-4 hidden lg:table-cell min-w-[150px] text-left">Keterangan</th>
                <th className="px-6 py-4 w-[140px] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
                    <p className="mt-2 text-xs font-bold text-slate-400">Memuat data transaksi...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">
                    Belum ada transaksi donasi yang tercatat.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.sk_fakta_donasi} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-left">{item.id_transaksi_donasi}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 text-left">
                      {item.dim_donatur?.nama_lengkap || 'Hamba Allah'}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="font-semibold text-emerald-600">{item.dim_program_donasi?.program_induk || '-'}</div>
                      <div className="text-[10px] text-slate-400 uppercase">{item.dim_program_donasi?.sub_program || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-indigo-600">
                      {formatRupiah(Number(item.nominal_valid))}
                    </td>
                    <td className="px-6 py-4 text-xs hidden lg:table-cell text-left">{item.no_ref || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => openDetailModal(item)} title="Detail Transaksi">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => openEditModal(item)} title="Edit Transaksi">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => confirmDelete(item.sk_fakta_donasi)} title="Hapus Transaksi">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card View - visible on xs only */}
          <div className="sm:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-xs font-bold text-slate-400">Memuat data...</p>
              </div>
            ) : data.length === 0 ? (
              <div className="py-8 text-center text-slate-500 italic text-sm px-4">
                Belum ada transaksi donasi yang tercatat.
              </div>
            ) : (
              data.map((item) => (
                <div key={item.sk_fakta_donasi} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {item.dim_donatur?.nama_lengkap || 'Hamba Allah'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-emerald-600">{item.dim_program_donasi?.program_induk || '-'}</span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-400 uppercase">{item.dim_program_donasi?.sub_program || '-'}</span>
                      </div>
                      <p className="text-lg font-semibold text-indigo-600 mt-2">
                        {formatRupiah(Number(item.nominal_valid))}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button variant="outline" size="icon" className="h-8 w-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => openDetailModal(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => openEditModal(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => confirmDelete(item.sk_fakta_donasi)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Paginasi */}
        {!loading && totalPages > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={limit}
            onPageChange={setPage}
          />
        )}
      </CardContent>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-semibold uppercase text-indigo-900 tracking-tight">Edit Transaksi Donasi</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-xs font-bold text-slate-500 uppercase">
                ID Trx
              </label>
              <Input
                value={editingData?.id_transaksi_donasi || ''}
                disabled
                className="col-span-3 font-mono text-xs bg-slate-100"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-xs font-bold text-slate-500 uppercase">
                Nominal
              </label>
              <Input
                type="number"
                value={editNominal}
                onChange={(e) => setEditNominal(e.target.value)}
                className="col-span-3 font-bold text-indigo-700"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-xs font-bold text-slate-500 uppercase">
                Keterangan
              </label>
              <Input
                value={editKeterangan}
                onChange={(e) => setEditKeterangan(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Batal</Button>
            <Button onClick={handleUpdate} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 font-bold">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 font-semibold uppercase tracking-tight">
              <AlertTriangle className="h-5 w-5" /> Konfirmasi Hapus
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-600 pt-2">
              Apakah Anda yakin ingin menghapus transaksi ini secara permanen? Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi total rekapitulasi dasbor.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="font-bold shadow-md">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Ya, Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-semibold uppercase text-indigo-900 tracking-tight">
              <Receipt className="h-5 w-5 text-indigo-600" /> Detail Transaksi Masuk
            </DialogTitle>
          </DialogHeader>
          {detailData && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <div>
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">ID Transaksi</p>
                  <p className="font-mono text-sm font-bold text-indigo-900 mt-1">{detailData.id_transaksi_donasi}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Nominal Donasi</p>
                  <p className="font-semibold text-xl text-indigo-700 mt-1">{formatRupiah(Number(detailData.nominal_valid))}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-6 px-2">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Donatur</p>
                  <p className="font-semibold text-slate-800 mt-1">{detailData.dim_donatur?.nama_lengkap || 'Hamba Allah'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Keterangan / Referensi</p>
                  <p className="font-semibold text-slate-800 mt-1">{detailData.no_ref || '-'}</p>
                </div>

                <div className="col-span-2 pt-4 border-t border-slate-100"></div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Program Induk</p>
                  <p className="font-semibold text-emerald-600 mt-1">{detailData.dim_program_donasi?.program_induk || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Sub Program</p>
                  <p className="font-semibold text-emerald-600 mt-1">{detailData.dim_program_donasi?.sub_program || '-'}</p>
                </div>

                <div className="col-span-2 pt-4 border-t border-slate-100"></div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Metode Pembayaran</p>
                  <p className="font-semibold text-slate-800 mt-1">{detailData.dim_jalur_pembayaran?.metode_bayar || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Bank Asal</p>
                  <p className="font-semibold text-slate-800 mt-1">{detailData.dim_jalur_pembayaran?.bank_asal || '-'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailModalOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 font-bold w-full sm:w-auto">
              Tutup Detail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
