'use client'

import dynamic from 'next/dynamic'

const Picker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="grid gap-6 md:grid-cols-2 animate-pulse">
      <div className="h-100 bg-slate-100 rounded-xl" />
      <div className="h-100 bg-slate-100 rounded-xl" />
    </div>
  ),
})

export default function LocationPickerWrapper({ mustahikList }: { mustahikList: any[] }) {
  return <Picker mustahikList={mustahikList} />
}