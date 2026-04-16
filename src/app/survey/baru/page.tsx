import SurveyForm from '@/components/survey/SurveyForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'

export default function BaruSurveyPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <div className="mb-2 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="-ml-2 text-slate-500 transition-colors hover:text-slate-900"
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
                <ClipboardCheck className="h-8 w-8 text-blue-600" />
                Survey <span className="text-blue-600">Kelayakan</span>
              </h1>
              <p className="mt-1 font-medium text-slate-500">
                Sistem Pendukung Keputusan Penentuan Mustahik Dompet Ummat
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8">
        <SurveyForm />
      </div>
    </div>
  )
}
