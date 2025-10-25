# User Stories

## Epic 1: Authentication & Onboarding

### US-101: User Registration
**As a** language learner
**I want to** create an account with email/password
**So that** my vocabulary progress is saved across sessions

**Acceptance Criteria:**
- [ ] User can navigate to sign-up page
- [ ] Form validates email format and password strength (min 8 chars)
- [ ] Successful registration creates Supabase user and redirects to reader
- [ ] Error messages display for duplicate email or weak password
- [ ] Form uses accessible labels and ARIA attributes

**Priority:** P0 (Day 1 AM)

---

### US-102: User Login
**As a** returning user
**I want to** log in with my credentials
**So that** I can access my saved vocabulary

**Acceptance Criteria:**
- [ ] User can navigate to login page
- [ ] Form validates email/password presence
- [ ] Successful login redirects to reader interface
- [ ] Invalid credentials show clear error message
- [ ] "Forgot password" link present (can be placeholder for MVP)

**Priority:** P0 (Day 1 AM)

---

### US-103: Session Persistence
**As a** user
**I want to** stay logged in when I return
**So that** I don't have to log in every time

**Acceptance Criteria:**
- [ ] Supabase session persists in browser storage
- [ ] Returning users with valid session skip login
- [ ] Expired sessions redirect to login gracefully
- [ ] Logout button clears session and redirects

**Priority:** P0 (Day 1 AM)

---

## Epic 2: Text Input & Rendering

### US-201: Paste Text for Analysis
**As a** user
**I want to** paste Spanish text into a textarea
**So that** I can transform it into an interactive reading experience

**Acceptance Criteria:**
- [ ] Reader page shows large textarea with placeholder ("Paste your Spanish text here...")
- [ ] Character count displays below textarea
- [ ] "Render Text" button becomes enabled when text is present
- [ ] Soft limit of 2,000 words with warning message if exceeded
- [ ] Text persists in session storage if user navigates away

**Priority:** P0 (Day 1 PM)

---

### US-202: Render Interactive Text
**As a** user
**I want to** click "Render Text" and see my passage with clickable words
**So that** I can start looking up definitions

**Acceptance Criteria:**
- [ ] Clicking "Render Text" transitions from input mode to render mode
- [ ] Text is tokenized by spaces into individual words
- [ ] Each word wrapped in `<span>` with unique ID (`word-{index}`)
- [ ] Words preserve original spacing and punctuation
- [ ] "Edit Text" button allows returning to input mode
- [ ] Transition animates smoothly (fade or slide)

**Priority:** P0 (Day 1 PM)

---

## Epic 3: Dictionary Integration

### US-301: Click Word to See Definition
**As a** user
**I want to** click any word and see its definition
**So that** I can learn vocabulary while reading

**Acceptance Criteria:**
- [ ] Clicking a word highlights it (visual state change)
- [ ] Sidebar/panel opens with loading spinner
- [ ] API call fetches definition from Merriam-Webster
- [ ] Definition displays: word, part of speech, translation(s)
- [ ] Multiple definitions shown if available
- [ ] Error state displays if word not found ("Definition unavailable")
- [ ] Panel can be closed (click outside or close button)

**Priority:** P0 (Day 1 PM)

---

### US-302: Definition Caching
**As a** user
**I want** definitions to load instantly on second click
**So that** I don't wait for the same API call repeatedly

**Acceptance Criteria:**
- [ ] Definitions cached in memory (React state/context)
- [ ] Second click of same word loads from cache (< 50ms)
- [ ] Cache persists during session but clears on page reload
- [ ] Cache size limited to 500 words (LRU eviction)

**Priority:** P1 (Day 2 if time)

---

## Epic 4: Text-to-Speech Integration

### US-401: Hear Word Pronunciation
**As a** user
**I want to** click a speaker icon and hear the word pronounced
**So that** I can learn correct pronunciation

**Acceptance Criteria:**
- [ ] Speaker icon appears next to word in definition panel
- [ ] Clicking speaker triggers ElevenLabs API call
- [ ] Audio streams and plays immediately (< 1 second delay)
- [ ] Visual feedback shows audio is playing (animated icon)
- [ ] Audio stops if user clicks another word
- [ ] Graceful error if API quota exceeded (hide icon + notification)

