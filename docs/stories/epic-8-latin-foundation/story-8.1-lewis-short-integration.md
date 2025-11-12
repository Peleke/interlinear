# Story 8.1: Lewis & Short JSON Integration

## Story
**As a** developer
**I want to** integrate the Lewis & Short Latin dictionary JSON files into the application
**So that** we have 50,000 Latin words available for instant lookup

## Priority
**P0 - Epic 8, Story 1 (START HERE)**

## Estimated Time
2-3 hours

## Dependencies
None (first story in Epic 8)

## Acceptance Criteria
- [ ] Lewis & Short JSON files downloaded and stored in `data/latin-dictionary/`
- [ ] All 26 files (ls_A.json through ls_Z.json) present
- [ ] Can load dictionary into memory (~50k entries)
- [ ] Can perform exact match lookups by headword
- [ ] Can handle macron variations (ā → a)
- [ ] Basic search functionality works (substring matching)

## Technical Details

### Lewis & Short Dictionary
- **Source**: [GitHub: lewis-short-json](https://github.com/IohannesArnold/lewis-short-json)
- **License**: Creative Commons (Perseus Digital Library)
- **Format**: JSON, 26 files (A-Z), ~50,000 entries
- **Quality**: Gold standard Latin dictionary

### Entry Structure
```json
{
  "key": "puella",
  "entry_type": "main",
  "part_of_speech": "noun",
  "gender": "F",
  "declension": 1,
  "title_genitive": "ae",
  "title_orthography": "pŭella",
  "senses": [
    "a girl, maiden, young woman",
    "a sweetheart, mistress"
  ],
  "main_notes": "dim. of puer"
}
```

### Tasks

#### 1. Download Dictionary Data
```bash
# Clone repository
gh repo clone IohannesArnold/lewis-short-json

# Create data directory
mkdir -p data/latin-dictionary

# Move JSON files
mv lewis-short-json/ls_*.json data/latin-dictionary/

# Verify all 26 files present
ls data/latin-dictionary/ | wc -l  # Should output 26
```

#### 2. Create TypeScript Service
**File**: `lib/services/latin-dictionary.ts`

See EPIC-BREAKDOWN-LATIN.md Story 8.1 for complete implementation.

#### 3. Create Test Script
**File**: `scripts/test-latin-dictionary.ts`

Test cases:
- Lookup "puella" → returns entry
- Lookup "pŭella" (with macron) → returns same entry
- Lookup "PUELLA" (uppercase) → returns entry
- Search "puel" → returns puella, puellar, etc.
- Lookup "asdfghjkl" → returns null
- Stats show ~50,000 entries

## Testing Checklist
- [ ] Dictionary loads without errors
- [ ] Exact match works: `lookup("puella")` → returns entry
- [ ] Macron handling works: `lookup("pŭella")` → returns same entry
- [ ] Case insensitive: `lookup("PUELLA")` → returns entry
- [ ] Search works: `search("puel")` → returns suggestions
- [ ] Not found returns null: `lookup("asdfghjkl")` → null
- [ ] Stats show correct count: ~50,000 entries

## Architecture References
- `/docs/PRD-v3-LATIN.md` - Latin learning platform PRD
- `/docs/EPIC-BREAKDOWN-LATIN.md` - Epic 8 detailed breakdown
- `/docs/architecture/tech-stack.md` - Technology stack

## Definition of Done
- [ ] All 26 Lewis & Short JSON files in `data/latin-dictionary/`
- [ ] `LatinDictionaryService` class implemented and tested
- [ ] Test script runs successfully with all test cases passing
- [ ] Dictionary loads ~50,000 entries on initialization
- [ ] Lookup and search functions work correctly
- [ ] Code follows project coding standards

---

## Dev Agent Record

### Agent Model Used
_To be filled during implementation_

### Tasks Completed
- [ ] Downloaded Lewis & Short JSON files
- [ ] Created data directory structure
- [ ] Implemented LatinDictionaryService class
- [ ] Implemented normalize() method for macron handling
- [ ] Implemented lookup() method
- [ ] Implemented search() method
- [ ] Created test script
- [ ] All tests passing

### Debug Log References
_To be filled if issues encountered_

### Completion Notes
_To be filled upon completion_

### File List
_To be filled with created/modified files_

### Change Log
_To be filled with significant changes_

### Status
**Status**: Draft
