'use client';

import { useState } from 'react';
import type { LatinAnalysisResult } from '@/types/latin';

interface LatinWordPopoverProps {
  word: string;
  onClose: () => void;
}

export function LatinWordPopover({ word, onClose }: LatinWordPopoverProps) {
  const [analysis, setAnalysis] = useState<LatinAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analysis on mount
  useState(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/latin/analyze?word=${encodeURIComponent(word)}`);
        if (!response.ok) throw new Error('Analysis failed');
        const data = await response.json();
        setAnalysis(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  });

  return (
    <div className="absolute z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
        aria-label="Close"
      >
        ✕
      </button>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="text-red-600">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && analysis && (
        <div className="space-y-3">
          {/* Word form */}
          <div>
            <h3 className="text-lg font-bold text-gray-900">{analysis.form}</h3>
            {analysis.lemma && analysis.lemma !== analysis.form && (
              <p className="text-sm text-gray-600">
                Lemma: <span className="font-medium">{analysis.lemma}</span>
              </p>
            )}
          </div>

          {/* Part of speech */}
          {analysis.pos && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Part of Speech</p>
              <p className="text-sm text-gray-900">{analysis.pos}</p>
            </div>
          )}

          {/* Morphology */}
          {analysis.morphology && Object.keys(analysis.morphology).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Morphology</p>
              <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                {Object.entries(analysis.morphology).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <div key={key} className="flex items-baseline space-x-1">
                      <span className="text-gray-600 capitalize">{key}:</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dictionary definition */}
          {analysis.dictionary && (
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs font-semibold uppercase text-gray-500">Definition</p>
              <ul className="mt-1 space-y-1 text-sm text-gray-900">
                {analysis.dictionary.definitions.slice(0, 3).map((def, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-gray-400">•</span>
                    <span>{def}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No data message */}
          {!analysis.lemma && !analysis.pos && !analysis.dictionary && (
            <p className="text-sm text-gray-500">No analysis data available</p>
          )}
        </div>
      )}
    </div>
  );
}
