'use client';

import { useState, useRef, useEffect } from 'react';
import { LatinWordPopover } from './LatinWordPopover';

interface LatinTextReaderProps {
  text: string;
  title?: string;
  author?: string;
  className?: string;
}

export function LatinTextReader({ text, title, author, className = '' }: LatinTextReaderProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse text into words and punctuation
  const tokens = text.match(/[\p{L}]+|[^\p{L}\s]+/gu) || [];

  const handleWordClick = (word: string, event: React.MouseEvent<HTMLSpanElement>) => {
    // Only trigger for actual Latin words (letters only)
    if (!/^[\p{L}]+$/u.test(word)) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      setPopoverPosition({
        top: rect.bottom - containerRect.top,
        left: rect.left - containerRect.left,
      });
    }

    setSelectedWord(word);
  };

  const handleClosePopover = () => {
    setSelectedWord(null);
  };

  // Close popover on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClosePopover();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Header */}
      {(title || author) && (
        <div className="mb-6 border-b border-gray-200 pb-4">
          {title && <h2 className="text-2xl font-bold text-gray-900">{title}</h2>}
          {author && <p className="text-sm text-gray-600">{author}</p>}
        </div>
      )}

      {/* Text content with clickable words */}
      <div className="relative leading-relaxed text-gray-900">
        <p className="text-lg">
          {tokens.map((token, idx) => {
            // Check if it's a word (contains letters)
            const isWord = /^[\p{L}]+$/u.test(token);

            if (isWord) {
              return (
                <span
                  key={idx}
                  onClick={(e) => handleWordClick(token, e)}
                  className="cursor-pointer transition-colors hover:bg-blue-100 hover:text-blue-700"
                >
                  {token}
                </span>
              );
            } else {
              // Punctuation or space
              return (
                <span key={idx} className="select-none">
                  {token}
                </span>
              );
            }
          })}
        </p>

        {/* Popover */}
        {selectedWord && (
          <div
            style={{
              position: 'absolute',
              top: `${popoverPosition.top}px`,
              left: `${popoverPosition.left}px`,
            }}
          >
            <LatinWordPopover word={selectedWord} onClose={handleClosePopover} />
          </div>
        )}
      </div>

      {/* Click outside to close popover */}
      {selectedWord && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleClosePopover}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
