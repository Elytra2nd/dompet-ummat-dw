'use client'

import dynamic from 'next/dynamic'

// Kita panggil MapContainer yang asli di sini dengan ssr: false
const MapComponent = dynamic(() => import('./MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="h-125 w-full animate-pulse rounded-xl bg-slate-100" />
  ),
})

interface MapWrapperProps {
  data: any[]
}

export default function MapWrapper({ data }: MapWrapperProps) {
  return <MapComponent data={data} />
}
