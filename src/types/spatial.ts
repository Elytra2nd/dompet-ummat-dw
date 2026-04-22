// src/types/spatial.ts

export type DrillLevel = 'kabupaten' | 'kecamatan' | 'kelurahan'

export interface DrillState {
  level: DrillLevel
  selectedKabupaten: string | null
  selectedKecamatan: string | null
}

export interface SpatialItem {
  wilayah: string
  jumlahMustahik: number
}

export interface PointItem {
  id: number
  kabupaten: string
  kecamatan: string
  desaKelurahan: string
  latitude: number
  longitude: number
}

export interface BreadcrumbItem {
  label: string
  onClick: () => void
}