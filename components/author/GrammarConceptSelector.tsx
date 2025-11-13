"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, X, BookOpen, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ReadingSelector } from "./ReadingSelector";

interface GrammarConcept {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  content: string | null;
}

interface Props {
  lessonId: string;
}

export default function GrammarConceptSelector({ lessonId }: Props) {
  const [linkedConcepts, setLinkedConcepts] = useState<GrammarConcept[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GrammarConcept[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateContent, setGenerateContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedConcepts, setGeneratedConcepts] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [maxConcepts, setMaxConcepts] = useState(5);

  // New concept form
  const [newConcept, setNewConcept] = useState({
    display_name: "",
    description: "",
    content: "",
  });

  useEffect(() => {
    loadLinkedConcepts();
  }, [lessonId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchConcepts();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadLinkedConcepts = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/grammar`);
      const data = await response.json();
      setLinkedConcepts(data.concepts || []);
    } catch (error) {
      console.error("Failed to load grammar concepts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchConcepts = async () => {
    try {
      const response = await fetch(
        `/api/grammar-concepts/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setSearchResults(data.concepts || []);
      setShowResults(true);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const linkConcept = async (conceptId: string) => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/grammar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept_id: conceptId }),
      });

      if (response.ok) {
        await loadLinkedConcepts();
        setSearchQuery("");
        setShowResults(false);
      }
    } catch (error) {
      console.error("Failed to link concept:", error);
    }
  };

  const unlinkConcept = async (conceptId: string) => {
    try {
      await fetch(`/api/lessons/${lessonId}/grammar/${conceptId}`, {
        method: "DELETE",
      });
      await loadLinkedConcepts();
    } catch (error) {
      console.error("Failed to unlink concept:", error);
    }
  };

  const createAndLinkConcept = async () => {
    try {
      // Create concept
      const createResponse = await fetch("/api/grammar-concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConcept),
      });

      if (!createResponse.ok) throw new Error("Failed to create concept");

      const { concept } = await createResponse.json();

      // Link to lesson
      await linkConcept(concept.id);

      // Reset form
      setNewConcept({ display_name: "", description: "", content: "" });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create concept:", error);
    }
  };

  const handleGenerate = async (selection: { readingIds?: string[], manualText?: string }) => {
    setIsGenerating(true);
    try {
      let sourceText = '';

      if (selection.manualText) {
        sourceText = selection.manualText;
      } else if (selection.readingIds && selection.readingIds.length > 0) {
        // Fetch reading content(s)
        const response = await fetch(`/api/lessons/${lessonId}/readings`);
        if (!response.ok) throw new Error('Failed to fetch readings');

        const data = await response.json();
        const selectedReadings = data.readings.filter((r: any) =>
          selection.readingIds!.includes(r.id)
        );

        sourceText = selectedReadings.map((r: any) => r.content).join('\n\n');
      }

      if (!sourceText.trim()) {
        throw new Error('No source text available');
      }

      const response = await fetch('/api/content-generation/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: sourceText,
          maxConcepts,
          language: 'es',
          targetLevel: 'A1',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      const data = await response.json();
      setGeneratedConcepts(data.grammar_concepts || []);
    } catch (error) {
      console.error('Grammar generation failed:', error);
      alert(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveGeneratedConcept = async (concept: any) => {
    try {
      // Generate slug from display name: "Present Perfect Tense" → "present-perfect-tense"
      const nameSlug = concept.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Build markdown content with all fields
      const exampleSection = concept.example_from_text
        ? `\n\n## Example from Text\n${concept.example_from_text}`
        : '';

      const additionalExamples = concept.additional_examples?.length
        ? `\n\n## Additional Examples\n${concept.additional_examples.map((ex: string) => `- ${ex}`).join('\n')}`
        : '';

      const content = `# ${concept.name}\n\n${concept.explanation}${exampleSection}${additionalExamples}`;

      // Create concept with proper field mapping
      const createResponse = await fetch("/api/grammar-concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameSlug,              // Slug for DB primary key
          display_name: concept.name,  // Human-readable name
          description: concept.explanation,
          content,                      // Full markdown with examples
        }),
      });

      if (!createResponse.ok) throw new Error("Failed to create concept");

      const { concept: createdConcept } = await createResponse.json();

      // Link to lesson
      await linkConcept(createdConcept.id);

      // Remove from generated list
      setGeneratedConcepts(prev => prev.filter(c => c !== concept));

      if (generatedConcepts.length === 1) {
        // Last one, close modal
        setShowGenerateModal(false);
        setGenerateContent("");
      }
    } catch (error) {
      console.error("Failed to save generated concept:", error);
      alert(error instanceof Error ? error.message : 'Failed to save concept');
    }
  };

  const saveAllConcepts = async () => {
    setIsSaving(true);
    const results = await Promise.allSettled(
      generatedConcepts.map(concept => saveGeneratedConcept(concept))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    if (failed > 0) {
      alert(`Saved ${succeeded}/${generatedConcepts.length} concepts. ${failed} failed.`);
    } else {
      alert(`Successfully saved all ${succeeded} concepts!`);
    }

    setIsSaving(false);
    setShowGenerateModal(false);
    setGeneratedConcepts([]);
    setGenerateContent("");
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading grammar concepts...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Grammar Concepts</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Link existing concepts or create new ones
        </p>
        <div className="flex gap-2 mb-4">
          <Button onClick={() => setShowGenerateModal(true)} variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            Extract
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            {showCreateForm ? "Cancel" : "Add"}
          </Button>
        </div>
      </div>

      {/* Generate Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Extract Grammar Concepts
            </DialogTitle>
          </DialogHeader>

          {generatedConcepts.length === 0 ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="max-concepts">Max Grammar Concepts (1-10)</Label>
                <Input
                  id="max-concepts"
                  type="number"
                  min={1}
                  max={10}
                  value={maxConcepts}
                  onChange={(e) => setMaxConcepts(parseInt(e.target.value) || 5)}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  AI will identify up to this many concepts
                </p>
              </div>
              <ReadingSelector
                lessonId={lessonId}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                generateButtonText="Extract Grammar Concepts"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Review and save extracted grammar concepts:
                </p>
                <Button
                  onClick={saveAllConcepts}
                  disabled={isSaving || generatedConcepts.length === 0}
                  size="sm"
                >
                  {isSaving ? "Saving..." : `Save All ${generatedConcepts.length} Concepts`}
                </Button>
              </div>
              {generatedConcepts.map((concept, i) => (
                <Card key={i} className="border-blue-200">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{concept.name}</h4>
                        {concept.cefr_level && (
                          <Badge variant="outline">{concept.cefr_level}</Badge>
                        )}
                      </div>
                      <p className="text-sm">{concept.explanation}</p>
                      {concept.example && (
                        <div className="text-sm bg-gray-50 p-2 rounded border">
                          <strong>Example:</strong> {concept.example}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => saveGeneratedConcept(concept)}>
                        Save & Link to Lesson
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setGeneratedConcepts(prev => prev.filter(c => c !== concept))}
                      >
                        Skip
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  setShowGenerateModal(false);
                  setGeneratedConcepts([]);
                  setGenerateContent("");
                }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create form */}
      {showCreateForm && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-base">Create Grammar Concept</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name *</Label>
              <Input
                value={newConcept.display_name}
                onChange={(e) =>
                  setNewConcept({ ...newConcept, display_name: e.target.value })
                }
                placeholder="e.g., SER - Present Tense"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newConcept.description}
                onChange={(e) =>
                  setNewConcept({ ...newConcept, description: e.target.value })
                }
                placeholder="Brief description of this concept"
              />
            </div>
            <div className="space-y-2">
              <Label>Content (Markdown)</Label>
              <Textarea
                value={newConcept.content}
                onChange={(e) =>
                  setNewConcept({ ...newConcept, content: e.target.value })
                }
                placeholder="# SER - Present Tense&#10;&#10;- yo soy&#10;- tú eres..."
                rows={6}
              />
            </div>
            <Button
              onClick={createAndLinkConcept}
              disabled={!newConcept.display_name}
              className="w-full"
            >
              Create & Link to Lesson
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search existing */}
      <Card>
        <CardContent className="p-6">
          <Label className="text-sm font-medium mb-2 block">
            Search Existing Concepts
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              placeholder="Search by name or title..."
              className="pl-10"
            />
          </div>

          {/* Search results */}
          {showResults && searchResults.length > 0 && (
            <div className="mt-2 border rounded-md max-h-64 overflow-y-auto">
              {searchResults.map((concept) => {
                const isLinked = linkedConcepts.some((c) => c.id === concept.id);
                return (
                  <button
                    key={concept.id}
                    onClick={() => !isLinked && linkConcept(concept.id)}
                    disabled={isLinked}
                    className={`w-full px-4 py-3 text-left border-b last:border-b-0 ${
                      isLinked
                        ? "bg-gray-50 cursor-not-allowed"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium">{concept.display_name}</div>
                        <div className="text-sm text-gray-500">{concept.name}</div>
                        {concept.description && (
                          <div className="text-xs text-gray-400 mt-1">
                            {concept.description}
                          </div>
                        )}
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

      {/* Linked concepts */}
      <div>
        <h4 className="text-sm font-medium mb-3">
          Linked Concepts ({linkedConcepts.length})
        </h4>
        {linkedConcepts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No grammar concepts linked yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {linkedConcepts.map((concept) => (
              <Card key={concept.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <CardTitle className="text-base">
                          {concept.display_name}
                        </CardTitle>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {concept.name}
                      </p>
                      {concept.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {concept.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unlinkConcept(concept.id)}
                      title="Unlink from lesson"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
