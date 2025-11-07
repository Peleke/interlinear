# Product Vision: Three-Phase Evolution Analysis

**Date**: 2025-11-06
**Author**: Mary (Analyst)
**Context**: Strategic analysis of lesson authoring, UX engagement, and corpus-driven course generation

---

## Executive Summary

Three interconnected product enhancements targeting different aspects of the learning platform:

1. **Lesson Authoring** (P0): Enable incremental content creation as you study/teach
2. **Driven Learning UX** (P1): Transform passive lesson consumption into engaging flow state
3. **Course-from-Corpus** (P2): Dynamic course generation from source texts with personalization

**Strategic Rationale**:
- Phase 1 solves content velocity bottleneck
- Phase 2 addresses learner engagement and retention
- Phase 3 enables infinite scalability and personalization

---

## Phase 1: Lesson Authoring System

### Problem Statement
**Current State**: Lessons created via YAML files → parsing scripts → database seeding
**Pain Points**:
- High friction for quick lesson creation
- No incremental authoring workflow
- Can't document lessons while studying new languages
- Difficult to iterate on existing content

**Target Users**:
1. **Self-studying polyglots**: Document Norse/Old English as you learn
2. **Teacher/creators**: Build lessons for languages you speak
3. **Content curators**: Refine and improve existing lessons

### Solution Architecture

#### Data Model Changes
```sql
-- Core lesson table modifications
ALTER TABLE lessons
  ADD COLUMN status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN author_id UUID REFERENCES auth.users(id),
  ALTER COLUMN overview DROP NOT NULL;

-- Enable draft/published visibility control
CREATE INDEX idx_lessons_status ON lessons(status);
CREATE INDEX idx_lessons_author ON lessons(author_id);
```

**Key Design Decisions**:
- ✅ All fields nullable except `title` (MVP first, build incrementally)
- ✅ Status enum controls visibility (drafts invisible to learners)
- ✅ Author tracking enables multi-user content creation
- ✅ Existing normalized structure supports component-by-component authoring

#### Authoring Workflow
```
1. Create Shell
   POST /api/lessons { title, course_id } → Returns draft lesson

2. Incremental Build (any order, any time)
   PATCH /api/lessons/:id/overview
   POST  /api/lessons/:id/dialogs
   POST  /api/lessons/:id/vocabulary
   POST  /api/lessons/:id/grammar
   POST  /api/lessons/:id/exercises
   POST  /api/lessons/:id/readings

3. Publish
   PATCH /api/lessons/:id { status: 'published' }
   → Validates minimum requirements
   → Makes visible to learners
```

#### RLS Security Model
```sql
-- Visibility Rules
- Drafts: Only author can see
- Published: All authenticated users can see
- Archived: Only author can see

-- Permissions
- Create: Any authenticated user
- Update: Author only
- Delete: Author only (drafts only)
- Publish: Author only
```

### Component Structure

Current lesson anatomy (all incrementally buildable):

1. **Dialogs** (0+ per lesson)
   - Context, setting
   - Multiple exchanges with speaker, spanish, english
   - ✅ Already normalized in DB

2. **Vocabulary** (0+ items)
   - Normalized `lesson_vocabulary_items` table
   - Junction table tracks new vs review
   - ✅ Supports shared vocabulary across lessons

3. **Grammar Concepts** (0+ concepts)
   - Rich markdown content
   - Associated vocabulary
   - Related grammar concepts
   - ✅ Reusable across lessons

4. **Exercises** (0+ exercises)
   - Types: fill_blank, multiple_choice, translation
   - Spanish/English text fields for translation
   - XP values
   - ✅ Multiple per lesson

5. **Readings** (0+ readings)
   - Link to `library_readings`
   - Required vs optional
   - Display order
   - ✅ Can reference existing or create new

### UI Components

