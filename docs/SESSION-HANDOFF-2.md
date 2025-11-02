# Session Handoff - Tutor Mode Live, Improvements Needed

**Date**: 2025-10-31
**Status**: ✅ Epic 7 COMPLETE, 🔄 Refinements Identified
**Next Session**: Start Epic 7.5 (Real-Time Feedback) OR Fix Bugs First

---

## TL;DR 🎯

**DONE**: Full AI tutor embedded in reader with 7 components, chat interface, error analysis
**WORKING**: Can converse with AI in Spanish, get CEFR-appropriate responses, see error summary
**BUGS**: Error highlighting not showing, no loading feedback on "Terminar Dialog"
**NEXT**: Real-time per-turn corrections + UX polish, then flashcard system

---

## What We Built This Session ✅

### Epic 7: AI Tutor Mode UI - COMPLETE
**9 files created, embedded in reader, fully functional**

1. **TutorPanel Component** - Self-contained tutor logic in reader
2. **DialogView** - Chat interface with auto-scroll, voice input
3. **ProfessorOverview** - AI-generated text analysis (cached)
4. **LevelSelector** - CEFR levels A1-C2
5. **VoiceInput** - Web Speech API for Spanish (Chrome/Edge)
6. **ErrorPlayback** - Conversation transcript with error highlighting
7. **ErrorTooltip** - Modal showing error details
8. **UI Components** - button, card, dialog, textarea (sepia theme)

### Integration
- **Embedded in Reader** - Tutor is 4th tab (Input → Render → Vocabulary → Tutor)
- **No Navigation** - Everything stays in reader view, smooth UX
- **Library Links** - "AI Tutor →" button on each library card

---

## Current State 📊

### Environment
```bash
# Running
Docker: Up and healthy
App: http://localhost:3000 (200 OK)
Container: interlinear-app-1

# Environment Variables
OPENAI_API_KEY: ✅ Set
MERRIAM_WEBSTER_API_KEY: ✅ Set
ELEVENLABS_API_KEY: ✅ Set
NEXT_PUBLIC_SUPABASE_URL: ✅ Set
NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ Set
```

### Database Status
```sql
-- ✅ Tables exist (created in Epic 6)
tutor_sessions
dialog_turns

-- ⚠️ Migration not applied in Supabase dashboard yet
-- File: supabase/migrations/20251031162946_create_tutor_tables.sql
-- TODO: Apply manually in Supabase SQL Editor
```

### API Endpoints
```
POST /api/tutor/start      ✅ Creates session, returns AI opening
POST /api/tutor/turn       ✅ Continues conversation
POST /api/tutor/analyze    ⚠️ Returns errors (but UI highlighting broken)
POST /api/tutor/overview   ✅ Cached 24h, returns professor analysis
```

---

## Known Issues 🚨

### 1. Error Highlighting Not Showing (HIGH PRIORITY)
**Symptom**: After ending dialog, says "Found 5 errors" but no underlined text
**Location**: `components/tutor/ErrorPlayback.tsx` line 54-62
**Possible Causes**:
- `highlightErrors()` function not working
- `dangerouslySetInnerHTML` not rendering `<mark>` tags
- Error text doesn't match message content exactly
- CSS not loading for `.bg-red-100.border-b-2.border-red-500`

**Debug Steps**:
1. Console.log `errors` array in ErrorPlayback
2. Verify `error.errorText` matches substrings in `message.content`
3. Test `dangerouslySetInnerHTML` with hardcoded HTML
4. Check browser inspector for `<mark>` tags in DOM

### 2. No Visual Feedback on "Terminar Dialog" (UX)
**Symptom**: Click button → nothing happens for 3-5 seconds → error summary appears
**Expected**: Loading spinner, progress text, or toast notification
**Quick Fix**:
```tsx
const [analyzing, setAnalyzing] = useState(false)

const handleEndDialog = async () => {
  setAnalyzing(true)
  try {
    // ... API call
  } finally {
    setAnalyzing(false)
  }
}

<Button disabled={loading || analyzing}>
  {analyzing ? 'Analyzing...' : 'Terminar Dialog'}
</Button>
```

### 3. No Real-Time Feedback (FEATURE GAP)
**Current**: Errors only shown after conversation ends
**Desired**: Per-turn corrections shown immediately below user messages
**See**: `docs/TUTOR-MODE-IMPROVEMENTS.md` Epic 7.5 for detailed plan

---

## File Structure 📁

