export type UserRole = "admin" | "seller" | "user"
export type DonationType = "uang" | "pakaian"
export type DonationStatus = "pending" | "approved" | "rejected" | "completed"

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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
    }
  }
}
