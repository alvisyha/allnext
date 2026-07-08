'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, User, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface TopbarProps {
  onMenuClick: () => void
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const pathname = usePathname()
  const supabase = createClient()
  const [userName, setUserName] = useState<string>('Pengguna')
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
        const fullName = user.user_metadata?.full_name
        if (fullName) {
          setUserName(fullName)
        } else {
          setUserName(user.email?.split('@')[0] || 'Pengguna')
        }
      }
    }
    fetchUser()
  }, [supabase])

  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard'
      case '/dashboard/tasks':
        return 'Tugas & Pengingat'
      case '/dashboard/habits':
        return 'Habit Tracker'
      case '/dashboard/finance':
        return 'Mengelola Keuangan'
      case '/dashboard/planner':
        return 'Planner & Kalender'
      default:
        return 'Allnext'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-brand-border h-16 px-6 flex items-center justify-between">
      {/* Search / Title area */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg border border-brand-border text-neutral-500 hover:bg-neutral-50 hover:text-brand-text transition-colors"
        >
          <Menu size={18} />
        </button>
        <h1 className="font-semibold text-lg text-brand-primary tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications Icon (Subtle placeholder) */}
        <button className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition-colors">
          <Bell size={18} />
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-brand-primary">{userName}</span>
            <span className="text-xs text-brand-muted">{userEmail}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20 flex items-center justify-center font-bold text-xs uppercase cursor-pointer">
            {userName ? getInitials(userName) : <User size={16} />}
          </div>
        </div>
      </div>
    </header>
  )
}
