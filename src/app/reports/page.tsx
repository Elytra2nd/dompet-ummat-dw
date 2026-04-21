'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog" // Tambahkan ini
import { 
  FileSpreadsheet, 
  FileText, 
  Users, 
  HeartHandshake, 
  Ambulance,
  RefreshCw,
  Eye,
  DownloadCloud
} from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null)
  const [donaturData, setDonaturData] = useState<any>(null)
  const [ambulanData, setAmbulanData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // STATE UNTUK PREVIEW
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{data: any[], title: string, type: 'excel' | 'pdf'} | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resSum, resDon, resAmb] = await Promise.all([
        fetch('/api/reports/summary'),
        fetch('/api/reports/donatur'),
        fetch('/api/reports/ambulan')
      ])
      setSummary(await resSum.json())
      setDonaturData(await resDon.json())
      setAmbulanData(await resAmb.json())
    } catch (error) {
      toast.error("Gagal sinkronisasi data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Fungsi Trigger Preview
  const handlePreview = (data: any[], title: string, type: 'excel' | 'pdf') => {
    setPreviewData({ data, title, type })
    setPreviewOpen(true)
  }

  // Logika Export Tetap Sama (Dipanggil dari dalam Modal)
  const executeExport = () => {
    if (!previewData) return
    if (previewData.type === 'excel') {
      exportCustomExcel(previewData.data, previewData.title)
    } else {
      exportCustomPDF(previewData.data, previewData.title)
    }
    setPreviewOpen(false)
  }

  const exportCustomExcel = (data: any[], title: string) => {
    const worksheet = XLSX.utils.json_to_sheet([]);
    const header = [["LAPORAN EKSEKUTIF - DOMPET UMMAT"], [`Kategori: ${title}`], [`Tgl: ${new Date().toLocaleString('id-ID')}`], []];
    XLSX.utils.sheet_add_aoa(worksheet, header, { origin: "A1" });
    const tableData = data.map(item => ({
      'Label': item.tipe || item.armada || 'N/A',
      'Total': item._count?.id_donatur || item._count?.id_transaksi || 0
    }));
    XLSX.utils.sheet_add_json(worksheet, tableData, { origin: "A5" });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, `${title}_2026.xlsx`);
  }

  const exportCustomPDF = (data: any[], title: string) => {
    const doc = new jsPDF();
    doc.setFontSize(16).setFont("helvetica", "bold").text("DOMPET UMMAT KALBAR", 105, 15, { align: "center" });
    doc.line(15, 25, 195, 25);
    autoTable(doc, {
      startY: 40,
      head: [['No', 'Deskripsi', 'Total']],
      body: data.map((item, index) => [index + 1, item.tipe || item.armada || 'N/A', item._count?.id_donatur || item._count?.id_transaksi || 0]),
    });
    doc.save(`${title}_Official.pdf`);
  }

  if (loading) return <div className="p-10 text-center font-black animate-pulse">MEMPERSIAPKAN ANALITIK...</div>

  return (
    <div className="p-4 md:p-8 space-y-8 bg-white min-h-screen font-sans">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b-4 border-slate-900 pb-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">BIDA <span className="text-emerald-600">Reports</span></h1>
        <Button onClick={fetchData} variant="outline" className="font-bold border-2"><RefreshCw className="mr-2 h-4 w-4" /> Sync</Button>
      </div>

      <Tabs defaultValue="donatur" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="donatur" className="font-bold">DONATUR</TabsTrigger>
          <TabsTrigger value="ambulan" className="font-bold">AMBULAN</TabsTrigger>
        </TabsList>

        {/* TAB DONATUR */}
        <TabsContent value="donatur">
          <Card className="border-2 rounded-none">
            <CardHeader className="flex flex-row items-center justify-between bg-slate-50 border-b">
              <CardTitle className="text-xs font-black uppercase">Statistik Donatur</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="font-bold border-2" onClick={() => handlePreview(donaturData.stats, 'Laporan Donatur', 'excel')}>
                  <Eye className="h-4 w-4 mr-2" /> Excel Preview
                </Button>
                <Button size="sm" className="bg-slate-900 font-bold" onClick={() => handlePreview(donaturData.stats, 'Laporan Donatur', 'pdf')}>
                  <Eye className="h-4 w-4 mr-2" /> PDF Preview
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
               {donaturData?.stats.map((item: any, i: number) => (
                 <div key={i} className="flex justify-between border-b py-2 text-sm font-bold">
                   <span>{item.tipe || 'Lainnya'}</span>
                   <span className="text-emerald-600">{item._count.id_donatur} Jiwa</span>
                 </div>
               ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB AMBULAN (Lakukan hal yang sama untuk tombolnya) */}
        <TabsContent value="ambulan">
           <Card className="border-2 rounded-none">
            <CardHeader className="flex flex-row items-center justify-between bg-slate-50 border-b">
              <CardTitle className="text-xs font-black uppercase">Statistik Ambulan</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="font-bold border-2" onClick={() => handlePreview(ambulanData.perArmada, 'Laporan Ambulan', 'excel')}>
                  <Eye className="h-4 w-4 mr-2" /> Excel Preview
                </Button>
                <Button size="sm" className="bg-slate-900 font-bold" onClick={() => handlePreview(ambulanData.perArmada, 'Laporan Ambulan', 'pdf')}>
                  <Eye className="h-4 w-4 mr-2" /> PDF Preview
                </Button>
              </div>
            </CardHeader>
            {/* ... Content ... */}
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL PREVIEW */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl border-4 border-slate-900 rounded-none shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-2 text-slate-900">
              {previewData?.type === 'excel' ? <FileSpreadsheet className="text-green-600" /> : <FileText className="text-rose-600" />}
              Preview: {previewData?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-slate-100 p-4 border-2 border-dashed border-slate-300 rounded-lg">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Struktur Dokumen Terdeteksi:</p>
              <div className="space-y-3">
                {previewData?.data.slice(0, 5).map((row, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2 border shadow-sm">
                    <span className="text-xs font-black text-slate-600">{row.tipe || row.armada || 'Data Point'}</span>
                    <Badge className="bg-emerald-100 text-emerald-700 border-none">{row._count?.id_donatur || row._count?.id_transaksi} Units</Badge>
                  </div>
                ))}
                {previewData && previewData.data.length > 5 && (
                  <p className="text-center text-[10px] font-bold text-slate-400">... dan {previewData.data.length - 5} data lainnya</p>
                )}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-400 flex items-start gap-3">
              <DownloadCloud className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                Dokumen ini akan diunduh dalam format <strong>{previewData?.type.toUpperCase()}</strong> dengan header resmi Dompet Ummat. Pastikan data di atas sudah sesuai sebelum melanjutkan proses export ke penyimpanan lokal.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" className="font-black uppercase text-xs" onClick={() => setPreviewOpen(false)}>Batal</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs px-8" onClick={executeExport}>
              Download Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}