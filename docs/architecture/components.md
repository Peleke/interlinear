# Components

Based on the architectural patterns, tech stack, and data models, here are the major logical components across the fullstack:

(See full component specifications in original context - includes AuthProvider, TextTokenizer, ClickableWord, DefinitionSidebar, AudioPlayer, VocabularyService, ReaderPage with code examples and tests)

## Component Diagram

```mermaid
graph TB
    User[User Browser] --> ReaderPage[ReaderPage<br/>Orchestrator]

    ReaderPage --> TextTokenizer[TextTokenizer Utility]
    ReaderPage --> ClickableWord[ClickableWord<br/>x N words]
    ReaderPage --> DefinitionSidebar[DefinitionSidebar]
    ReaderPage --> DictionaryAPI[/api/v1/dictionary/lookup]

    DefinitionSidebar --> AudioPlayer[AudioPlayer]
    AudioPlayer --> TTSAPI[/api/v1/tts/speak]

    ReaderPage --> VocabService[VocabularyService]
    VocabService --> Supabase[(Supabase<br/>vocabulary_entries)]

    AuthProvider[AuthProvider] -.provides auth.-> ReaderPage
    AuthProvider --> SupabaseAuth[(Supabase Auth)]

    DictionaryAPI --> MerriamWebster[Merriam-Webster API]
    TTSAPI --> ElevenLabs[ElevenLabs API]

    style ReaderPage fill:#D4A574
    style AuthProvider fill:#D4A574
    style VocabService fill:#8B7355
```

---
