'use client'

import React, { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50/50 flex text-brand-text">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Drawer container */}
          <div className="relative z-10 flex animate-in slide-in-from-left duration-300">
            <Sidebar isOpen={true} setIsOpen={() => {}} />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div 
        className={`flex-1 min-h-screen flex flex-col transition-all duration-300
          ${sidebarOpen ? 'md:pl-64' : 'md:pl-20'}
        `}
      >
        <Topbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  )
}
