# Story 8.4: Hybrid Dictionary Service with Cache

## Story
**As a** developer
**I want to** create a hybrid dictionary service that orchestrates cache, static dictionary, and CLTK
**So that** we achieve <50ms cached lookups and <2s first-time lookups with enrichment

## Priority
**P0 - Epic 8, Story 4**

## Estimated Time
3-4 hours

## Dependencies
Stories 8.1, 8.2, 8.3 (need all components)

## Acceptance Criteria
- [ ] Service checks PostgreSQL cache first
- [ ] Falls back to Lewis & Short if cache miss
- [ ] Calls CLTK service for enrichment
- [ ] Persists enriched entries to cache
- [ ] Returns unified `DictionaryEntry` format
- [ ] Tracks lookup count for popularity
- [ ] <50ms for cached lookups
- [ ] <2s for first-time lookups with CLTK

## Technical Details

### Lookup Flow
```
User clicks word "puella"
        ↓
Step 1: Check PostgreSQL cache
        ↓ (miss)
Step 2: Lookup Lewis & Short JSON (50k entries)
        → Found: "girl, maiden" + declension info
        ↓
Step 3: CLTK morphological enhancement
        → Lemmatize: "puellae" → "puella"
        → Generate inflections
        → POS: noun, 1st declension, feminine
        ↓
Step 4: Persist enriched entry to PostgreSQL
        → Cache for instant future lookups
        ↓
Step 5: Return unified DictionaryEntry format
```

### Key Features
- **Graceful degradation**: If CLTK fails, still return Lewis & Short entry
- **Fire-and-forget caching**: Don't block response on cache writes
- **Popularity tracking**: Increment lookup_count on each hit
- **Singleton pattern**: Reuse loaded dictionary across requests

### Implementation
**File**: `lib/services/hybrid-latin-dictionary.ts`

See EPIC-BREAKDOWN-LATIN.md Story 8.4 for complete implementation.

## Testing Checklist
- [ ] First lookup: Cache miss → Lewis & Short → CLTK → Persist
- [ ] Second lookup: Cache hit → Returns immediately (<50ms)
- [ ] CLTK failure: Still returns Lewis & Short entry
- [ ] Lookup count increments on each cache hit
- [ ] Search works for autocomplete
- [ ] All data properly stored in database

## Architecture References
- `/docs/PRD-v3-LATIN.md` - Hybrid dictionary architecture
- `/docs/EPIC-BREAKDOWN-LATIN.md` - Story 8.4 details
- `/docs/architecture/coding-standards.md` - Service layer patterns

## Definition of Done
- [ ] HybridLatinDictionary class implemented
- [ ] All lookup orchestration working
- [ ] CLTK integration with graceful fallback
- [ ] Cache persistence working
- [ ] Performance targets met (<50ms/<2s)
- [ ] All tests passing

---

## Dev Agent Record

### Agent Model Used
_To be filled during implementation_

### Tasks Completed
- [ ] Created HybridLatinDictionary class
- [ ] Implemented cache check logic
- [ ] Implemented Lewis & Short fallback
- [ ] Integrated CLTK enhancement
- [ ] Implemented cache persistence
- [ ] Added lookup count tracking
- [ ] Implemented search functionality

### Status
**Status**: Draft
