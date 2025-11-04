export type UserRole = "admin" | "seller" | "user"
export type DonationType = "uang" | "pakaian"
export type DonationStatus = "pending" | "approved" | "rejected"
export type ProductCategory = "pria" | "wanita" | "anak"
export type ProductCondition = "baru" | "preloved"
export type ProductStatus = "active" | "inactive"

export interface ProfilesTable {
  Row: {
    id: string
    email: string
    full_name: string | null
    role: UserRole
    created_at: string | null
    updated_at: string | null
  }
  Insert: {
    id: string
    email: string
    full_name?: string | null
    role?: UserRole
    created_at?: string
    updated_at?: string
  }
  Update: {
    email?: string
    full_name?: string | null
    role?: UserRole
    created_at?: string
    updated_at?: string
  }
}

export interface DonationsTable {
  Row: {
    id: string
    donor_name: string
    donor_email: string
    donor_phone: string
    donation_type: DonationType
    nominal: number | null
    net_amount: number | null
    payment_method: string | null
    transfer_proof_url: string | null
    clothing_list: string | null
    pickup_address: string | null
    notes: string | null
    is_anonymous: boolean
    status: DonationStatus
    created_at: string
    updated_at: string
  }
  Insert: {
    donor_name: string
    donor_email: string
    donor_phone: string
    donation_type: DonationType
    nominal?: number | null
    net_amount?: number | null
    payment_method?: string | null
    transfer_proof_url?: string | null
    clothing_list?: string | null
    pickup_address?: string | null
    notes?: string | null
    is_anonymous?: boolean
    status?: DonationStatus
  }
  Update: {
    donor_name?: string
    donor_email?: string
    donor_phone?: string
    donation_type?: DonationType
    nominal?: number | null
    net_amount?: number | null
    payment_method?: string | null
    transfer_proof_url?: string | null
    clothing_list?: string | null
    pickup_address?: string | null
    notes?: string | null
    is_anonymous?: boolean
    status?: DonationStatus
  }
}

export interface Database {
  public: {
    Tables: {
      profiles: ProfilesTable
      donations: DonationsTable
      products: ProductsTable
      accountability: AccountabilityTable
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
    }
  }
}

export interface ProductsTable {
  Row: {
    id: string
    user_id: string
    title: string
    description: string | null
    category: ProductCategory
    condition: ProductCondition
    price: number
    stock: number
    status: ProductStatus
    photo_urls: string[] | null
    created_at: string | null
    updated_at: string | null
  }
  Insert: {
    user_id: string
    title: string
    description?: string | null
    category: ProductCategory
    condition: ProductCondition
    price: number
    stock?: number
    status?: ProductStatus
    photo_urls?: string[] | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    user_id?: string
    title?: string
    description?: string | null
    category?: ProductCategory
    condition?: ProductCondition
    price?: number
    stock?: number
    status?: ProductStatus
    photo_urls?: string[] | null
    created_at?: string
    updated_at?: string
  }
}

export interface AccountabilityTable {
  Row: {
    id: string
    location: string
    activity_date: string
    description: string
    donation_ids: string[]
    photo_urls: string[] | null
    created_by: string
    created_at: string
    updated_at: string
  }
  Insert: {
    location: string
    activity_date: string
    description: string
    donation_ids: string[]
    photo_urls?: string[] | null
    created_by: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    location?: string
    activity_date?: string
    description?: string
    donation_ids?: string[]
    photo_urls?: string[] | null
    created_by?: string
    created_at?: string
    updated_at?: string
  }
}