**LessonEditor** (main interface)
```tsx
<LessonEditor lessonId={id}>
  <MetadataPanel />        // Title, overview, status
  <DialogBuilder />        // Add/edit/reorder dialogs
  <VocabularyManager />    // Search/add vocab items
  <GrammarSelector />      // Link/create grammar concepts
  <ExerciseBuilder />      // Type-specific exercise creation
  <ReadingLinker />        // Search/link readings
  <PublishPanel />         // Validation + publish
  <PreviewMode />          // See as learner would
</LessonEditor>
```

**Key UX Flows**:
- **Quick Entry**: Title → Save → Incrementally add components as you study
- **Template Start**: Pick template → Pre-filled structure → Customize
- **Batch Import**: Parse YAML → Create draft → Review/publish

### Implementation Strategy

**P0 - MVP** (Knock this out):
1. Schema migrations (status, author_id, nullable fields)
2. RLS policies for draft/published
3. API endpoints (lessons CRUD + component endpoints)
4. Basic LessonEditor UI
5. Dialog, Vocabulary, Exercise builders
6. Publish workflow with validation

**P1 - Polish**:
1. Grammar concept management UI
2. Reading search/link interface
3. Preview mode (see as learner)
4. Content templates library
5. Bulk operations (duplicate, archive, import)

**P2 - Advanced**:
1. Version history tracking
2. Collaborative authoring (multiple editors)
3. Review/approval workflow
4. Analytics on draft content
5. AI-assisted content generation

### Success Metrics
- **Velocity**: Time from idea → published lesson (target: <15min for simple lesson)
- **Adoption**: % of platform users who author at least 1 lesson
- **Quality**: Published lessons per draft (indicates polish before publish)
- **Retention**: Authors who create 2+ lessons (indicates workflow satisfaction)

---

## Phase 2: Driven Learning Experience

### Problem Statement
**Current State**: Linear lesson flow → passive consumption
**Vision**: Engaging, flow-state learning that hooks users from login → conversation → exercises

**Key Questions**:
1. How to create "BANG" moment when entering lesson?
2. How to hook learners into conversation engagement?
3. Can we run exercises through AI agent for dynamic interaction?
4. How to maintain flow state throughout lesson?

### Engagement Hooks Analysis

#### Hook 1: Immediate Conversation Entry
```
Current Flow:
Login → Course List → Lesson List → Lesson Page → Read Overview → Click Dialog

Desired Flow:
Login → Course → BANG → Conversation Starting
                 ↓
            Immediate immersion, no friction
```

**Implementation Ideas**:
- **Auto-start conversations**: Skip overview, jump into dialog
- **Voice-first**: Speak responses instead of click
- **Adaptive difficulty**: AI adjusts dialog based on performance
- **Contextual setup**: 2-second scene-setting animation → conversation

#### Hook 2: Agent-Driven Exercises
**Current**: Static fill-blank, multiple choice
**Vision**: Dynamic, conversational practice

```tsx
// Traditional Exercise
<FillBlank prompt="Yo ___ estudiante" answer="soy" />

// Agent-Driven Exercise
<AgentExercise
  concept="verb_ser_present"
  mode="conversation"
  adapt={true}
>
  Agent: "Tell me about yourself using SER"
  User: "Yo soy estudiante"
  Agent: "Perfecto! Now ask me what I am"
  User: "¿Qué eres tú?"
  Agent: "Soy profesor. Can you make that negative?"
  ...
</AgentExercise>
```

**Benefits**:
- Infinite variation (never same exercise twice)
- Natural conversation feel
- Adaptive difficulty
- Contextual feedback
- Engaging back-and-forth

**Technical Considerations**:
- LLM API costs
- Response latency
- Quality control (ensuring grammatical accuracy)
- Progress tracking (harder with dynamic content)

#### Hook 3: Flow State Maintenance

**Flow State Triggers**:
1. **Clear goals**: "Complete this conversation"
2. **Immediate feedback**: Real-time validation
3. **Challenge/skill balance**: Adaptive difficulty
4. **No interruptions**: Seamless component transitions
5. **Intrinsic motivation**: Story-driven progression

