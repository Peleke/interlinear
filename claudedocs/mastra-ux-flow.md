# Mastra Content Generation: UX Flow & Multiple Readings

**Updated**: 2025-11-10
**Key Changes**: Multiple readings support, WinkNLP integration, reading selection UX

---

## 📚 **Data Model: Lessons & Readings**

### Lesson Structure
```typescript
interface Lesson {
  id: string;
  title: string;
  description: string;
  target_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  target_language: 'es' | 'fr' | 'de';

  // A lesson has MULTIPLE readings
  readings: Reading[];

  // Generated content
  vocabulary: VocabularyItem[];
  exercises: Exercise[];
  grammar_concepts: GrammarConcept[];
}

interface Reading {
  id: string;
  lesson_id: string;
  title: string;
  content: string; // The actual text
  order: number;
}
```

---

## 🎨 **Phase 0: UX Flow with Reading Selection**

### Vocabulary Tab UI
```
┌─────────────────────────────────────────────┐
│ Vocabulary Tab                              │
├─────────────────────────────────────────────┤
│                                             │
│ [Reading Selection Dropdown ▼]             │
│   ○ Reading 1: "El Gato en la Casa"       │
│   ○ Reading 2: "La Familia Rodriguez"     │
│   ○ Reading 3: "Un Día en el Parque"      │
│   ● All Readings (combined)                │
│                                             │
│ [Generate Vocabulary ✨]                    │
│                                             │
│ Generated Vocabulary (15 items):            │
│ ┌─────────────────────────────────────────┐ │
│ │ 1. gato - cat (from Reading 1)         │ │
│ │ 2. familia - family (from Reading 2)    │ │
│ │ 3. parque - park (from Reading 3)       │ │
│ │ ...                                     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Generate Button Logic
```typescript
const handleGenerateVocabulary = async () => {
  const selectedReadings = readingSelection === 'all'
    ? lesson.readings
    : [lesson.readings.find(r => r.id === selectedReadingId)];

  // Combine reading texts
  const combinedText = selectedReadings
    .map(r => r.content)
    .join('\n\n---\n\n');

  // Pass metadata about which readings were used
  const metadata = {
    readingIds: selectedReadings.map(r => r.id),
    readingTitles: selectedReadings.map(r => r.title),
  };

  // Trigger workflow
  const response = await fetch('/api/v1/mastra/workflows/trigger', {
    method: 'POST',
    body: JSON.stringify({
      workflowType: 'vocabulary-only',
      readingText: combinedText,
      readingMetadata: metadata,
      targetLevel: lesson.target_level,
      targetLanguage: lesson.target_language,
    }),
  });
};
```

---

## 🧠 **WinkNLP Integration Strategy**

### Why WinkNLP?
- **650k tokens/sec** - Instant processing
- **POS tagging** - Identify nouns, verbs, adjectives
- **Frequency analysis** - Most common words
- **Sentence detection** - Key sentences for reading UI
- **Lemmatization** - Word base forms
- **Named entities** - People, places, etc.

### Hybrid Approach: WinkNLP + LLM

```
Reading Text
    ↓
[WinkNLP Analysis] ← FAST (local, instant)
    ├─ Extract all tokens
    ├─ POS tagging (nouns, verbs, adjectives)
    ├─ Frequency table
    ├─ Lemmatization
    ├─ Named entities
    └─ Candidate words (top 30-50 by frequency + educational value)
    ↓
[LLM Refinement] ← SMART (API, 2-5 sec)
    ├─ Filter for CEFR level appropriateness
    ├─ Add English translations
    ├─ Add definitions
    ├─ Add example sentences
    ├─ Prioritize educational value
    └─ Limit to maxItems (15)
    ↓
Final Vocabulary Items
```

### WinkNLP Implementation

#### `lib/nlp/wink-analyzer.ts` (NEW)
```typescript
import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';

const nlp = winkNLP(model);

export interface TokenAnalysis {
  word: string;
  lemma: string;
  pos: string;
  frequency: number;
  entities?: string[];
}

export function analyzeText(text: string) {
  const doc = nlp.readDoc(text);

  // Extract sentences (for key sentence detection)
  const sentences = doc.sentences().out();

  // Get word frequency
  const freqTable = doc.tokens().out(its.type, as.freqTable);

  // Get POS-tagged tokens
  const tokens = doc.tokens().out();

  // Filter for content words (nouns, verbs, adjectives)
  const contentWords = doc.tokens()
    .filter((t) => {
      const pos = t.out(its.pos);
      return ['NOUN', 'VERB', 'ADJ'].includes(pos);
    })
    .out();

  // Extract named entities
  const entities = doc.entities().out();

  return {
    sentences,
    freqTable,
    contentWords,
    entities,
    wordCount: tokens.length,
  };
}

