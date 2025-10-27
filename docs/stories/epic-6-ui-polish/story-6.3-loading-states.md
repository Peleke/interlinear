# Story 6.3: Loading & Error States Polish

## Summary
Ensure consistent loading spinners and helpful error messages.

## Status: PARTIAL ✅
Some loading states exist (VocabularyPanel, vocabulary page)

## Current State

### ✅ Already Good
```typescript
// VocabularyPanel - has spinner
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sepia-700" />

// DefinitionSidebar - has loading
{loading && <div>Loading definition...</div>}

// VocabularyCard - has deleting state
{isDeleting ? <spinner /> : <icon />}
```

### ⚠️ Needs Attention

**AudioPlayer** - No loading state for TTS generation
```typescript
// Add:
const [isGenerating, setIsGenerating] = useState(false)
{isGenerating && <span>Generating audio...</span>}
```

**TextInputPanel** - No feedback when switching modes
```typescript
// Maybe add transition state? (optional)
```

## Error Messages

### Current Errors (Good)
```typescript
// VocabularyPanel
"Failed to load vocabulary"

// DefinitionSidebar
"Failed to fetch definition"

// Dictionary API
"Word not found: {word}"
```

### Improvements (Nice to Have)
- Network error vs API error distinction
- Retry buttons for failed requests
- Toast notifications for background operations

## Empty States

### ✅ Already Implemented
```typescript
// VocabularyList
"Your vocabulary is empty. Words you click while reading will appear here."

// DefinitionSidebar (not found)
"Word not found: {word}"
```

## Expected Effort
⚡ **20 minutes** - Add AudioPlayer loading state, verify error messages
