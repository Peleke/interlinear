# Story 8.5: API Routes for Dictionary

## Story
**As a** frontend developer
**I want** REST API endpoints for Latin dictionary lookups
**So that** I can integrate Latin word definitions into the reader interface

## Priority
**P0 - Epic 8, Story 5**

## Estimated Time
1-2 hours

## Dependencies
Story 8.4 (need hybrid service)

## Acceptance Criteria
- [ ] GET `/api/dictionary/latin/[word]` returns dictionary entry
- [ ] GET `/api/dictionary/latin/search?q=[query]` returns suggestions
- [ ] Proper error handling (404 for not found, 500 for errors)
- [ ] Response format matches existing dictionary API
- [ ] Rate limiting considered (optional for MVP)

## Technical Details

### Endpoints

**1. Word Lookup**
- **Route**: `GET /api/dictionary/latin/[word]`
- **Response**: Dictionary entry with meanings, inflections, etymology
- **Errors**: 404 if not found, 400 if invalid, 500 on server error

**2. Search/Autocomplete**
- **Route**: `GET /api/dictionary/latin/search?q=[query]&limit=[n]`
- **Response**: Array of matching entries
- **Use case**: Autocomplete, suggestions

### Response Format
```json
{
  "word": "puella",
  "lemma": "puella",
  "meanings": [
    {
      "partOfSpeech": "noun",
      "definitions": [
        {"definition": "girl, maiden, young woman", "example": null}
      ]
    }
  ],
  "gender": "F",
  "declension": 1,
  "inflections": {"nom_sg": "puella", "gen_sg": "puellae", ...},
  "etymology": "dim. of puer",
  "phonetics": [],
  "source": "enhanced",
  "lookupCount": 42
}
```

### Implementation
**Files**:
- `app/api/dictionary/latin/[word]/route.ts`
- `app/api/dictionary/latin/search/route.ts`

See EPIC-BREAKDOWN-LATIN.md Story 8.5 for complete implementation.

## Testing Checklist
- [ ] `curl http://localhost:3000/api/dictionary/latin/puella` returns entry
- [ ] `curl http://localhost:3000/api/dictionary/latin/asdfghjkl` returns 404
- [ ] `curl http://localhost:3000/api/dictionary/latin/search?q=puel` returns suggestions
- [ ] Response format matches existing API (frontend compatible)
- [ ] Error responses properly formatted

## Architecture References
- `/docs/architecture/coding-standards.md` - API route conventions
- `/docs/EPIC-BREAKDOWN-LATIN.md` - Story 8.5 details

## Definition of Done
- [ ] Both API routes implemented
- [ ] Error handling in place
- [ ] Response format matches existing dictionary API
- [ ] All test curls pass
- [ ] Compatible with frontend components

---

## Dev Agent Record

### Agent Model Used
_To be filled during implementation_

### Tasks Completed
- [ ] Created word lookup route
- [ ] Created search route
- [ ] Implemented error handling
- [ ] Formatted responses for frontend compatibility
- [ ] Tested all endpoints

### Status
**Status**: Draft
