# Epic 8: Flashcard System & Simple SRS

**Status**: 🚧 In Progress
**Priority**: P0 - Critical
**Sprint**: 4-Day MVP Launch (Day 4)
**Estimated Effort**: 8 hours

---

## Overview

Build a simple flashcard system with spaced repetition for vocabulary retention. Focus on error corrections from Tutor Mode, with simplified SRS algorithm that can be upgraded to Anki SM-2 later.

**Key Features**:
- Save errors and vocabulary as flashcards
- Simple SRS algorithm (doubling intervals, 30-day cap)
- Review interface with flip animation
- Progress tracking and statistics
- Mobile-friendly card interaction

---

## User Stories

### 8.1: Database Migrations for Flashcards
**As a** developer
**I want** database schema for flashcard storage and SRS tracking
**So that** we can persist cards and review schedules

**Acceptance Criteria**:
- [ ] Create `flashcards` table with all required fields
- [ ] Add indexes on `user_id` and `next_review_date`
- [ ] Enable RLS policies for user data isolation
- [ ] Support source types: 'word', 'sentence', 'correction'
- [ ] Track interval progression and next review dates
- [ ] Migration runs successfully on local Supabase

**Database Schema**:
```sql
-- Flashcards with SRS tracking
CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  notes TEXT, -- Additional explanation or context
  source_type TEXT NOT NULL CHECK (source_type IN ('word', 'sentence', 'correction')),
  source_id TEXT, -- UUID or reference to vocabulary/turn
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  interval_days INT NOT NULL DEFAULT 1,
  times_reviewed INT NOT NULL DEFAULT 0,
  times_correct INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_interval CHECK (interval_days >= 1 AND interval_days <= 30),
  CONSTRAINT valid_review_count CHECK (times_reviewed >= 0),
  CONSTRAINT valid_correct_count CHECK (times_correct >= 0 AND times_correct <= times_reviewed)
);

-- Indexes for performance
CREATE INDEX idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX idx_flashcards_review_date ON public.flashcards(next_review_date);
CREATE INDEX idx_flashcards_source ON public.flashcards(source_type, source_id);
CREATE INDEX idx_flashcards_created ON public.flashcards(created_at DESC);

-- RLS Policies
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flashcards"
  ON public.flashcards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards"
  ON public.flashcards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards"
  ON public.flashcards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards"
  ON public.flashcards FOR DELETE
  USING (auth.uid() = user_id);
```

**Migration File**: `supabase/migrations/YYYYMMDDHHMMSS_create_flashcards.sql`

---

### 8.2: FlashcardService Implementation
**As a** developer
**I want** service layer for flashcard operations
**So that** we have reusable business logic across the app

**Acceptance Criteria**:
- [ ] Create flashcard with validation
- [ ] Get cards due today (next_review_date <= today)
- [ ] Get all cards sorted by next review date
- [ ] Review card and update SRS schedule
- [ ] Delete card
- [ ] Get statistics (total, due, reviewed today)
- [ ] Simple SRS algorithm implementation

**Implementation**: `lib/flashcards.ts`

