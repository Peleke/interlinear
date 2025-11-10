# Implementation Notes: Epic 6 & 7 Integration

**Document Purpose**: Cross-epic considerations, implementation sequencing, technical decisions, and risk management for Course Management and LLM Content Generation.

**Last Updated**: 2025-01-09
**Author**: Winston (Architect)

---

## Executive Summary

These two epics represent a **transformational leap** in authoring capabilities:
- **Epic 6** provides organizational structure (courses contain lessons)
- **Epic 7** provides content automation (LLM generates lesson components)

**Combined Impact**: Authors can create structured courses with AI-assisted content generation in **<1 hour** vs previous **8-10 hours** of manual work.

**Critical Path**: Epic 6 can be implemented independently. Epic 7 depends on Epic 5 (Content Builders) but NOT Epic 6. However, implementing Epic 6 first provides better UX for Epic 7 (generate content → organize into courses).

---

## Implementation Sequencing

### Recommended Approach: **Epic 6 → Epic 7** (Sequential)

**Rationale**:
1. **Faster time-to-value**: Epic 6 is smaller (10-12 pts vs 18-21 pts), delivers course organization quickly
2. **Better UX flow**: Authors create course structure → generate content → assign to courses
3. **Lower risk**: Epic 6 is pure CRUD, Epic 7 has LLM integration complexity
4. **Testing isolation**: Test course management thoroughly before adding AI complexity

**Timeline Estimate**:
- **Sprint 1 (Week 1)**: Epic 6 implementation + testing (10-12 story points)
- **Sprint 2 (Week 2-3)**: Epic 7 implementation + testing (18-21 story points)
- **Total**: 3 weeks for both epics

### Alternative Approach: **Parallel Implementation** (Advanced)

**Only if**:
- Multiple developers available (2+ engineers)
- Strong test coverage infrastructure
- Acceptance of integration complexity at merge

**Team Split**:
- **Team A**: Epic 6 (courses, lesson organization, UI)
- **Team B**: Epic 7 (LLM service, generation endpoints, review UI)
- **Integration Point**: Week 3 (merge branches, integration testing)

**Risks**:
- Merge conflicts in lesson authoring UI
- Coordination overhead
- Integration testing delayed until week 3

---

## Cross-Epic Integration Points

### 1. Lesson Authoring UI (Shared Component)

**Epic 6 Impact**:
- Adds "Course" dropdown to lesson form
- Adds "Authoring" nav link

**Epic 7 Impact**:
- Adds "🤖 Generate from Reading" button
- Adds generation progress modal
- Adds review modal

**Integration Consideration**:
- Both epics modify `/app/authoring/lessons/[id]/page.tsx`
- Solution: Modular component design
  - `LessonMetadataForm` (Epic 6 adds course dropdown)
  - `AIGenerationControls` (Epic 7 adds generation button)
  - Compose both in lesson editor

**Code Pattern**:
```typescript
// app/authoring/lessons/[id]/page.tsx

export default function LessonEditor({ lessonId }) {
  return (
    <div>
      <LessonMetadataForm lessonId={lessonId} />  {/* Epic 6: course dropdown */}
      <AIGenerationControls lessonId={lessonId} /> {/* Epic 7: generate button */}

      <Tabs>
        <TabPanel value="vocabulary">
          <VocabularyBuilder />
        </TabPanel>
        {/* ... other tabs ... */}
      </Tabs>
    </div>
  )
}
```

---

### 2. Database Schema (Shared Tables)

**Epic 6 Touches**:
- `courses` table (create, read, update, delete)
- `lessons` table (`course_id` nullable FK)
- `lesson_course_ordering` table (new junction table)

**Epic 7 Touches**:
- `vocabulary_items` table (adds `ai_generated`, `ai_metadata` columns)
- `grammar_concepts` table (adds `ai_generated`, `ai_metadata` columns)
- `exercises` table (adds `ai_generated`, `ai_metadata` columns)
- `ai_generation_logs` table (new tracking table)

**No Direct Conflicts**: Each epic modifies different tables

**Migration Sequencing**:
1. Run Epic 6 migration (course management)
2. Run Epic 7 migration (AI metadata columns)
3. Both migrations are **additive** (no breaking changes)

---

### 3. API Routes (Namespace Collision)

