# Core Workflows

(See full workflow sequence diagrams in original context - includes Auth Flow, Word Lookup, Audio Playback, Sentence Selection, Vocabulary List, Error Handling)

## Key Workflow Highlights

1. **Parallel operations** - Definition fetch and vocabulary save happen simultaneously (don't block UI)
2. **Optimistic UI** - Mark word as "saved" immediately (don't wait for DB confirmation)
3. **Error boundaries** - Each workflow has clear error paths that don't crash the app
4. **Streaming audio** - ElevenLabs audio streams directly to browser (no intermediate storage)
5. **RLS enforcement** - Supabase automatically filters queries by `auth.uid()` (no manual checking needed)
6. **Cache-first strategy** - Dictionary API checks server cache before hitting Merriam-Webster

---
