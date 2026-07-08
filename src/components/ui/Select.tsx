import React from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options = [], ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5 align-left">
        {label && (
          <label className="text-xs font-semibold text-brand-text/80 text-left">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-4 py-3 text-sm bg-neutral-50 border rounded-xl transition-all duration-200 outline-none cursor-pointer appearance-none
            ${error
              ? 'border-brand-danger focus:ring-1 focus:ring-brand-danger bg-red-40/10'
              : 'border-brand-border focus:bg-white focus:border-brand-primary/60 focus:ring-1 focus:ring-brand-primary/20'
            }
            ${className}
          `}
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%236b7280' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`,
            backgroundPosition: 'right 12px center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '18px',
            paddingRight: '40px'
          }}
          {...props}
        >
          {options.map((opt, index) => (
            /* Perbaikan di sini: Menggabungkan value dengan index agar key dijamin unik oleh React */
            <option key={`${opt.value}-${index}`} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span className="text-[11px] text-brand-danger font-medium text-left mt-0.5">
            {error}
          </span>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'