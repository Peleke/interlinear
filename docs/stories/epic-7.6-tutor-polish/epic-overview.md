# Epic 7.6: Tutor Polish & Audio

**Status**: 🚧 Not Started
**Priority**: P0 (HIGH)
**Estimated Effort**: 4 hours
**Dependencies**: Epic 7.5 (Real-Time Tutor Feedback) - Complete ✅

---

## Vision

Polish the tutor experience with post-conversation review and audio playback for AI messages. Add a "Professor Review" panel to give students comprehensive feedback on their performance, and enable audio playback of AI messages using ElevenLabs for better pronunciation learning.

---

## User Value

**As a** language learner
**I want to** receive a comprehensive review of my performance after each conversation and hear AI messages spoken aloud
**So that** I can understand my progress holistically and learn proper pronunciation

---

## Success Metrics

- ✅ Professor Review appears after "Terminar Diálogo"
- ✅ Review includes performance summary with positive bias
- ✅ Scrollable error list shows all corrections
- ✅ Audio button on each AI message plays via ElevenLabs
- ✅ Audio playback smooth with loading states

---

## Stories

### Story 7.6.1: Professor Review Panel
**Priority**: P0
**Effort**: 2 hours
**Status**: 🚧 Not Started

Create a comprehensive post-conversation review panel similar to ProfessorOverview but focused on student performance evaluation.

**Features**:
- Performance summary (positive, encouraging tone)
- Overall assessment (Excelente/Muy Bien/Bien/Necesitas Práctica)
- Strengths highlighted
- Areas for improvement
- Scrollable list of all errors with corrections
- Grammar/Vocabulary/Syntax breakdown

### Story 7.6.2: ElevenLabs Audio for AI Messages
**Priority**: P0
**Effort**: 2 hours
**Status**: 🚧 Not Started

Add audio playback buttons to AI messages in the conversation using ElevenLabs text-to-speech.

**Features**:
- Speaker icon button on each AI message
- Click to play audio
- Loading state during generation
- Cache audio for replays
- Spanish voice (proper accent)
- Play/pause/stop controls

---

## Technical Architecture

### Professor Review Component
```typescript
// components/tutor/ProfessorReview.tsx
interface ProfessorReview {
  overallScore: 'excelente' | 'muy_bien' | 'bien' | 'necesita_practica'
  summary: string
  strengths: string[]
  areasForImprovement: string[]
  errors: ErrorAnalysis[]
  encouragement: string
}
```

### Audio Integration
```typescript
// API route: /api/tutor/audio
// Uses ElevenLabs API to generate Spanish TTS
// Returns audio URL or streams audio data
```

---

## Implementation Strategy

**Phase 1: Professor Review** (Story 7.6.1)
1. Create ProfessorReview component
2. Generate review using GPT-4o after conversation
3. Display after clicking "Terminar Diálogo"
4. Show before ErrorPlayback

**Phase 2: Audio Playback** (Story 7.6.2)
1. Add ElevenLabs integration
2. Create audio playback UI component
3. Add to DialogView AI messages
4. Implement caching for efficiency

---

## Dependencies

**Required**:
- Epic 7.5 (Real-Time Tutor Feedback) ✅
- ElevenLabs API key (for audio)
- GPT-4o API (for review generation)

**Future Enhancements** (see ENHANCEMENTS.md):
- Save review to database
- Review history page
- Audio speed controls
- Download audio files
- Conversation persistence

---

## Cost Analysis

### Professor Review
```
Prompt: ~300 tokens
Conversation: ~500 tokens (avg)
Response: ~200 tokens
Total: ~1000 tokens per review

Cost (GPT-4o):
$0.0025/1K input + $0.01/1K output
~$0.004 per review

10 sessions/day × 30 days = 300 sessions = $1.20/month
```

### ElevenLabs Audio
```
Cost: $0.30 per 1K characters
Average AI message: 100 characters
Cost per message: $0.03

10 messages/conversation × 10 sessions = 100 messages = $3/month
```

**Total Epic 7.6 Cost**: ~$4.20/month per active user

---

## Timeline

**Total Time**: 4 hours

- Story 7.6.1 (Professor Review): 2 hours
- Story 7.6.2 (Audio Playback): 2 hours

**Suggested Flow**: Complete 7.6.1, test, then 7.6.2, test, then take a break before Epic 8

---

**Created**: 2025-10-31
**Author**: Peleke (User) + Claude (Dev Agent)
