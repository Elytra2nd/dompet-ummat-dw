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
  Shield,
  UserCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

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

// Konfigurasi navigasi dengan penanda role
const allNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    adminOnly: true,
  },
  {
    title: "Modul ZISWAF",
    url: "#",
    icon: HeartHandshake,
    adminOnly: true,
    items: [
      { title: "Database Donatur", url: "/donasi/donatur" },
      { title: "Transaksi Masuk", url: "/donasi/masuk" },
      { title: "Daftar Mustahik", url: "/mustahik" },
      { title: "Transaksi Keluar", url: "/donasi/keluar" },
    ],
  },
  {
    title: "Operasional Ambulan",
    url: "/ambulan",
    icon: Ambulance,
    adminOnly: true,
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
    adminOnly: false, // Bisa diakses semua role
    items: [
      { title: "Hasil Survey", url: "/survey/hasil", adminOnly: true },
      { title: "Manajemen Pertanyaan", url: "/survey/pertanyaan", adminOnly: true },
      { title: "Input Survey Baru", url: "/survey/baru" },
    ],
  },
  {
    title: "BIDA Analitik",
    url: "#",
    icon: BrainCircuit,
    adminOnly: true,
    items: [
      { title: "Segmentasi Donatur", url: "/segmentasi" },
      { title: "Perbandingan Segmen", url: "/segmentasi/perbandingan" },
      { title: "Sebaran Spasial", url: "/mustahik/spasial" },
      { title: "Log Audit SCD", url: "/reports/scd" },
    ],
  },
  {
    title: "Laporan & Export",
    url: "#",
    icon: FileBarChart,
    adminOnly: true,
    items: [
      { title: "Pusat Laporan", url: "/reports" },
      { title: "Laporan Individu", url: "/reports/individu" },
      { title: "Backup Data", url: "/data/backup" },
    ],
  },
  {
    title: "Pengaturan Sistem",
    url: "#",
    icon: Shield,
    adminOnly: true,
    items: [
      { title: "Manajemen Pengguna", url: "/users" },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()
  const { data: session } = useSession()

  const userRole = (session?.user as any)?.role as string | undefined
  const userName = session?.user?.name || session?.user?.email || 'User'
  const isAdmin = userRole === 'ADMIN'

  // Sembunyikan sidebar di halaman login
  if (pathname === '/login') return null

  // Filter menu berdasarkan role
  const filteredNavItems = allNavItems
    .filter(item => isAdmin || !item.adminOnly)
    .map(item => {
      if (item.items) {
        return {
          ...item,
          items: item.items.filter(sub => isAdmin || !(sub as any).adminOnly),
        }
      }
      return item
    })
    // Hapus grup yang itemsnya kosong setelah filter
    .filter(item => !item.items || item.items.length > 0)

  // Handler Logout
  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <Sidebar collapsible="icon" className="border-r-2 bg-white transition-all duration-300 ease-in-out">
      {/* HEADER */}
      <SidebarHeader className="h-16 border-b flex flex-row items-center justify-between px-4 overflow-hidden bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 transition-all duration-300">
          <img
            src="/logo-du.png"
            alt="Dompet Ummat"
            className="h-10 w-auto object-contain scale-110 origin-left group-data-[collapsible=icon]:scale-100 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 transition-all duration-300"
          />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden border-l-2 border-slate-200 pl-3">
            <span className="font-black tracking-tighter text-emerald-600 leading-none text-sm">BIDA</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Analytics</span>
          </div>
        </div>
        
        <button 
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 group-data-[collapsible=icon]:hidden transition-colors shrink-0"
        >
          <PanelLeftClose size={18} />
        </button>
      </SidebarHeader>

      <SidebarContent className="py-4 scrollbar-hide">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-4">
            {isAdmin ? 'Main Repository' : 'Menu Relawan'}
          </SidebarGroupLabel>
          <SidebarMenu className="px-2 space-y-1">
            {filteredNavItems.map((item) => {
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
                            {item.icon && <item.icon className={`h-5 w-5 shrink-0 ${isChildActive ? 'text-emerald-600' : ''}`} />}
                            <span className="truncate group-data-[collapsible=icon]:hidden min-w-0 flex-1">{item.title}</span>
                            <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="transition-all duration-300">
                          <SidebarMenuSub className="border-l-2 border-emerald-100 ml-4 py-1.5 my-1 space-y-1">
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                  <Link href={subItem.url} className="text-[13px] font-semibold py-2 transition-all">
                                    <span className="truncate">{subItem.title}</span>
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
                          {item.icon && <item.icon className="h-5 w-5 shrink-0" />}
                          <span className="truncate group-data-[collapsible=icon]:hidden min-w-0 flex-1">{item.title}</span>
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

      {/* FOOTER - USER INFO & LOGOUT */}
      <SidebarFooter className="p-4 border-t bg-slate-50/50 space-y-2">
        {/* User Info Card */}
        <div className="flex items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:justify-center">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isAdmin ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
            {isAdmin ? <Shield className="h-4 w-4" /> : <UserCircle2 className="h-4 w-4" />}
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-black text-slate-900 leading-none truncate max-w-[140px]">{userName}</span>
            <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isAdmin ? 'text-indigo-500' : 'text-amber-500'}`}>
              {isAdmin ? 'Administrator' : 'Relawan'}
            </span>
          </div>
        </div>
        
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="h-12 hover:bg-rose-50 hover:text-rose-600 transition-all rounded-xl px-3 group"
            >
              <LogOut className="h-5 w-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
              <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden ml-2">
                <span className="text-xs font-black text-slate-900 leading-none">Logout</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1 italic">End Session</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}