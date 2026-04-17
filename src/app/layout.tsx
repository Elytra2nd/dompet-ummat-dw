import type { Metadata } from 'next'
import { Poppins, Geist_Mono } from 'next/font/google'
import './globals.css'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DynamicBreadcrumb } from "@/components/layout/DynamicBreadcrumb" // Pastikan import ini ada
import { Toaster } from "sonner"
import { Separator } from "@/components/ui/separator"

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'BIDA | Dompet Ummat Kalbar',
  description: 'Business Intelligence & Data Analytics Platform for ZISWAF Management',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full bg-slate-50/50 font-sans">
        <TooltipProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              
              <main className="flex-1 flex flex-col min-w-0">
                {/* HEADER DENGAN BREADCRUMB DINAMIS */}
                <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    
                    {/* Menggunakan Komponen Breadcrumb Dinamis */}
                    <DynamicBreadcrumb />
                  </div>

                  {/* LOGO DI KANAN */}
                  <div className="ml-auto flex items-center gap-2">
                    <div className="font-black text-slate-900 tracking-tighter text-sm md:text-base">
                      DOMPET <span className="text-emerald-600">UMMAT</span>
                    </div>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                  {children}
                </div>
              </main>
            </div>
          </SidebarProvider>
        </TooltipProvider>

        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}