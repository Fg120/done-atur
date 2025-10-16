import { z } from "zod"

import type { UserRole } from "@/types/database"

export const userRoleSchema = z.enum(["admin", "seller", "user"]) satisfies z.ZodType<UserRole>

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, "Minimal 8 karakter"),
})

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(2, "Minimal 2 karakter").max(120, "Maksimal 120 karakter"),
    email: z.string().trim().email(),
    password: z.string().min(8, "Minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Minimal 8 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  })

export const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
})

export const adminCreateUserSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  role: userRoleSchema.optional(),
})

export const adminUpdateUserSchema = z
  .object({
    full_name: z.string().trim().min(2).max(120).optional(),
    role: userRoleSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Tidak ada data yang diubah",
  })

export const resetPasswordSchema = z.object({
  email: z.string().trim().email(),
})

export const passwordUpdateSchema = z
  .object({
    password: z.string().min(8, "Minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Minimal 8 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  })

export const userQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  page: z.coerce.number().int().min(1).default(1),
  q: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .optional(),
  sortBy: z.enum(["created_at", "name", "email"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
})

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
})

export const donationSchema = z.object({
  donor_name: z.string().trim().min(1, "Nama diperlukan").max(100),
  donor_email: z.string().trim().email("Email tidak valid"),
  donor_phone: z.string().regex(/^(\+62|0)\d{9,12}$/, "Nomor HP tidak valid").optional().or(z.literal("")),
  donation_type: z.enum(["uang", "pakaian"], {
    errorMap: () => ({ message: "Pilih jenis donasi" }),
  }),
  nominal: z.string().optional(),
  net_amount: z.number().optional(),
  payment_method: z.enum(["transfer", "ewallet"]).optional(),
  transfer_proof_url: z.string().url().nullable().optional(),
  clothing_list: z.string().optional(),
  pickup_address: z.string().optional(),
  notes: z.string().max(500).optional(),
  is_anonymous: z.boolean().optional(),
})
  .refine(
    (data) => {
      if (data.donation_type === "uang") {
        return data.nominal && Number(data.nominal) > 0
      }
      if (data.donation_type === "pakaian") {
        return data.clothing_list && data.clothing_list.length > 0
      }
      return false
    },
    {
      message: "Detail donasi diperlukan",
    }
  )

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>
export type UserQueryInput = z.infer<typeof userQuerySchema>
export type DonationInput = z.infer<typeof donationSchema>