export function extractVocabularyCandidates(
  text: string,
  maxCandidates: number = 30
): TokenAnalysis[] {
  const doc = nlp.readDoc(text);

  // Get content words with metadata
  const candidates = doc.tokens()
    .filter((t) => {
      const pos = t.out(its.pos);
      return ['NOUN', 'VERB', 'ADJ'].includes(pos);
    })
    .out(its.value, its.lemma, its.pos);

  // Calculate frequency
  const freqTable = doc.tokens().out(its.type, as.freqTable);

  // Combine and rank
  const rankedCandidates = candidates.map(([word, lemma, pos]) => ({
    word,
    lemma,
    pos,
    frequency: freqTable[word.toLowerCase()] || 0,
  }));

  // Sort by frequency and return top N
  return rankedCandidates
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, maxCandidates);
}

export function detectKeySentences(
  text: string,
  topN: number = 5
): string[] {
  const doc = nlp.readDoc(text);
  const sentences = doc.sentences().out();

  // Simple heuristic: sentences with most content words
  const scoredSentences = sentences.map((sentence) => {
    const sentenceDoc = nlp.readDoc(sentence);
    const contentWordCount = sentenceDoc.tokens()
      .filter((t) => {
        const pos = t.out(its.pos);
        return ['NOUN', 'VERB', 'ADJ'].includes(pos);
      })
      .out().length;

    return {
      sentence,
      score: contentWordCount,
    };
  });

  return scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(s => s.sentence);
}

export function generateWordCloudData(text: string) {
  const doc = nlp.readDoc(text);

  // Get frequency table for content words only
  const contentWords = doc.tokens()
    .filter((t) => {
      const pos = t.out(its.pos);
      return ['NOUN', 'VERB', 'ADJ'].includes(pos) && !t.out(its.stopWordFlag);
    })
    .out(its.value, as.freqTable);

  // Convert to word cloud format
  return Object.entries(contentWords)
    .map(([word, frequency]) => ({
      text: word,
      value: frequency,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 50); // Top 50 words for cloud
}
```

---

## 🔄 **Updated Vocabulary Generation Step**

#### `lib/mastra/steps/vocabulary.ts` (UPDATED)
```typescript
import { createStep } from '@mastra/core';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { extractVocabularyCandidates } from '@/lib/nlp/wink-analyzer';

const VocabularyInputSchema = z.object({
  readingText: z.string(),
  readingMetadata: z.object({
    readingIds: z.array(z.string()),
    readingTitles: z.array(z.string()),
  }),
  targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  targetLanguage: z.enum(['es', 'fr', 'de']),
  maxItems: z.number().default(15),
});

export const generateVocabularyStep = createStep({
  id: 'generate-vocabulary',
  inputSchema: VocabularyInputSchema,
  outputSchema: VocabularyOutputSchema,
  resumeSchema: VocabularyResumeSchema,

  execute: async ({ input, resumeData, suspend }) => {
    const { readingText, readingMetadata, targetLevel, targetLanguage, maxItems } = input;

    if (resumeData?.approved) {
      return resumeData.vocabulary;
    }

    // STEP 1: WinkNLP analysis (FAST)
    console.log('Analyzing text with WinkNLP...');
    const candidates = extractVocabularyCandidates(readingText, maxItems * 2);

    // STEP 2: LLM refinement (SMART)
    console.log(`LLM refining ${candidates.length} candidates to ${maxItems} items...`);

    const prompt = getVocabularyPrompt(targetLanguage, targetLevel, maxItems);

    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.7
    }).withStructuredOutput(VocabularyOutputSchema);

    const candidateList = candidates
      .map(c => `${c.word} (${c.pos}, freq: ${c.frequency})`)
      .join('\n');

    const result = await llm.invoke([
      { role: "system", content: prompt },
      {
        role: "user",
        content: `
Reading Text:
${readingText}

Vocabulary Candidates (from NLP analysis):
${candidateList}

Select the ${maxItems} most educationally valuable words for ${targetLevel} learners.
Prioritize words that:
- Are at or slightly above ${targetLevel}
- Appear in the reading
- Are useful in daily conversation
- Represent key concepts from the text

For each word, provide translation, definition, and example sentence.
        `
      }
    ]);

    // Tag each vocab item with source reading
    const vocabWithSources = result.vocabulary.map(item => ({
      ...item,
      source_readings: readingMetadata.readingIds,
    }));

    // Suspend for review (Phase 2)
    return await suspend({
      reason: `Review ${vocabWithSources.length} vocabulary items from ${readingMetadata.readingTitles.join(', ')}`,
      vocabulary: vocabWithSources,
    });
  }
});
```

**Benefits**:
- ✅ **WinkNLP pre-filters** → LLM only refines top candidates (faster + cheaper)
- ✅ **Frequency-aware** → Focuses on words that actually appear in text
- ✅ **POS-aware** → Prioritizes nouns, verbs, adjectives
- ✅ **Source tracking** → Know which reading each vocab came from

---

## 🎨 **New Feature: Word Cloud**

### Lesson View (Top of Page)
```
┌─────────────────────────────────────────────────┐
│ Lesson: Introduction to Family Vocabulary      │
├─────────────────────────────────────────────────┤
│                                                 │
│       [Word Cloud Visualization]                │
│          familia    casa                        │
│     madre      padre     hermano                │
│         hijo        hija                        │
│    abuelo         nieto                         │
│       tía      primo                            │
│                                                 │
│ Description: Learn to talk about your family...│
└─────────────────────────────────────────────────┘
```

### Component
```tsx
// app/lessons/[lessonId]/components/WordCloud.tsx
import { useEffect, useState } from 'react';
import { generateWordCloudData } from '@/lib/nlp/wink-analyzer';
import ReactWordcloud from 'react-wordcloud';

