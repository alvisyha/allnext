import React from 'react'
import { Card } from '@/components/ui/Card'

interface StatsCardProps {
  title: string
  value: string | number
  subtext?: string
  icon: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning'
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtext,
  icon,
  variant = 'primary',
}) => {
  const iconColors = {
    primary: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
    secondary: 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20',
    success: 'bg-brand-success/10 text-brand-success border-brand-success/20',
    danger: 'bg-brand-danger/10 text-brand-danger border-brand-danger/20',
    warning: 'bg-brand-warning/10 text-brand-warning border-brand-warning/20',
  }

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
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${iconColors[variant]} transition-transform duration-300 hover:scale-110`}>
        {icon}
      </div>
    </Card>
  )
}
