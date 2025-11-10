"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, X, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  if (isLoading) {
    return <div className="p-4 text-center">Loading grammar concepts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Grammar Concepts</h3>
          <p className="text-sm text-muted-foreground">
            Link existing concepts or create new ones
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          {showCreateForm ? "Cancel" : "Create New"}
        </Button>
      </div>

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
        <CardContent className="p-4">
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
