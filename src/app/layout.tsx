import type { Metadata, Viewport } from 'next'
import { Poppins, Geist_Mono } from 'next/font/google'
import './globals.css'
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "sonner"
import SessionProvider from '@/components/providers/SessionProvider'
import ClientLayoutWrapper from '@/components/layout/ClientLayoutWrapper'

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full bg-slate-50/50 font-sans">
        <SessionProvider>
          <TooltipProvider>
            <ClientLayoutWrapper>
              {children}
            </ClientLayoutWrapper>
          </TooltipProvider>

          <Toaster position="top-center" richColors />
        </SessionProvider>
      </body>
    </html>
  )
}