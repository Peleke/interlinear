'use client'

import { Token } from '@/types'

interface ClickableWordProps {
  token: Token
  isSelected: boolean
  isSaved: boolean
  onClick: (token: Token) => void
}

export function ClickableWord({
  token,
  isSelected,
  isSaved,
  onClick,
}: ClickableWordProps) {
  // Don't make whitespace/punctuation clickable
  if (!token.isWord) {
    return <span>{token.text}</span>
  }

  return (
    <span
      id={token.id}
      role="button"
      tabIndex={0}
      onClick={() => onClick(token)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(token)
        }
      }}
      className={`
        inline-block cursor-pointer transition-all duration-150
        hover:bg-sepia-100 hover:scale-105
        ${
          isSelected
            ? 'bg-gold text-sepia-900 font-semibold shadow-sm'
            : isSaved
            ? 'text-sepia-700 border-b-2 border-dotted border-sepia-400'
            : 'text-sepia-800'
        }
        px-0.5 rounded
      `}
      aria-label={`Word: ${token.cleanText}${isSaved ? ' (saved)' : ''}`}
      aria-pressed={isSelected}
    >
      {token.text}
    </span>
  )
}
