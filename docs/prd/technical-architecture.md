# Technical Architecture

## High-Level Component Tree

```
App
├── AuthProvider (Supabase session)
│
├── LoginPage
│   └── LoginForm
│
├── SignupPage
│   └── SignupForm
│
└── ReaderPage (protected route)
    ├── ReaderHeader
    │   ├── Logo
    │   ├── VocabularyButton
    │   └── LogoutButton
    │
    ├── TextInputPanel (mode === 'input')
    │   ├── Textarea
    │   └── RenderButton
    │
    ├── InteractiveTextPanel (mode === 'render')
    │   ├── ClickableWord[] (generated from tokens)
    │   ├── DefinitionSidebar
    │   │   ├── WordHeader
    │   │   ├── DefinitionList
    │   │   └── AudioPlayer (speaker icon)
    │   └── TextSelectionToolbar
    │       └── PlaySelectionButton
    │
    └── VocabularyListPanel (mode === 'vocabulary')
        └── VocabularyItem[]
            ├── Word
            ├── Definition
            ├── ClickCount
            └── DateSaved
```

---

## Data Flow Diagram

```
┌─────────────────┐
│  User Action    │
│  (Click Word)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  ReaderPage State Update    │
│  setSelectedWord(word)      │
└────────┬────────────────────┘
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
┌──────────────────┐   ┌─────────────────┐
│ Fetch Definition │   │ Save Vocabulary │
│ (API call)       │   │ (Supabase)      │
└────────┬─────────┘   └─────────────────┘
         │
         ▼
┌──────────────────┐
│ Update UI State  │
│ (show sidebar)   │
└──────────────────┘
```

---

## State Management Strategy

**Global State (React Context):**
```typescript
interface AppContext {
  user: User | null;
  vocabulary: VocabularyEntry[];
  addToVocabulary: (entry: VocabularyEntry) => void;
  refreshVocabulary: () => Promise<void>;
}
```

**Local State (Component):**
- `ReaderPage`: mode ('input' | 'render' | 'vocabulary'), tokens, selectedWord
- `DefinitionSidebar`: loading, error, definition
- `AudioPlayer`: playing, loading, error

**Why not Redux/Zustand?**
- MVP scope doesn't need complex state management
- React Context + hooks sufficient for this scale
- Faster to implement and debug

---
