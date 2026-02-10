'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, Settings, LogOut, Link2 } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const navItems = [
    {
      href: '/dashboard',
      label: 'Tableau de bord',
      icon: BarChart3,
      active: pathname === '/dashboard',
    },
    {
      href: '/dashboard/links',
      label: 'Événements',
      icon: Link2,
      active: pathname === '/dashboard/links',
    },
    {
      href: '/dashboard/config',
      label: 'Configuration',
      icon: Settings,
      active: pathname === '/dashboard/config',
    },
  ]

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/logo.png"
                alt="STX Tracker"
                width={120}
                height={40}
                priority
                className="h-12 w-auto"
              />
            </Link>
            <div className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={item.active ? 'default' : 'ghost'}
                      size="sm"
                      className={item.active ? 'bg-success text-success-foreground hover:bg-success/90' : ''}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="default"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOut ? 'Déconnexion...' : 'Déconnecter'}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
