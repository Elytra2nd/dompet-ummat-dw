'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  FileSpreadsheet, 
  FileText, 
  Users, 
  HeartHandshake, 
  Ambulance,
  RefreshCw,
  Eye,
  DownloadCloud,
  TrendingUp,
  Clock,
  MapPin,
  CheckCircle2
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
  const [mustahikData, setMustahikData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // STATE UNTUK PREVIEW
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{data: any[], title: string, type: 'excel' | 'pdf', insights?: any} | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resSum, resDon, resAmb, resMus] = await Promise.all([
        fetch('/api/reports/summary'),
        fetch('/api/reports/donatur'),
        fetch('/api/reports/ambulan'),
        fetch('/api/reports/mustahik')
      ])
      setSummary(await resSum.json())
      setDonaturData(await resDon.json())
      setAmbulanData(await resAmb.json())
      setMustahikData(await resMus.json())
    } catch (error) {
      toast.error("Gagal sinkronisasi data warehouse")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handlePreview = (data: any[], title: string, type: 'excel' | 'pdf', insights?: any) => {
    setPreviewData({ data, title, type, insights })
    setPreviewOpen(true)
  }

  const executeExport = () => {
    if (!previewData) return
    if (previewData.type === 'excel') {
      exportCustomExcel(previewData.data, previewData.title)
    } else {
      exportCustomPDF(previewData.data, previewData.title, previewData.insights)
    }
    setPreviewOpen(false)
  }

  const exportCustomExcel = (data: any[], title: string) => {
    const worksheet = XLSX.utils.json_to_sheet([]);
    const header = [
      ["LAPORAN EKSEKUTIF - DOMPET UMMAT"],
      [`Kategori: ${title}`],
      [`Tgl Cetak: ${new Date().toLocaleString('id-ID')}`],
      ["Status: Official Data Warehouse Record"],
      []
    ];
    XLSX.utils.sheet_add_aoa(worksheet, header, { origin: "A1" });
    
    const tableData = data.map(item => ({
      'Kategori/Label': item.tipe || item.armada || item.kategori_pm || item.jam || 'N/A',
      'Total Accumulation': item._count?.id_donatur || item._count?.id_transaksi || item._count?.id_mustahik || 0
    }));

    XLSX.utils.sheet_add_json(worksheet, tableData, { origin: "A6" });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_2026.xlsx`);
    toast.success("Excel Formal berhasil diunduh");
  }

  const exportCustomPDF = (data: any[], title: string, insights?: any) => {
    const doc = new jsPDF();
    doc.setFontSize(18).setFont("helvetica", "bold").text("DOMPET UMMAT KALBAR", 105, 15, { align: "center" });
    doc.setFontSize(10).setFont("helvetica", "normal").text("Pusat Analisis Data & Reporting Terpadu", 105, 22, { align: "center" });
    doc.line(15, 25, 195, 25);

    doc.setFontSize(12).setFont("helvetica", "bold").text(`LAPORAN: ${title.toUpperCase()}`, 15, 35);
    doc.setFontSize(9).setFont("helvetica", "normal").text(`Waktu Sinkronisasi: ${new Date().toLocaleString('id-ID')}`, 15, 42);

    autoTable(doc, {
      startY: 48,
      head: [['No', 'Dimensi Analisis', 'Total Aggregation']],
      body: data.map((item, index) => [
        index + 1, 
        item.tipe || item.armada || item.kategori_pm || item.jam || 'N/A', 
        `${item._count?.id_donatur || item._count?.id_transaksi || item._count?.id_mustahik || 0} Records`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.text("Dihasilkan secara otomatis oleh BIDA Platform", 15, finalY);
    doc.text("Halaman 1 dari 1", 105, 285, { align: "center" });

    doc.save(`${title}_Official.pdf`);
    toast.success("PDF Official berhasil dibuat");
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin" />
      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Mempersiapkan Insight Warehouse...</p>
    </div>
  )

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 pb-6 border-slate-200">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
            <TrendingUp className="h-10 w-10 text-emerald-600" /> BIDA <span className="text-emerald-600">Analytics</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs tracking-widest mt-1 uppercase">Executive Decision Support System</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-black px-4 py-2">
             SYSTEM ONLINE: {summary?.system.status}
           </Badge>
           <Button onClick={fetchData} variant="outline" className="font-bold border-2 bg-white"><RefreshCw className="mr-2 h-4 w-4" /> Sync</Button>
        </div>
      </div>

      {/* KPI CARDS WITH GROWTH INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white border-t-4 border-t-emerald-500">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Donatur Aktif</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-slate-800">{summary?.totals.donatur}</h3>
              <Badge className="bg-emerald-100 text-emerald-700 border-none mb-1">+{summary?.growth.donatur_new} New</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-t-4 border-t-blue-500">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Penerima Manfaat</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-slate-800">{summary?.totals.mustahik}</h3>
              <Badge className="bg-blue-100 text-blue-700 border-none mb-1">+{summary?.growth.mustahik_new} Month</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-t-4 border-t-rose-500">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Layanan Ambulan</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-slate-800">{summary?.totals.ambulan}</h3>
              <Badge className="bg-rose-100 text-rose-700 border-none mb-1">{summary?.growth.ambulan_this_month} Trips</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="donatur" className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-8">
          <TabsTrigger value="donatur" className="font-black text-xs uppercase px-8">Donatur</TabsTrigger>
          <TabsTrigger value="ambulan" className="font-black text-xs uppercase px-8">Ambulan</TabsTrigger>
          <TabsTrigger value="mustahik" className="font-black text-xs uppercase px-8">Mustahik</TabsTrigger>
        </TabsList>

        {/* TAB DONATUR */}
        <TabsContent value="donatur">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b">
                <CardTitle className="text-sm font-black uppercase tracking-tighter">Segmentasi Tipe Donatur</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="font-bold h-7 text-[9px]" onClick={() => handlePreview(donaturData.stats, 'Laporan Donatur', 'excel', donaturData.insights)}>Excel</Button>
                  <Button size="sm" className="bg-slate-900 font-bold h-7 text-[9px]" onClick={() => handlePreview(donaturData.stats, 'Laporan Donatur', 'pdf', donaturData.insights)}>PDF</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {donaturData?.stats.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between group">
                    <span className="text-xs font-bold text-slate-600 uppercase">{item.tipe || 'Individu'}</span>
                    <div className="flex items-center gap-4 flex-1 mx-8">
                       <div className="h-1.5 bg-slate-100 flex-1 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${(item._count.id_donatur / donaturData.total) * 100}%` }} />
                       </div>
                       <span className="text-[10px] font-black text-slate-400 w-10 text-right">{((item._count.id_donatur / donaturData.total) * 100).toFixed(0)}%</span>
                    </div>
                    <span className="text-xs font-black text-slate-800">{item._count.id_donatur} Jiwa</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="bg-emerald-900 text-white border-none shadow-xl">
               <CardHeader><CardTitle className="text-xs font-black uppercase text-emerald-400">Warehouse Insight</CardTitle></CardHeader>
               <CardContent className="space-y-6">
                  <div>
                    <p className="text-[9px] font-black uppercase text-emerald-500">SCD Type 2 Tracking</p>
                    <p className="text-2xl font-black">{donaturData?.insights.total_historical_changes} Histori</p>
                    <p className="text-[10px] text-emerald-200/60 leading-tight mt-1">Total perubahan data master yang terekam secara persisten di warehouse.</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-emerald-500">Corporate Partners</p>
                    <p className="text-2xl font-black">{donaturData?.insights.corporate_donors}</p>
                    <p className="text-[10px] text-emerald-200/60 leading-tight mt-1">Jumlah entitas lembaga/korporasi yang aktif berkontribusi.</p>
                  </div>
               </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB AMBULAN */}
        <TabsContent value="ambulan">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card className="md:col-span-2 border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b">
                  <CardTitle className="text-sm font-black uppercase tracking-tighter">Analisis Beban Waktu Operasional</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="font-bold h-7 text-[9px]" onClick={() => handlePreview(ambulanData.perWaktu, 'Beban Operasional Ambulan', 'excel')}>Excel</Button>
                    <Button size="sm" className="bg-slate-900 font-bold h-7 text-[9px]" onClick={() => handlePreview(ambulanData.perWaktu, 'Beban Operasional Ambulan', 'pdf')}>PDF</Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-2 gap-4">
                   {ambulanData?.perWaktu.map((t: any, i: number) => (
                     <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Clock className="h-4 w-4 text-rose-500" />
                           <span className="text-[10px] font-black uppercase text-slate-500">{t.jam?.replace(/__/g, ':').split('(')[0]}</span>
                        </div>
                        <span className="text-lg font-black text-slate-800">{t._count.id_transaksi}</span>
                     </div>
                   ))}
                </CardContent>
             </Card>
             <Card className="border-none shadow-sm bg-white border-l-4 border-l-rose-500">
                <CardHeader><CardTitle className="text-xs font-black uppercase text-slate-400">Peak Performance</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg">
                      <Truck className="h-5 w-5 text-rose-600" />
                      <div>
                        <p className="text-[9px] font-black text-rose-400 uppercase">Armada Teraktif</p>
                        <p className="text-xs font-black text-slate-800">{ambulanData?.insight_summary.most_busy_armada.armada.split('(')[0]}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                      <Clock className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="text-[9px] font-black text-indigo-400 uppercase">Shift Paling Sibuk</p>
                        <p className="text-xs font-black text-slate-800">{ambulanData?.insight_summary.peak_time.jam.split('(')[0]}</p>
                      </div>
                   </div>
                </CardContent>
             </Card>
           </div>
        </TabsContent>
      </Tabs>

      {/* MODAL PREVIEW DENGAN INSIGHT RINGKASAN */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl border-4 border-slate-900 rounded-none shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] p-0 overflow-hidden">
          <div className="bg-slate-900 p-6 flex items-center justify-between">
            <DialogTitle className="text-xl font-black uppercase italic text-emerald-400 flex items-center gap-3">
              {previewData?.type === 'excel' ? <FileSpreadsheet /> : <FileText />}
              {previewData?.title} Preview
            </DialogTitle>
            <Badge className="bg-emerald-500 text-white border-none">BIDA CERTIFIED</Badge>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Data Volume</p>
                  <p className="text-2xl font-black text-slate-800">{previewData?.data.length} <span className="text-xs font-bold text-slate-400">Categories</span></p>
               </div>
               <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Target Format</p>
                  <p className="text-2xl font-black text-slate-800 uppercase">{previewData?.type}</p>
               </div>
            </div>

            <div className="space-y-2">
               <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Eye className="h-3 w-3" /> Sample Data (Top 3)</p>
               {previewData?.data.slice(0, 3).map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center py-2 border-b border-dashed">
                    <span className="text-xs font-bold uppercase text-slate-600">{item.tipe || item.armada || item.jam || 'Analysis Point'}</span>
                    <span className="text-xs font-black text-emerald-600">{item._count?.id_donatur || item._count?.id_transaksi || 0} Records</span>
                 </div>
               ))}
            </div>

            <div className="bg-amber-50 p-4 border-l-4 border-amber-400">
               <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-amber-900 uppercase">Verifikasi Integritas</p>
                    <p className="text-[10px] text-amber-800 font-medium leading-tight mt-0.5">
                      Laporan ini akan diekspor dengan header formal Dompet Ummat dan timestamp audit {new Date().toLocaleTimeString()}. Data bersumber langsung dari tabel fakta warehouse.
                    </p>
                  </div>
               </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t gap-3">
            <Button variant="ghost" className="font-black uppercase text-xs" onClick={() => setPreviewOpen(false)}>Batal</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs px-10 shadow-lg" onClick={executeExport}>
              <DownloadCloud className="mr-2 h-4 w-4" /> Download Official {previewData?.type.toUpperCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}