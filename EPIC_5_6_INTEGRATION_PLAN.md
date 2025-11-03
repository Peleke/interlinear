# Epic 5 & 6: Integration & Polish - Comprehensive Plan

## 📊 Current Epic Status (from HANDOFF.md)

### Epic 5: Integration Layer
| Feature | Status | Notes |
|---------|--------|-------|
| Reader integration | ✅ DONE | Links working, "Back to Lesson" added |
| Tutor integration | ✅ DONE | Tutor available in reader |
| Flashcard integration | ✅ DONE | Can save words from exercises |
| Vocabulary graph update | ❓ NEEDS TESTING | Should update on lesson completion |

### Epic 6: Polish & Deploy
| Feature | Status | Notes |
|---------|--------|-------|
| Page transitions/animations | 🔲 NOT STARTED | Low priority for demo |
| Mobile-responsive course cards | 🔲 NOT STARTED | Works but could be better |
| Loading states | 🔲 NOT STARTED | Basic spinners exist |
| Toast notifications | 🔲 NOT STARTED | Using alerts currently |
| Final QA + staging deploy | 🔲 NOT STARTED | After features complete |

---

## 🆕 NEW Requirements - Deep Integration

### 1. Flashcard-Course Integration
**Goal**: Seamless flashcard creation from lessons

#### Current State
- ✅ Flashcard system exists in reader
- ✅ Can save exercises to flashcards (FillBlankExercise component)
- ❌ No course-specific decks
- ❌ No auto-deck creation on enrollment
- ❌ Can't click vocabulary in lesson to create cards

#### New Requirements
1. **Auto-create deck on course enrollment**
   - When user first views a course → create deck named "{Course Title} - Flashcards"
   - Associate deck with course ID

2. **Click vocabulary to create flashcard**
   - Any vocabulary word in lesson → click → modal → save to course deck
   - Should generate example sentence

3. **Exercise → Flashcard button**
   - Each translation exercise gets "Add to Flashcards" button
   - Saves the Spanish sentence + English translation

### 2. Dialog Enhancement Features
**Goal**: Interactive, immersive dialog experience

#### Current State
- ✅ Dialogs render in markdown
- ❌ English always visible
- ❌ No audio playback
- ❌ No tutor role-play mode

#### New Requirements
1. **Hidden translations (toggle)**
   - Spanish visible by default
   - English hidden under toggle/click
   - Click sentence → reveal English

2. **Audio playback per line**
   - Each dialog line gets audio button
   - Clicks → ElevenLabs TTS → play audio
   - Cache audio for repeat plays

3. **Dialog Tutor Mode**
   - "Practice Dialog" button under dialog
   - Opens tutor interface
   - LLM plays one role (e.g., María)
   - User plays other role (e.g., Juan)
   - LLM follows dialog script as guide
   - Provides corrections/feedback

---

## 🏗️ Architecture Analysis

### Current Components
```
LessonViewer.tsx
  ├─ Content blocks (markdown)
  ├─ Exercises (FillBlankExercise)
  └─ Interactive Readings (links to /reader)

/reader (ReaderClient)
  ├─ TextRenderPanel (clickable words)
  ├─ VocabularyPanel (word list)
  ├─ TutorPanel (conversation)
  └─ FlashcardsPanel (spaced repetition)

FillBlankExercise.tsx
  └─ Modal for saving to flashcards
```

### New Components Needed

#### 1. DialogViewer Component
**Purpose**: Replace markdown rendering for dialog content

```typescript
<DialogViewer
  content={dialogMarkdown}
  courseId={courseId}
  lessonId={lessonId}
  onAddToFlashcards={(spanish, english) => {...}}
/>
```

**Features**:
- Parse markdown into structured dialog
- Toggle English visibility per line
- Audio button per line (ElevenLabs)
- "Practice Dialog" button → opens DialogTutor

#### 2. DialogTutor Component
**Purpose**: Role-play dialog with AI

```typescript
<DialogTutor
  dialog={parsedDialog}
  userRole="Juan"
  aiRole="María"
  lessonContext={lesson.title}
/>
```

**Features**:
- Chat interface (similar to TutorPanel)
- LLM plays assigned role
- Follows dialog as script/guide
- Provides corrections

#### 3. VocabularyClickable Component
**Purpose**: Make vocabulary words clickable

```typescript
<VocabularyClickable
  word="saludos"
  courseId={courseId}
  onAddToFlashcard={(word, definition) => {...}}
/>
```

#### 4. CourseDeckManager (Service)
**Purpose**: Manage course-specific flashcard decks

```typescript
class CourseDeckManager {
  async getOrCreateCourseDeck(courseId: string, courseName: string)
  async addCardToDeck(deckId: string, front: string, back: string)
}
```

---

## 📋 Implementation Phases

### Phase 1: Flashcard-Course Integration (PRIORITY)
**Why first**: Foundation for other features, relatively straightforward

#### Tasks
1. **Database schema**
   ```sql
   -- Add course_id to flashcard_decks table
   ALTER TABLE flashcard_decks ADD COLUMN course_id UUID REFERENCES courses(id);

   -- Index for quick lookup
   CREATE INDEX idx_decks_course_id ON flashcard_decks(course_id);
   ```

