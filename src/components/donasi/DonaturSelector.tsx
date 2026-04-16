'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, Heart, Phone, MapPin, Loader2, X, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Sesuaikan interface dengan kolom database asli
interface Donatur {
  id_donatur: string
  nama_lengkap: string // Sebelumnya nama_donatur
  kontak_utama: string // Sebelumnya no_hp
  alamat: string
}

interface DonaturSelectorProps {
  onSelect: (id: string) => void
  selectedId: string
}

export default function DonaturSelector({
  onSelect,
  selectedId,
}: DonaturSelectorProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Donatur[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Menutup dropdown saat klik di luar area
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Logika pencarian dengan Debounce
  useEffect(() => {
    const searchDonatur = async () => {
      // Pastikan pencarian tidak trigger jika query kosong atau sudah terpilih
      if (
        query.length < 2 ||
        (selectedId &&
          query ===
            results.find((r) => r.id_donatur === selectedId)?.nama_lengkap)
      ) {
        return
      }

      setLoading(true)
      try {
        // Panggil route utama donatur
        const res = await fetch(
          `/api/donasi/donatur?q=${encodeURIComponent(query)}`,
        )
        if (res.ok) {
          const data = await res.json()
          setResults(data)
          setIsOpen(true)
        }
      } catch (e) {
        console.error('Gagal mencari donatur', e)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(searchDonatur, 500)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Input
          placeholder="Cari Nama Donatur atau No. HP..."
          value={query ?? ''} // Fix Error Controlled Input
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          className="h-12 border-2 pl-10 font-medium transition-all focus:border-indigo-500"
        />
        <Search className="absolute top-4 left-3 h-4 w-4 text-slate-400" />

        <div className="absolute top-3 right-3 flex items-center gap-2">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          )}
          {query && (
            <button
              type="button" // Mencegah form submit tidak sengaja
              onClick={() => {
                setQuery('')
                onSelect('')
                setIsOpen(false)
              }}
              className="text-slate-400 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <Card className="absolute z-50 mt-2 w-full overflow-hidden border-slate-200 shadow-2xl">
          <div className="max-h-64 overflow-y-auto">
            {results.length > 0 ? (
              results.map((d) => (
                <div
                  key={d.id_donatur}
                  onClick={() => {
                    onSelect(d.id_donatur)
                    setQuery(d.nama_lengkap) // Gunakan nama_lengkap
                    setIsOpen(false)
                  }}
                  className="group cursor-pointer border-b p-4 transition-colors last:border-0 hover:bg-indigo-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-indigo-100 p-2 transition-colors group-hover:bg-indigo-200">
                        <Heart className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        {/* Sinkronkan dengan database core */}
                        <p className="text-sm font-bold text-slate-800">
                          {d.nama_lengkap}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {d.kontak_utama}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />{' '}
                            {d.alamat || 'Alamat tidak tersedia'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="rounded bg-slate-100 px-2 py-1 font-mono text-[10px] font-bold text-slate-500">
                      {d.id_donatur}
                    </span>
                  </div>
                </div>
              ))
            ) : query.length >= 2 ? (
              <div className="p-4 text-center">
                <p className="mb-3 text-sm text-slate-500">
                  Donatur tidak ditemukan
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  asChild
                >
                  <a href="/donasi/donatur">
                    <Plus className="mr-2 h-3 w-3" /> Tambah Donatur Baru
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  )
}
