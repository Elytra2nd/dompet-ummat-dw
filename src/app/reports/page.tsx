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
  CheckCircle2,
  Truck,
  ShieldCheck
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
  const [previewData, setPreviewData] = useState<{data: any[], title: string, type: 'excel' | 'pdf'} | null>(null)

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

  const handlePreview = (data: any[], title: string, type: 'excel' | 'pdf') => {
    setPreviewData({ data, title, type })
    setPreviewOpen(true)
  }

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
    const header = [
      ["LAPORAN EKSEKUTIF - DOMPET UMMAT"],
      [`Kategori: ${title}`],
      [`Tgl Cetak: ${new Date().toLocaleString('id-ID')}`],
      ["Status: Official Data Warehouse Record"],
      []
    ];
    XLSX.utils.sheet_add_aoa(worksheet, header, { origin: "A1" });
    const tableData = data.map(item => ({
      'Kategori/Label': item.tipe || item.armada || item.kategori_pm || item.jam || item.kabupaten_kota || 'N/A',
      'Total Accumulation': item._count?.id_donatur || item._count?.id_transaksi || item._count?.id_mustahik || 0
    }));
    XLSX.utils.sheet_add_json(worksheet, tableData, { origin: "A6" });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_2026.xlsx`);
    toast.success("Excel Formal berhasil diunduh");
  }

  const exportCustomPDF = (data: any[], title: string) => {
    const doc = new jsPDF();
    doc.setFontSize(18).setFont("helvetica", "bold").text("DOMPET UMMAT KALBAR", 105, 15, { align: "center" });
    doc.setFontSize(10).setFont("helvetica", "normal").text("Jl. Danau Sentarum No. 99, Pontianak, Kalimantan Barat", 105, 22, { align: "center" });
    doc.line(15, 25, 195, 25);
    doc.setFontSize(12).setFont("helvetica", "bold").text(`LAPORAN: ${title.toUpperCase()}`, 15, 35);
    autoTable(doc, {
      startY: 45,
      head: [['No', 'Dimensi Analisis', 'Total Aggregation']],
      body: data.map((item, index) => [
        index + 1, 
        item.tipe || item.armada || item.kategori_pm || item.jam || item.kabupaten_kota || 'N/A', 
        `${item._count?.id_donatur || item._count?.id_transaksi || item._count?.id_mustahik || 0} Records`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });
    doc.save(`${title.replace(/\s+/g, '_')}_Official.pdf`);
    toast.success("PDF Official berhasil dibuat");
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-white">
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
             SYSTEM: {summary?.system.status}
           </Badge>
           <Button onClick={fetchData} variant="outline" className="font-bold border-2 bg-white"><RefreshCw className="mr-2 h-4 w-4" /> Sync</Button>
        </div>
      </div>

      {/* KPI CARDS */}
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
                  <Button size="sm" variant="outline" className="font-bold h-7 text-[9px]" onClick={() => handlePreview(donaturData.stats, 'Laporan Donatur', 'excel')}>Excel Preview</Button>
                  <Button size="sm" className="bg-slate-900 font-bold h-7 text-[9px]" onClick={() => handlePreview(donaturData.stats, 'Laporan Donatur', 'pdf')}>PDF Preview</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {donaturData?.stats.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between group">
                    <span className="text-xs font-bold text-slate-600 uppercase">{item.tipe || 'Individu'}</span>
                    <span className="text-xs font-black text-slate-800">{item._count.id_donatur} Jiwa</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="bg-emerald-900 text-white border-none shadow-xl">
               <CardHeader><CardTitle className="text-xs font-black uppercase text-emerald-400">Warehouse Insight</CardTitle></CardHeader>
               <CardContent className="space-y-6">
                  <div>
                    <p className="text-[9px] font-black uppercase text-emerald-500 italic">SCD Tracking</p>
                    <p className="text-2xl font-black">{donaturData?.insights.total_historical_changes} Histori</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-emerald-500 italic">Corporate Partners</p>
                    <p className="text-2xl font-black">{donaturData?.insights.corporate_donors}</p>
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
                  <CardTitle className="text-sm font-black uppercase tracking-tighter">Beban Waktu Operasional</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="font-bold h-7 text-[9px]" onClick={() => handlePreview(ambulanData.perWaktu, 'Beban Operasional Ambulan', 'excel')}>Excel Preview</Button>
                    <Button size="sm" className="bg-slate-900 font-bold h-7 text-[9px]" onClick={() => handlePreview(ambulanData.perWaktu, 'Beban Operasional Ambulan', 'pdf')}>PDF Preview</Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-2 gap-4">
                   {ambulanData?.perWaktu.map((t: any, i: number) => (
                     <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-rose-500" /><span className="text-[10px] font-black uppercase text-slate-500">{t.jam}</span></div>
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
                      <div><p className="text-[9px] font-black text-rose-400 uppercase">Armada Teraktif</p><p className="text-xs font-black text-slate-800">{ambulanData?.insight_summary.most_busy_armada.armada}</p></div>
                   </div>
                </CardContent>
             </Card>
           </div>
        </TabsContent>

        {/* TAB MUSTAHIK */}
        <TabsContent value="mustahik">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b">
                <CardTitle className="text-sm font-black uppercase tracking-tighter">Sebaran Wilayah Mustahik</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="font-bold h-7 text-[9px]" onClick={() => handlePreview(mustahikData.insights.top_locations, 'Sebaran Lokasi Mustahik', 'excel')}>Excel Preview</Button>
                  <Button size="sm" className="bg-slate-900 font-bold h-7 text-[9px]" onClick={() => handlePreview(mustahikData.insights.top_locations, 'Sebaran Lokasi Mustahik', 'pdf')}>PDF Preview</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {mustahikData?.insights.top_locations.map((loc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase">{loc.kabupaten_kota}</span>
                    <span className="text-xs font-black text-slate-800">{loc._count.id_mustahik} Jiwa</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="bg-blue-900 text-white border-none shadow-xl">
               <CardHeader><CardTitle className="text-xs font-black uppercase text-blue-400">Vulnerability Score</CardTitle></CardHeader>
               <CardContent className="space-y-6">
                  <div>
                    <p className="text-[9px] font-black uppercase text-blue-500 italic">Rata-rata Skor</p>
                    <p className="text-2xl font-black">{mustahikData?.insights.avg_score}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-blue-500 italic">Total Registrasi (3Bln)</p>
                    <p className="text-2xl font-black">{mustahikData?.insights.new_registrations_3m}</p>
                  </div>
               </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL PREVIEW SESUAI FORMAT DOWNLOAD */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl border-4 border-slate-900 rounded-none shadow-[12px_12px_0px_0px_rgba(16,185,129,1)] p-0 overflow-hidden">
          <div className="bg-slate-900 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                {previewData?.type === 'excel' ? <FileSpreadsheet className="text-white h-5 w-5" /> : <FileText className="text-white h-5 w-5" />}
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase italic text-white leading-none">
                  Preview {previewData?.type === 'pdf' ? 'Official PDF' : 'Formal Excel'}
                </DialogTitle>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">BIDA Platform • Document Ready for Export</p>
              </div>
            </div>
            <Badge className="bg-emerald-600 text-white border-none animate-pulse">VERIFIED</Badge>
          </div>

          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto bg-[#fdfdfd]">
            <div className="text-center border-b-2 border-double border-slate-300 pb-4 mb-6">
              <h4 className="font-black text-slate-800 text-sm uppercase leading-none">Dompet Ummat Kalimantan Barat</h4>
              <p className="text-[9px] text-slate-500 font-medium mt-1">Sistem Warehouse Analitik - Laporan Resmi Operasional 2026</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Judul Laporan:</p>
                  <h5 className="font-black text-slate-800 uppercase tracking-tight">{previewData?.title}</h5>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Timestamp Audit:</p>
                  <p className="text-[10px] font-bold text-slate-700">{new Date().toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="border-2 border-slate-900 rounded-none overflow-hidden bg-white">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900 text-white font-black uppercase text-[9px]">
                    <tr>
                      <th className="p-3 border-r border-slate-700 w-12 text-center">No</th>
                      <th className="p-3 border-r border-slate-700">Dimensi Analisis</th>
                      <th className="p-3 text-right">Total Akumulasi</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold text-slate-700">
                    {previewData?.data.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        <td className="p-3 border-r border-slate-100 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-3 border-r border-slate-100 uppercase">
                          {item.tipe || item.armada || item.kategori_pm || item.jam || item.kabupaten_kota || 'Data Point'}
                        </td>
                        <td className="p-3 text-right text-emerald-600 font-black">
                          {item._count?.id_donatur || item._count?.id_transaksi || item._count?.id_mustahik || 0} Records
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-10">
              <div className="text-center w-44">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-12">Mengetahui,</p>
                <div className="border-b-2 border-slate-300 w-full mb-1"></div>
                <p className="text-[9px] font-black text-slate-800 uppercase tracking-tighter flex items-center justify-center gap-1">
                  <ShieldCheck size={10} className="text-emerald-600" /> Kepala Divisi BIDA Platform
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-100 border-t-2 border-slate-200 gap-3">
            <Button variant="ghost" className="font-black uppercase text-xs" onClick={() => setPreviewOpen(false)}>Batal</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs px-10 shadow-[4px_4px_0px_0px_rgba(6,78,59,1)] active:translate-y-1 active:shadow-none transition-all" onClick={executeExport}>
              <DownloadCloud className="mr-2 h-4 w-4" /> Download {previewData?.type.toUpperCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}