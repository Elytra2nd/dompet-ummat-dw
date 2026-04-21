'use client'

import * as React from 'react'
import {
  Ambulance,
  LayoutDashboard,
  HeartHandshake,
  ChevronRight,
  LogOut,
  BrainCircuit,
  PanelLeftClose,
  ClipboardCheck,
  FileBarChart,
  Activity,
  History,
  LayoutGrid
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const sidebarConfig = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Modul ZISWAF",
      url: "#",
      icon: HeartHandshake,
      items: [
        { title: "Database Donatur", url: "/donasi/donatur" },
        { title: "Transaksi Masuk", url: "/donasi/masuk" },
        { title: "Daftar Mustahik", url: "/mustahik" },
        { title: "Input Mustahik", url: "/mustahik/baru" },
        { title: "Transaksi Keluar", url: "/donasi/keluar" },
      ],
    },
    {
      title: "Operasional Ambulan",
      url: "/ambulan",
      icon: Ambulance,
      items: [
        { title: "Portal Utama", url: "/ambulan" },
        { title: "Layanan Pasien", url: "/ambulan/monitoring" },
        { title: "Aktivitas & Biaya", url: "/ambulan/riwayat" },
      ],
    },
    {
      title: "Survey & Kelayakan",
      url: "#",
      icon: ClipboardCheck,
      items: [
        { title: "Hasil Survey", url: "/survey" },
        { title: "Manajemen Pertanyaan", url: "/survey/pertanyaan" },
        { title: "Input Survey Baru", url: "/survey/baru" },
      ],
    },
    {
      title: "BIDA Analitik",
      url: "#",
      icon: BrainCircuit,
      items: [
        { title: "Segmentasi Donatur", url: "/segmentasi" },
        { title: "Perbandingan Segmen", url: "/segmentasi/perbandingan" },
        { title: "Sebaran Spasial", url: "/map/mustahik" },
        { title: "Log Audit SCD", url: "/reports/scd" },
      ],
    },
    {
      title: "Laporan & Export",
      url: "#",
      icon: FileBarChart,
      items: [
        { title: "Pusat Laporan", url: "/reports" },
      ],
    },
  ],
}

export function AppSidebar() {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()

  return (
    <Sidebar collapsible="icon" className="border-r-2 bg-white transition-all duration-300 ease-in-out">
      {/* HEADER */}
      <SidebarHeader className="h-16 border-b flex flex-row items-center justify-between px-3 overflow-hidden bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 transition-opacity duration-300">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg shadow-emerald-100">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-black tracking-tighter text-slate-900 leading-none italic">DOMPET <span className="text-emerald-600 font-black">UMMAT</span></span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">BIDA Warehouse v2</span>
          </div>
        </div>
        
        <button 
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 group-data-[collapsible=icon]:hidden transition-colors"
        >
          <PanelLeftClose size={18} />
        </button>
      </SidebarHeader>

      <SidebarContent className="py-4 scrollbar-hide">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-4">
            Main Repository
          </SidebarGroupLabel>
          <SidebarMenu className="px-2 space-y-1">
            {sidebarConfig.navMain.map((item) => {
              const isChildActive = item.items?.some(sub => pathname === sub.url || pathname.startsWith(sub.url + '/'))
              const isParentActive = pathname === item.url || (item.url !== '#' && pathname.startsWith(item.url))

              return (
                <React.Fragment key={item.title}>
                  {item.items ? (
                    <Collapsible asChild defaultOpen={isChildActive} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton 
                            tooltip={item.title} 
                            className={`h-10 font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all ${isChildActive ? 'bg-emerald-50/50 text-emerald-700' : ''}`}
                          >
                            {item.icon && <item.icon className={`h-5 w-5 ${isChildActive ? 'text-emerald-600' : ''}`} />}
                            <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="transition-all duration-300">
                          <SidebarMenuSub className="border-l-2 border-emerald-100 ml-4 py-1.5 my-1 space-y-1">
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                  <Link href={subItem.url} className="text-[13px] font-semibold py-2 transition-all">
                                    {subItem.title}
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        asChild 
                        tooltip={item.title} 
                        isActive={isParentActive}
                        className={`h-10 font-bold transition-all hover:bg-emerald-50 ${isParentActive ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-slate-600'}`}
                      >
                        <Link href={item.url}>
                          {item.icon && <item.icon className="h-5 w-5" />}
                          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </React.Fragment>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="p-4 border-t bg-slate-50/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-12 hover:bg-rose-50 hover:text-rose-600 transition-all rounded-xl px-3">
              <LogOut className="h-5 w-5" />
              <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                <span className="text-xs font-black text-slate-900 leading-none">Muhammad Ilham</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1 italic">Authorized Admin</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}