import AddDonasiForm from '@/components/donasi/AddDonasiForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft, HeartHandshake } from 'lucide-react'
import Link from 'next/link'

export default function TransaksiMasukBaruPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-6">
          <div className="mb-2 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="-ml-2 text-slate-500 font-bold transition-colors hover:text-indigo-600"
            >
              <Link href="/donasi/masuk">
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              <HeartHandshake className="h-8 w-8 text-indigo-600" />
              Input <span className="text-indigo-600">Transaksi Masuk</span>
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Catat penerimaan donasi ZISWAF baru.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <AddDonasiForm />
      </div>
    </div>
  )
}
