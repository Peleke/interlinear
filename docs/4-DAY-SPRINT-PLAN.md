# 4-Day Sprint Plan: Interlinear AI Tutor MVP

**Status**: 🚀 Ready to Build
**Timeline**: 4 days (32 hours)
**Target**: Ship adaptive learning MVP with AI tutor

---

## 🎯 Vision

Transform Interlinear from a simple vocabulary tracker into an **adaptive AI-powered language tutor** that:
1. Saves custom texts to a personal library
2. Tracks vocabulary per text with original context
3. Engages users in AI-powered dialog practice
4. Analyzes mistakes and provides corrections
5. Converts errors into spaced repetition flashcards

**The "Holy Shit" Moment**: Users practice conversation, get personalized error feedback, and automatically build flashcard decks from their mistakes.

---

## 📋 Tech Stack Additions

```json
{
  "dependencies": {
    "langchain": "^0.3.11",
    "@langchain/openai": "^0.3.17",
    "@langchain/core": "^0.3.29",
    "mixpanel-browser": "^2.56.0"
  }
}
```

**Environment Variables**:
- `OPENAI_API_KEY` - For LangChain/GPT-4
- `NEXT_PUBLIC_MIXPANEL_TOKEN` - For analytics

---

## 📅 Daily Breakdown

### **DAY 1: Library System (Foundation)** - 8 hours

**Goal**: Users can save texts and track vocab per source

**Morning (4h)**:
- ✅ Database migrations (`library_texts` table, vocab updates)
- ✅ Backend services (`lib/library.ts`)
- ✅ API routes (`/api/library`, `/api/library/[id]`)
- ✅ Update vocab service to accept `sourceTextId` + sentence extraction

**Afternoon (4h)**:
- ✅ Library list page (`/library`)
- ✅ Add text form (`/library/new`)
- ✅ Text detail page with vocab (`/library/[id]`)
- ✅ Reader "Save to Library" button

**Deliverable**: Users can save/browse texts, vocab links to source

---

### **DAY 2: AI Backend (The Magic)** - 8 hours

**Goal**: LangChain + OpenAI powering dialog and error analysis

**Morning (4h)**:
- ✅ Install LangChain dependencies
- ✅ Environment setup (OpenAI API key)
- ✅ Build `TutorService` with LangChain prompts:
  - Start dialog
  - Continue conversation
  - Analyze errors
  - Generate professor overview

**Afternoon (4h)**:
- ✅ Database migrations (`tutor_sessions`, `dialog_turns`)
- ✅ API routes:
  - `/api/tutor/start`
  - `/api/tutor/turn`
  - `/api/tutor/analyze`
  - `/api/tutor/overview`
- ✅ Test all endpoints with real conversations

**Deliverable**: AI can converse in Spanish and identify errors

---

### **DAY 3: Tutor UI (The "Holy Shit" Feature)** - 8 hours

**Goal**: Polished dialog interface + error playback

**Morning (4h)**:
- ✅ Tutor landing page (`/tutor/[textId]`)
- ✅ Professor overview component (collapsible)
- ✅ Level selector (A1-C2)
- ✅ Dialog view (chat interface)
- ✅ Voice input (Web Speech API for Spanish)

**Afternoon (4h)**:
- ✅ Error playback view
- ✅ Error tooltips with corrections
- ✅ "Save as flashcard" buttons
- ✅ Polish animations and loading states
- ✅ Mobile responsiveness

**Deliverable**: Full dialog → error feedback → flashcard save flow works

---

### **DAY 4: Flashcards + Ship** - 8 hours

**Goal**: Simple SRS + final polish → SHIP IT!

**Morning (4h)**:
- ✅ Database migration (`flashcards` table)
- ✅ Flashcard service with simple SRS (doubling intervals)
- ✅ API routes (`/api/flashcards`, `/api/flashcards/review`)
- ✅ Flashcard review page (`/flashcards`)
- ✅ Connect error corrections → flashcard creation

**Afternoon (4h)**:
- ✅ Mixpanel analytics integration
- ✅ Track key events (dialog start, errors found, flashcards created)
- ✅ UI polish:
  - Loading states
  - Error handling
  - Empty states
  - Celebration animations
- ✅ End-to-end testing
- ✅ Deploy to production

**Deliverable**: Shippable MVP ready for students 🚀

---

## 📊 Database Schema Summary

```sql
-- New Tables (Day 1)
library_texts (id, user_id, title, content, language, created_at)
ALTER TABLE vocabulary ADD (source_text_id, original_sentence)

-- New Tables (Day 2)
tutor_sessions (id, user_id, text_id, level, started_at, completed_at)
dialog_turns (id, session_id, turn_number, ai_message, user_response, errors_json)

-- New Tables (Day 4)
flashcards (id, user_id, front, back, source_type, source_id, next_review_date, interval_days)
```

---

## 🎨 UI/UX Highlights

### Library (Day 1)
- Card-based layout for text browsing
- Per-text vocabulary filtering
- Original sentence context displayed

### Tutor Mode (Day 3)
- **Professor Overview**: AI-generated text summary + learning objectives
- **Chat Interface**: Natural conversation flow
- **Voice Input**: Web Speech API for speaking practice
- **Error Playback**: Mistakes highlighted with corrections + explanations

### Flashcards (Day 4)
- **Flip Animation**: 3D CSS transform
- **Simple SRS**: Doubling intervals (1d → 2d → 4d → 8d → 30d max)
- **Progress Tracking**: Due count + completion celebration

---

## 🚨 Risk Mitigation

