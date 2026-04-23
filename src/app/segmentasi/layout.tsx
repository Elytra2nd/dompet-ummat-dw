'use client'

import { SegmentasiProvider } from '@/contexts/SegmentasiContext'

export default function SegmentasiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SegmentasiProvider>{children}</SegmentasiProvider>
}
