'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  Users, 
  HeartHandshake, 
  Ambulance,
  RefreshCw,
  Printer
} from 'lucide-react'
import * as XLSX from 'xlsx'
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

  // Fitur Export ke Excel
  const exportToExcel = (data: any, fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Laporan")
    XLSX.writeFile(wb, `${fileName}_${new Date().getTime()}.xlsx`)
    toast.success("Laporan berhasil di-export ke Excel")
  }

  const handlePrint = () => window.print()

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
          <Button onClick={handlePrint} className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest">
            <Printer className="h-4 w-4 mr-2" /> Print PDF
          </Button>
        </div>
      </div>

      {/* KPI OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-slate-900 shadow-none rounded-none">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase text-slate-400">Total Donatur</p>
            <h3 className="text-4xl font-black text-slate-900">{summary?.donatur || 0}</h3>
          </CardContent>
        </Card>
        <Card className="border-2 border-slate-900 shadow-none rounded-none bg-emerald-600 text-white">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase text-emerald-200">Total Mustahik</p>
            <h3 className="text-4xl font-black">{summary?.mustahik || 0}</h3>
          </CardContent>
        </Card>
        <Card className="border-2 border-slate-900 shadow-none rounded-none">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase text-slate-400">Total Layanan Ambulan</p>
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
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-emerald-600" /> Statistik Donatur per Tipe
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline" 
                className="print:hidden font-bold border-2 text-[10px]"
                onClick={() => exportToExcel(donaturData.stats, 'Laporan_Donatur')}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" /> Export Excel
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {donaturData?.stats.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2">
                    <span className="font-black text-slate-700 uppercase text-xs">{item.tipe || 'Lainnya'}</span>
                    <span className="font-mono font-black text-emerald-600">{item._count.id_donatur} Orang</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ambulan">
          <Card className="border-2 shadow-none rounded-none">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Ambulance className="h-4 w-4 text-emerald-600" /> Statistik Penggunaan Armada
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline" 
                className="print:hidden font-bold border-2 text-[10px]"
                onClick={() => exportToExcel(ambulanData.perArmada, 'Laporan_Ambulan')}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" /> Export Excel
              </Button>
            </CardHeader>
            <CardContent className="p-6">
               <div className="space-y-4">
                {ambulanData?.perArmada.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2">
                    <span className="font-black text-slate-700 uppercase text-xs">Armada: {item.armada}</span>
                    <span className="font-mono font-black text-blue-600">{item._count.id_transaksi} Trip</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* FOOTER KHUSUS CETAK */}
      <div className="hidden print:block mt-20 border-t-2 border-slate-900 pt-4 text-right">
        <p className="font-black text-xs uppercase">Dicetak pada: {new Date().toLocaleString()}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BIDA Platform - Dompet Ummat</p>
      </div>
    </div>
  )
}