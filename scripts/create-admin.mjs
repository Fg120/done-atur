#!/usr/bin/env node
import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables:")
  console.error("   - NEXT_PUBLIC_SUPABASE_URL")
  console.error("   - SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

// Get admin details from command line or use defaults
const args = process.argv.slice(2)
const ADMIN_EMAIL = args[0] || process.env.ADMIN_EMAIL || "admin@example.com"
const ADMIN_PASSWORD = args[1] || process.env.ADMIN_PASSWORD || "AdminSupabase!12345"
const ADMIN_NAME = args[2] || process.env.ADMIN_NAME || "Administrator"

console.log("🚀 Creating admin user...")
console.log(`   Email: ${ADMIN_EMAIL}`)
console.log(`   Name: ${ADMIN_NAME}`)

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function createAdminUser() {
  try {
    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`)
    }

    const existing = existingUsers.users.find(user => user.email === ADMIN_EMAIL)

    if (existing) {
      console.log("👤 User already exists, updating profile...")
      
      // Update the profile to ensure admin role
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          role: "admin", 
          name: ADMIN_NAME 
        })
        .eq("id", existing.id)

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`)
      }

      console.log("✅ Admin user profile updated successfully!")
      console.log(`   ID: ${existing.id}`)
      console.log(`   Email: ${existing.email}`)
      console.log(`   Role: admin`)
      return
    }

    // Create new user
    console.log("👤 Creating new user...")
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: ADMIN_NAME,
      },
    })

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`)
    }

    if (!userData.user) {
      throw new Error("User creation returned no data")
    }

    console.log("👤 User created, setting up profile...")

    // The profile should be created automatically by the trigger, but let's ensure it has admin role
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ 
        role: "admin",
        name: ADMIN_NAME 
      })
      .eq("id", userData.user.id)

    if (profileError) {
      console.warn(`⚠️  Profile update warning: ${profileError.message}`)
      // Try to insert instead
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: userData.user.id,
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
          role: "admin"
        })

      if (insertError) {
        console.warn(`⚠️  Profile insert warning: ${insertError.message}`)
      }
    }

    console.log("✅ Admin user created successfully!")
    console.log(`   ID: ${userData.user.id}`)
    console.log(`   Email: ${userData.user.email}`)
    console.log(`   Role: admin`)
    console.log(`   Password: ${ADMIN_PASSWORD}`)
    
  } catch (error) {
    console.error("❌ Error:", error.message)
    process.exit(1)
  }
}

// Verify connection first
console.log("🔌 Testing database connection...")
supabase
  .from("profiles")
  .select("count", { count: "exact", head: true })
  .then(({ error }) => {
    if (error) {
      console.error("❌ Database connection failed:", error.message)
      process.exit(1)
    }
    console.log("✅ Database connection successful")
    createAdminUser()
  })