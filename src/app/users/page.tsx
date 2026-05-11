'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  Shield,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { useSession } from 'next-auth/react'

// Shadcn UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type User = {
  id: string
  name: string | null
  email: string | null
  role: 'ADMIN' | 'STAFF' | 'SURVEYOR'
  createdAt: string
  updatedAt: string
}

export default function UserManagementPage() {
  const { data: session } = useSession()
  const currentUserEmail = session?.user?.email

  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  // Form States
  const [isEditing, setIsEditing] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STAFF',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Gagal mengambil data pengguna')
      const data = await res.json()
      setUsers(data)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Auto-hide messages
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('')
        setErrorMsg('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMsg, errorMsg])

  const handleOpenCreate = () => {
    setIsEditing(false)
    setSelectedUserId(null)
    setFormData({ name: '', email: '', password: '', role: 'STAFF' })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setIsEditing(true)
    setSelectedUserId(user.id)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // Biarkan kosong, hanya isi jika ingin ubah
      role: user.role,
    })
    setIsDialogOpen(true)
  }

  const handleOpenDelete = (id: string) => {
    setSelectedUserId(id)
    setIsDeleteOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const url = isEditing ? `/api/users/${selectedUserId}` : '/api/users'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan')

      setSuccessMsg(isEditing ? 'Data pengguna berhasil diupdate' : 'Pengguna baru berhasil ditambahkan')
      setIsDialogOpen(false)
      fetchUsers()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUserId) return
    setIsSubmitting(true)
    setErrorMsg('')
    
    try {
      const res = await fetch(`/api/users/${selectedUserId}`, {
        method: 'DELETE',
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus pengguna')

      setSuccessMsg('Pengguna berhasil dihapus')
      setIsDeleteOpen(false)
      fetchUsers()
    } catch (err: any) {
      setErrorMsg(err.message)
      setIsDeleteOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Badge className="bg-indigo-500">Administrator</Badge>
      case 'SURVEYOR': return <Badge className="bg-emerald-500">Relawan / Petugas Survei</Badge>
      case 'STAFF': return <Badge className="bg-amber-500">Staff Internal</Badge>
      default: return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200">
              <Users className="h-6 w-6 text-white" />
            </div>
            Manajemen Pengguna
          </h1>
          <p className="text-slate-500 mt-1 ml-12 text-sm">
            Kelola hak akses sistem, tambah relawan baru, dan atur akun staf administrator.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 shadow-md w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Main Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[250px] text-left px-6">Nama Lengkap</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[200px] text-left">Email</TableHead>
                  <TableHead className="min-w-[150px] text-left">Role Hak Akses</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[150px] text-left">Terdaftar Sejak</TableHead>
                  <TableHead className="text-center w-[120px] pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
                      <p className="text-sm text-slate-500 mt-2">Memuat data pengguna...</p>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                      Belum ada data pengguna.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="group hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-slate-900 px-6 text-left">{user.name}</TableCell>
                      <TableCell className="text-slate-600 hidden sm:table-cell text-left">{user.email}</TableCell>
                      <TableCell className="text-left">{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-slate-500 text-sm hidden md:table-cell text-left">
                        {new Date(user.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-center pr-6">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                            onClick={() => handleOpenEdit(user)}
                            aria-label="Edit pengguna"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {user.email !== currentUserEmail ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                              onClick={() => handleOpenDelete(user.id)}
                              aria-label="Hapus pengguna"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button disabled variant="ghost" size="icon" className="h-10 w-10" aria-label="Tidak bisa menghapus akun sendiri">
                              <Shield className="h-4 w-4 text-slate-400" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Perbarui detail pengguna. Biarkan password kosong jika tidak ingin mengubahnya.' 
                : 'Pilih role secara hati-hati, Administrator memiliki akses penuh ke seluruh data warehouse.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input 
                id="name" 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="Misal: Ahmad Fulan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="akun@dompetummat.id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {isEditing ? 'Password Baru (Opsional)' : 'Password'}
              </Label>
              <Input 
                id="password" 
                type="password" 
                required={!isEditing}
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                placeholder={isEditing ? 'Biarkan kosong jika tidak diubah' : 'Minimal 6 karakter'}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Role Akses</Label>
              <Select 
                value={formData.role} 
                onValueChange={(val) => setFormData({...formData, role: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SURVEYOR">Relawan / Petugas Survei (Akses Terbatas)</SelectItem>
                  <SelectItem value="STAFF">Staff Internal</SelectItem>
                  <SelectItem value="ADMIN">Administrator (Akses Penuh)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Simpan Perubahan' : 'Buat Akun'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Hapus Pengguna
            </DialogTitle>
            <DialogDescription className="pt-2">
              Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