**Epic 6 Routes**:
- `POST /api/courses`
- `GET /api/courses`
- `GET /api/courses/[id]`
- `PUT /api/courses/[id]`
- `DELETE /api/courses/[id]`
- `POST /api/courses/[id]/lessons`
- `DELETE /api/courses/[id]/lessons/[lessonId]`
- `PUT /api/courses/[id]/lessons/order`

**Epic 7 Routes**:
- `POST /api/lessons/[id]/generate/vocabulary`
- `POST /api/lessons/[id]/generate/grammar`
- `POST /api/lessons/[id]/generate/exercises`

**No Conflicts**: Different namespaces (`/courses` vs `/lessons/[id]/generate`)

---

### 4. Service Layer (Shared Dependencies)

**Existing Services** (from Epic 5):
- `VocabularyService` (Epic 7 extends with AI generation)
- `GrammarService` (Epic 7 extends with AI generation)
- `ExerciseService` (Epic 7 extends with AI generation)

**New Services**:
- `CourseService` (Epic 6)
- `LLMService` (Epic 7)

**Shared Utilities**:
```
lib/utils/
├── text.ts                 # Existing: sentence extraction, word counting
├── validation.ts           # New: CEFR level validation, content grounding
└── caching.ts              # New: Rate limiting, LLM response caching
```

**Integration**: Services are independent, no coupling required

---

## Shared Infrastructure Needs

### 1. Authentication & Authorization

**Current State**: Supabase Auth with RLS policies
**Epic 6 Needs**: RLS policies for `courses` and `lesson_course_ordering` tables
**Epic 7 Needs**: User ID for rate limiting, cost tracking

**Decision**: Continue using Supabase RLS, no changes needed

---

### 2. Environment Variables

**Epic 6** (no new env vars):
- Uses existing Supabase connection

**Epic 7** (requires new env vars):
```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx  # Fallback provider
```