**UX Patterns**:
```
Lesson Entry
  ↓
Context Setup (2-5 seconds, ambient animation)
  ↓
Dialog (voice-enabled, immediate feedback)
  ↓
Seamless transition to Vocabulary Review
  ↓
Grammar Insight (brief, contextual)
  ↓
Practice Exercises (agent-driven, conversational)
  ↓
Reading (optional, recommended)
  ↓
Completion Celebration + XP
```

**Design Principles**:
- **Minimize clicks**: Auto-progress where possible
- **Maximize voice**: Speak > type > click
- **Contextual UI**: Only show relevant controls
- **Micro-rewards**: XP for each component, not just lesson end
- **Progress visibility**: Clear sense of advancement

### Gamification Elements

**Current**: XP + streaks
**Potential Enhancements**:
- **Combo multipliers**: Maintain flow → 2x XP
- **Mastery badges**: Grammar concept mastery tracking
- **Story progression**: Unlock narrative arcs through lessons
- **Social elements**: Share achievements, compare with friends
- **Daily challenges**: Quick 5-minute targeted practice

### AI Agent Integration Points

1. **Conversation Partner**: Dynamic dialog practice
2. **Exercise Generator**: Infinite practice variations
3. **Pronunciation Coach**: Real-time feedback on speaking
4. **Grammar Explainer**: On-demand contextual explanations
5. **Adaptive Tutor**: Identifies weak areas, suggests practice

### Implementation Considerations

**Technical Challenges**:
- Voice recognition accuracy (Web Speech API vs dedicated service)
- AI response quality/consistency
- Cost management (LLM API calls)
- Offline capability (cached exercises vs dynamic)
- Analytics (tracking engagement, not just completion)

**UX Challenges**:
- Onboarding (teach voice interaction pattern)
- Error handling (misheard speech, AI mistakes)
- Accessibility (screen readers, keyboard navigation)
- Performance (smooth animations, no lag)

### Success Metrics
- **Engagement**: Time in lesson (target: >10min avg)
- **Completion rate**: % who finish lesson after starting (target: >80%)
- **Return rate**: % who start next lesson same session (target: >60%)
- **Flow indicators**: Uninterrupted session length, component completion velocity

---

## Phase 3: Course-from-Corpus Generation

### Vision Statement
**Goal**: Build personalized courses from source texts, adapting difficulty and topics to learner interests

**Example Use Case**:
```
Input:
- Topic sequence: [greetings, introductions, SER verb, adjectives, ...]
- User interests: [Norse sagas, mythology, daily life]
- Source texts: [Poetic Edda, Prose Edda, sagas, modern Icelandic]

Output:
- 20 lessons focusing on topic sequence
- Each lesson uses text from preferred sources
- Text scaled to learner level (A1 version of saga excerpt)
- Vocabulary extracted from corpus, constrained to level
- Grammar lessons taught through authentic text examples
```

### Architecture Components

#### 1. Corpus Analysis Engine
```typescript
interface CorpusAnalyzer {
  // Extract topics present in text
  identifyTopics(text: Text): Topic[]

  // Assess text difficulty (lexical, syntactic, semantic)
  assessDifficulty(text: Text): CEFRLevel

  // Extract vocabulary at target level
  extractVocabulary(text: Text, level: CEFRLevel): VocabItem[]

  // Identify grammar patterns
  findGrammarPatterns(text: Text): GrammarPattern[]
}
```

**Technical Approach**:
- **Topic modeling**: LDA, BERT embeddings for semantic clustering
- **Difficulty assessment**: Lexical frequency analysis, syntactic complexity, readability scores
- **Vocabulary extraction**: Frequency analysis, level-appropriate filtering
- **Grammar detection**: Dependency parsing, pattern matching

#### 2. Text Difficulty Scaler
```typescript
interface TextScaler {
  // Simplify text to target level while preserving meaning
  simplifyTo(text: Text, targetLevel: CEFRLevel): Text

  // Create multiple difficulty tiers from source
  createTiers(text: Text): {
    A1: Text,
    A2: Text,
    B1: Text,
    B2: Text,
    C1: Text,
    original: Text
  }
}
```

