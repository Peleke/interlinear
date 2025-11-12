"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Edit2, Languages, CheckSquare, PenTool, Sparkles, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReadingSelector } from "./ReadingSelector";

interface Exercise {
  id: string;
  exercise_type: 'fill_blank' | 'multiple_choice' | 'translation';
  prompt: string;
  answer: string;
  options?: any;
  spanish_text?: string;
  english_text?: string;
  direction?: string;
  xp_value: number;
  sequence_order: number;
}

interface Props {
  lessonId: string;
}

type ExerciseType = 'fill_blank' | 'multiple_choice' | 'translation';

const exerciseTypes = [
  { id: 'fill_blank' as ExerciseType, label: 'Fill in Blank', icon: PenTool },
  { id: 'multiple_choice' as ExerciseType, label: 'Multiple Choice', icon: CheckSquare },
  { id: 'translation' as ExerciseType, label: 'Translation', icon: Languages },
];

// Language configuration for translation exercises
const LANGUAGE_CONFIG = {
  'es': { name: 'Spanish', flag: '🇪🇸', displayCode: 'ES' },
  'la': { name: 'Latin', flag: '🏛️', displayCode: 'LA' },
  'en': { name: 'English', flag: '🇺🇸', displayCode: 'EN' }
} as const;

type LanguageCode = keyof typeof LANGUAGE_CONFIG;

