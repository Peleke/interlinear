"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, X, BookOpen, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { GenerateLessonModal } from "./GenerateLessonModal";

interface LibraryReading {
  id: string;
  title: string;
  author: string | null;
  content?: string | null;
  reading_overview?: string | null;
  difficulty_level: string | null;
  word_count: number | null;
  language: string;
  is_required?: boolean;
  display_order?: number;
}

interface Props {
  lessonId: string;
  language: "es" | "is";
}

export default function ReadingLinker({ lessonId, language }: Props) {
  const [linkedReadings, setLinkedReadings] = useState<LibraryReading[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LibraryReading[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingReadingId, setEditingReadingId] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReadingForGeneration, setSelectedReadingForGeneration] = useState<LibraryReading | null>(null);

  // New reading form
  const [newReading, setNewReading] = useState({
    title: "",
    author: "",
    content: "",
    reading_overview: "",
    difficulty_level: "",
    language: "es",
  });

  const loadLinkedReadings = useCallback(async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/readings`);
      const data = await response.json();
      setLinkedReadings(data.readings || []);
    } catch (error) {
      console.error("Failed to load readings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  const searchReadings = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/library-readings/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setSearchResults(data.readings || []);
      setShowResults(true);
    } catch (error) {
      console.error("Search failed:", error);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadLinkedReadings();
  }, [loadLinkedReadings]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchReadings();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchReadings]);

  const linkReading = async (readingId: string) => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/readings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reading_id: readingId, is_required: true }),
      });

      if (response.ok) {
        await loadLinkedReadings();
        setSearchQuery("");
        setShowResults(false);
      }
    } catch (error) {
      console.error("Failed to link reading:", error);
    }
  };

  const unlinkReading = async (readingId: string) => {
    try {
      await fetch(`/api/lessons/${lessonId}/readings/${readingId}`, {
        method: "DELETE",
      });
      await loadLinkedReadings();
    } catch (error) {
      console.error("Failed to unlink reading:", error);
    }
  };

  const toggleRequired = async (readingId: string, currentRequired: boolean) => {
    try {
      await fetch(`/api/lessons/${lessonId}/readings/${readingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_required: !currentRequired }),
      });
      await loadLinkedReadings();
    } catch (error) {
      console.error("Failed to toggle required:", error);
    }
  };

  const loadReadingForEdit = (reading: LibraryReading) => {
    setNewReading({
      title: reading.title,
      author: reading.author || "",
      content: reading.content || "",
      reading_overview: reading.reading_overview || "",
      difficulty_level: reading.difficulty_level || "",
      language: reading.language,
    });
    setEditingReadingId(reading.id);
    setShowCreateForm(true);
  };

  const updateReading = async () => {
    if (!editingReadingId) return;

    try {
      const response = await fetch(`/api/library-readings/${editingReadingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReading),
      });

      if (!response.ok) throw new Error("Failed to update reading");

      // Reload linked readings to show updates
      await loadLinkedReadings();

      // Reset form
      setNewReading({ title: "", author: "", content: "", reading_overview: "", difficulty_level: "", language: "es" });
      setEditingReadingId(null);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to update reading:", error);
    }
  };

  const createAndLinkReading = async () => {
    try {
      // Create reading
      const createResponse = await fetch("/api/library-readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReading),
      });

      if (!createResponse.ok) throw new Error("Failed to create reading");

      const { reading } = await createResponse.json();

      // Link to lesson
      await linkReading(reading.id);

      // Reset form
      setNewReading({ title: "", author: "", content: "", reading_overview: "", difficulty_level: "", language: "es" });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create reading:", error);
    }
  };

  const handleSubmit = () => {
    if (editingReadingId) {
      updateReading();
    } else {
      createAndLinkReading();
    }
  };

  const handleCancelEdit = () => {
    setNewReading({ title: "", author: "", content: "", reading_overview: "", difficulty_level: "", language: "es" });
    setEditingReadingId(null);
    setShowCreateForm(false);
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading readings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Library Readings</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Link existing readings or create new ones
        </p>
        <Button
          onClick={() => {
            if (showCreateForm || editingReadingId) {
              handleCancelEdit();
            } else {
              setShowCreateForm(true);
            }
          }}
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          {showCreateForm || editingReadingId ? "Cancel" : "Add"}
        </Button>
      </div>

      {/* Create/Edit form */}
      {showCreateForm && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-base">
              {editingReadingId ? "Edit Library Reading" : "Create Library Reading"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={newReading.title}
                  onChange={(e) =>
                    setNewReading({ ...newReading, title: e.target.value })
                  }
                  placeholder="Reading title"
                />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input
                  value={newReading.author}
                  onChange={(e) =>
                    setNewReading({ ...newReading, author: e.target.value })
                  }
                  placeholder="Author name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                <Input
                  value={newReading.difficulty_level}
                  onChange={(e) =>
                    setNewReading({ ...newReading, difficulty_level: e.target.value })
                  }
                  placeholder="e.g., A1, B2"
                />
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <select
                  value={newReading.language}
                  onChange={(e) =>
                    setNewReading({ ...newReading, language: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="es">Spanish (es)</option>
                  <option value="la">Latin (la)</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reading Overview</Label>
              <Textarea
                value={newReading.reading_overview}
                onChange={(e) =>
                  setNewReading({ ...newReading, reading_overview: e.target.value })
                }
                placeholder="Optional markdown description that will replace the generic text in lesson views..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={newReading.content}
                onChange={(e) =>
                  setNewReading({ ...newReading, content: e.target.value })
                }
                placeholder="Full text content..."
                rows={8}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!newReading.title || !newReading.content}
              className="w-full"
            >
              {editingReadingId ? "Update Reading" : "Create & Link to Lesson"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search existing */}
      <Card>
        <CardContent className="p-6">
          <Label className="text-sm font-medium mb-2 block">
            Search Existing Readings
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              placeholder="Search by title, author, or difficulty..."
              className="pl-10"
            />
          </div>

          {/* Search results */}
          {showResults && searchResults.length > 0 && (
            <div className="mt-2 border rounded-md max-h-64 overflow-y-auto">
              {searchResults.map((reading) => {
                const isLinked = linkedReadings.some((r) => r.id === reading.id);
                return (
                  <button
                    key={reading.id}
                    onClick={() => !isLinked && linkReading(reading.id)}
                    disabled={isLinked}
                    className={`w-full px-4 py-3 text-left border-b last:border-b-0 ${
                      isLinked
                        ? "bg-gray-50 cursor-not-allowed"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium">{reading.title}</div>
                        {reading.author && (
                          <div className="text-sm text-gray-500">{reading.author}</div>
                        )}
                        <div className="flex gap-2 mt-1 text-xs text-gray-400">
                          {reading.difficulty_level && (
                            <span className="uppercase">{reading.difficulty_level}</span>
                          )}
                          {reading.word_count && <span>{reading.word_count} words</span>}
                          <span className="uppercase">{reading.language}</span>
                        </div>
                      </div>
                      {isLinked && (
                        <Badge variant="secondary" className="text-xs">
                          Linked
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked readings */}
      <div>
        <h4 className="text-sm font-medium mb-3">
          Linked Readings ({linkedReadings.length})
        </h4>
        {linkedReadings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No readings linked yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {linkedReadings.map((reading) => (
              <Card
                key={reading.id}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => loadReadingForEdit(reading)}
              >
                <CardHeader className="pb-3">
                  {/* Desktop/tablet layout - single row */}
                  <div className="hidden md:flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <CardTitle className="text-base">{reading.title}</CardTitle>
                      </div>
                      {reading.author && (
                        <p className="text-xs text-muted-foreground mt-1">
                          by {reading.author}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2 text-xs text-gray-500">
                        {reading.difficulty_level && (
                          <Badge variant="outline" className="text-xs">
                            {reading.difficulty_level}
                          </Badge>
                        )}
                        {reading.word_count && (
                          <span>{reading.word_count} words</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReadingForGeneration(reading);
                          setShowGenerateModal(true);
                        }}
                        title="Generate lesson content from this reading"
                      >
                        <Sparkles className="h-4 w-4 mr-1 text-yellow-500" />
                        Generate Lesson
                      </Button>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs cursor-pointer">
                          {reading.is_required ? "Required" : "Optional"}
                        </Label>
                        <Switch
                          checked={reading.is_required}
                          onCheckedChange={() =>
                            toggleRequired(reading.id, reading.is_required!)
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unlinkReading(reading.id)}
                        title="Unlink from lesson"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile layout - two rows */}
                  <div className="md:hidden space-y-3">
                    {/* Row 1: Title and info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <CardTitle className="text-base">{reading.title}</CardTitle>
                      </div>
                      {reading.author && (
                        <p className="text-xs text-muted-foreground mt-1">
                          by {reading.author}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2 text-xs text-gray-500">
                        {reading.difficulty_level && (
                          <Badge variant="outline" className="text-xs">
                            {reading.difficulty_level}
                          </Badge>
                        )}
                        {reading.word_count && (
                          <span>{reading.word_count} words</span>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Controls */}
                    <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReadingForGeneration(reading);
                          setShowGenerateModal(true);
                        }}
                        title="Generate lesson content from this reading"
                      >
                        <Sparkles className="h-4 w-4 mr-1 text-yellow-500" />
                        Generate
                      </Button>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs cursor-pointer">
                            {reading.is_required ? "Required" : "Optional"}
                          </Label>
                          <Switch
                            checked={reading.is_required}
                            onCheckedChange={() =>
                              toggleRequired(reading.id, reading.is_required!)
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unlinkReading(reading.id)}
                          title="Unlink from lesson"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Generate Lesson Modal */}
      {selectedReadingForGeneration && (
        <GenerateLessonModal
          open={showGenerateModal}
          onOpenChange={setShowGenerateModal}
          readingId={selectedReadingForGeneration.id}
          readingTitle={selectedReadingForGeneration.title}
          readingLevel={selectedReadingForGeneration.difficulty_level || undefined}
          lessonId={lessonId}
          language={language}
        />
      )}
    </div>
  );
}
