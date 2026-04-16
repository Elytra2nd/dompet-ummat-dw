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
      Pendidikan: ['Beasiswa Utama', 'Institut Muallaf', 'Ota'],
      Kesehatan: ['Kesehatan Gratis', 'Ambulans Gratis', 'Dompet Tvri Peduli'],
      Ekonomi: ['Pemberdayaan Ekonomi'],
      'Sosial Kemanusiaan': [
        'Bantuan Pangan',
        'Dakwah Pedalaman',
        'Zakat Fitrah',
        'Fidyah',
        'Zakat Mal',
        'Paket Buka Puasa',
        'Paket Lebaran',
      ],
      'Dakwah & Advokasi': [
        "Ta''Jil Ontheroad",
        "Paket Ta''Jil",
        'Akikah Kita',
        'Kurban/Tfk',
        'Cicilan Kurban',
        'Wakaf',
        'Infak Tpa',
      ],
    },
    penyalur: {
      Ekonomi: ['Zakat Profesi', 'Zakat Pertanian'],
      'Dakwah & Advokasi': ['Infak Umum', 'Infak Praktis', 'Inbuser'],
      Operasional: ['Vue', 'Ett', 'Lainnya'],
    },
    lainnya: {
      'To Be Determined': [
        'To Be Determined',
        'Not Applicable',
        'Data Corrupted',
      ],
    },
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <div className="mb-2 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="-ml-2 font-medium text-slate-500 transition-colors hover:text-emerald-600"
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Dashboard
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Registrasi{' '}
                <span className="text-emerald-600">Entitas Baru</span>
              </h1>
              <p className="mt-1 font-medium text-slate-500 italic">
                Sinkronisasi SQL Enum:{' '}
                <code className="rounded bg-emerald-50 px-1 font-mono text-xs text-emerald-700">
                  dim_program_donasi.sub_program
                </code>
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="font-sans text-[10px] font-bold tracking-widest text-emerald-700 uppercase">
                Galaxy Schema Integrated
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8">
        <AddMustahikForm hierarkiData={hierarkiData} />

        <footer className="mt-12 text-center text-xs font-medium text-slate-400">
          <p>© 2026 Dompet Ummat - Sistem Informasi Geospasial (SOLAP Ready)</p>
          <p className="mt-1 opacity-70">
            Fact Constellation Architecture v2.1
          </p>
        </footer>
      </div>
    </div>
  )
}
