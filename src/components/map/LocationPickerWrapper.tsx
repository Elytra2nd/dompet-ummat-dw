'use client'

import dynamic from 'next/dynamic'

const Picker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="grid animate-pulse gap-6 md:grid-cols-2">
      <div className="h-100 rounded-xl bg-slate-100" />
      <div className="h-100 rounded-xl bg-slate-100" />
    </div>
  ),
})

export default function LocationPickerWrapper({
  mustahikList,
}: {
  mustahikList: any[]
}) {
  return <Picker mustahikList={mustahikList} />
}
