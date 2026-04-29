import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

// Rute yang HANYA boleh diakses oleh ADMIN
const ADMIN_ONLY_ROUTES = [
  '/donasi',
  '/mustahik',
  '/ambulan',
  '/segmentasi',
  '/reports',
  '/data',
  '/input-lokasi',
  '/users',
]

// Rute yang boleh diakses oleh SEMUA user yang sudah login (termasuk relawan)
const SHARED_ROUTES = [
  '/survey',
  '/api/survey',
  '/api/mustahik/index', // Relawan perlu akses data mustahik untuk form survey
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Lewatkan halaman login, api auth, aset statis
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Ambil token JWT (session)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // Jika belum login → redirect ke login
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = token.role as string

  // ADMIN: Akses penuh ke semua rute
  if (role === 'ADMIN') {
    return NextResponse.next()
  }

  // STAFF/SURVEYOR (Relawan): Hanya boleh akses rute survey dan root
  if (role === 'STAFF' || role === 'SURVEYOR') {
    // Izinkan akses ke halaman root (akan di-redirect ke survey nanti di client)
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/survey/baru', request.url))
    }

    // Izinkan rute survey dan API yang diperlukan
    const isAllowed = SHARED_ROUTES.some(route => pathname.startsWith(route))
    
    // Izinkan juga API umum yang dibutuhkan
    if (pathname.startsWith('/api/') && !ADMIN_ONLY_ROUTES.some(r => pathname.startsWith(`/api${r}`))) {
      return NextResponse.next()
    }
    
    if (isAllowed) {
      return NextResponse.next()
    }

    // Cek apakah termasuk rute admin-only
    const isAdminRoute = ADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route))
    if (isAdminRoute) {
      // Redirect relawan ke survey jika coba akses rute admin
      return NextResponse.redirect(new URL('/survey/baru', request.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'],
}