export function LessonWordCloud({ readings }: { readings: Reading[] }) {
  const [words, setWords] = useState([]);

  useEffect(() => {
    const combinedText = readings.map(r => r.content).join(' ');
    const cloudData = generateWordCloudData(combinedText);
    setWords(cloudData);
  }, [readings]);

  return (
    <div className="word-cloud-container">
      <ReactWordcloud words={words} />
    </div>
  );
}
```

---

## 🔍 **New Feature: Key Sentences in Reading UI**

### Reading View with Highlights
```
┌─────────────────────────────────────────────────┐
│ Reading: El Gato en la Casa                    │
├─────────────────────────────────────────────────┤
│                                                 │
│ [⭐ Key] El gato está en la casa.              │
│                                                 │
│ Es un gato grande y negro.                     │
│                                                 │
│ [⭐ Key] Le gusta dormir en el sofá.           │
│                                                 │
│ Por la mañana, el gato come pescado.           │
│                                                 │
│ [⭐ Key] Después, sale al jardín para jugar... │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Component
```tsx
// app/reader/components/ReadingWithKeyHighlights.tsx
import { detectKeySentences } from '@/lib/nlp/wink-analyzer';

export function ReadingWithKeyHighlights({ content }: { content: string }) {
  const keySentences = detectKeySentences(content, 5);

  return (
    <div className="reading-content">
      {content.split('.').map((sentence, i) => {
        const isKey = keySentences.includes(sentence + '.');
        return (
          <p key={i} className={isKey ? 'key-sentence' : ''}>
            {isKey && <span className="key-badge">⭐ Key</span>}
            {sentence}.
          </p>
        );
      })}
    </div>
  );
}
```

---

## 📋 **Updated Dependencies**

```bash
npm install wink-nlp wink-eng-lite-web-model
npm install react-wordcloud  # For word cloud visualization
```

---

## 🎯 **Summary of Changes**

### Multiple Readings Support
- ✅ Reading selection dropdown (specific or "all")
- ✅ Combine reading texts for generation
- ✅ Track which readings contributed to each vocab item
- ✅ Metadata passed through workflow

### WinkNLP Integration
- ✅ Pre-filter vocabulary candidates (faster, cheaper)
- ✅ Frequency + POS analysis
- ✅ Word cloud generation
- ✅ Key sentence detection
- ✅ Named entity extraction (future)

### New Features
- ✅ Word cloud at top of lesson view
- ✅ Key sentence highlighting in reading UI
- ✅ Educational value ranking via hybrid NLP+LLM

---

## ❓ **Updated Open Questions**

1. **WinkNLP Models**:
   - Do we need Spanish/French/German models? (wink-eng-lite is English)
   - How to handle multilingual text?

2. **Word Cloud UI**:
   - Which library? react-wordcloud, d3-cloud, or custom?
   - Update frequency? (regenerate on vocab changes)

3. **Key Sentence Algorithm**:
   - Current: content word count
   - Better: semantic importance, grammar complexity?

4. **Reading Selection UX**:
   - Default to "All Readings" or "First Reading"?
   - Remember user's last selection?

---

**Status**: UX flow + WinkNLP strategy defined

**Next**: Review, answer questions, implement
