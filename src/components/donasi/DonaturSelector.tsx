'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Search, Heart, Phone, MapPin, Loader2, X, Plus } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Donatur {
  id_donatur: string;
  nama_donatur: string;
  no_hp: string;
  alamat: string;
}

interface DonaturSelectorProps {
  onSelect: (id: string) => void;
  selectedId: string;
}

export default function DonaturSelector({ onSelect, selectedId }: DonaturSelectorProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Donatur[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Menutup dropdown saat klik di luar area
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Logika pencarian dengan Debounce
  useEffect(() => {
    const searchDonatur = async () => {
      if (query.length < 2 || (selectedId && query === results.find(r => r.id_donatur === selectedId)?.nama_donatur)) {
        return
      }
      
      setLoading(true)
      try {
        const res = await fetch(`/api/donasi/donatur/search?q=${query}`)
        const data = await res.json()
        setResults(data)
        setIsOpen(true)
      } catch (e) {
        console.error("Gagal mencari donatur", e)
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
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          className="pl-10 h-12 border-2 focus:border-indigo-500 transition-all font-medium"
        />
        <Search className="absolute left-3 top-4 h-4 w-4 text-slate-400" />
        
        <div className="absolute right-3 top-3 flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
          {query && (
            <button 
              onClick={() => { setQuery(''); onSelect(''); setIsOpen(false) }}
              className="text-slate-400 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <Card className="absolute z-50 w-full mt-2 shadow-2xl border-slate-200 overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {results.length > 0 ? (
              results.map((d) => (
                <div
                  key={d.id_donatur}
                  onClick={() => {
                    onSelect(d.id_donatur)
                    setQuery(d.nama_donatur)
                    setIsOpen(false)
                  }}
                  className="p-4 hover:bg-indigo-50 cursor-pointer border-b last:border-0 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 p-2 rounded-full group-hover:bg-indigo-200 transition-colors">
                        <Heart className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{d.nama_donatur}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {d.no_hp}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {d.alamat || 'Alamat tidak tersedia'}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">
                      {d.id_donatur}
                    </span>
                  </div>
                </div>
              ))
            ) : query.length >= 2 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-slate-500 mb-3">Donatur tidak ditemukan</p>
                <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                  <Plus className="h-3 w-3 mr-2" /> Tambah Donatur Baru
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  )
}