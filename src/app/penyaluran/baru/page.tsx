import AddPenyaluranForm from '@/components/penyaluran/AddPenyaluranForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft, HandCoins } from 'lucide-react'
import Link from 'next/link'

export default function PenyaluranBaruPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <div className="mb-2 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="-ml-2 text-slate-500 transition-colors hover:text-emerald-600"
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Dashboard
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
                <HandCoins className="h-8 w-8 text-emerald-600" />
                Penyaluran <span className="text-emerald-600">Bantuan</span>
              </h1>
              <p className="mt-1 font-medium text-slate-500">
                Realisasi program dan pendayagunaan dana ZISWAF Dompet Ummat
                Kalimatan Barat
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8">
        <AddPenyaluranForm />
      </div>
    </div>
  )
}
