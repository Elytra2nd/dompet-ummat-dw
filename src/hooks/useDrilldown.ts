// src/hooks/useDrilldown.ts

import { useCallback, useState } from 'react'
import type { DrillLevel, DrillState, BreadcrumbItem } from '@/types/spatial'

export function useDrilldown() {
    const [drill, setDrill] = useState<DrillState>({
        level: 'kabupaten',
        selectedKabupaten: null,
        selectedKecamatan: null,
    })

    const drillDown = useCallback((featureName: string) => {
        setDrill((prev) => {
            if (prev.level === 'kabupaten') {
                return {
                    level: 'kecamatan',
                    selectedKabupaten: featureName,
                    selectedKecamatan: null,
                }
            }
            if (prev.level === 'kecamatan') {
                return {
                    ...prev,
                    level: 'kelurahan',
                    selectedKecamatan: featureName,
                }
            }
            return prev // kelurahan = level terdalam, tidak bisa drill lebih jauh
        })
    }, [])

    const rollUp = useCallback(() => {
        setDrill((prev) => {
            if (prev.level === 'kelurahan') {
                return {
                    ...prev,
                    level: 'kecamatan',
                    selectedKecamatan: null,
                }
            }
            if (prev.level === 'kecamatan') {
                return {
                    level: 'kabupaten',
                    selectedKabupaten: null,
                    selectedKecamatan: null,
                }
            }
            return prev // sudah di level teratas
        })
    }, [])

    const resetAll = useCallback(() => {
        setDrill({
            level: 'kabupaten',
            selectedKabupaten: null,
            selectedKecamatan: null,
        })
    }, [])

    // Breadcrumb otomatis dari drill state
    const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Kalimantan Barat', onClick: resetAll },
        ...(drill.selectedKabupaten
            ? [{
                label: drill.selectedKabupaten,
                onClick: () =>
                    setDrill({
                        level: 'kecamatan',
                        selectedKabupaten: drill.selectedKabupaten,
                        selectedKecamatan: null,
                    }),
            }]
            : []),
        ...(drill.selectedKecamatan
            ? [{
                label: drill.selectedKecamatan,
                onClick: () => {
                    // Klik pada nama kecamatan di breadcrumb harusnya tetap di level kelurahan
                    // atau jika ingin kembali ke view kecamatan:
                    setDrill(prev => ({ ...prev, level: 'kelurahan' }))
                }
            }]
            : []),
  ]

    const isDeepest = drill.level === 'kelurahan'
    const canRollUp = drill.level !== 'kabupaten'

    return {
        drill,
        drillDown,
        rollUp,
        resetAll,
        breadcrumbs,
        isDeepest,
        canRollUp,
    }
}