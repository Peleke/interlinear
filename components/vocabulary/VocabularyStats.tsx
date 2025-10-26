'use client'

import type { VocabularyStats } from '@/types'

interface VocabularyStatsDisplayProps {
  stats: VocabularyStats
}

export function VocabularyStatsDisplay({ stats }: VocabularyStatsDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-sepia-200 p-6 mb-6">
      <h2 className="text-2xl font-serif text-sepia-900 mb-4">Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Words */}
        <div>
          <div className="text-3xl font-serif text-sepia-900">{stats.totalWords}</div>
          <div className="text-sm text-sepia-600">Total Words</div>
        </div>

        {/* Recent Words */}
        <div>
          <div className="text-3xl font-serif text-sepia-900">{stats.recentWords}</div>
          <div className="text-sm text-sepia-600">Last 7 Days</div>
        </div>

        {/* Top Words Preview */}
        <div>
          <div className="text-sm font-medium text-sepia-700 mb-2">Most Clicked</div>
          {stats.topWords.length > 0 ? (
            <div className="space-y-1">
              {stats.topWords.slice(0, 3).map((item) => (
                <div key={item.word} className="flex justify-between text-sm">
                  <span className="text-sepia-800 font-serif">{item.word}</span>
                  <span className="text-sepia-600">{item.count}×</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-sepia-500">No data yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
