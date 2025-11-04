"use client"

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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { adminCreateProductSchema, type AdminCreateProductInput } from "@/lib/validators"

interface ProductRow {
  id: string
  user_id: string
  title: string
  description: string | null
  category: "pria" | "wanita" | "anak"
  condition: "baru" | "preloved"
  price: number
  stock: number
  status: "active" | "inactive"
  created_at: string | null
  updated_at: string | null
}

interface ProductsResponse {
  data: {
    items: ProductRow[]
    total: number
    page: number
    pageSize: number
  }
}

interface UserOption { id: string; email: string; full_name: string | null }

const DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const PAGE_SIZE = 10

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(PAGE_SIZE)
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'price'>('created_at')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])

  const form = useForm<AdminCreateProductInput>({
    resolver: zodResolver(adminCreateProductSchema),
    defaultValues: {
      title: "",
      user_id: "",
      condition: "baru",
      price: 0,
      stock: 0,
      status: "active",
      photo_urls: [],
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
      try {
        const response = await fetch(`/api/users?limit=50&page=1&sortBy=full_name&order=asc`, { cache: 'no-store' })
        if (!response.ok) return
        const payload = await response.json()
        const items: any[] = payload?.data?.items ?? []
        setUsers(items.map((u) => ({ id: u.id, email: u.email, full_name: u.full_name })))
      } catch { }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          limit: String(pageSize),
          page: String(page),
          sortBy,
          order,
        })
        if (debouncedSearch) params.set('q', debouncedSearch)
        if (statusFilter !== 'all') params.set('status', statusFilter)

        const response = await fetch(`/api/products?${params}`, { cache: 'no-store' })
        if (!response.ok) {
          const body = await response.json().catch(() => null)
          throw new Error(body?.error ?? `HTTP ${response.status}`)
        }
        const payload: ProductsResponse = await response.json()
        setProducts(payload.data.items)
        setTotal(payload.data.total)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Tidak dapat memuat produk'
        setError(errorMessage)
        toast({ variant: 'destructive', title: 'Terjadi kesalahan', description: errorMessage })
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [page, pageSize, sortBy, order, debouncedSearch, statusFilter])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return
    setPage(nextPage)
  }

  const toggleSort = (column: 'created_at' | 'title' | 'price') => {
    if (sortBy === column) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortBy(column)
    setOrder('asc')
  }

  const handleCreate = async (values: AdminCreateProductInput) => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title.trim(),
          user_id: values.user_id,
          condition: values.condition,
          price: values.price,
          stock: values.stock,
          status: values.status,
          photo_urls: values.photo_urls && values.photo_urls.length ? values.photo_urls : undefined,
        }),
      })

      const result = await response.json().catch(() => null)
      if (!response.ok) {
        if (response.status === 422 && result?.details) {
          form.setError('title', { message: result.details.title?.[0] })
          form.setError('user_id', { message: result.details.user_id?.[0] })
          form.setError('condition', { message: result.details.condition?.[0] })
          form.setError('price', { message: result.details.price?.[0] })
          form.setError('stock', { message: result.details.stock?.[0] })
          form.setError('status', { message: result.details.status?.[0] })
        }
        throw new Error(result?.error ?? 'Gagal menambah produk')
      }

      toast({ title: 'Produk dibuat', description: 'Produk baru berhasil ditambahkan.' })
      form.reset({ title: '', user_id: '', condition: 'baru', price: 0, stock: 0, status: 'active', photo_urls: [] })
      setPage(1)
      setDebouncedSearch('')
      setSearchTerm('')
      const newProduct: ProductRow | undefined = result?.data
      if (newProduct) {
        setProducts((prev) => [newProduct, ...prev].slice(0, pageSize))
        setTotal((prev) => prev + 1)
      } else {
        router.refresh()
      }
      setIsModalOpen(false)
    } catch (error) {
      toast({ variant: 'destructive', title: 'Terjadi kesalahan', description: error instanceof Error ? error.message : 'Tidak dapat menambah produk' })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage catalog items</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Product title" disabled={isCreating} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Product description"
                          disabled={isCreating}
                          className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isCreating}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select owner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.full_name ? `${u.full_name} (${u.email})` : u.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isCreating}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pria">Pria</SelectItem>
                          <SelectItem value="wanita">Wanita</SelectItem>
                          <SelectItem value="anak">Anak</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isCreating}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="baru">Baru</SelectItem>
                            <SelectItem value="preloved">Preloved</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isCreating}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" disabled={isCreating} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" min="0" disabled={isCreating} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                      'Create Product'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('title')}>
                Title {sortBy === 'title' && (order === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('price')}>
                Price {sortBy === 'price' && (order === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('created_at')}>
                Created {sortBy === 'created_at' && (order === 'asc' ? '↑' : '↓')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Loading products...</p>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/admin/products/${p.id}`)}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>Rp {p.price.toLocaleString('id-ID')}</TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.created_at ? DATE_FORMATTER.format(new Date(p.created_at)) : '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing {Math.min((page - 1) * pageSize + 1, total)} to {Math.min(page * pageSize, total)} of {total} products
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(page - 1) }} className={page <= 1 ? 'pointer-events-none opacity-50' : ''} />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(pageNumber) }} isActive={pageNumber === page}>
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            <PaginationItem>
              <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(page + 1) }} className={page >= totalPages ? 'pointer-events-none opacity-50' : ''} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <Toaster />
    </div>
  )
}