| Risk | Mitigation | Fallback |
|------|------------|----------|
| **LLM Prompt Quality** | Test with 5 real conversations, iterate | Manual error flagging UI |
| **OpenAI Latency** | Show entertaining loading states | Async processing + notification |
| **Voice Input Browser Support** | Test Chrome/Safari | Text-only input always available |
| **SRS Edge Cases** | Keep algorithm dead simple | Manual "Mark as reviewed" button |
| **Scope Creep** | Ruthless prioritization, sticky notes | Ship what works, Month 1 roadmap |

---

## ✅ Success Criteria

**Must Have (Ship-Blockers)**:
- [ ] Library system functional (save, browse, delete texts)
- [ ] Vocab links to source texts with original sentences
- [ ] Dialog mode works (start conversation, exchange messages)
- [ ] Error analysis returns useful corrections
- [ ] Flashcards save and review with simple SRS
- [ ] No critical bugs (auth, data loss, crashes)

**Should Have (Polish)**:
- [ ] Professor overview generates summaries
- [ ] Voice input works (Chrome minimum)
- [ ] Mobile-responsive (doesn't break on phone)
- [ ] Loading states clear
- [ ] Error handling graceful

**Nice to Have (Month 1)**:
- 🔜 Whisper STT integration (if browser API insufficient)
- 🔜 Streaming LangChain responses
- 🔜 Public library with curated texts
- 🔜 Anki SM-2 algorithm upgrade
- 🔜 Multi-deck support

---

## 📁 Documentation Structure

```
docs/
├── 4-DAY-SPRINT-PLAN.md (this file)
├── prd/
│   ├── epic-5-library-system.md
│   ├── epic-6-tutor-mode-ai.md
│   ├── epic-7-tutor-ui.md
│   └── epic-8-flashcards-srs.md
├── wireframes/
│   ├── library-system.md
│   └── tutor-mode-ui.md
└── stories/
    ├── epic-5-library-system/
    │   ├── story-5.1-database-migrations.md
    │   ├── story-5.2-library-service.md
    │   ├── story-5.3-library-ui.md
    │   └── story-5.4-vocab-linking.md
    └── epic-6-tutor-ai/
        ├── story-6.1-langchain-setup.md
        ├── story-6.2-tutor-service.md
        ├── story-6.3-dialog-api.md
        └── story-6.4-error-analysis.md
```

---

## 🔗 Quick Links

- **Epics**: `/docs/prd/epic-*.md`
- **Wireframes**: `/docs/wireframes/*.md`
- **Stories**: `/docs/stories/epic-*/story-*.md`
- **Main PRD**: `/docs/prd.md` (existing)
- **Architecture**: `/docs/architecture.md` (existing)

---

## 🚀 Getting Started

### Pre-Sprint Checklist
- [ ] OpenAI API key obtained
- [ ] Mixpanel account created (optional Day 1-3)
- [ ] Review all epic docs
- [ ] Review wireframes
- [ ] 4 days blocked on calendar
- [ ] Current app tested and working

### Day 1 Kickoff
```bash
# 1. Create migration file
touch supabase/migrations/20241101_library_system.sql

# 2. Copy schema from story-5.1-database-migrations.md

# 3. Apply migration
npm run db:reset

# 4. Start building!
npm run dev
```

---

## 💡 Implementation Tips

### Reuse Existing Patterns
- `VocabularyService` → Create `LibraryService`, `TutorService`, `FlashcardService`
- `VocabularyCard` → Adapt for `LibraryCard`
- `TextInputPanel` → Reuse for library text form
- API error handling → Apply consistently

### LangChain Best Practices
- Use `ChatPromptTemplate` for structured prompts
- Request JSON responses for error analysis
- Implement retry logic for API failures
- Cache professor overviews per text

### Voice Input
```typescript
const recognition = new webkitSpeechRecognition()
recognition.lang = 'es-ES'
recognition.continuous = false
recognition.interimResults = false

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript
  setInput(transcript)
}
```

### Simple SRS Algorithm
```typescript
function updateInterval(currentInterval: number, correct: boolean): number {
  if (!correct) return 1 // Reset
  return Math.min(currentInterval * 2, 30) // Double, cap at 30
}
```

---

## 📈 Post-Launch Roadmap

### Month 1: Make It Smarter
- Multi-deck support
- CEFR level auto-detection
- Bilingual chat mode
- LLM example sentence generation
- Improved SRS (Anki SM-2)

### Month 2: Make It Sticky
- Push notifications for reviews
- Streaks + gamification
- Progress dashboard
- Anki CSV export

### Month 3: Public Library Launch
- 20-30 curated texts (A1-C2)
- Browse by level + topic
- Readability scoring
- Community contributions

### Months 4-12: Scale
- Multi-language (Spanish → French, German, Italian)
- Mobile apps (React Native)
- Social features (study groups, leaderboards)
- Teacher dashboard
- Browser extension

---

## 🎬 Demo Script

**For students/investors/users (2-3 minutes)**:

1. **Hook**: "Watch me learn Spanish by actually using it, not drilling flashcards."
2. **Setup**: Paste Spanish article → "This is now my textbook."
3. **Read**: Click words → definitions appear instantly
4. **Tutor**: "Let's practice" → AI starts conversation
5. **Engage**: Respond in Spanish (intentionally make mistakes)
6. **Reveal**: AI replays conversation, highlights 3 errors, explains each
7. **Payoff**: "Save as flashcard" → "Now my mistakes are my study material."
8. **Close**: "Learning that adapts to MY mistakes, not generic lists."

**Result**: "Shut up and take my money." 💰

---

## 📞 Support & Questions

- **Technical issues**: Check `/docs/architecture.md`
- **Design decisions**: See `/docs/prd/*.md`
- **Implementation details**: Review `/docs/stories/**/*.md`
- **Original plan**: This file + wireframes

---

**Let's ship this and make students freak out!** 🚀🔥

*Last updated: 2025-10-31*
