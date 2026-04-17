'use client'

import * as React from 'react'
import {
  Ambulance,
  LayoutDashboard,
  HeartHandshake,
  ChevronRight,
  LogOut,
  BrainCircuit,
  PanelLeftClose, // Ikon untuk trigger
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
  useSidebar, // Hook untuk deteksi status sidebar
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
      isActive: true,
    },
    {
      title: "Modul ZISWAF",
      url: "#",
      icon: HeartHandshake,
      items: [
        { title: "Database Donatur", url: "/donasi/donatur" },
        { title: "Transaksi Masuk", url: "/donasi/masuk" },
      ],
    },
    {
      title: "Layanan Ambulans",
      url: "#",
      icon: Ambulance,
      items: [
        { title: "Input Layanan", url: "/ambulan/layanan" },
        { title: "Monitoring", url: "/ambulan/monitoring" },
      ],
    },
    {
      title: "BIDA Analitik",
      url: "#",
      icon: BrainCircuit,
      items: [
        { title: "Sebaran Spasial", url: "/map/mustahik" },
        { title: "Prediksi SVM", url: "/analitik/prediksi" },
        { title: "Log Audit SCD", url: "/reports/scd" },
      ],
    },
  ],
}

export function AppSidebar() {
  const pathname = usePathname()
  const { toggleSidebar, state } = useSidebar() // Ambil fungsi toggle

  return (
    <Sidebar collapsible="icon" className="border-r-2 bg-white transition-all duration-300 ease-in-out">
      {/* HEADER DENGAN TOMBOL ANIMASI BUKA/TUTUP */}
      <SidebarHeader className="h-16 border-b flex flex-row items-center justify-between px-4 overflow-hidden">
        <div className="flex items-center gap-3 transition-opacity duration-300">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-black tracking-tighter text-slate-900 leading-none">DOMPET <span className="text-emerald-600">UMMAT</span></span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">BIDA Platform</span>
          </div>
        </div>
        
        {/* Tombol Trigger Internal */}
        <button 
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 group-data-[collapsible=icon]:hidden transition-colors"
        >
          <PanelLeftClose size={18} />
        </button>
      </SidebarHeader>

      <SidebarContent className="py-4 scrollbar-hide">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Main Menu
          </SidebarGroupLabel>
          <SidebarMenu>
            {sidebarConfig.navMain.map((item) => (
              <React.Fragment key={item.title}>
                {item.items ? (
                  <Collapsible asChild className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title} className="h-11 font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all">
                          {item.icon && <item.icon className="h-5 w-5" />}
                          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="transition-all duration-300 data-[state=closed]:animate-slide-up data-[state=open]:animate-slide-down">
                        <SidebarMenuSub className="border-l-2 ml-4 py-2 space-y-1">
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                <Link href={subItem.url} className="text-sm font-medium py-2">
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
                      isActive={pathname === item.url}
                      className="h-11 font-semibold transition-all hover:bg-emerald-50"
                    >
                      <Link href={item.url}>
                        {item.icon && <item.icon className="h-5 w-5" />}
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </React.Fragment>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t bg-slate-50/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-12 hover:bg-red-50 hover:text-red-600 transition-all">
              <LogOut className="h-5 w-5" />
              <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                <span className="text-xs font-black text-slate-900">Sign Out</span>
                <span className="text-[9px] font-bold text-slate-400">admin@dompetummat.id</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}