/**
 * Integration Tests — Middleware RBAC
 * ====================================
 * Tests role-based access control routing logic.
 * Mocks next-auth/jwt getToken to simulate different user roles.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock getToken from next-auth/jwt
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}))

import { getToken } from 'next-auth/jwt'
import { middleware } from '@/middleware'

const mockedGetToken = vi.mocked(getToken)

function createRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(pathname, 'http://localhost:3000'))
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Unauthenticated user', () => {
  beforeEach(() => {
    mockedGetToken.mockResolvedValue(null)
  })

  it('should allow access to /login', async () => {
    const req = createRequest('/login')
    const res = await middleware(req)
    // /login is bypassed in the early return, so NextResponse.next()
    expect(res.status).not.toBe(307) // not a redirect
  })

  it('should allow access to /api/auth/*', async () => {
    const req = createRequest('/api/auth/session')
    const res = await middleware(req)
    expect(res.status).not.toBe(307)
  })

  it('should redirect to /login for protected route /', async () => {
    const req = createRequest('/')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('should redirect to /login for /donasi', async () => {
    const req = createRequest('/donasi/masuk')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })
})

describe('ADMIN role', () => {
  beforeEach(() => {
    mockedGetToken.mockResolvedValue({ role: 'ADMIN' } as any)
  })

  it('should allow access to / (dashboard)', async () => {
    const req = createRequest('/')
    const res = await middleware(req)
    expect(res.status).not.toBe(307)
  })

  it('should allow access to /donasi/*', async () => {
    const req = createRequest('/donasi/masuk')
    const res = await middleware(req)
    expect(res.status).not.toBe(307)
  })

  it('should allow access to /ambulan/*', async () => {
    const req = createRequest('/ambulan/monitoring')
    const res = await middleware(req)
    expect(res.status).not.toBe(307)
  })

  it('should allow access to /survey/*', async () => {
    const req = createRequest('/survey/baru')
    const res = await middleware(req)
    expect(res.status).not.toBe(307)
  })

  it('should allow access to /reports/*', async () => {
    const req = createRequest('/reports/scd')
    const res = await middleware(req)
    expect(res.status).not.toBe(307)
  })

  it('should allow access to /segmentasi/*', async () => {
    const req = createRequest('/segmentasi')
    const res = await middleware(req)
    expect(res.status).not.toBe(307)
  })
})

describe('SURVEYOR role (Relawan)', () => {
  beforeEach(() => {
    mockedGetToken.mockResolvedValue({ role: 'SURVEYOR' } as any)
  })

  it('should redirect / to /survey/baru', async () => {
    const req = createRequest('/')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/survey/baru')
  })

  it('should allow access to /survey/baru', async () => {
    const req = createRequest('/survey/baru')
    const res = await middleware(req)
    expect(res.status).not.toBe(307)
  })

  it('should allow access to /survey/hasil', async () => {
    const req = createRequest('/survey/hasil')
    const res = await middleware(req)
    expect(res.status).not.toBe(307)
  })

  it('should redirect /donasi/* to /survey/baru (privilege escalation blocked)', async () => {
    const req = createRequest('/donasi/masuk')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/survey/baru')
  })

  it('should redirect /ambulan/* to /survey/baru', async () => {
    const req = createRequest('/ambulan/monitoring')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/survey/baru')
  })

  it('should redirect /reports/* to /survey/baru', async () => {
    const req = createRequest('/reports/scd')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/survey/baru')
  })

  it('should redirect /segmentasi/* to /survey/baru', async () => {
    const req = createRequest('/segmentasi')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/survey/baru')
  })

  it('should redirect /mustahik/* to /survey/baru', async () => {
    const req = createRequest('/mustahik')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/survey/baru')
  })
})

describe('STAFF role', () => {
  beforeEach(() => {
    mockedGetToken.mockResolvedValue({ role: 'STAFF' } as any)
  })

  it('should behave same as SURVEYOR — redirect / to /survey/baru', async () => {
    const req = createRequest('/')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/survey/baru')
  })

  it('should allow access to /survey/*', async () => {
    const req = createRequest('/survey/baru')
    const res = await middleware(req)
    expect(res.status).not.toBe(307)
  })
})
