import React from 'react'

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'neutral'
  children: React.ReactNode
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className = '' }) => {
  const styles = {
    primary: 'bg-brand-primary/10 text-brand-primary border-brand-primary/10',
    secondary: 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/10',
    success: 'bg-brand-success/10 text-brand-success border-brand-success/20',
    danger: 'bg-brand-danger/10 text-brand-danger border-brand-danger/20',
    warning: 'bg-brand-warning/10 text-brand-warning border-brand-warning/20',
    neutral: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}>
      {children}
    </span>
  )
}