```typescript
import { createClient } from '@/lib/supabase/server'

export type SourceType = 'word' | 'sentence' | 'correction'

export interface Flashcard {
  id: string
  user_id: string
  front: string
  back: string
  notes?: string
  source_type: SourceType
  source_id?: string
  next_review_date: string
  interval_days: number
  times_reviewed: number
  times_correct: number
  created_at: string
  updated_at: string
}

export interface FlashcardInsert {
  front: string
  back: string
  notes?: string
  source_type: SourceType
  source_id?: string
}

export interface FlashcardStats {
  totalCards: number
  dueToday: number
  reviewedToday: number
  accuracy: number
}

export class FlashcardService {
  /**
   * Create a new flashcard
   */
  static async createFlashcard(data: FlashcardInsert): Promise<Flashcard> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: flashcard, error } = await supabase
      .from('flashcards')
      .insert({
        user_id: user.id,
        front: data.front,
        back: data.back,
        notes: data.notes,
        source_type: data.source_type,
        source_id: data.source_id,
        next_review_date: new Date().toISOString().split('T')[0], // Today
        interval_days: 1
      })
      .select()
      .single()

    if (error) throw error
    return flashcard
  }

  /**
   * Get flashcards due today or earlier
   */
  static async getDueToday(): Promise<Flashcard[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const today = new Date().toISOString().split('T')[0]

    const { data: flashcards, error } = await supabase
      .from('flashcards')
      .select('*')
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true })

    if (error) throw error
    return flashcards
  }

  /**
   * Get all flashcards sorted by next review date
   */
  static async getAllFlashcards(): Promise<Flashcard[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: flashcards, error } = await supabase
      .from('flashcards')
      .select('*')
      .order('next_review_date', { ascending: true })

    if (error) throw error
    return flashcards
  }

  /**
   * Get single flashcard by ID
   */
  static async getFlashcard(id: string): Promise<Flashcard> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: flashcard, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return flashcard
  }

  /**
   * Review a flashcard and update SRS schedule
   * Simple algorithm: double interval on correct (max 30 days), reset to 1 on incorrect
   */
  static async reviewFlashcard(
    id: string,
    correct: boolean
  ): Promise<{ nextReviewDate: string; newInterval: number }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get current flashcard
    const flashcard = await this.getFlashcard(id)

    // Calculate new interval
    let newInterval: number
    if (correct) {
      // Double the interval, capped at 30 days
      newInterval = Math.min(flashcard.interval_days * 2, 30)
    } else {
      // Reset to 1 day
      newInterval = 1
    }

    // Calculate next review date
    const today = new Date()
    const nextReviewDate = new Date(today)
    nextReviewDate.setDate(today.getDate() + newInterval)
    const nextReviewDateStr = nextReviewDate.toISOString().split('T')[0]

    // Update flashcard
    const { error } = await supabase
      .from('flashcards')
      .update({
        interval_days: newInterval,
        next_review_date: nextReviewDateStr,
        times_reviewed: flashcard.times_reviewed + 1,
        times_correct: correct ? flashcard.times_correct + 1 : flashcard.times_correct,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    return {
      nextReviewDate: nextReviewDateStr,
      newInterval
    }
  }

  /**
   * Delete a flashcard
   */
  static async deleteFlashcard(id: string): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get flashcard statistics
   */
  static async getStats(): Promise<FlashcardStats> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const today = new Date().toISOString().split('T')[0]

    // Total cards
    const { count: totalCards } = await supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })

    // Due today
    const { count: dueToday } = await supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .lte('next_review_date', today)

    // Reviewed today (updated_at is today)
    const { count: reviewedToday } = await supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', `${today}T00:00:00`)

    // Calculate accuracy
    const { data: cards } = await supabase
      .from('flashcards')
      .select('times_reviewed, times_correct')

    const totalReviews = cards?.reduce((sum, c) => sum + c.times_reviewed, 0) || 0
    const totalCorrect = cards?.reduce((sum, c) => sum + c.times_correct, 0) || 0
    const accuracy = totalReviews > 0 ? (totalCorrect / totalReviews) * 100 : 0

    return {
      totalCards: totalCards || 0,
      dueToday: dueToday || 0,
      reviewedToday: reviewedToday || 0,
      accuracy: Math.round(accuracy)
    }
  }
}
```

**File Location**: `lib/flashcards.ts`

---

### 8.3: API Routes for Flashcard Operations
**As a** frontend developer
**I want** REST API endpoints for flashcard CRUD
**So that** I can build the flashcard UI

