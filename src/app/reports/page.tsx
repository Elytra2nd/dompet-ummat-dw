'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileSpreadsheet, 
  FileText, 
  Users, 
  HeartHandshake, 
  Ambulance,
  RefreshCw,
  Printer
} from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { toast } from 'sonner'

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null)
  const [donaturData, setDonaturData] = useState<any>(null)
  const [ambulanData, setAmbulanData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
      toast.error("Gagal sinkronisasi data laporan")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // 1. CUSTOM EXCEL FORMAT (Dengan Header Formal)
  const exportCustomExcel = (data: any[], title: string) => {
    const worksheet = XLSX.utils.json_to_sheet([]);
    
    // Header Kustom
    const header = [
      ["LAPORAN EKSEKUTIF DATA WAREHOUSE - DOMPET UMMAT"],
      [`Kategori: ${title}`],
      [`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`],
      [] // Baris kosong
    ];

    XLSX.utils.sheet_add_aoa(worksheet, header, { origin: "A1" });
    
    // Data (Mulai dari baris ke-5)
    const tableData = data.map(item => ({
      'Kategori/Label': item.tipe || item.armada || item.kategori_layanan || 'N/A',
      'Jumlah Record': item._count.id_donatur || item._count.id_transaksi || 0
    }));

    XLSX.utils.sheet_add_json(worksheet, tableData, { origin: "A5", skipHeader: false });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_2026.xlsx`);
    toast.success("Excel Formal berhasil diunduh");
  }

  // 2. CUSTOM PDF FORMAT (Format Kop Surat Resmi)
  const exportCustomPDF = (data: any[], title: string) => {
    const doc = new jsPDF();
    
    // Kop Surat
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("DOMPET UMMAT KALIMANTAN BARAT", 105, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Jl. Danau Sentarum No. 99, Pontianak, Kalimantan Barat", 105, 20, { align: "center" });
    doc.line(15, 25, 195, 25);

    // Judul & Info
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`LAPORAN: ${title.toUpperCase()}`, 15, 35);
    
    doc.setFontSize(9);
    doc.text(`Dicetak Oleh: Sistem BIDA Platform`, 15, 42);
    doc.text(`Waktu: ${new Date().toLocaleString('id-ID')}`, 15, 47);

    // Tabel
    const tableRows = data.map((item, index) => [
      index + 1,
      item.tipe || item.armada || item.kategori_layanan || 'N/A',
      `${item._count.id_donatur || item._count.id_transaksi || 0} Record`
    ]);

    (doc as any).autoTable({
      startY: 55,
      head: [['No', 'Kategori/Deskripsi', 'Total Accumulation']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255] },
      styles: { fontSize: 9 }
    });

    // Tanda Tangan
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFont("helvetica", "normal");
    doc.text("Mengetahui,", 150, finalY);
    doc.text("Kepala Divisi Program", 150, finalY + 15);
    doc.text("( ____________________ )", 150, finalY + 30);

    doc.save(`${title.replace(/\s+/g, '_')}_Official.pdf`);
    toast.success("PDF Official berhasil dibuat");
  }

  if (loading) return <div className="p-10 font-black text-slate-400 animate-pulse">GENERATING ANALYTICS...</div>

  return (
    <div className="p-4 md:p-8 space-y-8 bg-white min-h-screen font-sans print:p-0">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-slate-900 pb-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
            BIDA <span className="text-emerald-600">Reporting</span> Center
          </h1>
          <p className="text-slate-500 font-bold text-xs tracking-widest mt-1">Data Warehouse Analysis & Export System</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button onClick={fetchData} variant="outline" className="font-bold border-2">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-slate-900 shadow-none rounded-none">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><HeartHandshake className="h-3 w-3"/> Total Donatur</p>
            <h3 className="text-4xl font-black text-slate-900">{summary?.donatur || 0}</h3>
          </CardContent>
        </Card>
        <Card className="border-2 border-slate-900 shadow-none rounded-none bg-emerald-600 text-white">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase text-emerald-200 flex items-center gap-2"><Users className="h-3 w-3"/> Total Mustahik</p>
            <h3 className="text-4xl font-black">{summary?.mustahik || 0}</h3>
          </CardContent>
        </Card>
        <Card className="border-2 border-slate-900 shadow-none rounded-none">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Ambulance className="h-3 w-3"/> Total Layanan</p>
            <h3 className="text-4xl font-black text-slate-900">{summary?.ambulan || 0}</h3>
          </CardContent>
        </Card>
      </div>

      {/* DETAILED REPORTS TABS */}
      <Tabs defaultValue="donatur" className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-6 print:hidden">
          <TabsTrigger value="donatur" className="font-bold uppercase text-[10px]">Laporan Donatur</TabsTrigger>
          <TabsTrigger value="ambulan" className="font-bold uppercase text-[10px]">Laporan Operasional</TabsTrigger>
        </TabsList>

        <TabsContent value="donatur">
          <Card className="border-2 shadow-none rounded-none">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50">
              <CardTitle className="text-xs font-black uppercase tracking-widest">Statistik Donatur per Tipe</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="font-bold border-2 text-[10px]" onClick={() => exportCustomExcel(donaturData.stats, 'Laporan Donatur')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" /> Excel Formal
                </Button>
                <Button size="sm" className="bg-slate-900 font-bold text-[10px]" onClick={() => exportCustomPDF(donaturData.stats, 'Laporan Donatur')}>
                  <FileText className="h-4 w-4 mr-2" /> PDF Official
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                {donaturData?.stats.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2">
                    <span className="font-black text-slate-700 uppercase text-xs">{item.tipe || 'Lainnya'}</span>
                    <span className="font-mono font-black text-emerald-600">{item._count.id_donatur} Orang</span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ambulan">
          <Card className="border-2 shadow-none rounded-none">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50">
              <CardTitle className="text-xs font-black uppercase tracking-widest">Statistik Armada & Layanan</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="font-bold border-2 text-[10px]" onClick={() => exportCustomExcel(ambulanData.perArmada, 'Laporan Ambulan')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" /> Excel Formal
                </Button>
                <Button size="sm" className="bg-slate-900 font-bold text-[10px]" onClick={() => exportCustomPDF(ambulanData.perArmada, 'Laporan Ambulan')}>
                  <FileText className="h-4 w-4 mr-2" /> PDF Official
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                {ambulanData?.perArmada.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2">
                    <span className="font-black text-slate-700 uppercase text-xs">{item.armada || 'Unit Utama'}</span>
                    <span className="font-mono font-black text-blue-600">{item._count.id_transaksi} Trip</span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}