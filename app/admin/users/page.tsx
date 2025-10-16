'use client'

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Search } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { adminCreateUserSchema, type AdminCreateUserInput } from "@/lib/validators"

interface UserRow {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string | null
  updated_at: string | null
}

interface UsersResponse {
  data: {
    items: UserRow[]
    total: number
    page: number
    pageSize: number
  }
}

const DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const PAGE_SIZE = 10

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(PAGE_SIZE)
  const [sortBy, setSortBy] = useState<'created_at' | 'full_name' | 'email'>('created_at')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AdminCreateUserInput>({
    resolver: zodResolver(adminCreateUserSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: undefined,
    },
  })

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchTerm])

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          limit: String(pageSize),
          page: String(page),
          sortBy,
          order,
        })
        if (debouncedSearch) {
          params.set('q', debouncedSearch)
        }
        const response = await fetch(`/api/users?${params}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          const body = await response.json().catch(() => null)
          const errorMessage = body?.error ?? `HTTP ${response.status}: ${response.statusText}`
          throw new Error(errorMessage)
        }

        const payload: UsersResponse = await response.json()
        setUsers(payload.data.items)
        setTotal(payload.data.total)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Tidak dapat memuat data pengguna'
        setError(errorMessage)
        toast({
          variant: 'destructive',
          title: 'Terjadi kesalahan',
          description: errorMessage,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [page, pageSize, sortBy, order, debouncedSearch])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return
    setPage(nextPage)
  }

  const toggleSort = (column: 'created_at' | 'full_name' | 'email') => {
    if (sortBy === column) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortBy(column)
    setOrder('asc')
  }

  const handleCreate = async (values: AdminCreateUserInput) => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: values.full_name.trim(),
          email: values.email.trim(),
          role: values.role || undefined,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        if (response.status === 422 && result?.details) {
          form.setError('full_name', { message: result.details.full_name?.[0] })
          form.setError('email', { message: result.details.email?.[0] })
          form.setError('role', { message: result.details.role?.[0] })
        }
        throw new Error(result?.error ?? 'Gagal menambah pengguna')
      }

      toast({
        title: 'Pengguna dibuat',
        description: 'Undangan telah dikirim ke email yang ditambahkan.',
      })

      // Reset form and search
      form.reset({ full_name: '', email: '', role: undefined })
      setPage(1)
      setDebouncedSearch('')
      setSearchTerm('')

      const newUser: UserRow | undefined = result?.data
      if (newUser) {
        setUsers((prev) => [newUser, ...prev].slice(0, pageSize))
        setTotal((prev) => prev + 1)
      } else {
        router.refresh()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Terjadi kesalahan',
        description: error instanceof Error ? error.message : 'Tidak dapat menambah pengguna',
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" disabled={isCreating} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="user@example.com" disabled={isCreating} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isCreating}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="seller">Seller</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create User'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('full_name')}>
                Name {sortBy === 'full_name' && (order === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('email')}>
                Email {sortBy === 'email' && (order === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('created_at')}>
                Joined {sortBy === 'created_at' && (order === 'asc' ? '↑' : '↓')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Loading users...</p>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="text-destructive">
                    <p className="font-medium">Error loading users</p>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  <div>
                    <p className="font-medium">No users found</p>
                    <p className="text-sm mt-1">
                      {debouncedSearch ? 
                        'Try adjusting your search terms or create a new user.' : 
                        'Get started by creating your first user.'
                      }
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                >
                  <TableCell className="font-medium">{user.full_name ?? 'No name'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.created_at ? DATE_FORMATTER.format(new Date(user.created_at)) : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing {Math.min((page - 1) * pageSize + 1, total)} to {Math.min(page * pageSize, total)} of {total} users
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  handlePageChange(page - 1)
                }}
                className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      handlePageChange(pageNumber)
                    }}
                    isActive={pageNumber === page}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  handlePageChange(page + 1)
                }}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <Toaster />
    </div>
  )
}
