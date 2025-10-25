# External APIs

## Merriam-Webster Spanish Dictionary API

**Purpose:** Provides Spanish-to-English word definitions, part of speech, and example sentences.

**Documentation:** https://dictionaryapi.com/products/api-spanish-dictionary

**Base URL(s):**
- `https://www.dictionaryapi.com/api/v3/references/spanish/json/{word}`

**Authentication:** API key (query parameter)
- Query param: `?key=YOUR_API_KEY`
- Signup: https://dictionaryapi.com/register/index

**Rate Limits:**
- Free tier: 1,000 requests/day
- No per-second throttling documented

**Key Endpoints Used:**

- `GET /api/v3/references/spanish/json/{word}?key={api_key}` - Look up Spanish word

**Integration Notes:**

1. **Transformation required** - Raw API response is verbose; we extract into `DefinitionResponse` format
2. **Error handling:** Empty array `[]` → Word not found, 403 → Invalid API key, 429 → Rate limit exceeded
3. **Caching strategy:** Server-side Map cache (key = word, value = DefinitionResponse)
4. **Security:** API key stored in GCP Secret Manager

---

## ElevenLabs Text-to-Speech API

**Purpose:** Converts Spanish text into realistic AI-powered speech audio (MP3 stream).

**Documentation:** https://elevenlabs.io/docs/api-reference/text-to-speech

**Base URL(s):**
- `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream`

**Authentication:** API key (HTTP header)
- Header: `xi-api-key: YOUR_API_KEY`

**Rate Limits:**
- Free tier: 10,000 characters/month

**Key Endpoints Used:**

- `POST /v1/text-to-speech/{voice_id}/stream` - Generate speech and stream audio
  - **Voice ID:** `pNInz6obpgDQGcFmaJgB` (multilingual Spanish voice)
  - **Model:** `eleven_multilingual_v2` (supports Spanish)
  - **Streaming:** Audio returned as binary stream

**Integration Notes:**

1. **Streaming implementation** - Pipe response directly to client
2. **Character limit enforcement** - Reject requests > 200 chars to prevent quota abuse
3. **Error handling:** 401 → Invalid API key, 429 → Quota exceeded, 500 → Service error
4. **Client-side caching** - Store audio blobs in localStorage (keyed by text)
5. **Security:** API key in GCP Secret Manager

---