export default function ExerciseBuilder({ lessonId }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeType, setActiveType] = useState<ExerciseType>('fill_blank');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateContent, setGenerateContent] = useState("");
  const [generateCount, setGenerateCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExercises, setGeneratedExercises] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savingExerciseIndex, setSavingExerciseIndex] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);
  // Language state for lesson (will be determined from lesson data or exercises)
  const [lessonLanguage, setLessonLanguage] = useState<LanguageCode>('es');
  const targetLanguage: LanguageCode = 'en'; // Always English for now

  // Form states for each type
  const [fillBlankForm, setFillBlankForm] = useState({
    prompt: "",
    answer: "",
    blankPosition: 0,
  });

  const [multipleChoiceForm, setMultipleChoiceForm] = useState({
    prompt: "",
    answer: "",
    options: ["", "", "", ""],
  });

  const [translationForm, setTranslationForm] = useState({
    prompt: "",
    sourceText: "", // Changed from spanishText to be language-agnostic
    targetText: "", // Changed from englishText to be language-agnostic
    direction: "es_to_en" as string, // Will be updated dynamically
  });

  useEffect(() => {
    loadExercises();
  }, [lessonId]);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      
      // Fetch exercises
      const response = await fetch(`/api/lessons/${lessonId}/exercises`);
      if (!response.ok) throw new Error('Failed to load exercises');
      const data = await response.json();
      setExercises(data.exercises || []);

      // Detect lesson language from existing exercises or lesson data
      const exercises = data.exercises || [];
      let detectedLanguage: LanguageCode = 'es'; // Default to Spanish

      // Try to detect from URL params first (e.g., if Latin lesson)
      if (typeof window !== 'undefined') {
        const url = window.location.href;
        if (url.includes('latin') || url.includes('la')) {
          detectedLanguage = 'la';
        }
      }

      // Try to detect from exercises with spanish_text that looks like Latin
      if (detectedLanguage === 'es') {
        for (const exercise of exercises) {
          if (exercise.spanish_text && 
              (exercise.spanish_text.includes('eum') || 
               exercise.spanish_text.includes('est') ||
               exercise.spanish_text.includes('sum') ||
               exercise.spanish_text.match(/\b(qui|quae|quod)\b/))) {
            detectedLanguage = 'la';
            break;
          }
        }
      }

      setLessonLanguage(detectedLanguage);
      
      // Update translation form direction based on detected language
      setTranslationForm(prev => ({
        ...prev,
        direction: `${detectedLanguage}_to_en`
      }));

    } catch (error) {
      console.error("Failed to load exercises:", error);
    } finally {
      setIsLoading(false);
    }
  };;

  const createExercise = async () => {
    try {
      let endpoint = '';
      let body: any = { lessonId };

      switch (activeType) {
        case 'fill_blank':
          endpoint = '/api/exercises/fill-blank';
          body = {
            ...body,
            prompt: fillBlankForm.prompt,
            answer: fillBlankForm.answer,
            blankPosition: fillBlankForm.blankPosition,
          };
          break;
        case 'multiple_choice':
          endpoint = '/api/exercises/multiple-choice';
          body = {
            ...body,
            prompt: multipleChoiceForm.prompt,
            answer: multipleChoiceForm.answer,
            options: multipleChoiceForm.options.filter(o => o.trim()),
          };
          break;
        case 'translation':
          endpoint = '/api/exercises/translation';
          body = {
            ...body,
            prompt: translationForm.prompt,
            spanishText: translationForm.sourceText, // Map sourceText to spanishText for API compatibility
            englishText: translationForm.targetText, // Map targetText to englishText for API compatibility
            direction: translationForm.direction,
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create exercise');
      }

      await loadExercises();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("Failed to create exercise:", error);
      alert(error instanceof Error ? error.message : 'Failed to create exercise');
    }
  };

  const openDeleteModal = (exerciseId: string) => {
    setExerciseToDelete(exerciseId);
    setShowDeleteModal(true);
  };

  const confirmDeleteExercise = async () => {
    if (!exerciseToDelete) return;

    try {
      const response = await fetch(`/api/exercises/${exerciseToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadExercises();
        setShowDeleteModal(false);
        setExerciseToDelete(null);
      }
    } catch (error) {
      console.error("Failed to delete exercise:", error);
    }
  };

  const cancelDeleteExercise = () => {
    setShowDeleteModal(false);
    setExerciseToDelete(null);
  };

  const resetForm = () => {
    setFillBlankForm({ prompt: "", answer: "", blankPosition: 0 });
    setMultipleChoiceForm({ prompt: "", answer: "", options: ["", "", "", ""] });
    setTranslationForm({
      prompt: "",
      sourceText: "",
      targetText: "",
      direction: `${lessonLanguage}_to_en`
    });
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

      const response = await fetch('/api/content-generation/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: sourceText,
          type: activeType,
          count: generateCount,
          language: lessonLanguage, // Use detected lesson language
          targetLevel: 'A1',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      const data = await response.json();
      setGeneratedExercises(data.exercises || []);
    } catch (error) {
      console.error('Exercise generation failed:', error);
      alert(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveGeneratedExercise = async (exercise: any, index: number) => {
    setSavingExerciseIndex(index);
    try {
      let endpoint = '';
      let body: any = { lessonId };

      // Map LLM output field: correct_answer → answer
      const answer = exercise.correct_answer || exercise.answer;

      switch (activeType) {
        case 'fill_blank':
          endpoint = '/api/exercises/fill-blank';
          body = {
            ...body,
            prompt: exercise.prompt,
            answer,
            blankPosition: 0,
          };
          break;
        case 'multiple_choice':
          endpoint = '/api/exercises/multiple-choice';
          body = {
            ...body,
            prompt: exercise.prompt,
            answer: exercise.options?.[0] || answer,
            options: exercise.options || [],
          };
          break;
        case 'translation':
          endpoint = '/api/exercises/translation';
          body = {
            ...body,
            prompt: exercise.prompt || 'Translate:',
            spanishText: exercise.spanish_text || exercise.prompt,
            englishText: exercise.english_text || answer,
            direction: `${lessonLanguage}_to_en`, // Use detected language
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to save exercise');
      }

      await loadExercises();
      // Remove from generated list
      setGeneratedExercises(prev => prev.filter(e => e !== exercise));

      if (generatedExercises.length === 1) {
        // Last one, close modal
        setShowGenerateModal(false);
        setGenerateContent("");
      }
    } catch (error) {
      console.error("Failed to save generated exercise:", error);
      alert(error instanceof Error ? error.message : 'Failed to save exercise');
    } finally {
      setSavingExerciseIndex(null);
    }
  };

  const filteredExercises = exercises.filter(e => e.exercise_type === activeType);

  const renderForm = () => {
    switch (activeType) {
      case 'fill_blank':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Create Fill-in-Blank Exercise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fill-prompt">Prompt</Label>
                <Input
                  id="fill-prompt"
                  placeholder="E.g., Complete the sentence: Yo ____ de España"
                  value={fillBlankForm.prompt}
                  onChange={(e) => setFillBlankForm({ ...fillBlankForm, prompt: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="fill-answer">Correct Answer</Label>
                <Input
                  id="fill-answer"
                  placeholder="E.g., soy"
                  value={fillBlankForm.answer}
                  onChange={(e) => setFillBlankForm({ ...fillBlankForm, answer: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createExercise} disabled={!fillBlankForm.prompt || !fillBlankForm.answer}>
                  Create Exercise
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'multiple_choice':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Create Multiple Choice Exercise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mc-prompt">Question</Label>
                <Input
                  id="mc-prompt"
                  placeholder="E.g., What does 'hola' mean?"
                  value={multipleChoiceForm.prompt}
                  onChange={(e) => setMultipleChoiceForm({ ...multipleChoiceForm, prompt: e.target.value })}
                />
              </div>
              <div>
                <Label>Answer Choices (first 2 required)</Label>
                {multipleChoiceForm.options.map((option, i) => (
                  <Input
                    key={i}
                    className="mt-2"
                    placeholder={`Option ${i + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...multipleChoiceForm.options];
                      newOptions[i] = e.target.value;
                      setMultipleChoiceForm({ ...multipleChoiceForm, options: newOptions });
                    }}
                  />
                ))}
              </div>
              <div>
                <Label htmlFor="mc-answer">Correct Answer</Label>
                <select
                  id="mc-answer"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={multipleChoiceForm.answer}
                  onChange={(e) => setMultipleChoiceForm({ ...multipleChoiceForm, answer: e.target.value })}
                >
                  <option value="">Select correct answer</option>
                  {multipleChoiceForm.options.filter(o => o.trim()).map((option, i) => (
                    <option key={i} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={createExercise}
                  disabled={
                    !multipleChoiceForm.prompt ||
                    !multipleChoiceForm.answer ||
                    multipleChoiceForm.options.filter(o => o.trim()).length < 2
                  }
                >
                  Create Exercise
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'translation':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Create Translation Exercise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="trans-prompt">Prompt</Label>
                <Input
                  id="trans-prompt"
                  placeholder="E.g., Translate to English"
                  value={translationForm.prompt}
                  onChange={(e) => setTranslationForm({ ...translationForm, prompt: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="trans-source" className="flex items-center gap-2">
                  {LANGUAGE_CONFIG[lessonLanguage].flag} {LANGUAGE_CONFIG[lessonLanguage].displayCode} Text
                </Label>
                <Textarea
                  id="trans-source"
                  placeholder={`Text in ${LANGUAGE_CONFIG[lessonLanguage].name}`}
                  value={translationForm.sourceText}
                  onChange={(e) => setTranslationForm({ ...translationForm, sourceText: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="trans-target" className="flex items-center gap-2">
                  {LANGUAGE_CONFIG[targetLanguage].flag} {LANGUAGE_CONFIG[targetLanguage].displayCode} Text
                </Label>
                <Textarea
                  id="trans-target"
                  placeholder={`Translation in ${LANGUAGE_CONFIG[targetLanguage].name}`}
                  value={translationForm.targetText}
                  onChange={(e) => setTranslationForm({ ...translationForm, targetText: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="trans-direction">Translation Direction</Label>
                <select
                  id="trans-direction"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={translationForm.direction}
                  onChange={(e) => setTranslationForm({ ...translationForm, direction: e.target.value as any })}
                >
                  <option value={`${lessonLanguage}_to_en`}>
                    {LANGUAGE_CONFIG[lessonLanguage].name} → {LANGUAGE_CONFIG[targetLanguage].name}
                  </option>
                  <option value={`en_to_${lessonLanguage}`}>
                    {LANGUAGE_CONFIG[targetLanguage].name} → {LANGUAGE_CONFIG[lessonLanguage].name}
                  </option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={createExercise}
                  disabled={
                    !translationForm.prompt ||
                    !translationForm.sourceText ||
                    !translationForm.targetText
                  }
                >
                  Create Exercise
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  const renderExerciseCard = (exercise: Exercise) => {
    return (
      <Card key={exercise.id} className="relative">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <p className="font-medium text-sm mb-1">{exercise.prompt}</p>
              {exercise.exercise_type === 'translation' && (
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    {exercise.direction?.includes('la_to_en') ? '🏛️ → 🇺🇸' :
                     exercise.direction?.includes('en_to_la') ? '🇺🇸 → 🏛️' :
                     exercise.direction === 'es_to_en' ? '🇪🇸 → 🇺🇸' : '🇺🇸 → 🇪🇸'}
                  </p>
                  <p><strong>{exercise.direction?.includes('la') ? 'LA' : 'ES'}:</strong> {exercise.spanish_text}</p>
                  <p><strong>EN:</strong> {exercise.english_text}</p>
                </div>
              )}
              {exercise.exercise_type === 'multiple_choice' && (
                <div className="text-sm space-y-1 mt-2">
                  {(exercise.options as any)?.choices?.map((opt: string, i: number) => (
                    <div key={i} className={cn(
                      "pl-2 border-l-2",
                      opt === exercise.answer ? "border-green-500 font-medium" : "border-gray-300"
                    )}>
                      {opt} {opt === exercise.answer && '✓'}
                    </div>
                  ))}
                </div>
              )}
              {exercise.exercise_type === 'fill_blank' && (
                <p className="text-sm mt-1">
                  <strong>Answer:</strong> {exercise.answer}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDeleteModal(exercise.id)}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{exercise.xp_value} XP</Badge>
            <Badge variant="secondary">#{exercise.sequence_order + 1}</Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <div className="p-6">Loading exercises...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Exercises</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowGenerateModal(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate with AI
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Exercise
          </Button>
        </div>
      </div>

      {/* Generate Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate {exerciseTypes.find(t => t.id === activeType)?.label} Exercises
            </DialogTitle>
          </DialogHeader>

          {generatedExercises.length === 0 ? (
            <div className="space-y-4">
              <ReadingSelector
                lessonId={lessonId}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                generateButtonText={`Generate ${generateCount} Exercises`}
              />

              <div className="pt-2">
                <Label htmlFor="generate-count">Number of Exercises</Label>
                <Input
                  id="generate-count"
                  type="number"
                  min={1}
                  max={10}
                  value={generateCount}
                  onChange={(e) => setGenerateCount(parseInt(e.target.value) || 3)}
                  className="mt-2"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Review and save generated exercises:
              </p>
              {generatedExercises.map((exercise, i) => (
                <Card key={i} className="border-blue-200">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <p className="font-medium">{exercise.prompt}</p>
                      {exercise.options && (
                        <div className="text-sm space-y-1">
                          {exercise.options.map((opt: string, j: number) => (
                            <div key={j} className={j === 0 ? "text-green-600 font-medium" : ""}>
                              {j + 1}. {opt} {j === 0 && "✓"}
                            </div>
                          ))}
                        </div>
                      )}
                      {exercise.answer && !exercise.options && (
                        <p className="text-sm"><strong>Answer:</strong> {exercise.answer}</p>
                      )}
                      {exercise.explanation && (
                        <p className="text-sm text-muted-foreground italic">{exercise.explanation}</p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => saveGeneratedExercise(exercise, i)}
                        disabled={savingExerciseIndex === i}
                      >
                        {savingExerciseIndex === i ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save to Lesson'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setGeneratedExercises(prev => prev.filter(e => e !== exercise))}
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
                  setGeneratedExercises([]);
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

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-destructive" />
              Delete Exercise
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this exercise? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={cancelDeleteExercise}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteExercise}>
                Delete Exercise
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exercise Type Tabs */}
      <div className="flex gap-2 border-b">
        {exerciseTypes.map((type) => {
          const Icon = type.icon;
          const count = exercises.filter(e => e.exercise_type === type.id).length;
          return (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border-b-2 transition-colors",
                activeType === type.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {type.label}
              <Badge variant="secondary" className="ml-1">{count}</Badge>
            </button>
          );
        })}
      </div>

      {/* Create Form */}
      {showForm && <div className="mt-4">{renderForm()}</div>}

      {/* Exercise List */}
      <div className="space-y-3 mt-6">
        {filteredExercises.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No {exerciseTypes.find(t => t.id === activeType)?.label.toLowerCase()} exercises yet.</p>
              <p className="text-sm mt-1">Click "Add Exercise" to create one.</p>
            </CardContent>
          </Card>
        ) : (
          filteredExercises
            .sort((a, b) => a.sequence_order - b.sequence_order)
            .map(renderExerciseCard)
        )}
      </div>

      <div className="text-sm text-muted-foreground text-center pt-4 border-t">
        Total: {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
        {' • '}
        {exercises.reduce((sum, e) => sum + e.xp_value, 0)} XP
      </div>
    </div>
  );
}