**Scaling Strategies**:
1. **Lexical simplification**: Replace rare words with common synonyms
2. **Syntactic simplification**: Break complex sentences, reduce clauses
3. **Semantic preservation**: Maintain core meaning and narrative
4. **Cultural context**: Keep authentic cultural references with glosses

**Example**:
```
Original (C1):
"Þá mælti Hár: Þat er upphaf þessarar sögu at Surtr ferr norðan um Múspellsheima"

Scaled (A1):
"Surtr es un gigante de fuego. Él viaja desde el sur. Hay una batalla grande."

Scaled (B1):
"La historia empieza con Surtr. Surtr es un gigante de fuego que viene
del reino de Múspellsheimr en el sur. Hay una gran batalla."
```

#### 3. Lesson Generator
```typescript
interface LessonGenerator {
  // Generate lesson from topic + corpus
  generateLesson(params: {
    topic: GrammarTopic,
    corpus: Text[],
    level: CEFRLevel,
    userInterests: string[]
  }): LessonDraft

  // Create dialog from corpus examples
  createDialog(
    examples: CorpusExample[],
    topic: Topic
  ): Dialog

  // Generate exercises from corpus
  createExercises(
    corpus: Text,
    topic: Topic,
    count: number
  ): Exercise[]
}
```

**Generation Process**:
```
1. Select Topic (from sequence)
   ↓
2. Filter Corpus by User Interests
   ↓
3. Find Text Segments Demonstrating Topic
   ↓
4. Scale Text to Target Level
   ↓
5. Extract Vocabulary (frequency-limited to level)
   ↓
6. Generate Dialog from Corpus Examples
   ↓
7. Create Grammar Explanation
   ↓
8. Generate Exercises Testing Topic
   ↓
9. Assemble Lesson Components
   ↓
10. Save as Draft for Review
```

#### 4. Course Sequencer
```typescript
interface CourseSequencer {
  // Create course from topic sequence + corpus
  generateCourse(params: {
    topicSequence: GrammarTopic[],
    corpus: Text[],
    level: CEFRLevel,
    lessonsPerTopic: number,
    userInterests: string[]
  }): Course

  // Ensure progressive difficulty
  validateProgression(lessons: Lesson[]): ValidationResult

  // Optimize vocabulary recycling
  optimizeVocabularyRecurrence(course: Course): Course
}
```

**Sequencing Principles**:
- **Vocabulary recycling**: Words introduced early appear in later lessons
- **Grammar scaffolding**: New concepts build on previously taught
- **Topic coherence**: Related topics clustered together
- **Difficulty curve**: Gradual increase, avoiding spikes

### User Workflow

```
1. Define Learning Goals
   - Target topics: [verb conjugations, noun cases, ...]
   - Proficiency level: A1-C2
   - Interests: [sagas, history, daily life, ...]

2. Select Corpus Sources
   - Curated collections: [Eddas, sagas, modern texts]
   - Custom uploads: User provides own texts
   - Generated content: AI-written culturally appropriate texts

3. Configure Course
   - Lessons per topic: 1-5
   - Difficulty progression: gradual vs steep
   - Exercise density: light, medium, heavy

4. Generate Course (Background Job)
   - Analyze corpus (5-10 min)
   - Generate lessons (10-30 min)
   - Create exercises (5-15 min)
   → Course saved as drafts

5. Review & Refine
   - Preview generated lessons
   - Edit content as needed
   - Approve for publishing

6. Publish & Learn
   - Course available to user
   - (Optional) Share with community
```

### Technical Challenges

**Corpus Processing**:
- **Scale**: Processing large texts (MB-GB range)
- **Languages**: Need NLP tools for target languages (Norse, Old English have limited tooling)
- **Quality**: Ensuring extracted content is pedagogically sound

**Text Scaling**:
- **Authenticity vs Simplicity**: Balancing readability with cultural authenticity
- **Meaning preservation**: Simplification without distortion
- **Quality control**: Automated scaling may introduce errors

