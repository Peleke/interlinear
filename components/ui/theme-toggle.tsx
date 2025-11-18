'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'
import { Button } from '@/components/ui/button'

interface ThemeToggleProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ThemeToggle({ variant = 'ghost', size = 'icon' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className="relative overflow-hidden transition-all duration-300 hover:scale-105"
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-4 w-4 transition-all duration-300 dark:rotate-90 dark:scale-0" />
          <span className="sr-only">Switch to dark mode</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4 transition-all duration-300 rotate-0 scale-100 dark:rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 transition-all duration-300 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Switch to light mode</span>
        </>
      )}
    </Button>
  )
}