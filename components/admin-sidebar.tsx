"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Gift,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { logout } from "@/app/admin/actions"

interface AdminSidebarProps {
  userEmail?: string
}

export function AdminSidebar({ userEmail }: AdminSidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/admin",
    },
    {
      icon: Gift,
      label: "Donasi",
      href: "/admin/donations",
    },
    {
      icon: Users,
      label: "Pengguna",
      href: "/admin/users",
    },
    {
      icon: Settings,
      label: "Pengaturan",
      href: "/admin/settings",
    },
  ]

  return (
    <>
      {/* Mobile Hamburger */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background transition-transform duration-300 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4 space-y-2">
            {userEmail && (
              <p className="text-xs text-muted-foreground truncate px-4 py-2">
                {userEmail}
              </p>
            )}
            <form
              action={async () => {
                await logout()
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-background/80 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