**Acceptance Criteria**:
- [ ] `GET /api/flashcards` - Get all or due flashcards
- [ ] `POST /api/flashcards` - Create flashcard
- [ ] `DELETE /api/flashcards/[id]` - Delete flashcard
- [ ] `POST /api/flashcards/review` - Review and update SRS
- [ ] `GET /api/flashcards/stats` - Get statistics
- [ ] All routes validate request bodies with Zod
- [ ] All routes return proper error responses

**Implementation**: `app/api/flashcards/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { FlashcardService } from '@/lib/flashcards'
import { z } from 'zod'

const CreateFlashcardSchema = z.object({
  front: z.string().min(1).max(500),
  back: z.string().min(1).max(1000),
  notes: z.string().max(1000).optional(),
  source_type: z.enum(['word', 'sentence', 'correction']),
  source_id: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const due = searchParams.get('due')

    let flashcards
    if (due === 'today') {
      flashcards = await FlashcardService.getDueToday()
    } else {
      flashcards = await FlashcardService.getAllFlashcards()
    }

    return NextResponse.json({ flashcards })
  } catch (error) {
    console.error('Get flashcards error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to get flashcards' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = CreateFlashcardSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const flashcard = await FlashcardService.createFlashcard(parsed.data)

    return NextResponse.json({ flashcard }, { status: 201 })
  } catch (error) {
    console.error('Create flashcard error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to create flashcard' },
      { status: 500 }
    )
  }
}
```

**Implementation**: `app/api/flashcards/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { FlashcardService } from '@/lib/flashcards'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await FlashcardService.deleteFlashcard(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete flashcard error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to delete flashcard' },
      { status: 500 }
    )
  }
}
```

**Implementation**: `app/api/flashcards/review/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { FlashcardService } from '@/lib/flashcards'
import { z } from 'zod'

const ReviewSchema = z.object({
  cardId: z.string().uuid(),
  correct: z.boolean()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = ReviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const result = await FlashcardService.reviewFlashcard(
      parsed.data.cardId,
      parsed.data.correct
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Review flashcard error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to review flashcard' },
      { status: 500 }
    )
  }
}
```

**Implementation**: `app/api/flashcards/stats/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { FlashcardService } from '@/lib/flashcards'

export async function GET(request: NextRequest) {
  try {
    const stats = await FlashcardService.getStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Get stats error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}
```

**File Locations**:
- `app/api/flashcards/route.ts`
- `app/api/flashcards/[id]/route.ts`
- `app/api/flashcards/review/route.ts`
- `app/api/flashcards/stats/route.ts`

---

### 8.4: Flashcards Review Page
**As a** language learner
**I want to** review flashcards due today
**So that** I can reinforce learning at optimal intervals

**Acceptance Criteria**:
- [ ] Show count of cards due today
- [ ] Display cards one at a time
- [ ] Flip animation (click to reveal back)
- [ ] "Correct" and "Incorrect" buttons
- [ ] Progress indicator (X of Y cards)
- [ ] Keyboard shortcuts (1=incorrect, 2=correct, space=flip)
- [ ] Completion celebration when done
- [ ] Empty state if no cards due