2. **CourseDeckManager service**
   - `/lib/services/course-deck-manager.ts`
   - `getOrCreateCourseDeck(userId, courseId, courseName)`
   - `addCardToCourseDeck(deckId, front, back)`

3. **Update LessonViewer**
   - Fetch/create course deck on mount
   - Pass `courseDeckId` to exercises
   - Update FillBlankExercise to use course deck

4. **Add "Save to Flashcards" to exercises**
   - Button on each exercise
   - Saves exercise to course deck
   - Toast notification on save

**Time estimate**: 2-3 hours
**Complexity**: Medium (database + service layer)

---

### Phase 2: Dialog Viewer with Toggles (PRIORITY)
**Why second**: Improves UX significantly, no external deps

#### Tasks
1. **Parse dialog markdown**
   - Utility function: `parseDialogMarkdown(content: string)`
   - Returns: `{ speaker, spanish, english }[]`
   - Handles `**Speaker:** text *translation*` format

2. **Create DialogViewer component**
   - Takes parsed dialog array
   - Shows Spanish by default
   - English hidden, click to reveal
   - Styling matches current lesson aesthetic

3. **Integrate in LessonViewer**
   - Detect if content block is dialog (heuristic or content_type)
   - Use DialogViewer instead of ReactMarkdown
   - Fallback to markdown for non-dialog

**Time estimate**: 1-2 hours
**Complexity**: Low-Medium (parsing + React state)

---

### Phase 3: Audio Playback (ElevenLabs)
**Why third**: Enhances dialog, requires API integration

#### Tasks
1. **TTS service**
   - `/lib/services/tts.ts`
   - `generateAudio(text: string, language: 'es')`
   - Returns audio URL or blob
   - Cache in memory (LRU cache)

2. **Add to DialogViewer**
   - Audio button per line
   - Click → call TTS → play audio
   - Loading state while generating
   - Error handling

3. **ElevenLabs API setup**
   - Already have ElevenLabs in tech stack
   - Check if API route exists: `/api/v1/tts`
   - If not, create it

**Time estimate**: 2-3 hours
**Complexity**: Medium (external API, caching, audio playback)

---

### Phase 4: Dialog Tutor Mode (STRETCH GOAL)
**Why last**: Most complex, can work without it for demo

#### Tasks
1. **Dialog parsing for roles**
   - Extract distinct speakers
   - Identify turn-taking pattern
   - Create dialog script object

2. **DialogTutor component**
   - Chat interface (copy TutorPanel structure)
   - System prompt: "You are {aiRole}. Follow this dialog script..."
   - LLM responds as assigned character
   - Evaluates user responses

3. **Integration**
   - "Practice Dialog" button in DialogViewer
   - Opens modal or navigates to tutor page
   - Pass dialog script as context

4. **LLM prompting**
   ```typescript
   systemPrompt = `You are ${aiRole} in a Spanish learning dialog.

   Dialog script:
   ${dialogScript}

   Instructions:
   - Respond only as ${aiRole}
   - Follow the dialog as a guide
   - Correct user's Spanish gently
   - Stay in character
   `
   ```

**Time estimate**: 3-4 hours
**Complexity**: High (LLM prompting, dialog state management)

---

### Phase 5: Vocabulary Clickable (NICE TO HAVE)
**Why optional**: Great feature but less critical than dialog

#### Tasks
1. **Identify vocabulary in content**
   - Vocabulary blocks already have content_type = 'vocabulary'
   - Parse vocabulary entries
   - Make each word clickable

2. **Add click handler**
   - Click word → fetch definition (if not in content)
   - Show modal with word + definition + example
   - "Add to Flashcards" button

3. **Generate example sentence**
   - Call LLM: "Generate Spanish sentence using '{word}'"
   - Add Spanish sentence + English translation to flashcard

**Time estimate**: 2-3 hours
**Complexity**: Medium (parsing, modal, LLM generation)

---

## 🎯 Recommended Implementation Order

### For Demo (Must Have)
1. ✅ **Phase 1: Flashcard-Course Integration** (2-3h)
   - Auto-create course decks
   - Save exercises to course deck
   - Immediate value, clean integration

2. ✅ **Phase 2: Dialog Viewer with Toggles** (1-2h)
   - Hide English by default
   - Click to reveal
   - Better learning experience

3. ⚠️ **Phase 3: Audio Playback** (2-3h)
   - Audio buttons on dialog lines
   - ElevenLabs integration
   - If time allows, big UX win

### Stretch Goals (Nice to Have)
4. ⏸️ **Phase 4: Dialog Tutor Mode** (3-4h)
   - Role-play with AI
   - Most innovative feature
   - Complex, can defer

5. ⏸️ **Phase 5: Vocabulary Clickable** (2-3h)
   - Click vocab → flashcard
   - Useful but lower priority

---

## 💾 Database Changes Needed