```
interlinear/
├── app/
│   ├── reader/
│   │   └── reader-client.tsx          # 🔄 Tutor tab integrated
│   └── tutor/[textId]/
│       └── page.tsx                   # ⚠️ Standalone (now redundant?)
│
├── components/
│   ├── reader/
│   │   ├── TutorPanel.tsx             # ✅ NEW - Embedded tutor
│   │   ├── TextInputPanel.tsx
│   │   ├── TextRenderPanel.tsx
│   │   └── VocabularyPanel.tsx
│   ├── tutor/
│   │   ├── ProfessorOverview.tsx      # ✅ NEW
│   │   ├── LevelSelector.tsx          # ✅ NEW
│   │   ├── DialogView.tsx             # ✅ NEW
│   │   ├── VoiceInput.tsx             # ✅ NEW
│   │   ├── ErrorPlayback.tsx          # ✅ NEW (has bug)
│   │   └── ErrorTooltip.tsx           # ✅ NEW
│   └── ui/
│       ├── button.tsx                 # ✅ NEW
│       ├── card.tsx                   # ✅ NEW
│       ├── dialog.tsx                 # ✅ NEW
│       └── textarea.tsx               # ✅ NEW
│
├── lib/
│   ├── tutor-tools.ts                 # ✅ LangChain tools (Epic 6)
│   ├── rate-limit.ts                  # ✅ 10 req/min
│   └── overview-cache.ts              # ✅ 24h TTL
│
├── types/
│   └── tutor.ts                       # ✅ NEW - TypeScript interfaces
│
└── docs/
    ├── TUTOR-MODE-IMPROVEMENTS.md     # ✅ NEW - This session's feedback
    └── SESSION-HANDOFF-2.md           # ✅ NEW - This file
```

---

## User Feedback Summary 💬

### Immediate Pain Points
1. ⚠️ "Terminar Dialog" gives no feedback → Add loading state
2. 🐛 Error highlighting broken → Debug `highlightErrors()` function
3. 🎯 Want real-time corrections per turn, not end-of-conversation batch

### Feature Requests
1. **Real-Time Feedback** - Show corrections below user messages as they type
2. **Professor Review** - Post-conversation summary with common mistakes + advice
3. **Collapsible Corrections** - Don't overwhelm, make feedback subtle/ignorable
4. **Positive Reinforcement** - Show 😊 emoji when no errors detected
5. **Panel Toggle** - Switch between pre-lesson overview ↔️ post-lesson review

### Roadmap Vision
1. **Phase 1**: Polish tutor experience (Epic 7.5 + 7.6)
2. **Phase 2**: Build flashcard system (Epic 8) - CRITICAL PATH
3. **Phase 3**: Games tab using flashcards (Epic 9) - Future

---

## Recommended Next Steps 🎯

### Option A: Bug Fixes First (Conservative)
**Time**: 1-2 hours
1. Debug error highlighting in ErrorPlayback
2. Add loading state to "Terminar Dialog"
3. Test full tutor flow end-to-end
4. Apply Supabase migration
5. Then proceed to Epic 7.5

**Pros**: Stable base before adding features
**Cons**: User still doesn't get real-time feedback

---

### Option B: Jump to Real-Time Feedback (Aggressive)
**Time**: 4-6 hours
1. Implement per-turn error correction API
2. Update DialogView to show inline corrections
3. Build collapsible feedback component
4. Fix bugs as encountered along the way

**Pros**: Delivers user's highest priority feature
**Cons**: May encounter bugs while building

---

### 🏆 Recommended: **Option A** (Bug Fixes First)
**Rationale**:
- Error playback bug blocks testing real-time corrections
- Loading feedback is quick win for UX
- Better to have working foundation before adding complexity
- Can transition to Epic 7.5 in same session after fixes

**Next Commands**:
```bash
# Start next session
cd /home/peleke/Documents/Projects/swae/interlinear

# Verify environment
docker ps | grep interlinear
curl http://localhost:3000

# Debug error highlighting
npm run dev  # Local testing
# OR inspect Docker logs
docker logs interlinear-app-1 --tail 50

# Read improvement plan
cat docs/TUTOR-MODE-IMPROVEMENTS.md
```

---

## Epic 7.5 Preview: Real-Time Feedback

