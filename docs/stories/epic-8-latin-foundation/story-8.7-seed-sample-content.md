# Story 8.7: Seed Sample Latin Content

## Story
**As a** product manager
**I want** demo-ready Latin content with working dictionary lookups
**So that** I can show off the platform to potential users and investors

## Priority
**P1 - Epic 8, Story 7 (nice to have for MVP)**

## Estimated Time
2 hours

## Dependencies
Story 8.6 (need frontend working)

## Acceptance Criteria
- [ ] 2-3 sample Latin readings created (Cicero, Caesar, Virgil)
- [ ] Sample lesson created linking to reading
- [ ] Can test full flow: read → click word → see definition
- [ ] Demo-ready content for showing off the platform

## Technical Details

### Sample Content

**1. Cicero - In Catilinam I (Opening)**
- Famous rhetorical questions
- Intermediate difficulty
- Great for demonstrating persuasive Latin

**2. Caesar - De Bello Gallico I.1 (Opening)**
- "Gallia est omnis divisa in partes tres..."
- Beginner difficulty
- Clear, straightforward prose

**3. Virgil - Aeneid I.1-4 (Opening)**
- "Arma virumque cano..."
- Advanced difficulty
- Epic poetry, complex syntax

### Seeding Script
**File**: `scripts/seed-latin-demo.ts`

Steps:
1. Create 3 readings in `library_readings`
2. Create 1 lesson in `lessons`
3. Link Cicero reading to lesson in `lesson_readings`

See EPIC-BREAKDOWN-LATIN.md Story 8.7 for complete implementation.

## Testing Checklist
- [ ] Script runs without errors
- [ ] 3 readings appear in library
- [ ] 1 lesson appears in courses
- [ ] Can open Cicero reading and click words
- [ ] Dictionary lookups work for common words (quo, usque, tandem, etc.)

## Architecture References
- `/docs/EPIC-BREAKDOWN-LATIN.md` - Story 8.7 details

## Definition of Done
- [ ] Seeding script created
- [ ] 3 Latin readings seeded
- [ ] 1 Latin lesson seeded
- [ ] Lesson links to Cicero reading
- [ ] Full end-to-end demo works
- [ ] Content ready for product demos

---

## Dev Agent Record

### Agent Model Used
_To be filled during implementation_

### Tasks Completed
- [ ] Created seed script
- [ ] Added Cicero reading
- [ ] Added Caesar reading
- [ ] Added Virgil reading
- [ ] Created demo lesson
- [ ] Linked reading to lesson
- [ ] Tested full flow

### Status
**Status**: Draft
