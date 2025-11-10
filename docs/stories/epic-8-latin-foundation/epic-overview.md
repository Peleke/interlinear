# Epic 8: Latin Foundation

## Overview
**Goal**: Get Latin dictionary working with hybrid architecture (static + CLTK enhancement)

**Why This First**: Validates entire architecture, fastest path to working prototype, best resources

**Timeline**: 1-2 weeks (10-15 hours total)

**Priority**: 🔴 P0 - START HERE

## Success Criteria
- ✅ 50,000 Latin words available instantly from Lewis & Short
- ✅ <50ms cached lookups, <2s first-time lookups with CLTK
- ✅ All cached entries have morphological data (inflections, POS, gender)
- ✅ Can read sample Latin texts and get definitions with one click
- ✅ Language-agnostic design allows easy swap to Old Norse later

## Stories

| # | Story | Priority | Time | Status |
|---|-------|----------|------|--------|
| 8.1 | [Lewis & Short JSON Integration](./story-8.1-lewis-short-integration.md) | P0 | 2-3h | Draft |
| 8.2 | [Database Schema Creation](./story-8.2-database-schema.md) | P0 | 1h | Draft |
| 8.3 | [CLTK Python Microservice Setup](./story-8.3-cltk-microservice.md) | P0 | 2-3h | Draft |
| 8.4 | [Hybrid Dictionary Service with Cache](./story-8.4-hybrid-dictionary-service.md) | P0 | 3-4h | Draft |
| 8.5 | [API Routes for Dictionary](./story-8.5-api-routes.md) | P0 | 1-2h | Draft |
| 8.6 | [Frontend Integration](./story-8.6-frontend-integration.md) | P0 | 2-3h | Draft |
| 8.7 | [Seed Sample Latin Content](./story-8.7-seed-sample-content.md) | P1 | 2h | Draft |

**Total Estimated Time**: 13-18 hours

## Architecture

### Hybrid Dictionary Flow
```
User clicks Latin word
        ↓
Step 1: Check PostgreSQL cache (instant)
        ↓ (miss on first lookup)
Step 2: Lookup Lewis & Short JSON (50k words)
        → Found: English definition + basic grammar
        ↓
Step 3: CLTK morphological enhancement
        → Lemmatize inflected forms
        → Generate full inflection tables
        → POS tagging (noun/verb/adj/etc.)
        ↓
Step 4: Persist to PostgreSQL cache
        → Future lookups <50ms
        ↓
Step 5: Return enriched entry to user
```

### Key Benefits
- ✅ **Cold start**: 50,000 Latin words instantly available (Lewis & Short)
- ✅ **Incremental enhancement**: First lookup ~2s, subsequent <50ms
- ✅ **Self-improving**: Database gets richer with usage
- ✅ **Morphological awareness**: Every cached word has inflection tables
- ✅ **Language-agnostic**: Same architecture works for Old Norse, Greek, etc.

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Static Dictionary | Lewis & Short JSON (50k entries) | Base dictionary coverage |
| Enhancement | CLTK Python (FastAPI microservice) | Morphological analysis |
| Cache | PostgreSQL (Supabase) | Persistent enriched entries |
| Frontend | TypeScript/Next.js | Reader interface |
| Container | Docker | CLTK service deployment |

## Dependencies

### External Resources
- **Lewis & Short JSON**: [GitHub](https://github.com/IohannesArnold/lewis-short-json)
- **CLTK**: Classical Language Toolkit for Python
- **FastAPI**: Python web framework for CLTK service

### Project Dependencies
- Existing reader component (from Epic 2)
- Existing dictionary popover (from Epic 3)
- Supabase database (from Epic 1)

## Testing Strategy

### Unit Tests
- Dictionary service: Lookup, search, normalization
- CLTK service: Lemmatization, POS tagging
- API routes: Error handling, response format

### Integration Tests
- End-to-end: Click word → See enriched definition
- Cache behavior: First lookup vs. subsequent
- CLTK fallback: Graceful degradation if service fails

### Performance Tests
- Cached lookup: <50ms target
- First lookup with CLTK: <2s target
- Dictionary load time: <5s on startup

## Completion Checklist

**Before marking Epic 8 as DONE**:
- [ ] All 7 stories completed
- [ ] Lewis & Short dictionary integrated (50k words)
- [ ] Database schema created and migrated
- [ ] CLTK microservice running
- [ ] Hybrid dictionary service orchestrates all layers
- [ ] API routes functional
- [ ] Frontend displays Latin content properly
- [ ] Sample Latin content seeded
- [ ] End-to-end test: Read Latin → Click word → See enriched definition
- [ ] Performance targets met (<50ms cached, <2s first lookup)
- [ ] Documentation updated

## Next Steps After Epic 8

After completing Latin foundation, choose one of:
- **Epic 10**: Conversational Dialogs MVP (validate conversation-first learning)
- **Epic 9**: winkNLP Text Intelligence (add linguistic analysis)
- **Epic 11**: Grammar Index System (grammar-aware content)

## References
- [PRD v3: Latin Learning Platform](../../PRD-v3-LATIN.md)
- [Epic Breakdown: Detailed Stories](../../EPIC-BREAKDOWN-LATIN.md)
- [Tech Stack](../../architecture/tech-stack.md)
