import AddMustahikForm from '@/components/mustahik/AddMustahikForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewMustahikPage() {
  /**
   * Hierarki Data yang diselaraskan dengan:
   * 1. dim_program_donasi.program_induk (Key Level 2)
   * 2. dim_program_donasi.sub_program (Value Array Level 3)
   */
  const hierarkiData = {
    mustahik: {
      "Pendidikan": [
        "Beasiswa Utama", 
        "Institut Muallaf", 
        "Ota"
      ],
      "Kesehatan": [
        "Kesehatan Gratis", 
        "Ambulans Gratis", 
        "Dompet Tvri Peduli"
      ],
      "Ekonomi": [
        "Pemberdayaan Ekonomi"
      ],
      "Sosial Kemanusiaan": [
        "Bantuan Pangan", 
        "Dakwah Pedalaman", 
        "Zakat Fitrah", 
        "Fidyah", 
        "Zakat Mal", 
        "Paket Buka Puasa",
        "Paket Lebaran"
      ],
      "Dakwah & Advokasi": [
        "Ta''Jil Ontheroad", 
        "Paket Ta''Jil", 
        "Akikah Kita", 
        "Kurban/Tfk", 
        "Cicilan Kurban",
        "Wakaf",
        "Infak Tpa"
      ]
    },
    penyalur: {
      "Ekonomi": [
        "Zakat Profesi", 
        "Zakat Pertanian"
      ],
      "Dakwah & Advokasi": [
        "Infak Umum", 
        "Infak Praktis", 
        "Inbuser"
      ],
      "Operasional": [
        "Vue", 
        "Ett", 
        "Lainnya"
      ]
    },
    lainnya: {
      "To Be Determined": [
        "To Be Determined", 
        "Not Applicable", 
        "Data Corrupted"
      ]
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="bg-white border-b mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" asChild className="-ml-2 text-slate-500 hover:text-emerald-600 transition-colors font-medium">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Dashboard
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Registrasi <span className="text-emerald-600">Entitas Baru</span>
              </h1>
              <p className="text-slate-500 mt-1 font-medium italic">
                Sinkronisasi SQL Enum: <code className="text-emerald-700 bg-emerald-50 px-1 rounded font-mono text-xs">dim_program_donasi.sub_program</code>
              </p>
            </div>

            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full w-fit">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest font-sans">
                Galaxy Schema Integrated
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8">
        <AddMustahikForm hierarkiData={hierarkiData} />
        
        <footer className="mt-12 text-center text-slate-400 text-xs font-medium">
          <p>© 2026 Dompet Ummat - Sistem Informasi Geospasial (SOLAP Ready)</p>
          <p className="mt-1 opacity-70">Fact Constellation Architecture v2.1</p>
        </footer>
      </div>
    </div>
  )
}