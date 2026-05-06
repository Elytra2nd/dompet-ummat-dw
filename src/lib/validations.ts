import { z } from 'zod/v4'
import { NextResponse } from 'next/server'

/**
 * API Validation Schemas
 * ======================
 * Centralized Zod schemas for request validation.
 * Usage: const { data, error } = validateBody(await req.json(), RegisterSchema)
 */

// ---- Shared helpers ----

/** Validate request body against a Zod schema. Returns parsed data or error response. */
export function validateBody<T extends z.ZodType>(
  body: unknown,
  schema: T
): { data: z.infer<T>; error: null } | { data: null; error: NextResponse } {
  const result = schema.safeParse(body)
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
    return {
      data: null,
      error: NextResponse.json(
        { error: 'Validasi gagal', issues },
        { status: 400 }
      ),
    }
  }
  return { data: result.data, error: null }
}

/** Validate search params against a Zod schema */
export function validateQuery<T extends z.ZodType>(
  params: URLSearchParams,
  schema: T
): { data: z.infer<T>; error: null } | { data: null; error: NextResponse } {
  const raw: Record<string, string> = {}
  params.forEach((value, key) => { raw[key] = value })
  return validateBody(raw, schema)
}

// ---- Route Schemas ----

/** POST /api/auth/register */
export const RegisterSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  name: z.string().min(1, 'Nama wajib diisi').max(100),
  role: z.enum(['ADMIN', 'STAFF', 'SURVEYOR']),
})

/** POST /api/users */
export const CreateUserSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  name: z.string().min(1, 'Nama wajib diisi').max(100).optional(),
  role: z.enum(['ADMIN', 'STAFF', 'SURVEYOR']),
})

/** PUT /api/users/[id] */
export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional().or(z.literal('')),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['ADMIN', 'STAFF', 'SURVEYOR']).optional(),
})

/** POST /api/donasi/donatur (create) */
export const CreateDonaturSchema = z.object({
  nama_donatur: z.string().min(1, 'Nama donatur wajib diisi'),
  no_hp: z.string().min(1, 'Nomor HP wajib diisi'),
  alamat: z.string().optional().default('-'),
  perusahaan: z.string().optional().default('-'),
  kategori_donatur: z.string().min(1),
})

/** PUT /api/donasi/donatur (update SCD Type 2) */
export const UpdateDonaturSchema = z.object({
  sk_donatur: z.number({ error: 'SK diperlukan untuk update histori' }),
  nama_donatur: z.string().min(1),
  no_hp: z.string().min(1),
  alamat: z.string().optional(),
  perusahaan: z.string().optional().default('-'),
  kategori_donatur: z.string().min(1),
})

/** GET /api/donasi/donatur query params */
export const DonaturQuerySchema = z.object({
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).max(10000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
})

/** POST /api/donasi/masuk */
export const DonasiMasukSchema = z.object({
  id_donatur: z.string().min(1, 'ID donatur wajib dipilih'),
  nominal: z.number().positive('Nominal harus lebih dari 0'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  sub_program: z.string().min(1, 'Sub program wajib dipilih'),
  metode_bayar: z.string().optional(),
  keterangan: z.string().optional(),
})

/** POST /api/mustahik/update-location */
export const UpdateLocationSchema = z.object({
  sk_mustahik: z.number(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})
