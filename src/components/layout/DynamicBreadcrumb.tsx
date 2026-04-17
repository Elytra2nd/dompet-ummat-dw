'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from 'lucide-react'

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  
  // Memecah path: "/donasi/masuk" -> ["", "donasi", "masuk"]
  // Lalu difilter agar tidak ada string kosong
  const pathSegments = pathname.split('/').filter((segment) => segment !== '')

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Item Home / Dashboard Selalu Ada */}
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="flex items-center gap-1 font-medium">
            <Home className="h-3 w-3" />
            <span className="hidden md:inline">Dashboard</span>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {pathSegments.length > 0 && <BreadcrumbSeparator />}

        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join('/')}`
          const isLast = index === pathSegments.length - 1
          
          // Format teks: "layanan-ambulan" -> "Layanan Ambulan"
          const title = segment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())

          return (
            <React.Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-bold text-slate-900">
                    {title}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href} className="font-medium capitalize">
                    {title}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}