### Technical Approach
1. **Modify `/api/tutor/turn`**:
   ```typescript
   // Current response
   { aiMessage, turnNumber, shouldEnd }

   // New response
   {
     aiMessage,
     turnNumber,
     shouldEnd,
     correction: {
       hasErrors: boolean,
       correctedText: string,
       errors: Array<{
         errorText: string,
         correction: string,
         explanation: string
       }>
     }
   }
   ```

2. **Add `analyzeUserMessage()` to tutor-tools.ts**:
   - Mini version of `analyzeErrorsTool`
   - Single-turn analysis (not full conversation)
   - Returns correction + explanation

3. **Update DialogView message display**:
   ```tsx
   {message.role === 'user' && (
     <div className="space-y-2">
       <p>{message.content}</p>
       {message.correction?.hasErrors ? (
         <CollapsibleCorrection>
           <CorrectText>{message.correction.correctedText}</CorrectText>
           <ErrorDetails>{message.correction.explanation}</ErrorDetails>
         </CollapsibleCorrection>
       ) : (
         <PositiveFeedback>😊 ¡Perfecto!</PositiveFeedback>
       )}
     </div>
   )}
   ```

4. **Store corrections for flashcard creation**:
   - Keep in `messages` state with corrections
   - When saving flashcard: use original → corrected → explanation

---

## Testing Checklist ✅

### Verify Before Next Session
- [ ] App running at http://localhost:3000
- [ ] Can navigate to /library
- [ ] Can open text in reader
- [ ] Tutor tab appears and loads
- [ ] Professor overview displays
- [ ] Can select CEFR level
- [ ] Start dialog creates session
- [ ] AI responds to messages
- [ ] Voice input works (Chrome)
- [ ] 🐛 Error highlighting shows (CURRENTLY BROKEN)
- [ ] 🚨 Loading feedback on end dialog (MISSING)

### Epic 7.5 Acceptance Criteria
- [ ] Send message → see correction below (real-time)
- [ ] No errors → see positive emoji
- [ ] Errors → see collapsible correction
- [ ] Correction is subtle/ignorable
- [ ] Can expand to see full explanation
- [ ] Corrections stored for flashcards

---

## Cost Tracking 💰

### Current Spend (Estimated)
```
OpenAI GPT-4o:
- Professor overview: ~2000 tokens × $0.005/1K = $0.01 per overview (cached 24h)
- Dialog turns: ~500 tokens × $0.005/1K × 10 turns = $0.025 per session
- Error analysis: ~1500 tokens × $0.005/1K = $0.0075 per analysis

Per complete tutor session: ~$0.04
100 users × 10 sessions/month = 1000 sessions = $40/month
```

### With Real-Time Feedback (Epic 7.5)
```
Per-turn correction: ~300 tokens × $0.005/1K = $0.0015 per turn
10 turns × $0.0015 = $0.015 additional per session

Total per session: $0.04 + $0.015 = $0.055
100 users × 10 sessions = $55/month

Still under budget with rate limiting (10 req/min)
```

---

## Quick Reference 🔖

### Commands
```bash
# Dev server
npm run dev

# Type check
npm run type-check

# Docker
docker compose up -d --build
docker logs interlinear-app-1 --tail 50
docker exec -it interlinear-app-1 sh

# Database migration (manual)
# Copy supabase/migrations/20251031162946_create_tutor_tables.sql
# Paste into Supabase Dashboard → SQL Editor → Run
```

### URLs
- App: http://localhost:3000
- Library: http://localhost:3000/library
- Reader: http://localhost:3000/reader
- Supabase: https://supabase.com/dashboard/project/pvigmyvestuzlcrclosp

### Key Files to Edit (Epic 7.5)
```
app/api/tutor/turn/route.ts        # Add correction response
lib/tutor-tools.ts                 # Add analyzeUserMessage()
components/tutor/DialogView.tsx    # Show inline corrections
components/tutor/ErrorPlayback.tsx # Fix highlighting bug (priority)
```

---

## Dependencies Status 📦

### Installed This Session
```json
{
  "lucide-react": "^0.263.0"  // Icons for UI components
}
```

### Already Present (Epic 6)
```json
{
  "@langchain/core": "^0.3.0",
  "@langchain/langgraph": "^0.2.0",
  "@langchain/openai": "^0.3.0",
  "langchain": "^0.3.0",
  "lru-cache": "^10.0.0",
  "zod": "^3.22.0"
}
```

### No Additional Deps Needed (Epic 7.5)
All required libraries already installed.

---

**🚀 Ready for next session!** Load this doc, verify environment, start with bug fixes or jump to Epic 7.5.