**Implementation**: `app/flashcards/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flashcard, FlashcardStats } from '@/lib/flashcards'
import { FlashcardReview } from '@/components/flashcards/FlashcardReview'
import { FlashcardStats as StatsDisplay } from '@/components/flashcards/FlashcardStats'
import { CompletionMessage } from '@/components/flashcards/CompletionMessage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, ArrowLeft } from 'lucide-react'

export default function FlashcardsPage() {
  const router = useRouter()
  const [dueCards, setDueCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<FlashcardStats | null>(null)
  const [completed, setCompleted] = useState(false)

  // Load due cards and stats
  useEffect(() => {
    async function loadData() {
      try {
        const [cardsResponse, statsResponse] = await Promise.all([
          fetch('/api/flashcards?due=today'),
          fetch('/api/flashcards/stats')
        ])

        if (!cardsResponse.ok || !statsResponse.ok) {
          throw new Error('Failed to load data')
        }

        const cardsData = await cardsResponse.json()
        const statsData = await statsResponse.json()

        setDueCards(cardsData.flashcards)
        setStats(statsData)
      } catch (error) {
        console.error('Load error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle review
  const handleReview = async (correct: boolean) => {
    const currentCard = dueCards[currentIndex]

    try {
      await fetch('/api/flashcards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: currentCard.id,
          correct
        })
      })

      // Move to next card
      if (currentIndex < dueCards.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // All cards reviewed
        setCompleted(true)
      }
    } catch (error) {
      console.error('Review error:', error)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (completed || currentIndex >= dueCards.length) return

      if (e.key === '1') {
        handleReview(false)
      } else if (e.key === '2') {
        handleReview(true)
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [currentIndex, dueCards, completed])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-sepia-200 rounded w-3/4"></div>
          <div className="h-96 bg-sepia-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/library')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Button>
          <h1 className="text-3xl font-serif text-sepia-900 flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Flashcard Review
          </h1>
        </div>
      </div>

      {/* Stats */}
      {stats && <StatsDisplay stats={stats} />}

      {/* Review or Completion */}
      {completed ? (
        <CompletionMessage
          cardsReviewed={dueCards.length}
          onContinue={() => router.push('/library')}
          onViewAll={() => router.push('/flashcards/all')}
        />
      ) : dueCards.length === 0 ? (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900 text-center">
              🎉 No cards due today!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-green-700 mb-4">
              You're all caught up. Great work!
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => router.push('/flashcards/all')}
                variant="outline"
              >
                View All Cards
              </Button>
              <Button onClick={() => router.push('/library')}>
                Back to Library
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <FlashcardReview
          card={dueCards[currentIndex]}
          currentIndex={currentIndex}
          totalCards={dueCards.length}
          onReview={handleReview}
        />
      )}
    </div>
  )
}
```

**File Location**: `app/flashcards/page.tsx`

---

### 8.5: Flashcard Review Component
**As a** language learner
**I want** interactive card flipping
**So that** I can test my memory before seeing the answer

**Acceptance Criteria**:
- [ ] Card displays front initially
- [ ] Click/tap to flip and show back
- [ ] 3D flip animation (CSS transform)
- [ ] Review buttons appear after flip
- [ ] Progress indicator visible
- [ ] Responsive on mobile and desktop

**Implementation**: `components/flashcards/FlashcardReview.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Flashcard } from '@/lib/flashcards'
import { X, Check } from 'lucide-react'

interface FlashcardReviewProps {
  card: Flashcard
  currentIndex: number
  totalCards: number
  onReview: (correct: boolean) => void
}

export function FlashcardReview({
  card,
  currentIndex,
  totalCards,
  onReview
}: FlashcardReviewProps) {
  const [flipped, setFlipped] = useState(false)

  const handleFlip = () => {
    setFlipped(!flipped)
  }

  const handleReview = (correct: boolean) => {
    onReview(correct)
    setFlipped(false) // Reset for next card
  }

  const progress = ((currentIndex + 1) / totalCards) * 100

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-sepia-600">
          <span>
            Card {currentIndex + 1} of {totalCards}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div className="perspective-1000">
        <Card
          className={`flashcard-container cursor-pointer transition-transform duration-500 ${
            flipped ? 'rotate-y-180' : ''
          }`}
          onClick={handleFlip}
        >
          <CardContent className="p-8 min-h-[400px] flex items-center justify-center">
            {!flipped ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-sepia-600 uppercase tracking-wide">
                  Front
                </p>
                <p className="text-2xl font-serif text-sepia-900 whitespace-pre-wrap">
                  {card.front}
                </p>
                <p className="text-sm text-sepia-500 italic">
                  Click to reveal answer
                </p>
              </div>
            ) : (
              <div className="text-center space-y-4 rotate-y-180">
                <p className="text-sm text-sepia-600 uppercase tracking-wide">
                  Back
                </p>
                <p className="text-xl font-serif text-sepia-900 whitespace-pre-wrap">
                  {card.back}
                </p>
                {card.notes && (
                  <p className="text-sm text-sepia-600 mt-4 border-t border-sepia-200 pt-4">
                    {card.notes}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Buttons */}
      {flipped && (
        <div className="flex gap-4">
          <Button
            onClick={() => handleReview(false)}
            variant="outline"
            size="lg"
            className="flex-1 border-red-300 hover:bg-red-50 text-red-700"
          >
            <X className="mr-2 h-5 w-5" />
            Incorrect (1)
          </Button>
          <Button
            onClick={() => handleReview(true)}
            size="lg"
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="mr-2 h-5 w-5" />
            Correct (2)
          </Button>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <Card className="bg-sepia-50 border-sepia-200">
        <CardContent className="p-4">
          <p className="text-sm text-sepia-600 text-center">
            <kbd className="px-2 py-1 bg-white border border-sepia-300 rounded text-xs">
              Space
            </kbd>{' '}
            to flip •{' '}
            <kbd className="px-2 py-1 bg-white border border-sepia-300 rounded text-xs">
              1
            </kbd>{' '}
            for incorrect •{' '}
            <kbd className="px-2 py-1 bg-white border border-sepia-300 rounded text-xs">
              2
            </kbd>{' '}
            for correct
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

**CSS** (add to `globals.css`):
```css
.perspective-1000 {
  perspective: 1000px;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}

