import { prisma } from './prisma'

export async function logActivity(
  userId: string,
  action: string,
  entity: string,
  details?: Record<string, any> | string,
  ipAddress?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
        ipAddress,
      },
    })
  } catch (error) {
    // Kami hanya me-log ke console jika gagal, agar tidak memblokir alur utama aplikasi
    console.error('[AUDIT_ERROR] Gagal menyimpan log aktivitas:', error)
  }
}
