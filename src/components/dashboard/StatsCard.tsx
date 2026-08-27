import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Plus } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subtext?: string
  icon: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning'
  onQuickAction?: () => void
  quickActionLabel?: string
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtext,
  icon,
  variant = 'primary',
  onQuickAction,
  quickActionLabel,
}) => {
  const [showTooltip, setShowTooltip] = useState(false)

  const iconColors = {
    primary: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
    secondary: 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20',
    success: 'bg-brand-success/10 text-brand-success border-brand-success/20',
    danger: 'bg-brand-danger/10 text-brand-danger border-brand-danger/20',
    warning: 'bg-brand-warning/10 text-brand-warning border-brand-warning/20',
  }

  const iconRingColors = {
    primary: 'ring-brand-primary/30',
    secondary: 'ring-brand-secondary/30',
    success: 'ring-brand-success/30',
    danger: 'ring-brand-danger/30',
    warning: 'ring-brand-warning/30',
  }

  const iconContent = (
    <>
      {icon}
      {onQuickAction && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-secondary text-white flex items-center justify-center shadow-sm">
          <Plus size={10} strokeWidth={3} />
        </div>
      )}
    </>
  )

  return (
    <Card hoverable className="flex items-center justify-between p-6">
      <div className="flex flex-col gap-1 align-left">
        <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider text-left">
          {title}
        </span>
        <span className="text-2xl font-bold text-brand-primary text-left tracking-tight mt-1">
          {value}
        </span>
        {subtext && (
          <span className="text-xs text-brand-muted text-left mt-0.5">
            {subtext}
          </span>
        )}
      </div>

      {/* Icon — clickable when onQuickAction is provided */}
      <div className="relative">
        {onQuickAction ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onQuickAction(); }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={`relative w-12 h-12 rounded-xl flex items-center justify-center border cursor-pointer
              ${iconColors[variant]}
              transition-all duration-300 hover:scale-110 hover:ring-2 ${iconRingColors[variant]}
              active:scale-95`}
            aria-label={quickActionLabel}
          >
            {iconContent}
          </button>
        ) : (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${iconColors[variant]} transition-transform duration-300 hover:scale-110`}>
            {iconContent}
          </div>
        )}

        {/* Tooltip */}
        {showTooltip && quickActionLabel && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-lg bg-brand-primary text-white text-[10px] font-medium shadow-lg z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            {quickActionLabel}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-brand-primary" />
          </div>
        )}
      </div>
    </Card>
  )
}
