import AddMustahikForm from '@/components/mustahik/AddMustahikForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewMustahikPage() {
  /**
   * Hierarki Data yang disesuaikan dengan kebutuhan komponen AddMustahikForm.
   * Key Level 2 (Program Induk) harus sesuai dengan Enum di database.
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
        "Cicilan Kurban"
      ]
    },
    penyalur: {
      "Zakat Profesi": ["Zakat Profesi", "Zakat Pertanian"],
      "Infak & Wakaf": ["Infak Umum", "Wakaf", "Inbuser"]
    },
    lainnya: {
      "Administrasi": ["To Be Determined", "Not Applicable"]
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="bg-white border-b mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" asChild className="-ml-2 text-slate-500 hover:text-emerald-600 transition-colors">
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
              <p className="text-slate-500 mt-1 font-medium">
                Sinkronisasi Data Warehouse & Sistem Geospasial Melawi
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8">
        {/* PERBAIKAN: Gunakan prop hierarkiData, bukan categoryOptions */}
        <AddMustahikForm hierarkiData={hierarkiData} />
        
        <footer className="mt-12 text-center text-slate-400 text-sm italic">
          <p>© 2026 Dompet Ummat - Sistem Informasi Geospasial (SOLAP Ready)</p>
        </footer>
      </div>
    </div>
  )
}