'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, User, IdCard, MapPin, Loader2, X } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Mustahik {
  id_mustahik: string
  nama: string
  nik: string
  desa: string
}

interface MustahikSelectorProps {
  onSelect: (id: string) => void
  selectedId: string
}

export default function MustahikSelector({
  onSelect,
  selectedId,
}: MustahikSelectorProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Mustahik[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Klik di luar untuk menutup dropdown
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

  // Fungsi pencarian
  useEffect(() => {
    const searchMustahik = async () => {
      if (query.length < 2) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`/api/mustahik/search?q=${query}`)
        const data = await res.json()
        setResults(data)
        setIsOpen(true)
      } catch (e) {
        console.error('Search error', e)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchMustahik, 500)
    return () => clearTimeout(debounce)
  }, [query])

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Input
          placeholder="Cari Nama atau NIK Mustahik..."
          value={selectedId && !isOpen ? selectedId : query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          className="h-11 border-2 pl-10 transition-all focus:border-emerald-500"
        />
        <Search className="absolute top-3.5 left-3 h-4 w-4 text-slate-400" />
        {loading && (
          <Loader2 className="absolute top-3.5 right-3 h-4 w-4 animate-spin text-emerald-500" />
        )}
        {selectedId && (
          <button
            onClick={() => {
              onSelect('')
              setQuery('')
            }}
            className="absolute top-3.5 right-10 text-slate-400 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto border-slate-200 shadow-xl">
          {results.map((m) => (
            <div
              key={m.id_mustahik}
              onClick={() => {
                onSelect(m.id_mustahik)
                setQuery(m.nama)
                setIsOpen(false)
              }}
              className="cursor-pointer border-b p-3 transition-colors last:border-0 hover:bg-emerald-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-100 p-2">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{m.nama}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="flex items-center gap-0.5">
                        <IdCard className="h-3 w-3" /> {m.nik}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" /> {m.desa}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">
                  {m.id_mustahik}
                </span>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