.flashcard-container {
  transform-style: preserve-3d;
}
```

**File Location**: `components/flashcards/FlashcardReview.tsx`

---

### 8.6: Flashcard Stats Component
**As a** language learner
**I want** to see my progress statistics
**So that** I stay motivated and track my learning

**Acceptance Criteria**:
- [ ] Shows total cards
- [ ] Shows cards due today
- [ ] Shows cards reviewed today
- [ ] Shows accuracy percentage
- [ ] Visual progress indicators

**Implementation**: `components/flashcards/FlashcardStats.tsx`

```typescript
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { FlashcardStats as Stats } from '@/lib/flashcards'
import { BarChart3, Calendar, CheckCircle2, Target } from 'lucide-react'

interface FlashcardStatsProps {
  stats: Stats
}

export function FlashcardStats({ stats }: FlashcardStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-sepia-50 border-sepia-200">
        <CardContent className="p-4 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-sepia-600" />
          <div>
            <p className="text-2xl font-bold text-sepia-900">
              {stats.totalCards}
            </p>
            <p className="text-xs text-sepia-600">Total Cards</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-amber-600" />
          <div>
            <p className="text-2xl font-bold text-amber-900">
              {stats.dueToday}
            </p>
            <p className="text-xs text-amber-600">Due Today</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
          <div>
            <p className="text-2xl font-bold text-green-900">
              {stats.reviewedToday}
            </p>
            <p className="text-xs text-green-600">Reviewed Today</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-center gap-3">
          <Target className="h-8 w-8 text-blue-600" />
          <div>
            <p className="text-2xl font-bold text-blue-900">
              {stats.accuracy}%
            </p>
            <p className="text-xs text-blue-600">Accuracy</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

**File Location**: `components/flashcards/FlashcardStats.tsx`

---

### 8.7: Completion Message Component
**As a** language learner
**I want** a celebration when I finish reviewing
**So that** I feel accomplished and motivated

**Acceptance Criteria**:
- [ ] Shows congratulations message
- [ ] Displays number of cards reviewed
- [ ] Confetti or celebration animation
- [ ] "Continue" button back to library
- [ ] "View All Cards" button option

**Implementation**: `components/flashcards/CompletionMessage.tsx`

```typescript
'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, ArrowRight, BookOpen } from 'lucide-react'

interface CompletionMessageProps {
  cardsReviewed: number
  onContinue: () => void
  onViewAll: () => void
}

export function CompletionMessage({
  cardsReviewed,
  onContinue,
  onViewAll
}: CompletionMessageProps) {
  // Trigger confetti animation
  useEffect(() => {
    // You can integrate a library like canvas-confetti here
    // For now, just a celebration message
    console.log('🎉 Celebration!')
  }, [])

  return (
    <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Trophy className="h-16 w-16 text-yellow-500" />
        </div>
        <CardTitle className="text-3xl font-serif text-sepia-900">
          ¡Fantástico!
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-6">
        <div>
          <p className="text-xl text-sepia-700 mb-2">
            You reviewed <strong>{cardsReviewed}</strong> {cardsReviewed === 1 ? 'card' : 'cards'} today!
          </p>
          <p className="text-sepia-600">
            Keep up the great work. Your next review will be scheduled based on
            your performance.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={onViewAll} variant="outline" size="lg">
            <BookOpen className="mr-2 h-4 w-4" />
            View All Cards
          </Button>
          <Button onClick={onContinue} size="lg">
            Continue Learning
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="pt-6 border-t border-sepia-200">
          <p className="text-sm text-sepia-500">
            Come back tomorrow to review more cards and strengthen your memory!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
```

**File Location**: `components/flashcards/CompletionMessage.tsx`

---

### 8.8: All Flashcards List Page
**As a** language learner
**I want to** browse all my flashcards
**So that** I can review or manage specific cards

**Acceptance Criteria**:
- [ ] List view of all flashcards
- [ ] Shows front, back, next review date
- [ ] Sorted by next review date
- [ ] Delete button per card
- [ ] Filter by source type
- [ ] Empty state if no cards

**Implementation**: `app/flashcards/all/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flashcard } from '@/lib/flashcards'
import { FlashcardList } from '@/components/flashcards/FlashcardList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus } from 'lucide-react'

export default function AllFlashcardsPage() {
  const router = useRouter()
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFlashcards() {
      try {
        const response = await fetch('/api/flashcards')
        if (!response.ok) throw new Error('Failed to load flashcards')

        const data = await response.json()
        setFlashcards(data.flashcards)
      } catch (error) {
        console.error('Load error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFlashcards()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete')

      setFlashcards(flashcards.filter(c => c.id !== id))
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-sepia-200 rounded w-3/4"></div>
          <div className="h-32 bg-sepia-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/flashcards')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Review
          </Button>
          <h1 className="text-3xl font-serif text-sepia-900">
            All Flashcards ({flashcards.length})
          </h1>
        </div>
      </div>

      {/* List or Empty State */}
      {flashcards.length === 0 ? (
        <Card className="bg-sepia-50 border-sepia-200">
          <CardHeader>
            <CardTitle className="text-center text-sepia-900">
              No Flashcards Yet
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sepia-600">
              Create flashcards from vocabulary words or tutor error corrections.
            </p>
            <Button onClick={() => router.push('/library')}>
              <Plus className="mr-2 h-4 w-4" />
              Go to Library
            </Button>
          </CardContent>
        </Card>
      ) : (
        <FlashcardList flashcards={flashcards} onDelete={handleDelete} />
      )}
    </div>
  )
}
```

**File Location**: `app/flashcards/all/page.tsx`

---

### 8.9: Flashcard List Component
**As a** developer
**I want** reusable list component
**So that** I can display flashcards consistently

**Acceptance Criteria**:
- [ ] Displays flashcard front and back
- [ ] Shows next review date
- [ ] Shows source type badge
- [ ] Delete button with confirmation
- [ ] Responsive grid layout

**Implementation**: `components/flashcards/FlashcardList.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Flashcard } from '@/lib/flashcards'
import { Trash2, Calendar } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface FlashcardListProps {
  flashcards: Flashcard[]
  onDelete: (id: string) => void
}

const SOURCE_TYPE_COLORS = {
  word: 'bg-blue-100 text-blue-800',
  sentence: 'bg-purple-100 text-purple-800',
  correction: 'bg-red-100 text-red-800'
}

const SOURCE_TYPE_LABELS = {
  word: 'Vocabulary',
  sentence: 'Sentence',
  correction: 'Error Correction'
}

export function FlashcardList({ flashcards, onDelete }: FlashcardListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 0) return 'Overdue'
    return `${diffDays} days`
  }

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {flashcards.map((card) => (
          <Card key={card.id} className="border-sepia-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={SOURCE_TYPE_COLORS[card.source_type]}>
                      {SOURCE_TYPE_LABELS[card.source_type]}
                    </Badge>
                    <div className="flex items-center text-sm text-sepia-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Next review: {formatDate(card.next_review_date)}</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg font-serif text-sepia-900">
                    {card.front}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(card.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sepia-700">{card.back}</p>
              {card.notes && (
                <p className="text-sm text-sepia-600 mt-2 pt-2 border-t border-sepia-200">
                  {card.notes}
                </p>
              )}
              <div className="mt-4 flex gap-4 text-xs text-sepia-500">
                <span>Reviewed: {card.times_reviewed} times</span>
                <span>
                  Accuracy: {card.times_reviewed > 0
                    ? Math.round((card.times_correct / card.times_reviewed) * 100)
                    : 0}%
                </span>
                <span>Interval: {card.interval_days} days</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flashcard?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The flashcard will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

**File Location**: `components/flashcards/FlashcardList.tsx`

---

## Technical Specification

### SRS Algorithm Details

**Simple Doubling Interval**:
```typescript
// On correct answer
newInterval = Math.min(currentInterval * 2, 30)

// On incorrect answer
newInterval = 1

// Calculate next review date
nextReviewDate = today + newInterval days
```

**Progression Example**:
```
Day 0 (initial): 1 day
Day 1 (correct): 2 days → review Day 3
Day 3 (correct): 4 days → review Day 7
Day 7 (correct): 8 days → review Day 15
Day 15 (correct): 16 days → review Day 31
Day 31 (correct): 30 days (capped) → review Day 61
Any incorrect: 1 day (reset)
```

### TypeScript Types

```typescript
// types/flashcards.ts
export type SourceType = 'word' | 'sentence' | 'correction'

export interface Flashcard {
  id: string
  user_id: string
  front: string
  back: string
  notes?: string
  source_type: SourceType
  source_id?: string
  next_review_date: string
  interval_days: number
  times_reviewed: number
  times_correct: number
  created_at: string
  updated_at: string
}

export interface FlashcardStats {
  totalCards: number
  dueToday: number
  reviewedToday: number
  accuracy: number
}
```

### File Structure

```
lib/
  flashcards.ts                  # Service layer

app/flashcards/
  page.tsx                       # Review due cards
  all/page.tsx                   # List all cards

app/api/flashcards/
  route.ts                       # GET/POST flashcards
  [id]/route.ts                  # DELETE flashcard
  review/route.ts                # POST review
  stats/route.ts                 # GET statistics

components/flashcards/
  FlashcardReview.tsx            # Card flip component
  FlashcardStats.tsx             # Statistics display
  CompletionMessage.tsx          # Celebration
  FlashcardList.tsx              # All cards list

supabase/migrations/
  YYYYMMDDHHMMSS_create_flashcards.sql

types/
  flashcards.ts                  # TypeScript interfaces
```

---

## UI/UX Specifications

### Flashcard Display
- Card dimensions: `min-h-[400px]` (desktop), full-width (mobile)
- Flip animation: CSS 3D transform with `perspective-1000`
- Front: Large text, centered, "Click to reveal"
- Back: Definition + notes, rotated 180deg

### Review Buttons
- Incorrect: `border-red-300 text-red-700` (left)
- Correct: `bg-green-600` (right)
- Large touch targets: `size="lg"` (48px height)
- Keyboard shortcuts displayed below buttons

### Progress Indicator
- "Card X of Y" text
- Progress bar component
- Percentage displayed
- Updates after each review

### Empty States
- "No cards due today! 🎉" (celebration)
- "No flashcards yet" with CTA to library

### Animations
- Flip: `transition-transform duration-500`
- Confetti on completion (optional library)
- Progress bar smooth transition

---

## Testing Checklist

### Functional Tests
- [ ] Create flashcard from error correction
- [ ] Create flashcard from vocabulary word
- [ ] View flashcards due today
- [ ] Flip flashcard (click)
- [ ] Mark as correct → interval doubles
- [ ] Mark as incorrect → interval resets to 1
- [ ] Progress indicator updates correctly
- [ ] Completion message shows when done
- [ ] View all flashcards list
- [ ] Delete flashcard with confirmation
- [ ] Next review date calculated correctly
- [ ] Stats displayed accurately

### SRS Algorithm Tests
- [ ] Correct progression: 1→2→4→8→16→30 days
- [ ] Incorrect resets to 1 day
- [ ] Cap at 30 days enforced
- [ ] Next review date calculation accurate
- [ ] Statistics accuracy calculation correct

### UI/UX Tests
- [ ] Card flip animation smooth
- [ ] Buttons responsive and accessible
- [ ] Keyboard shortcuts work (1, 2, space)
- [ ] Mobile: Touch targets adequate
- [ ] Mobile: Card displays properly
- [ ] Progress bar animates smoothly
- [ ] Empty states display correctly
- [ ] Completion celebration shows

### Browser Compatibility
- [ ] Chrome: Full functionality
- [ ] Safari: Animations work
- [ ] Firefox: Flip animation works
- [ ] Mobile: Touch interactions work

---

## Dependencies

- **Requires**: Epic 7 (Tutor UI) for error correction source
- **Requires**: Epic 5 (Library) for vocabulary source
- **Blocks**: None (final epic)

---

## Success Metrics

**Day 4 Complete When**:
- ✅ Can save error corrections as flashcards
- ✅ Can save vocabulary as flashcards
- ✅ Can review flashcards with simple SRS
- ✅ Interval doubling works correctly
- ✅ Statistics track accurately
- ✅ UI is polished and celebration-worthy
- ✅ MVP ready to ship! 🚀

---

## Future Enhancements (Post-MVP)

### Month 1 Improvements
- [ ] Upgrade to Anki SM-2 algorithm (e-factor, quality ratings)
- [ ] Multi-deck support (organize by topic/text)
- [ ] Cloze deletion cards (fill-in-the-blank)
- [ ] Bulk flashcard generator from text
- [ ] Export to Anki-compatible CSV
- [ ] Audio playback for pronunciation
- [ ] Streak tracking and gamification
- [ ] Detailed analytics dashboard

### Advanced Features
- [ ] Image support on flashcards
- [ ] Reverse cards (back→front review)
- [ ] Custom SRS algorithm parameters
- [ ] Shared deck marketplace
- [ ] Mobile app with offline support
- [ ] Spaced repetition for entire texts

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Simple SRS too basic | Cap at 30 days prevents forgetting, upgrade path to SM-2 planned |
| Card overload (hundreds of cards) | Pagination and filtering, only show due cards by default |
| Accidental deletion | Confirmation dialog, consider "archive" instead of delete |
| Review fatigue | Limit daily reviews, celebration messages, progress tracking |
| State management complexity | Use server-side state, client-side only for UI interaction |
| Performance with many cards | Database indexes on review date, limit query results |

---

## Notes

- Simple SRS algorithm is MVP-appropriate (proven by Duolingo early versions)
- Upgrade path to Anki SM-2 or SuperMemo-based algorithm in Month 1
- Flashcard flip uses pure CSS (no JavaScript libraries needed)
- Statistics calculated server-side for accuracy
- Keyboard shortcuts enhance desktop UX
- Mobile-first responsive design throughout
- Celebration moments boost motivation and retention
- Integration points with Tutor and Library epics complete the learning loop
