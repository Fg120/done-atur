import { redirect } from "next/navigation"
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
import { getCurrentProfile, type Profile } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin-sidebar"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const profile = await getCurrentProfile() as Profile | null

  if (!profile || profile.role !== "admin") {
    redirect("/")
  }

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <AdminSidebar userEmail={user?.email} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:ml-64">
        {/* Top Navigation */}
        <header className="border-b bg-background sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="hidden md:block">
              <h2 className="text-lg font-semibold">Admin Dashboard</h2>
            </div>
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {profile.full_name?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile.full_name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/account">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/admin/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Pengaturan
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form
                      action={async () => {
                        "use server"
                        await logout()
                      }}
                      className="w-full"
                    >
                      <button
                        type="submit"
                        className="flex w-full items-center text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
