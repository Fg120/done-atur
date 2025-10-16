import { redirect } from "next/navigation"
import Link from "next/link"
import { LogOut, Settings, Users, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "./actions"
import { getCurrentProfile } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const profile = await getCurrentProfile()

  if (!profile || profile.role !== "admin") {
    redirect("/")
  }

  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const userInitials = profile.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : profile.email.substring(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <Link href="/admin/users" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#312E81] text-white">
                <Settings className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-[#312E81]">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Done-Atur</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/admin/users"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-[#312E81] transition-colors"
            >
              <Users className="h-4 w-4" />
              Users
            </Link>
            {/* Add more admin navigation items here as needed */}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={profile.full_name || profile.email} />
                    <AvatarFallback className="bg-[#312E81] text-white">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile.full_name || "Admin"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={logout}>
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-red-600 focus:text-red-600 w-full"
                    asChild
                  >
                    <button type="submit" className="flex items-center gap-2 w-full">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}