**Lesson Quality**:
- **Coherence**: Generated lessons may feel disconnected
- **Pedagogical soundness**: Auto-generated exercises may not target learning objectives
- **Cultural appropriateness**: Corpus may contain unsuitable content

**Performance**:
- **Generation time**: 30-60 min for full course
- **Compute cost**: LLM API calls for text processing
- **Storage**: Scaled text versions multiply corpus size

### Mitigation Strategies

1. **Hybrid approach**: AI generation + human review before publish
2. **Template system**: Pre-vetted lesson structures, fill with corpus content
3. **Progressive rollout**: Start with curated corpus, expand to user uploads
4. **Quality gates**: Automated checks for lesson coherence, difficulty consistency
5. **Feedback loop**: Learn from user engagement with generated content

### Success Metrics
- **Generation quality**: % of generated lessons published without major edits
- **User satisfaction**: Ratings of generated courses
- **Engagement**: Completion rate of generated vs hand-crafted courses
- **Efficiency**: Time saved vs manual lesson creation
- **Scalability**: Number of courses generated per week

---

## Strategic Integration

### How Phases Connect

**Phase 1 → Phase 2**:
- Authoring tool enables rapid content iteration for engagement experiments
- Draft lessons can be tested with small cohorts before publishing
- Author feedback informs what makes lessons "engaging"

**Phase 2 → Phase 3**:
- Engagement data reveals what content types hook learners
- Agent interactions provide training data for better generation
- Flow patterns inform optimal lesson structure for generator

**Phase 1 → Phase 3**:
- Generated lessons saved as drafts, reviewed via authoring tool
- Authoring tool becomes review/refinement interface for generated content
- Authors can fine-tune generated content before publishing

### Rollout Strategy

**Quarter 1: Foundation**
- Phase 1 MVP (authoring tool)
- Metrics collection on current lesson engagement
- Technical research on corpus analysis

**Quarter 2: Engagement**
- Phase 2 experiments (voice, agent, flow)
- A/B testing on engagement hooks
- Phase 1 polish based on author feedback

**Quarter 3: Intelligence**
- Phase 3 prototype (single-topic generation)
- Integration of Phases 1 & 2 learnings
- Alpha testing with power users

**Quarter 4: Scale**
- Full course generation capability
- Community corpus contributions
- Multi-language expansion

---

## Risk Assessment

### Technical Risks
- **AI quality**: Generated content may not meet pedagogical standards
- **Cost**: LLM API usage could be expensive at scale
- **Performance**: Complex workflows may have UX-breaking latency
- **NLP availability**: Limited tools for less-common languages

**Mitigation**: Hybrid AI+human approach, cost caps, performance budgets, focus on well-supported languages first

### Product Risks
- **Complexity**: Feature creep, overwhelming users
- **Adoption**: Authors may prefer existing YAML workflow
- **Quality**: Generated content could damage brand if poor

**Mitigation**: Phased rollout, extensive testing, clear quality gates, optional features

### Business Risks
- **Resource allocation**: Significant engineering investment
- **Market fit**: Unknown if users want AI-generated courses
- **Competition**: Other platforms may ship similar features

**Mitigation**: MVP validation before full build, user research, fast iteration

---

## Recommendation

**Execute in order**:

1. **Phase 1 (NOW)**: Clear need, achievable scope, immediate value
   - Enables content velocity
   - Low risk, proven patterns
   - Foundation for future phases

2. **Phase 2 (NEXT)**: Addresses engagement gap, leverages modern AI
   - Differentiated learning experience
   - Moderate risk, requires UX experimentation
   - Builds on Phase 1 content creation

3. **Phase 3 (FUTURE)**: Ambitious, high-value, complex
   - Requires proven engagement patterns from Phase 2
   - Depends on authoring tool from Phase 1 for review workflow
   - High risk, but transformative if successful

**Critical Success Factors**:
- User-centered design throughout
- Metrics-driven iteration
- Quality gates at every stage
- Incremental delivery, frequent validation
