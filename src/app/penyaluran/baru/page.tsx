import AddPenyaluranForm from '@/components/penyaluran/AddPenyaluranForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft, HandCoins } from 'lucide-react'
import Link from 'next/link'

export default function PenyaluranBaruPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="bg-white border-b mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" asChild className="-ml-2 text-slate-500 hover:text-emerald-600 transition-colors">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Dashboard
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                <HandCoins className="h-8 w-8 text-emerald-600" />
                Penyaluran <span className="text-emerald-600">Bantuan</span>
              </h1>
              <p className="text-slate-500 mt-1 font-medium">
                Realisasi program dan pendayagunaan dana ZISWAF Dompet Ummat Kalimatan Barat
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8">
        <AddPenyaluranForm />
      </div>
    </div>
  )
}