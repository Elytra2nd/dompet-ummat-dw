'use client'

import { useEffect, useState } from 'react'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ClipboardCheck, Search, Filter, UserCheck, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SurveyData {
  sk_survey: number;
  no_register: string;
  total_skor_sistem: string;
  kelayakan_sistem: string;
  kategori_rekomendasi: string;
  dim_mustahik: {
    nama: string;
    id_mustahik: string;
  };
  dim_date?: {
    tanggal: string;
  };
}

export default function SurveyMainPage() {
  const [surveys, setSurveys] = useState<SurveyData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/survey/hasil')
      .then(res => res.json())
      .then(data => {
        setSurveys(Array.isArray(data) ? data : [])
        setLoading(false)
      })
  }, [])

  const filteredSurveys = surveys.filter(s => 
    s.dim_mustahik?.nama?.toLowerCase().includes(search.toLowerCase()) ||
    s.no_register?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-emerald-600" /> 
            Hasil <span className="text-emerald-600">Survey Kelayakan</span>
          </h1>
          <p className="text-slate-500 font-medium italic">Data Warehouse Decision Support System (DSS)</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari Mustahik..." 
            className="pl-10 border-2 rounded-xl font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-900">
              <TableRow>
                <TableHead className="text-white font-black text-[10px] uppercase">Mustahik & Reg</TableHead>
                <TableHead className="text-white font-black text-[10px] uppercase text-center">Skor Akhir</TableHead>
                <TableHead className="text-white font-black text-[10px] uppercase text-center">Status Kelayakan</TableHead>
                <TableHead className="text-white font-black text-[10px] uppercase">Rekomendasi Bantuan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold animate-pulse">Sinkronisasi Data...</TableCell></TableRow>
              ) : filteredSurveys.map((item) => (
                <TableRow key={item.sk_survey} className="hover:bg-emerald-50/50 transition-colors">
                  <TableCell>
                    <p className="font-black text-slate-800 uppercase text-sm">{item.dim_mustahik?.nama || 'N/A'}</p>
                    <p className="font-mono text-[10px] text-slate-400 font-bold">{item.no_register}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-block p-2 bg-slate-100 rounded-lg">
                       <span className="text-lg font-black text-slate-700">{item.total_skor_sistem}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`font-black text-[10px] px-3 py-1 shadow-none border-none ${
                      item.kelayakan_sistem === 'Sangat_Layak' ? 'bg-emerald-100 text-emerald-700' :
                      item.kelayakan_sistem === 'Layak' ? 'bg-blue-100 text-blue-700' :
                      item.kelayakan_sistem === 'Dipertimbangkan' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {item.kelayakan_sistem?.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <div className="mt-1"><ClipboardCheck className="h-4 w-4 text-emerald-500" /></div>
                      <p className="text-xs font-bold text-slate-600 max-w-[200px]">
                        {item.kategori_rekomendasi?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}