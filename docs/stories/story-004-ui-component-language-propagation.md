# STORY 004: UI Component Language Propagation

**Story ID**: STORY-004
**Points**: 2
**Priority**: High
**Epic**: EPIC-LANG-001
**Security Impact**: Low - UI changes, proper input validation maintained
**Performance Impact**: Negligible - UI state changes only

## User Story

**As a** content author
**I want** the authoring interface to respect my lesson's language
**So that** vocabulary and grammar extraction work for Latin lessons

## Technical Implementation

### File-by-File Specification

#### 1. Enhanced Vocabulary Manager (`components/author/VocabularyManager.tsx`)

**MODIFY EXISTING FILE - Major refactoring for language awareness**

```typescript
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Edit, Globe } from 'lucide-react';
import { extractVocabularyForLanguage } from '@/lib/content-generation/tools/extract-vocabulary';
import { Language, VocabCandidate, VocabOptions } from '@/lib/content-generation/interfaces/language-processor';
import { toast } from 'sonner';

interface VocabularyManagerProps {
  lessonId: string;
  lessonLanguage: Language; // NEW: Required language prop
  initialVocabulary?: VocabCandidate[];
  onVocabularyChange: (vocabulary: VocabCandidate[]) => void;
  readOnly?: boolean;
}

interface VocabularyState {
  vocabulary: VocabCandidate[];
  loading: boolean;
  extracting: boolean;
  selectedItems: Set<string>;
}

export function VocabularyManager({
  lessonId,
  lessonLanguage, // NEW: Use lesson's language
  initialVocabulary = [],
  onVocabularyChange,
  readOnly = false
}: VocabularyManagerProps) {
  const [state, setState] = useState<VocabularyState>({
    vocabulary: initialVocabulary,
    loading: false,
    extracting: false,
    selectedItems: new Set()
  });

  const [extractionOptions, setExtractionOptions] = useState<VocabOptions>({
    maxItems: 20,
    includeFrequency: true,
    includeMorphology: lessonLanguage === 'la', // Enable morphology for Latin
    difficultyFilter: undefined
  });

  // Language-specific configuration
  const languageConfig = getLanguageConfig(lessonLanguage);

  useEffect(() => {
    setState(prev => ({ ...prev, vocabulary: initialVocabulary }));
  }, [initialVocabulary]);

  // Update morphology setting when language changes
  useEffect(() => {
    setExtractionOptions(prev => ({
      ...prev,
      includeMorphology: lessonLanguage === 'la'
    }));
  }, [lessonLanguage]);

  const handleExtractVocabulary = useCallback(async (text: string) => {
    if (!text.trim()) {
      toast.error('Please provide text to extract vocabulary from');
      return;
    }

    setState(prev => ({ ...prev, extracting: true }));

    try {
      // Security: Validate text length
      if (text.length > 10000) {
        throw new Error('Text is too long (max 10,000 characters)');
      }

      // NEW: Use language-aware extraction
      const extractedVocabulary = await extractVocabularyForLanguage(
        text,
        lessonLanguage, // Use lesson's language
        extractionOptions
      );

      // Merge with existing vocabulary, avoiding duplicates
      const existingLemmas = new Set(state.vocabulary.map(v => v.lemma));
      const newVocabulary = extractedVocabulary.filter(v => !existingLemmas.has(v.lemma));
      const updatedVocabulary = [...state.vocabulary, ...newVocabulary];

      setState(prev => ({
        ...prev,
        vocabulary: updatedVocabulary,
        extracting: false
      }));

      onVocabularyChange(updatedVocabulary);

      toast.success(
        `Extracted ${newVocabulary.length} new ${languageConfig.displayName} vocabulary items`,
        {
          description: `${extractedVocabulary.length} total found, ${newVocabulary.length} were new`
        }
      );

    } catch (error) {
      console.error('Vocabulary extraction failed:', error);
      setState(prev => ({ ...prev, extracting: false }));

      toast.error('Failed to extract vocabulary', {
        description: error.message || 'An unexpected error occurred'
      });
    }
  }, [lessonLanguage, extractionOptions, state.vocabulary, onVocabularyChange, languageConfig]);

  const handleRemoveVocabulary = useCallback((lemma: string) => {
    const updatedVocabulary = state.vocabulary.filter(v => v.lemma !== lemma);
    setState(prev => ({ ...prev, vocabulary: updatedVocabulary }));
    onVocabularyChange(updatedVocabulary);

    toast.success('Vocabulary item removed');
  }, [state.vocabulary, onVocabularyChange]);

  const handleBulkRemove = useCallback(() => {
    const updatedVocabulary = state.vocabulary.filter(v => !state.selectedItems.has(v.lemma));
    setState(prev => ({
      ...prev,
      vocabulary: updatedVocabulary,
      selectedItems: new Set()
    }));
    onVocabularyChange(updatedVocabulary);

    toast.success(`Removed ${state.selectedItems.size} vocabulary items`);
  }, [state.vocabulary, state.selectedItems, onVocabularyChange]);

  const toggleSelection = useCallback((lemma: string) => {
    setState(prev => {
      const newSelection = new Set(prev.selectedItems);
      if (newSelection.has(lemma)) {
        newSelection.delete(lemma);
      } else {
        newSelection.add(lemma);
      }
      return { ...prev, selectedItems: newSelection };
    });
  }, []);

  const selectAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedItems: new Set(prev.vocabulary.map(v => v.lemma))
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedItems: new Set() }));
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {languageConfig.displayName} Vocabulary Manager
          </CardTitle>

          {/* Language indicator badge */}
          <Badge variant="outline" className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${languageConfig.colorClass}`} />
            {languageConfig.displayName}
          </Badge>
        </div>

        {/* Extraction Options */}
        <ExtractionOptionsPanel
          options={extractionOptions}
          onOptionsChange={setExtractionOptions}
          language={lessonLanguage}
          languageConfig={languageConfig}
          disabled={readOnly}
        />

        {/* Extraction Interface */}
        <VocabularyExtractionInput
          onExtract={handleExtractVocabulary}
          extracting={state.extracting}
          language={lessonLanguage}
          languageConfig={languageConfig}
          disabled={readOnly}
        />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Vocabulary List Management */}
        {state.vocabulary.length > 0 && (
          <VocabularyListControls
            selectedCount={state.selectedItems.size}
            totalCount={state.vocabulary.length}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
            onBulkRemove={handleBulkRemove}
            disabled={readOnly}
          />
        )}

        {/* Vocabulary Items List */}
        <VocabularyList
          vocabulary={state.vocabulary}
          selectedItems={state.selectedItems}
          onToggleSelection={toggleSelection}
          onRemoveItem={handleRemoveVocabulary}
          language={lessonLanguage}
          languageConfig={languageConfig}
          readOnly={readOnly}
        />

        {/* Empty State */}
        {state.vocabulary.length === 0 && (
          <EmptyVocabularyState
            language={languageConfig.displayName}
            onExtractExample={() => handleExtractVocabulary(languageConfig.exampleText)}
            disabled={readOnly}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Language configuration helper
function getLanguageConfig(language: Language) {
  const configs = {
    es: {
      displayName: 'Spanish',
      colorClass: 'bg-red-500',
      exampleText: 'El perro come comida deliciosa en el parque.',
      placeholderText: 'Enter Spanish text to extract vocabulary...',
      extractButtonText: 'Extract Spanish Vocabulary',
      features: ['frequency', 'difficulty'],
      morphologyLabel: 'Include verb conjugations'
    },
    la: {
      displayName: 'Latin',
      colorClass: 'bg-purple-500',
      exampleText: 'Caesar Galliam vincit et gloriam quaerit.',
      placeholderText: 'Enter Latin text to extract vocabulary...',
      extractButtonText: 'Extract Latin Vocabulary',
      features: ['morphology', 'cases', 'difficulty'],
      morphologyLabel: 'Include morphological analysis'
    }
  };

  return configs[language] || configs.es;
}

// Sub-components for better organization
interface ExtractionOptionsPanelProps {
  options: VocabOptions;
  onOptionsChange: (options: VocabOptions) => void;
  language: Language;
  languageConfig: any;
  disabled: boolean;
}

function ExtractionOptionsPanel({
  options,
  onOptionsChange,
  language,
  languageConfig,
  disabled
}: ExtractionOptionsPanelProps) {
  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <h4 className="text-sm font-medium">Extraction Options</h4>

      <div className="grid grid-cols-2 gap-4">
        {/* Max Items */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Max Items
          </label>
          <input
            type="number"
            value={options.maxItems}
            onChange={(e) => onOptionsChange({
              ...options,
              maxItems: Math.max(1, Math.min(100, parseInt(e.target.value) || 20))
            })}
            className="w-full px-3 py-2 text-sm border rounded-md"
            min="1"
            max="100"
            disabled={disabled}
          />
        </div>

        {/* Difficulty Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Difficulty Filter
          </label>
          <select
            value={options.difficultyFilter || 'all'}
            onChange={(e) => onOptionsChange({
              ...options,
              difficultyFilter: e.target.value === 'all' ? undefined : e.target.value as any
            })}
            className="w-full px-3 py-2 text-sm border rounded-md"
            disabled={disabled}
          >
            <option value="all">All Levels</option>
            <option value="basic">Basic</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Frequency Analysis */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.includeFrequency}
            onChange={(e) => onOptionsChange({
              ...options,
              includeFrequency: e.target.checked
            })}
            disabled={disabled}
            className="rounded"
          />
          Include frequency data
        </label>

        {/* Morphology Analysis - Language specific */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.includeMorphology}
            onChange={(e) => onOptionsChange({
              ...options,
              includeMorphology: e.target.checked
            })}
            disabled={disabled}
            className="rounded"
          />
          {languageConfig.morphologyLabel}
        </label>
      </div>
    </div>
  );
}

interface VocabularyExtractionInputProps {
  onExtract: (text: string) => void;
  extracting: boolean;
  language: Language;
  languageConfig: any;
  disabled: boolean;
}

function VocabularyExtractionInput({
  onExtract,
  extracting,
  language,
  languageConfig,
  disabled
}: VocabularyExtractionInputProps) {
  const [text, setText] = useState('');

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {languageConfig.displayName} Text
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={languageConfig.placeholderText}
          className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md resize-y"
          disabled={disabled || extracting}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{text.length} / 10,000 characters</span>
          {text.length > 8000 && (
            <span className="text-amber-600">Approaching character limit</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => onExtract(text)}
          disabled={!text.trim() || extracting || disabled}
          className="flex-1"
        >
          {extracting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              {languageConfig.extractButtonText}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => setText(languageConfig.exampleText)}
          disabled={disabled}
        >
          Use Example
        </Button>
      </div>
    </div>
  );
}

interface VocabularyListControlsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkRemove: () => void;
  disabled: boolean;
}

function VocabularyListControls({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkRemove,
  disabled
}: VocabularyListControlsProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
      <div className="text-sm text-muted-foreground">
        {selectedCount > 0 ? (
          <span>
            {selectedCount} of {totalCount} items selected
          </span>
        ) : (
          <span>{totalCount} vocabulary items</span>
        )}
      </div>

      <div className="flex gap-2">
        {selectedCount === 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            disabled={disabled}
          >
            Select All
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              disabled={disabled}
            >
              Clear Selection
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkRemove}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove Selected
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

interface VocabularyListProps {
  vocabulary: VocabCandidate[];
  selectedItems: Set<string>;
  onToggleSelection: (lemma: string) => void;
  onRemoveItem: (lemma: string) => void;
  language: Language;
  languageConfig: any;
  readOnly: boolean;
}

function VocabularyList({
  vocabulary,
  selectedItems,
  onToggleSelection,
  onRemoveItem,
  language,
  languageConfig,
  readOnly
}: VocabularyListProps) {
  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto">
      {vocabulary.map((vocab) => (
        <VocabularyItem
          key={vocab.lemma}
          vocabulary={vocab}
          selected={selectedItems.has(vocab.lemma)}
          onToggleSelection={() => onToggleSelection(vocab.lemma)}
          onRemove={() => onRemoveItem(vocab.lemma)}
          language={language}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

interface VocabularyItemProps {
  vocabulary: VocabCandidate;
  selected: boolean;
  onToggleSelection: () => void;
  onRemove: () => void;
  language: Language;
  readOnly: boolean;
}

function VocabularyItem({
  vocabulary,
  selected,
  onToggleSelection,
  onRemove,
  language,
  readOnly
}: VocabularyItemProps) {
  return (
    <div className={`p-3 border rounded-lg transition-colors ${selected ? 'bg-muted border-primary' : 'bg-background'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {!readOnly && (
              <input
                type="checkbox"
                checked={selected}
                onChange={onToggleSelection}
                className="rounded"
              />
            )}

            <div className="font-medium">
              {vocabulary.word !== vocabulary.lemma && (
                <span className="text-muted-foreground">{vocabulary.word} → </span>
              )}
              <span>{vocabulary.lemma}</span>
            </div>

            <Badge variant="secondary" className="text-xs">
              {vocabulary.partOfSpeech}
            </Badge>

            {vocabulary.difficulty && (
              <Badge
                variant={vocabulary.difficulty === 'basic' ? 'default' : vocabulary.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {vocabulary.difficulty}
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {vocabulary.definition}
          </p>

          {/* Language-specific features */}
          {language === 'la' && vocabulary.morphology && (
            <div className="text-xs text-muted-foreground">
              <LatinMorphologyDisplay morphology={vocabulary.morphology} />
            </div>
          )}

          {vocabulary.frequency && (
            <div className="text-xs text-muted-foreground">
              Frequency: {vocabulary.frequency}
            </div>
          )}
        </div>

        {!readOnly && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function LatinMorphologyDisplay({ morphology }: { morphology: any }) {
  const parts = [];
  if (morphology.case) parts.push(`${morphology.case} case`);
  if (morphology.number) parts.push(morphology.number);
  if (morphology.gender) parts.push(morphology.gender);
  if (morphology.tense) parts.push(`${morphology.tense} tense`);
  if (morphology.mood) parts.push(`${morphology.mood} mood`);
  if (morphology.voice) parts.push(`${morphology.voice} voice`);

  return <span>{parts.join(', ')}</span>;
}

interface EmptyVocabularyStateProps {
  language: string;
  onExtractExample: () => void;
  disabled: boolean;
}

function EmptyVocabularyState({ language, onExtractExample, disabled }: EmptyVocabularyStateProps) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <div className="space-y-2">
        <p>No {language.toLowerCase()} vocabulary items yet</p>
        <p className="text-sm">
          Enter some {language.toLowerCase()} text above to extract vocabulary automatically
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onExtractExample}
          disabled={disabled}
        >
          Try Example Text
        </Button>
      </div>
    </div>
  );
}
```

#### 2. Enhanced Exercise Builder (`components/author/ExerciseBuilder.tsx`)

**MODIFY EXISTING FILE - Add language awareness to exercise generation**

```typescript
'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Wand2, Settings, Globe } from 'lucide-react';
import {
  generateExercises,
  ExerciseType,
  Exercise,
  VocabCandidate,
  GrammarConcept,
  Language
} from '@/lib/content-generation/tools/generate-exercises';
import { toast } from 'sonner';

interface ExerciseBuilderProps {
  lessonId: string;
  lessonLanguage: Language; // NEW: Required language prop
  vocabulary: VocabCandidate[];
  grammarConcepts: GrammarConcept[];
  initialExercises?: Exercise[];
  onExercisesChange: (exercises: Exercise[]) => void;
  readOnly?: boolean;
}

interface ExerciseGenerationOptions {
  exerciseTypes: ExerciseType[];
  targetDifficulty: 'basic' | 'intermediate' | 'advanced';
  maxExercises: number;
  customInstructions?: string;
}

export function ExerciseBuilder({
  lessonId,
  lessonLanguage, // NEW: Use lesson's language
  vocabulary,
  grammarConcepts,
  initialExercises = [],
  onExercisesChange,
  readOnly = false
}: ExerciseBuilderProps) {
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [generating, setGenerating] = useState(false);
  const [generationOptions, setGenerationOptions] = useState<ExerciseGenerationOptions>({
    exerciseTypes: getDefaultExerciseTypes(lessonLanguage), // NEW: Language-specific defaults
    targetDifficulty: 'intermediate',
    maxExercises: 8,
    customInstructions: ''
  });

  // Language-specific configuration
  const languageConfig = getExerciseLanguageConfig(lessonLanguage);

  const handleGenerateExercises = useCallback(async () => {
    if (vocabulary.length === 0 && grammarConcepts.length === 0) {
      toast.error('Need vocabulary or grammar concepts to generate exercises');
      return;
    }

    setGenerating(true);

    try {
      // NEW: Use language-aware exercise generation
      const generatedExercises = await generateExercises(
        '', // Original text not needed for exercise generation
        lessonLanguage, // Use lesson's language
        vocabulary,
        grammarConcepts,
        {
          targetDifficulty: generationOptions.targetDifficulty,
          exerciseTypes: generationOptions.exerciseTypes,
          maxExercises: generationOptions.maxExercises
        }
      );

      const updatedExercises = [...exercises, ...generatedExercises];
      setExercises(updatedExercises);
      onExercisesChange(updatedExercises);

      toast.success(
        `Generated ${generatedExercises.length} ${languageConfig.displayName} exercises`,
        {
          description: `Created ${generationOptions.exerciseTypes.join(', ')} exercises`
        }
      );

    } catch (error) {
      console.error('Exercise generation failed:', error);
      toast.error('Failed to generate exercises', {
        description: error.message || 'An unexpected error occurred'
      });
    } finally {
      setGenerating(false);
    }
  }, [
    lessonLanguage,
    vocabulary,
    grammarConcepts,
    exercises,
    generationOptions,
    onExercisesChange,
    languageConfig
  ]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            {languageConfig.displayName} Exercise Builder
          </CardTitle>

          <Badge variant="outline" className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${languageConfig.colorClass}`} />
            {languageConfig.displayName}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="exercises">
              Exercises ({exercises.length})
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <ExerciseGenerationPanel
              options={generationOptions}
              onOptionsChange={setGenerationOptions}
              language={lessonLanguage}
              languageConfig={languageConfig}
              vocabularyCount={vocabulary.length}
              grammarCount={grammarConcepts.length}
              onGenerate={handleGenerateExercises}
              generating={generating}
              disabled={readOnly}
            />
          </TabsContent>

          <TabsContent value="exercises" className="space-y-4">
            <ExercisesList
              exercises={exercises}
              onExercisesChange={(updated) => {
                setExercises(updated);
                onExercisesChange(updated);
              }}
              language={lessonLanguage}
              readOnly={readOnly}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <ExerciseSettingsPanel
              options={generationOptions}
              onOptionsChange={setGenerationOptions}
              language={lessonLanguage}
              languageConfig={languageConfig}
              disabled={readOnly}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Language-specific exercise type defaults
function getDefaultExerciseTypes(language: Language): ExerciseType[] {
  const defaults = {
    es: ['translation', 'fill_blank', 'multiple_choice'],
    la: ['translation', 'parsing', 'multiple_choice']
  };

  return defaults[language] || defaults.es;
}

// Language configuration for exercise building
function getExerciseLanguageConfig(language: Language) {
  const configs = {
    es: {
      displayName: 'Spanish',
      colorClass: 'bg-red-500',
      availableTypes: [
        { value: 'translation', label: 'Translation', description: 'Spanish ↔ English translation' },
        { value: 'fill_blank', label: 'Fill in the Blank', description: 'Complete sentences with vocabulary' },
        { value: 'multiple_choice', label: 'Multiple Choice', description: 'Choose correct answer' },
        { value: 'matching', label: 'Matching', description: 'Match words with definitions' }
      ],
      specialFeatures: ['conjugation', 'ser_estar', 'subjunctive']
    },
    la: {
      displayName: 'Latin',
      colorClass: 'bg-purple-500',
      availableTypes: [
        { value: 'translation', label: 'Translation', description: 'Latin → English with grammatical analysis' },
        { value: 'parsing', label: 'Parsing', description: 'Identify case, tense, mood, voice' },
        { value: 'multiple_choice', label: 'Multiple Choice', description: 'Grammar and vocabulary questions' },
        { value: 'matching', label: 'Matching', description: 'Match words with definitions' }
      ],
      specialFeatures: ['case_identification', 'syntax_analysis', 'morphology']
    }
  };

  return configs[language] || configs.es;
}

// Sub-components would follow similar patterns...
```

#### 3. Enhanced Grammar Concept Selector (`components/author/GrammarConceptSelector.tsx`)

**MODIFY EXISTING FILE - Add language-specific grammar handling**

```typescript
'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Plus, Globe } from 'lucide-react';
import {
  identifyGrammar,
  GrammarConcept,
  GrammarOptions,
  Language
} from '@/lib/content-generation/tools/identify-grammar';
import { toast } from 'sonner';

interface GrammarConceptSelectorProps {
  lessonId: string;
  lessonLanguage: Language; // NEW: Required language prop
  initialConcepts?: GrammarConcept[];
  onConceptsChange: (concepts: GrammarConcept[]) => void;
  readOnly?: boolean;
}

export function GrammarConceptSelector({
  lessonId,
  lessonLanguage, // NEW: Use lesson's language
  initialConcepts = [],
  onConceptsChange,
  readOnly = false
}: GrammarConceptSelectorProps) {
  const [concepts, setConcepts] = useState<GrammarConcept[]>(initialConcepts);
  const [identifying, setIdentifying] = useState(false);
  const [identificationOptions, setIdentificationOptions] = useState<GrammarOptions>({
    maxConcepts: 10,
    complexityLevel: 'all',
    includeExamples: true
  });

  // Language-specific configuration
  const languageConfig = getGrammarLanguageConfig(lessonLanguage);

  const handleIdentifyGrammar = useCallback(async (text: string) => {
    if (!text.trim()) {
      toast.error('Please provide text to identify grammar concepts');
      return;
    }

    setIdentifying(true);

    try {
      // NEW: Use language-aware grammar identification
      const identifiedConcepts = await identifyGrammar(
        text,
        lessonLanguage, // Use lesson's language
        identificationOptions
      );

      // Merge with existing concepts, avoiding duplicates
      const existingIds = new Set(concepts.map(c => c.id));
      const newConcepts = identifiedConcepts.filter(c => !existingIds.has(c.id));
      const updatedConcepts = [...concepts, ...newConcepts];

      setConcepts(updatedConcepts);
      onConceptsChange(updatedConcepts);

      toast.success(
        `Identified ${newConcepts.length} new ${languageConfig.displayName} grammar concepts`,
        {
          description: `${identifiedConcepts.length} total found, ${newConcepts.length} were new`
        }
      );

    } catch (error) {
      console.error('Grammar identification failed:', error);
      toast.error('Failed to identify grammar concepts', {
        description: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIdentifying(false);
    }
  }, [lessonLanguage, identificationOptions, concepts, onConceptsChange, languageConfig]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {languageConfig.displayName} Grammar Concepts
          </CardTitle>

          <Badge variant="outline" className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${languageConfig.colorClass}`} />
            {languageConfig.displayName}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Grammar Identification Interface */}
        <GrammarIdentificationInput
          onIdentify={handleIdentifyGrammar}
          identifying={identifying}
          language={lessonLanguage}
          languageConfig={languageConfig}
          disabled={readOnly}
        />

        {/* Identification Options */}
        <GrammarOptionsPanel
          options={identificationOptions}
          onOptionsChange={setIdentificationOptions}
          language={lessonLanguage}
          languageConfig={languageConfig}
          disabled={readOnly}
        />

        {/* Grammar Concepts List */}
        <GrammarConceptsList
          concepts={concepts}
          onConceptsChange={(updated) => {
            setConcepts(updated);
            onConceptsChange(updated);
          }}
          language={lessonLanguage}
          languageConfig={languageConfig}
          readOnly={readOnly}
        />
      </CardContent>
    </Card>
  );
}

// Language configuration for grammar concepts
function getGrammarLanguageConfig(language: Language) {
  const configs = {
    es: {
      displayName: 'Spanish',
      colorClass: 'bg-red-500',
      exampleText: 'El libro que leí ayer era muy interesante y me gustó mucho.',
      placeholderText: 'Enter Spanish text to identify grammar concepts...',
      commonConcepts: [
        'Subjunctive mood',
        'Ser vs Estar',
        'Past tenses',
        'Direct/Indirect objects',
        'Relative clauses'
      ],
      complexityGuidance: {
        basic: 'Simple present, articles, basic adjectives',
        intermediate: 'Subjunctive, complex tenses, pronouns',
        advanced: 'Advanced syntax, literary constructions'
      }
    },
    la: {
      displayName: 'Latin',
      colorClass: 'bg-purple-500',
      exampleText: 'Caesar, qui Galliam vincit, magnus imperator est qui gloriam quaerit.',
      placeholderText: 'Enter Latin text to identify grammar concepts...',
      commonConcepts: [
        'Ablative absolute',
        'Indirect statement',
        'Purpose clauses',
        'Relative clauses',
        'Passive periphrastic',
        'Participial phrases'
      ],
      complexityGuidance: {
        basic: 'Cases, basic verb forms, simple sentences',
        intermediate: 'Complex syntax, participles, subordinate clauses',
        advanced: 'Rhetorical devices, complex syntax patterns'
      }
    }
  };

  return configs[language] || configs.es;
}

// Sub-components would implement language-specific features...
```

### API Updates

#### Enhanced Content Generation Workflow API

```typescript
// app/api/content-generation/workflow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractVocabularyForLanguage } from '@/lib/content-generation/tools/extract-vocabulary';
import { identifyGrammar } from '@/lib/content-generation/tools/identify-grammar';
import { generateExercises } from '@/lib/content-generation/tools/generate-exercises';

const ContentGenerationSchema = z.object({
  text: z.string().min(1).max(10000),
  language: z.enum(['es', 'la']), // NEW: Required language parameter
  options: z.object({
    maxVocabulary: z.number().min(1).max(100).default(20),
    includeGrammar: z.boolean().default(true),
    exerciseTypes: z.array(z.enum(['translation', 'fill_blank', 'multiple_choice', 'parsing', 'matching'])).default(['translation', 'multiple_choice']),
    targetDifficulty: z.enum(['basic', 'intermediate', 'advanced']).default('intermediate'),
    maxExercises: z.number().min(1).max(20).default(8)
  }).default({})
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, language, options } = ContentGenerationSchema.parse(body);

    // Extract vocabulary with language awareness
    const vocabulary = await extractVocabularyForLanguage(
      text,
      language,
      {
        maxItems: options.maxVocabulary,
        includeFrequency: true,
        includeMorphology: language === 'la' // Enable morphology for Latin
      }
    );

    // Identify grammar concepts
    const grammarConcepts = options.includeGrammar
      ? await identifyGrammar(text, language, {
          maxConcepts: 10,
          complexityLevel: 'all',
          includeExamples: true
        })
      : [];

    // Generate exercises
    const exercises = await generateExercises(
      text,
      language,
      vocabulary,
      grammarConcepts,
      {
        targetDifficulty: options.targetDifficulty,
        exerciseTypes: options.exerciseTypes,
        maxExercises: options.maxExercises
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        vocabulary,
        grammarConcepts,
        exercises,
        language,
        processingMetadata: {
          vocabCount: vocabulary.length,
          grammarCount: grammarConcepts.length,
          exerciseCount: exercises.length,
          language
        }
      }
    });

  } catch (error) {
    console.error('Content generation workflow failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Content generation failed',
        code: error.code || 'GENERATION_ERROR'
      },
      { status: 400 }
    );
  }
}
```

### Database Schema Updates

```sql
-- Update lessons table to track language
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'es' CHECK (language IN ('es', 'la'));

-- Update existing lessons to have explicit language
UPDATE lessons SET language = 'es' WHERE language IS NULL;

-- Add index for language queries
CREATE INDEX IF NOT EXISTS idx_lessons_language ON lessons(language);

-- Update lesson_vocabulary to include language
ALTER TABLE lesson_vocabulary ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'es';

-- Update lesson_grammar_concepts if it exists
ALTER TABLE lesson_grammar_concepts ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'es' IF EXISTS;

-- Add UI interaction metrics
CREATE TABLE IF NOT EXISTS ui_interaction_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    lesson_id UUID REFERENCES lessons(id),
    component_name TEXT NOT NULL,
    action_type TEXT NOT NULL,
    language TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Acceptance Criteria

- [ ] **Language Propagation**: All authoring components use `lesson.language` instead of hard-coded 'es'
- [ ] **Language-Specific UI**: Components show appropriate language indicators and labels
- [ ] **API Integration**: All API calls include language parameter from lesson context
- [ ] **Backward Compatibility**: Existing Spanish lessons continue to work without modification
- [ ] **Latin Support**: Creating Latin lessons triggers Latin-specific processing
- [ ] **Validation**: Input validation works for both Spanish and Latin content
- [ ] **Error Handling**: Clear error messages for language-specific failures
- [ ] **Performance**: UI remains responsive with language switching

### Testing Strategy

```typescript
// Component integration tests
describe('UI Component Language Propagation', () => {
  test('VocabularyManager uses lesson language for extraction', async () => {
    const mockLesson = { id: 'test', language: 'la' as Language };

    render(
      <VocabularyManager
        lessonId={mockLesson.id}
        lessonLanguage={mockLesson.language}
        onVocabularyChange={jest.fn()}
      />
    );

    // Test that Latin text triggers Latin processing
    const textArea = screen.getByPlaceholderText(/latin text/i);
    const extractButton = screen.getByText(/extract latin vocabulary/i);

    fireEvent.change(textArea, { target: { value: 'Caesar vincit' } });
    fireEvent.click(extractButton);

    // Verify Latin processor was called
    expect(mockLatinProcessor.extractVocabulary).toHaveBeenCalledWith(
      'Caesar vincit',
      expect.objectContaining({ includeMorphology: true })
    );
  });
});
```

### Risk Mitigation

**UI Compatibility**:
- Maintain all existing component props for backward compatibility
- Gradual rollout with feature flags
- Comprehensive component testing

**Data Integrity**:
- Default language values for existing data
- Validation to ensure language consistency
- Migration scripts for data cleanup