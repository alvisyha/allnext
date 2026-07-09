'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Flame,
  Wallet,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tugas & Pengingat', href: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Keuangan', href: '/dashboard/finance', icon: Wallet },
    { name: 'Planner & Kalender', href: '/dashboard/planner', icon: Calendar },
    { name: 'Habit Tracker', href: '/dashboard/habits', icon: Flame },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-45 bg-white border-r border-brand-border flex flex-col justify-between transition-all duration-300
        ${isOpen ? 'w-64' : 'w-20'}
      `}
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold text-base shrink-0">
              A
            </div>
            {isOpen && (
              <span className="font-bold text-lg text-brand-primary tracking-tight animate-in fade-in duration-200">
                Allnext
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden md:flex p-1.5 rounded-lg border border-brand-border text-neutral-400 hover:bg-neutral-50 hover:text-brand-text transition-colors duration-200"
          >
            {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-neutral-100 text-brand-primary'
                    : 'text-brand-muted hover:bg-neutral-50 hover:text-brand-primary'
                  }
                `}
              >
                <Icon size={18} className={isActive ? 'text-brand-primary' : 'text-neutral-400'} />
                {isOpen && (
                  <span className="animate-in fade-in duration-200 shrink-0">
                    {item.name}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout Action */}
      <div className="p-4 border-t border-brand-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-brand-danger hover:bg-red-50 transition-all duration-200 cursor-pointer"
        >
          <LogOut size={18} className="shrink-0" />
          {isOpen && (
            <span className="animate-in fade-in duration-200 shrink-0">
              Keluar
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}
