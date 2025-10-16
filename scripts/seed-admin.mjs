import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")
  process.exit(1)
}

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com"
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "AdminSupabase!12345"
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? "Administrator"

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function ensureAdminUser() {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error("Failed to list users:", listError.message)
    process.exit(1)
  }

  const existing = users.users.find(user => user.email === ADMIN_EMAIL)

  if (existing) {
    console.log(`Admin user already exists: ${ADMIN_EMAIL}`)
    await supabase
      .from("profiles")
      .update({ role: "admin", full_name: ADMIN_NAME })
      .eq("id", existing.id)
    console.log("Profile role ensured to admin.")
    return
  }

  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: ADMIN_NAME,
    },
  })

  if (createError) {
    console.error("Failed to create admin user:", createError.message)
    process.exit(1)
  }

  if (!userData.user) {
    console.error("Supabase did not return user details after creation.")
    process.exit(1)
  }

  await supabase
    .from("profiles")
    .update({ role: "admin", full_name: ADMIN_NAME })
    .eq("id", userData.user.id)

  console.log(`Admin user created: ${ADMIN_EMAIL}`)
}

ensureAdminUser()
  .then(() => {
    console.log("Seeding finished.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Unexpected error:", error)
    process.exit(1)
  })