**Setup Required**:
1. Create Anthropic account (https://console.anthropic.com)
2. Generate API key
3. Add to `.env.local` and deployment environment (Cloud Run secrets)

---

### 3. Rate Limiting Infrastructure

**Epic 7 Requirement**: Rate limiting for LLM generation endpoints

**Options**:
1. **Upstash Redis** (recommended for production)
   - Serverless Redis
   - Built-in rate limiting library
   - Cost: ~$10/month

2. **In-Memory Cache** (MVP acceptable)
   - Node.js Map with TTL
   - Reset on server restart (acceptable for MVP)
   - Cost: $0

**Recommendation**: Start with in-memory cache for MVP, migrate to Upstash Redis if rate limiting abuse detected.

**Implementation**:
```typescript
// lib/utils/rate-limit.ts
import { LRUCache } from 'lru-cache'

const ratelimit = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 60 // 1 hour
})

export async function checkRateLimit(
  userId: string,
  action: string,
  limit: number
): Promise<boolean> {
  const key = `${userId}:${action}`
  const current = ratelimit.get(key) || 0

  if (current >= limit) {
    return false // Rate limited
  }

  ratelimit.set(key, current + 1)
  return true // Allowed
}
```

---

### 4. Cost Monitoring

**Epic 7 Requirement**: Track AI generation costs

**Solution**: `ai_generation_logs` table (already in Epic 7 spec)

**Monitoring Strategy**:
```typescript
// Weekly cost report (scheduled job)
const weeklyCost = await supabase
  .from('ai_generation_logs')
  .select('estimated_cost_usd')
  .gte('created_at', sevenDaysAgo)
  .sum('estimated_cost_usd')

if (weeklyCost > WEEKLY_BUDGET) {
  // Send alert to admin
  await sendSlackAlert(`⚠️ Weekly AI cost: $${weeklyCost} (budget: $${WEEKLY_BUDGET})`)
}
```

**Budget Recommendation**:
- **MVP**: $50/week ($200/month)
- **Growth**: $200/week ($800/month)
- **Scale**: $500/week ($2000/month)

---

## Technical Risks (Cross-Epic)

### Risk 1: Course-Lesson Association Confusion

**Scenario**: Author generates content for lesson → wants to add to course → discovers lesson already in course from `lessons.course_id`

**Issue**: Distinction between `lessons.course_id` (nullable FK) and `lesson_course_ordering` (junction table) unclear

**Mitigation**:
- **UI Clarity**: Lesson form course dropdown labeled "Primary Course (optional)"
- **Documentation**: Clear distinction in code comments
- **Future**: Consider deprecating `lessons.course_id` in favor of junction table only

**Decision Needed**: Should we deprecate `lessons.course_id` now or later?
- **Deprecate Now**: Cleaner data model, less confusion
- **Keep For Now**: Faster implementation, defer breaking change

**Recommendation**: **Keep for now**, deprecate in Epic 8+ after user feedback.

---

### Risk 2: AI Generation Performance Impact

**Scenario**: 100 authors simultaneously generate content → API rate limits → failures

**Issue**: LLM API calls are blocking, high concurrency = degraded performance

**Mitigation**:
- **Per-user rate limiting**: 10 generations/hour (already in Epic 7)
- **Queue system** (future): Defer generations to background worker
- **Caching**: Cache generation results for identical readings
- **Fallback**: Switch to OpenAI if Anthropic rate-limited

**Performance Target**: <30 seconds for vocabulary generation at 50 concurrent users

**Monitoring**: Track generation latency, alert if >60 seconds

---

### Risk 3: Data Migration Sequencing

**Scenario**: Epic 6 deployed → Epic 7 migration adds AI columns → old lesson data missing AI flags

**Issue**: Existing vocabulary/grammar/exercises don't have `ai_generated` column

**Mitigation**:
- **Default values**: `ai_generated DEFAULT FALSE` in migration
- **Backfill**: All existing content marked as human-generated (correct assumption)
- **No data loss**: Additive columns only, no deletions

**Migration Safety**:
```sql
-- Epic 7 migration is backward-compatible
ALTER TABLE vocabulary_items
  ADD COLUMN ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN ai_metadata JSONB;

-- Existing rows get default FALSE (human-generated)
-- New rows can set TRUE (AI-generated)
```

---

## Open Architectural Questions

### Question 1: Should AI generation suggest course organization?

**Context**: Epic 7 generates lesson content, Epic 6 provides course structure

**Potential Enhancement**: LLM analyzes generated content → suggests which course it belongs to

**Example**:
```
User generates content from "Don Quixote Chapter 1" reading
→ LLM suggests: "This lesson belongs to 'Intermediate Spanish Literature' course (B1 level)"
→ Author approves → lesson auto-added to course
```

**Decision**:
- **MVP**: No auto-suggestion (out of scope)
- **Future**: Epic 8 could add "Smart Course Assignment" feature

---

### Question 2: Should courses be multi-language?

**Current Schema**: `courses.language` is single value (`es`, `fr`, etc.)

**Potential Need**: Multi-language courses (e.g., "Spanish for French Speakers")

**Decision**:
- **MVP**: Single language per course
- **Future**: Add `courses.target_languages[]` array if needed

---

### Question 3: Should lesson ordering be manual or automatic?

**Current Design**: Manual drag-and-drop ordering in course detail

**Potential Enhancement**: Auto-sort lessons by difficulty, topic, or creation date

**Decision**:
- **MVP**: Manual ordering only
- **Future**: Add "Auto-Sort" button with options (difficulty, date, topic)

---

### Question 4: What happens to AI-generated content when reading is deleted?

**Scenario**:
1. Author generates vocab/grammar/exercises from reading
2. Author deletes reading from library
3. What happens to AI-generated lesson content?

**Options**:
- **Option A**: Keep content (reading is just source, content is independent)
- **Option B**: Mark content as "orphaned" (source reading deleted)
- **Option C**: Cascade delete (controversial - destroys work)

**Recommendation**: **Option A** - Keep content, reading deletion doesn't affect lessons

**Rationale**: Lessons are independent artifacts, deleting source shouldn't destroy derivative work

---

## Testing Strategy

### Unit Tests

**Epic 6**:
- `CourseService` methods (CRUD operations)
- Lesson-course association logic
- Display order validation

**Epic 7**:
- `LLMService` with mocked Anthropic responses
- Zod schema validation
- Content grounding validation
- Rate limiting logic

### Integration Tests

**Epic 6**:
- API route end-to-end (create course → add lessons → reorder → delete)
- RLS policy enforcement (user A can't access user B's courses)

**Epic 7**:
- Generation API routes with mocked LLM
- Review modal approve/reject workflow
- Cost tracking logs created

### Cross-Epic Integration Tests

**Scenario 1**: Generate content → organize into course
1. Create lesson
2. Generate vocabulary from reading
3. Approve generated content
4. Create course
5. Add lesson to course
6. Verify lesson appears in course detail with generated content

**Scenario 2**: Multi-course lesson reuse
1. Create lesson with AI-generated exercises
2. Add lesson to Course A
3. Add same lesson to Course B
4. Verify junction table has 2 entries
5. Verify lesson displays in both courses

### E2E Tests (Playwright)

**Critical Paths**:
1. **Author creates structured course with AI content**:
   - Create course
   - Create lesson with reading
   - Generate vocabulary/grammar/exercises
   - Review and approve
   - Add lesson to course
   - Verify course detail shows complete lesson

2. **Author organizes existing lessons into course**:
   - Create 3 lessons (manual content)
   - Create course
   - Add all 3 lessons
   - Reorder lessons via drag-and-drop
   - Verify order persists on page refresh

---

## Deployment Considerations

### Database Migrations

**Sequencing**:
1. **Deploy Epic 6**: Run migration for `lesson_course_ordering`, update `lessons.course_id` FK
2. **Verify Epic 6**: Test course CRUD, lesson association
3. **Deploy Epic 7**: Run migration for AI metadata columns, `ai_generation_logs` table
4. **Verify Epic 7**: Test AI generation with mocked LLM (use test API key)

**Rollback Plan**:
- Epic 6: Drop `lesson_course_ordering` table, revert `lessons.course_id` FK changes
- Epic 7: Drop AI metadata columns, drop `ai_generation_logs` table
- Both migrations are **additive**, rollback is non-destructive

---

### Environment Variables

**Production Deployment Checklist**:
```bash
# Epic 7 requires
ANTHROPIC_API_KEY=sk-ant-xxxxx         # Production key
OPENAI_API_KEY=sk-xxxxx                # Fallback key

# Optional monitoring
SLACK_WEBHOOK_URL=https://hooks.slack... # Cost alerts
SENTRY_DSN=https://...                   # Error tracking
```

**Secret Management** (Cloud Run):
```bash
# Add secrets to Cloud Run
gcloud secrets create anthropic-api-key --data-file=./anthropic-key.txt
gcloud secrets create openai-api-key --data-file=./openai-key.txt

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member=serviceAccount:SERVICE_ACCOUNT_EMAIL \
  --role=roles/secretmanager.secretAccessor
```

---

### Feature Flags (Recommended)

**Purpose**: Gradual rollout, A/B testing, kill switch

**Implementation**:
```typescript
// lib/features.ts
export const FEATURES = {
  COURSE_MANAGEMENT: process.env.NEXT_PUBLIC_FEATURE_COURSES === 'true',
  AI_GENERATION: process.env.NEXT_PUBLIC_FEATURE_AI === 'true'
}

// Usage in components
{FEATURES.COURSE_MANAGEMENT && <CourseSelector />}
{FEATURES.AI_GENERATION && <GenerateButton />}
```

**Rollout Strategy**:
1. **Week 1**: Deploy Epic 6 with `FEATURE_COURSES=true` for internal testing
2. **Week 2**: Enable for beta users (10-20 authors)
3. **Week 3**: Enable for all users
4. **Week 4**: Deploy Epic 7 with `FEATURE_AI=true` for internal testing
5. **Week 5**: Enable AI generation for beta users
6. **Week 6**: Enable for all users

---

## Performance Optimization

### Epic 6 Optimizations

**Database Queries**:
```typescript
// Inefficient: N+1 query problem
const courses = await getCourses()
for (const course of courses) {
  const lessonCount = await getLessonCount(course.id) // N queries!
}

// Optimized: Single query with join
const courses = await supabase
  .from('courses')
  .select(`
    *,
    lesson_count:lesson_course_ordering(count)
  `)
```

**Caching**:
- Cache course list for 5 minutes (reduce DB load)
- Invalidate cache on course create/update/delete

---

### Epic 7 Optimizations

**LLM Response Caching**:
```typescript
// Cache key: hash of reading text + generation params
const cacheKey = crypto
  .createHash('sha256')
  .update(`${readingText}:${targetLevel}:${maxItems}`)
  .digest('hex')

// Check cache before LLM call
const cached = await redis.get(`llm:vocab:${cacheKey}`)
if (cached) {
  return JSON.parse(cached)
}

// Call LLM, cache result for 24 hours
const result = await llmService.generateVocabulary(...)
await redis.set(`llm:vocab:${cacheKey}`, JSON.stringify(result), 'EX', 86400)
```

**Streaming Responses**:
```typescript
// Stream LLM responses for better UX
export async function POST(req: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      const result = await llmService.generateVocabulary(...)

      // Send progress updates
      controller.enqueue(JSON.stringify({ status: 'processing', progress: 50 }))

      // Send final result
      controller.enqueue(JSON.stringify({ status: 'complete', items: result.items }))
      controller.close()
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

---

## Future Roadmap (Post-Epic 6 & 7)

### Epic 8: Advanced AI Features (Potential)

**Ideas**:
- Dialog generation from reading themes
- Adaptive difficulty (learn from user edits)
- Multi-language support (French, German, Italian)
- Bulk generation (entire course from reading list)
- Custom prompt templates

**Estimated Effort**: 15-20 story points

---

### Epic 9: Collaborative Authoring (Potential)

**Ideas**:
- Multi-author courses (shared editing)
- Review/approval workflow (author → reviewer → publisher)
- Comment system on lesson components
- Version history (track changes over time)

**Dependency**: Epic 6 (course management) must be complete

**Estimated Effort**: 12-16 story points

---

### Epic 10: Learner Course Enrollment (Logical Next Step)

**Ideas**:
- Learners browse published courses
- Enroll in courses (track progress)
- Course completion certificates
- Learning analytics (time spent, accuracy)

**Dependency**: Epic 6 (courses exist) + lesson publishing workflow

**Estimated Effort**: 18-25 story points

---

## Security Considerations

### Epic 6 Security

**RLS Policies**: Already covered in Epic 6 spec
**Authorization**: Verify author owns course before editing
**Input Validation**: Sanitize course titles, descriptions (XSS prevention)

---

### Epic 7 Security

**API Key Protection**:
- Never expose keys to client
- Use server-side API routes only
- Rotate keys quarterly

**Prompt Injection Prevention**:
```typescript
// Treat reading text as untrusted input
function sanitizeReadingForLLM(text: string): string {
  // Remove potential prompt injection attempts
  // (Though LLM should ignore instructions in data)
  return text.replace(/\n\n(System|Assistant|User):/gi, '')
}
```

**Rate Limiting**: Already covered (10 requests/hour/user)

**Cost Abuse Prevention**:
- Monthly spending caps per user
- Admin dashboard to monitor usage
- Automatic disable if suspicious patterns

---

## Documentation Requirements

### Developer Documentation

**Epic 6**:
- Course management API reference
- Junction table schema explanation
- Drag-and-drop implementation guide

**Epic 7**:
- LLM integration guide
- Prompt engineering best practices
- Cost optimization strategies

---

### User Documentation

**Epic 6** (for authors):
- "How to create a course"
- "How to organize lessons into courses"
- "How to reorder lessons"

**Epic 7** (for authors):
- "How to generate content from readings"
- "How to review AI-generated content"
- "Understanding AI-generated badges"

---

## Success Criteria (Combined)

**Epic 6 + 7 Complete When**:
1. ✅ Author can create course with metadata
2. ✅ Author can add/remove/reorder lessons in course
3. ✅ Author can generate vocab/grammar/exercises from reading
4. ✅ Author can review and approve AI content
5. ✅ AI-generated content clearly marked with badges
6. ✅ Cost tracking logs every generation
7. ✅ All tests passing (unit, integration, E2E)
8. ✅ Deployed to production with feature flags
9. ✅ Documentation complete (developer + user)
10. ✅ **Time-to-lesson**: <1 hour (vs 8-10 hours manual)

---

## Contact & Questions

**Architect**: Winston (@architect agent)
**Questions**: Post in `#epic-6-7-implementation` Slack channel
**Blockers**: Escalate to tech lead if stuck >4 hours

**🚀 LET'S BUILD SOMETHING MAGICAL!**
