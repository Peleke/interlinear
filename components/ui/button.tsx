import * as React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

export const buttonVariants = ({
  variant = 'default',
  size = 'default',
}: {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
} = {}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50'

  const variantStyles = {
    default: 'bg-sepia-700 text-white hover:bg-sepia-800',
    outline: 'border border-sepia-300 bg-transparent hover:bg-sepia-100',
    ghost: 'hover:bg-sepia-100'
  }

  const sizeStyles = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3 text-sm',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10'
  }

  return `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`
}

export function Button({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  asChild = false,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      className: classes
    } as any)
  }

  return (
    <button
      className={classes}
      {...props}
    >
      {children}
    </button>
  )
}
