'use client'

import { Token } from '@/types'

interface ClickableWordProps {
  token: Token
  isSelected: boolean
  isSaved: boolean
  onClick: (token: Token) => void
  disabled?: boolean
}

export function ClickableWord({
  token,
  isSelected,
  isSaved,
  onClick,
  disabled = false,
}: ClickableWordProps) {
  // Don't make whitespace/punctuation clickable
  if (!token.isWord) {
    return <span>{token.text}</span>
  }

  return (
    <span
      id={token.id}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onClick(token)}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(token)
        }
      }}
      className={`
        inline-block transition-all duration-150
        ${disabled ? 'cursor-default' : 'cursor-pointer hover:bg-sepia-100 hover:scale-105'}
        ${
          isSelected
            ? 'bg-gold-200 text-sepia-900 font-semibold shadow-sm'
            : isSaved
            ? 'text-sepia-700 border-b-2 border-dotted border-sepia-400'
            : 'text-sepia-800'
        }
        px-0.5 rounded
      `}
      aria-label={`Word: ${token.cleanText}${isSaved ? ' (saved)' : ''}`}
      aria-pressed={isSelected}
      aria-disabled={disabled}
    >
      {token.text}
    </span>
  )
}
