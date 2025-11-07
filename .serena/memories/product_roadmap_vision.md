# Product Roadmap Vision

## Phase 1: Lesson Authoring (IMMEDIATE)
**Goal**: Enable incremental lesson creation as you study/prepare materials

**Core Requirements**:
- Create lessons matching existing app structure
- All fields nullable except title (draft-first approach)
- Support multiple example texts/dialogs per lesson
- Save drafts, iterate, publish when ready
- Components to support:
  - Overview
  - Background reading
  - Example texts (multiple, with dialog-like structure)
  - Grammar points
  - Vocabulary
  - Practice exercises
  - Readings (handled separately/via links)

**Use Cases**:
1. Study new language (Norse, OE) → document incrementally → build lesson
2. Quick lesson creation for languages you speak
3. Iterative refinement workflow

## Phase 2: Driven Learning Experience (NEXT)
**Goal**: Transform passive lesson viewing into engaging, flow-state learning

**Key Questions**:
- How to make login → course → lesson flow feel "driven"?
- How to hook learners into conversation engagement?
- Can we run exercises through the AI agent?
- How to create seamless progression through lesson components?

**Desired UX Flow**:
```
Login → Click Course → BANG
  ↓
Conversation (engaging, interactive)
  ↓
Exercises (gamified? agent-driven?)
  ↓
Flow state maintained throughout
```

## Phase 3: Course-from-Corpus (FUTURE)
**Goal**: Dynamic course generation from source texts

**Vision**:
- Build X lessons from selected texts (a, b, c)
- Focus on specified topics in sequence
- Scale text difficulty → create leveled "belted" reading tiers
- Adapt to user interests (sagas, history, fiction, generated content)
- Generate lessons FROM preferred text filtered through topic sequence

**Example Workflow**:
```
1. Define topic sequence (grammar progression)
2. User selects interest areas (sagas, mythology, daily life)
3. System extracts/generates appropriate texts
4. Auto-generates lessons targeting topics using those texts
5. Creates tiered reading materials (A1 → B2 versions)
```

**Technical Challenges**:
- Text difficulty assessment & scaling
- Topic extraction from corpus
- Lesson generation from constrained vocabulary
- Maintaining authenticity while simplifying

---

## Strategic Priorities
1. **NOW**: Lesson authoring (enables content creation velocity)
2. **NEXT**: UX engagement hooks (retention & effectiveness)
3. **FUTURE**: Corpus-driven generation (scalability & personalization)