### 1. Course Decks Association
```sql
-- Option A: Add column to existing table
ALTER TABLE flashcard_decks
ADD COLUMN course_id UUID REFERENCES courses(id),
ADD COLUMN auto_created BOOLEAN DEFAULT false;

-- Option B: New junction table (if many-to-many needed)
CREATE TABLE course_decks (
  course_id UUID REFERENCES courses(id),
  deck_id UUID REFERENCES flashcard_decks(id),
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (course_id, deck_id)
);
```

**Recommendation**: Option A (simpler, 1:1 relationship sufficient)

### 2. Enrollment Tracking (if not exists)
```sql
-- Check if this exists
SELECT * FROM information_schema.tables WHERE table_name = 'user_courses';

-- If not, create it
CREATE TABLE user_courses (
  user_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  enrolled_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);
```

**Needed for**: Knowing when user first accesses course

---

## 🧪 Testing Checklist

### Phase 1: Flashcard Integration
- [ ] New course view → auto-creates deck
- [ ] Deck named "{Course Title} - Flashcards"
- [ ] Exercise "Add to Flashcards" → saves to course deck
- [ ] View flashcards → see saved exercises
- [ ] Multiple courses → separate decks

### Phase 2: Dialog Viewer
- [ ] Dialog loads in lesson
- [ ] English hidden by default
- [ ] Click line → reveals English
- [ ] Markdown formatting preserved
- [ ] Non-dialog content still uses ReactMarkdown

### Phase 3: Audio
- [ ] Audio button appears on each line
- [ ] Click → loading state → plays audio
- [ ] Audio in Spanish (not English)
- [ ] Repeat clicks → cached audio plays immediately
- [ ] Error handling for API failures

### Phase 4: Dialog Tutor (if implemented)
- [ ] "Practice Dialog" button appears
- [ ] Click → opens tutor interface
- [ ] LLM stays in assigned role
- [ ] Follows dialog script
- [ ] Provides corrections
- [ ] Can restart dialog

---

## 🚀 Epic 6: Polish (After Integration)

### Quick Wins
1. **Toast Notifications** (replace alerts)
   - Install `sonner` (already in package.json!)
   - Replace `alert()` with `toast.success()` / `toast.error()`
   - 30 minutes

2. **Loading States**
   - Add Loader2 spinners to async operations
   - Exercise submission, flashcard save, etc.
   - 1 hour

3. **Mobile Responsiveness**
   - Test on mobile viewport
   - Adjust course cards grid
   - Fix any overflow issues
   - 1-2 hours

### Deferred (Not for Demo)
- Page transitions/animations
- Staging deployment
- Full QA pass

---

## 📊 Time Estimates

### Must Have (5-8 hours)
- Phase 1: Flashcard Integration (2-3h)
- Phase 2: Dialog Viewer (1-2h)
- Phase 3: Audio Playback (2-3h)

### Nice to Have (5-7 hours)
- Phase 4: Dialog Tutor (3-4h)
- Phase 5: Vocabulary Clickable (2-3h)

### Polish (2-3 hours)
- Toasts + Loading States (1.5h)
- Mobile Responsiveness (1-2h)

**Total for demo-ready**: 7-11 hours (Must Have + Polish)

---

## 🤔 Discussion Questions

### 1. Dialog Parsing Strategy
**Question**: Should we keep dialogs in markdown or create structured data?

**Option A**: Parse markdown on-the-fly
- ✅ No database changes
- ✅ Works with existing data
- ❌ Parsing logic complexity

**Option B**: Store dialogs as JSON in database
- ✅ Structured, easier to work with
- ✅ Better for audio/tutor features
- ❌ Requires migration, re-seeding

**Recommendation**: Option A for now (faster), Option B later

### 2. Course Deck Creation Trigger
**Question**: When do we create the course deck?

**Option A**: First lesson view
- ✅ Simple, no enrollment tracking needed
- ❌ Might not have "enrolled" concept

**Option B**: Explicit enrollment action
- ✅ Clear user intent
- ❌ Requires enrollment system

**Recommendation**: Option A (first lesson view)

### 3. Audio Caching Strategy
**Question**: Where to cache audio?

**Option A**: Server-side (API route caches)
- ✅ Shared across users
- ❌ Server storage needed

**Option B**: Client-side (browser cache/memory)
- ✅ Simple, no server storage
- ❌ Not shared, might be slower

**Recommendation**: Option B (simpler for demo)

### 4. Dialog Tutor Context
**Question**: How much context to give LLM?

**Option A**: Full dialog + lesson context
- ✅ Best accuracy
- ❌ More tokens

**Option B**: Just dialog script
- ✅ Cheaper
- ❌ Less contextual

**Recommendation**: Option A (quality > cost for demo)

---

## 🎯 Next Steps

1. **Discuss priorities**
   - Must have: Phases 1, 2, 3?
   - Stretch goals: Phases 4, 5?

2. **Database decisions**
   - Course deck schema approach?
   - Enrollment tracking needed?

3. **Technical decisions**
   - Dialog parsing strategy?
   - Audio caching approach?

4. **Start implementation**
   - Begin with Phase 1 (flashcards)?
   - Or Phase 2 (dialog viewer)?

**Let's chat about priorities and any questions!** 🚀