**Priority:** P0 (Day 2 AM)

---

### US-402: Play Selected Text
**As a** user
**I want to** select a sentence and hear it read aloud
**So that** I can practice listening comprehension

**Acceptance Criteria:**
- [ ] Text selection shows "Play Selection" button/icon
- [ ] Button appears as floating tooltip near selection
- [ ] Clicking button sends selected text to ElevenLabs
- [ ] Entire selection plays as continuous audio
- [ ] Selection limited to 200 characters (show warning if exceeded)
- [ ] Button disappears when selection cleared

**Priority:** P0 (Day 2 AM)

---

### US-403: Audio Caching
**As a** user
**I want** repeated words/phrases to play instantly
**So that** I stay within API quota limits

**Acceptance Criteria:**
- [ ] Audio files cached in localStorage (base64 or blob URL)
- [ ] Cache key is hash of text + voice settings
- [ ] Cached audio plays with zero delay
- [ ] Cache limited to 10MB (evict oldest on overflow)
- [ ] Cache survives page reload

**Priority:** P1 (Day 2 PM if time)

---

## Epic 5: Vocabulary Tracking

### US-501: Auto-Save Clicked Words
**As a** user
**I want** clicked words automatically saved to my vocabulary list
**So that** I can review them later without manual work

**Acceptance Criteria:**
- [ ] First click on a word saves it to Supabase `vocabulary_entries`
- [ ] Subsequent clicks increment `click_count`
- [ ] Saved data includes: word, definition, timestamp, language
- [ ] Visual indicator shows word is "saved" (checkmark or color change)
- [ ] Save happens asynchronously (doesn't block UI)

**Priority:** P0 (Day 1 PM)

---

### US-502: View Vocabulary List
**As a** user
**I want to** view all my saved vocabulary words
**So that** I can review what I've learned

**Acceptance Criteria:**
- [ ] "Vocabulary" button/tab opens vocabulary view
- [ ] List shows all saved words with definitions
- [ ] Words sorted by most recent first
- [ ] Each entry shows: word, translation, click count, date saved
- [ ] List scrolls if > 10 words
- [ ] Empty state shows helpful message ("Start clicking words...")

**Priority:** P0 (Day 2 PM)

---

### US-503: Track Sentence Contexts
**As a** user
**I want** the app to remember which sentences contained my vocabulary
**So that** I can see words in context later

**Acceptance Criteria:**
- [ ] When word is saved, full sentence stored in `sentence_contexts`
- [ ] Sentence detection uses basic period/question mark splitting
- [ ] Vocabulary list shows "View in Context" link per word
- [ ] Clicking link displays sentence with word highlighted
- [ ] Multiple contexts shown if word appears in multiple sentences

**Priority:** P2 (Post-MVP, nice to have)

---

## Epic 6: UI/UX Polish

### US-601: Beautiful Typography
**As a** user
**I want** the reading interface to feel like a premium manuscript
**So that** the experience is enjoyable and focused

**Acceptance Criteria:**
- [ ] Body text uses serif font (e.g., Merriweather, Georgia)
- [ ] Font size is comfortably large (18-20px)
- [ ] Line height is generous (1.6-1.8)
- [ ] Proper contrast ratio (WCAG AA compliant)
- [ ] Responsive text sizing (scales on mobile)

**Priority:** P0 (Day 2 PM)

---

### US-602: Smooth Animations
**As a** user
**I want** UI transitions to feel smooth and polished
**So that** the app feels professional

**Acceptance Criteria:**
- [ ] Definition panel slides in smoothly (300ms ease-out)
- [ ] Word highlights fade in (150ms)
- [ ] Mode transitions fade (200ms)
- [ ] All animations 60fps (no jank)
- [ ] Reduced motion respected (prefers-reduced-motion media query)

**Priority:** P1 (Day 2 PM)

---

### US-603: Mobile Responsive
**As a** user
**I want** the app to work well on my phone
**So that** I can read on the go

**Acceptance Criteria:**
- [ ] Layout adapts to mobile viewport (< 768px)
- [ ] Definition panel becomes bottom sheet on mobile
- [ ] Text size remains readable on small screens
- [ ] Touch targets are ≥ 44px (iOS guidelines)
- [ ] No horizontal scroll

**Priority:** P1 (Day 2 PM)

---
