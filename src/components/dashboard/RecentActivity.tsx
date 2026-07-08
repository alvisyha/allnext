import React from 'react'
import { Card } from '@/components/ui/Card'
import { CheckSquare, Wallet, Flame, Calendar, CircleHelp } from 'lucide-react'

export interface ActivityItem {
  id: string
  title: string
  time: string
  type: 'task' | 'finance' | 'habit' | 'event'
  description?: string
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckSquare size={16} className="text-indigo-650" />
      case 'finance':
        return <Wallet size={16} className="text-emerald-650" />
      case 'habit':
        return <Flame size={16} className="text-amber-650" />
      case 'event':
        return <Calendar size={16} className="text-purple-650" />
      default:
        return <CircleHelp size={16} className="text-neutral-500" />
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'bg-indigo-50 border-indigo-100'
      case 'finance':
        return 'bg-emerald-50 border-emerald-100'
      case 'habit':
        return 'bg-amber-50 border-amber-100'
      case 'event':
        return 'bg-purple-50 border-purple-100'
      default:
        return 'bg-neutral-50 border-neutral-100'
    }
  }

  return (
    <Card className="p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base text-brand-primary">Aktivitas Terbaru</h3>
      </div>
      
      {activities.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-brand-muted">Belum ada aktivitas.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[320px] pr-1">
          {activities.map((item) => (
            <div key={item.id} className="flex gap-4 items-start text-left">
              {/* Icon container */}
              <div className={`p-2 rounded-xl border shrink-0 ${getBgColor(item.type)}`}>
                {getIcon(item.type)}
              </div>
              
              {/* Content area */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-primary truncate">
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-xs text-brand-muted mt-0.5 truncate">
                    {item.description}
                  </p>
                )}
                <span className="text-[10px] font-medium text-brand-muted block mt-1">
                  {item.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
