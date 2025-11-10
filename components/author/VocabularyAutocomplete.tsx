"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";

interface VocabularyItem {
  id: string;
  spanish: string;
  english: string;
  part_of_speech: string | null;
  difficulty_level: string | null;
  usage_count: number;
  used_in_lessons: string[];
}

interface VocabularyAutocompleteProps {
  onSelect: (item: VocabularyItem) => void;
  language?: "es" | "is" | "both";
  placeholder?: string;
}

export default function VocabularyAutocomplete({
  onSelect,
  language = "both",
  placeholder = "Search existing vocabulary...",
}: VocabularyAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search (300ms)
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: "10",
      });

      if (language !== "both") {
        params.append("language", language);
      }

      const response = await fetch(`/api/vocabulary/search?${params}`);

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(data.items || []);
      setShowResults(true);
    } catch (error) {
      console.error("Vocabulary search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [language]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (item: VocabularyItem) => {
    onSelect(item);
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>

      {/* Results dropdown */}
      {showResults && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-96 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          )}

          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">
              No vocabulary found. Add a new word instead.
            </div>
          )}

          {!loading &&
            results.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {item.spanish}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-700">{item.english}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {item.part_of_speech && (
                        <Badge variant="outline" className="text-xs">
                          {item.part_of_speech}
                        </Badge>
                      )}
                      {item.difficulty_level && (
                        <Badge variant="secondary" className="text-xs">
                          {item.difficulty_level}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Usage indicator */}
                  {item.usage_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 whitespace-nowrap">
                      <span>⭐</span>
                      <span>
                        Used in {item.usage_count} lesson
                        {item.usage_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Show lesson titles on hover */}
                {item.used_in_lessons.length > 0 && (
                  <div className="mt-1 text-xs text-gray-400 truncate">
                    Also in: {item.used_in_lessons.slice(0, 3).join(", ")}
                    {item.used_in_lessons.length > 3 &&
                      ` +${item.used_in_lessons.length - 3} more`}
                  </div>
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
