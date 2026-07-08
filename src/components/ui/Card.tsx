import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'outline'
  hoverable?: boolean
}

export const Card: React.FC<CardProps> = ({
  className = '',
  variant = 'default',
  hoverable = false,
  children,
  ...props
}) => {
  const baseStyles = 'rounded-2xl p-6 transition-all duration-300'
  
  const variants = {
    default: 'bg-white border border-brand-border shadow-xs',
    glass: 'glass-card',
    outline: 'border border-brand-border bg-transparent',
  }

  const hoverStyles = hoverable
    ? 'hover:shadow-md hover:translate-y-[-2px] border-neutral-350 cursor-pointer'
    : ''

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
