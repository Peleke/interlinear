"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Reading {
  id: string;
  title: string;
  content: string;
  difficulty_level?: string;
}

interface ReadingSelectorProps {
  lessonId: string;
  onGenerate: (selection: { readingIds?: string[], manualText?: string }) => void;
  isGenerating: boolean;
  generateButtonText?: string;
}

export function ReadingSelector({
  lessonId,
  onGenerate,
  isGenerating,
  generateButtonText = "Generate",
}: ReadingSelectorProps) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [selectedReadingIds, setSelectedReadingIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [manualText, setManualText] = useState("");
  const [isLoadingReadings, setIsLoadingReadings] = useState(true);

  useEffect(() => {
    loadReadings();
  }, [lessonId]);

  const loadReadings = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/readings`);
      if (response.ok) {
        const data = await response.json();
        setReadings(data.readings || []);

        // Auto-select first reading if available
        if (data.readings && data.readings.length > 0) {
          setSelectedReadingIds([data.readings[0].id]);
        }
      }
    } catch (error) {
      console.error("Failed to load readings:", error);
    } finally {
      setIsLoadingReadings(false);
    }
  };

  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedReadingIds(readings.map(r => r.id));
    } else if (readings.length > 0) {
      setSelectedReadingIds([readings[0].id]);
    }
  };

  const handleReadingChange = (readingId: string) => {
    setSelectedReadingIds([readingId]);
    setSelectAll(false);
  };

  const handleGenerate = () => {
    if (manualText.trim()) {
      onGenerate({ manualText: manualText.trim() });
    } else if (selectedReadingIds.length > 0) {
      onGenerate({ readingIds: selectedReadingIds });
    }
  };

  const canGenerate = manualText.trim() || selectedReadingIds.length > 0;

  if (isLoadingReadings) {
    return <div className="text-sm text-muted-foreground">Loading readings...</div>;
  }

  if (readings.length === 0) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
          No readings linked to this lesson. You can paste custom text below.
        </div>
        <div>
          <Label htmlFor="manual-text">Custom Text</Label>
          <Textarea
            id="manual-text"
            placeholder="Paste reading text, sentences, or vocabulary list here..."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            rows={8}
            className="mt-2"
          />
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !canGenerate}
          className="w-full"
        >
          {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isGenerating ? "Generating..." : generateButtonText}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reading Selection Section */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="reading-select">Select Reading Source</Label>
          <Select
            value={selectAll ? "all" : selectedReadingIds[0] || ""}
            onValueChange={(value) => {
              if (value === "all") {
                handleSelectAllChange(true);
              } else {
                handleReadingChange(value);
              }
            }}
          >
            <SelectTrigger id="reading-select" className="mt-2">
              <SelectValue placeholder="Choose a reading..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📚 All Readings</SelectItem>
              {readings.map((reading) => (
                <SelectItem key={reading.id} value={reading.id}>
                  📖 {reading.title}
                  {reading.difficulty_level && ` (${reading.difficulty_level})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {readings.length > 1 && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all-readings"
              checked={selectAll}
              onCheckedChange={handleSelectAllChange}
            />
            <label
              htmlFor="select-all-readings"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Use all {readings.length} readings
            </label>
          </div>
        )}

        {selectAll && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
            ℹ️ All reading texts will be combined and sent to the AI for generation
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      {/* Manual Text Input Section */}
      <div>
        <Label htmlFor="manual-text">Paste Custom Text (Optional)</Label>
        <Textarea
          id="manual-text"
          placeholder="Or paste custom text here to override reading selection..."
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          rows={6}
          className="mt-2"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Custom text will override the selected reading(s) above
        </p>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !canGenerate}
        className="w-full"
      >
        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isGenerating ? "Generating..." : generateButtonText}
      </Button>
    </div>
  );
}
