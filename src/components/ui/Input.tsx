import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5 align-left">
        {label && (
          <label className="text-xs font-semibold text-brand-text/80 text-left">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-neutral-450 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={`w-full px-4 py-3 text-sm bg-neutral-50 border rounded-xl transition-all duration-200 outline-none
              ${icon ? 'pl-11' : ''}
              ${error 
                ? 'border-brand-danger focus:ring-1 focus:ring-brand-danger bg-red-40/10' 
                : 'border-brand-border focus:bg-white focus:border-brand-primary/60 focus:ring-1 focus:ring-brand-primary/20'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <span className="text-[11px] text-brand-danger font-medium text-left mt-0.5">
            {error}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
