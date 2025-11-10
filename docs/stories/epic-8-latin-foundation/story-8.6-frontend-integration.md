# Story 8.6: Frontend Integration

## Story
**As a** student
**I want to** click on Latin words in readings and see dictionary definitions
**So that** I can learn Latin vocabulary while reading authentic texts

## Priority
**P0 - Epic 8, Story 6**

## Estimated Time
2-3 hours

## Dependencies
Story 8.5 (need API routes)

## Acceptance Criteria
- [ ] Reader component updated to support language parameter
- [ ] Latin readings can be created and viewed
- [ ] Click-to-define works for Latin words
- [ ] Dictionary popover displays Latin-specific fields (declension, gender)
- [ ] Language selector shows Latin option
- [ ] Existing Spanish/English functionality unaffected

## Technical Details

### Frontend Updates

**1. Language-Aware Dictionary Service**
**File**: `lib/services/dictionary.ts`
- Add `language` parameter to `lookupWord()`
- Route to appropriate dictionary API based on language
- Support 'la' (Latin), 'es' (Spanish), 'en' (English)

**2. Enhanced Dictionary Popover**
**File**: `components/reader/DictionaryPopover.tsx`
- Display lemma if different from word
- Show declension and gender for nouns
- Display inflections table (collapsible)
- Show etymology if available
- Maintain backward compatibility with English/Spanish

**3. Library Page Updates**
**File**: `app/library/page.tsx`
- Add language filter dropdown
- Show Latin readings
- Filter by language: 'all', 'en', 'es', 'la'

### Latin-Specific UI Elements
- **Lemma Display**: Show "puellae → puella" if different
- **Grammar Info**: "F, 1st declension"
- **Inflections Table**: Expandable detail showing all forms
- **Etymology**: Italicized footer note

## Tasks

### 1. Update Dictionary Service
Add language routing to existing `lookupWord()` function.

### 2. Update DictionaryPopover Component
Add Latin-specific fields while maintaining existing structure.

### 3. Update Library Page
Add language filter UI.

### 4. Test End-to-End
- Create test Latin reading
- Click word
- Verify popover shows Latin-specific data

See EPIC-BREAKDOWN-LATIN.md Story 8.6 for complete implementation.

## Testing Checklist
- [ ] Can create Latin reading via author interface
- [ ] Latin reading displays properly in reader
- [ ] Clicking Latin word shows dictionary popover
- [ ] Popover displays declension, gender, inflections
- [ ] Language selector shows Latin option
- [ ] Spanish/English readings still work correctly

## Architecture References
- `/docs/architecture/source-tree.md` - Component locations
- `/docs/EPIC-BREAKDOWN-LATIN.md` - Story 8.6 details

## Definition of Done
- [ ] Dictionary service supports language parameter
- [ ] Popover displays Latin-specific fields
- [ ] Library page has language filter
- [ ] All existing functionality preserved
- [ ] End-to-end test passes

---

## Dev Agent Record

### Agent Model Used
_To be filled during implementation_

### Tasks Completed
- [ ] Updated dictionary.ts with language routing
- [ ] Enhanced DictionaryPopover component
- [ ] Added language filter to library page
- [ ] Tested Latin word lookups
- [ ] Verified backward compatibility

### Status
**Status**: Draft
