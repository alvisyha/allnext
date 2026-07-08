import React from 'react'
import { Card } from '@/components/ui/Card'
import { Plus, CheckSquare, Flame, Wallet, Calendar } from 'lucide-react'

interface QuickActionsProps {
  onAddTask: () => void
  onAddTransaction: () => void
  onAddEvent: () => void
  onAddHabit: () => void
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAddTask,
  onAddTransaction,
  onAddEvent,
  onAddHabit,
}) => {
  const actions = [
    {
      title: 'Tambah Tugas',
      desc: 'Masukkan to-do list baru',
      icon: CheckSquare,
      color: 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100/55',
      handler: onAddTask,
    },
    {
      title: 'Catat Keuangan',
      desc: 'Catat pemasukan / pengeluaran',
      icon: Wallet,
      color: 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100/55',
      handler: onAddTransaction,
    },
    {
      title: 'Agenda Baru',
      desc: 'Tambahkan jadwal ke kalender',
      icon: Calendar,
      color: 'bg-purple-50 border-purple-100 text-purple-600 hover:bg-purple-100/55',
      handler: onAddEvent,
    },
    {
      title: 'Kebiasaan Baru',
      desc: 'Buat habit tracker baru',
      icon: Flame,
      color: 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100/55',
      handler: onAddHabit,
    },
  ]

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base text-brand-primary">Akses Cepat</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.title}
              onClick={item.handler}
              className={`flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${item.color}`}
            >
              <div className="p-2 rounded-lg bg-white/80 shrink-0 shadow-xs">
                <Icon size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{item.title}</span>
                <span className="text-xs opacity-80 mt-0.5">{item.desc}</span>
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
