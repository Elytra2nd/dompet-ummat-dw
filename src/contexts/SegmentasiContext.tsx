'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react'

interface SegmentData {
  key: string
  label: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  iconName: string
  count: number
  percentage: number
  avg_recency: number
  avg_frequency: number
  avg_monetary: number
  total_monetary: number
  recommendation: {
    title: string
    description: string
    channels: string[]
  }
}

interface AnalysisResult {
  success: boolean
  timestamp: string
  elapsed_ms: number
  stats: {
    total_donatur: number
    avg_recency: number
    avg_frequency: number
    avg_monetary: number
  }
  clustering: {
    optimal_k: number
    silhouette: number
    davies_bouldin: number
    calinski_harabasz: number
    rating: { stars: number; label: string }
    converged: boolean
    iterations: number
  }
  segments: SegmentData[]
  total_donatur: number
}

interface SegmentasiContextType {
  data: AnalysisResult | null
  loading: boolean
  error: string
  runAnalysis: (force?: boolean) => Promise<void>
  lastFetched: number | null
}

const SegmentasiContext = createContext<SegmentasiContextType | undefined>(undefined)

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 menit cache

export function SegmentasiProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastFetched, setLastFetched] = useState<number | null>(null)

  // Refs biar runAnalysis stabil (tidak recreate tiap state change)
  const dataRef = useRef(data)
  const lastFetchedRef = useRef(lastFetched)
  const loadingRef = useRef(loading)
  useEffect(() => { dataRef.current = data }, [data])
  useEffect(() => { lastFetchedRef.current = lastFetched }, [lastFetched])
  useEffect(() => { loadingRef.current = loading }, [loading])

  const runAnalysis = useCallback(async (force = false) => {
    // Hindari parallel request
    if (loadingRef.current) return
    // Gunakan cache client jika masih valid
    if (!force && dataRef.current && lastFetchedRef.current &&
        (Date.now() - lastFetchedRef.current < CACHE_TTL_MS)) {
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/segmentasi/run', { method: 'POST' })
      if (!res.ok) throw new Error('Gagal menjalankan analisis')
      const result = await res.json()
      setData(result)
      setLastFetched(Date.now())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, []) // stable — baca state lewat refs

  return (
    <SegmentasiContext.Provider value={{ data, loading, error, runAnalysis, lastFetched }}>
      {children}
    </SegmentasiContext.Provider>
  )
}

export function useSegmentasi() {
  const context = useContext(SegmentasiContext)
  if (!context) {
    throw new Error('useSegmentasi must be used within SegmentasiProvider')
  }
  return context
}
