import AddMustahikForm from '@/components/mustahik/AddMustahikForm'
import { Button } from '@/components/ui/button' // Perbaikan: kutip tunggal di awal dan akhir
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewMustahikPage() {
  const kategoriEnum = [
    "Sosial",
    "Pasien Ambulan",
    "Kesehatan",
    "Ekonomi",
    "Pendidikan",
    "Penyalur Ekonomi",
    "Penyalur Kesehatan",
    "Penyalur Pendidikan",
    "Penyalur Sosial",
    "Petugas",
    "Program Donasi"
  ];

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
                Registrasi <span className="text-emerald-600">Mustahik Baru</span>
              </h1>
              <p className="text-slate-500 mt-1 font-medium">
                Sistem Penomoran ID Otomatis Dompet Ummat
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8">
        <AddMustahikForm categoryOptions={kategoriEnum} />
        
        <footer className="mt-12 text-center text-slate-400 text-sm italic">
          <p>© 2026 Dompet Ummat - Sistem Informasi Geospasial</p>
        </footer>
      </div>
    </div>
  )
}