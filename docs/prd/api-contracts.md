# API Contracts

## Internal API Routes

### POST `/api/dictionary/lookup`

**Request:**
```json
{
  "word": "hablar",
  "language": "es"
}
```

**Response (200):**
```json
{
  "word": "hablar",
  "definitions": [
    {
      "partOfSpeech": "verb",
      "translation": "to speak, to talk",
      "examples": ["hablar español", "hablar con alguien"]
    }
  ],
  "cached": false
}
```

**Response (404):**
```json
{
  "error": "WORD_NOT_FOUND",
  "message": "No definition found for 'xyz'.",
  "suggestions": []
}
```

**Response (500):**
```json
{
  "error": "API_ERROR",
  "message": "Dictionary service unavailable."
}
```

---

### POST `/api/tts/speak`

**Request:**
```json
{
  "text": "Buenos días",
  "voiceId": "pNInz6obpgDQGcFmaJgB"
}
```

**Response (200):**
- Content-Type: `audio/mpeg`
- Body: Audio stream (binary)

**Response (429):**
```json
{
  "error": "QUOTA_EXCEEDED",
  "message": "Text-to-speech quota exceeded. Try again tomorrow."
}
```

**Response (500):**
```json
{
  "error": "TTS_ERROR",
  "message": "Text-to-speech service unavailable."
}
```

---

## External API Integrations

### Merriam-Webster Spanish Dictionary

**Endpoint:**
```
GET https://www.dictionaryapi.com/api/v3/references/spanish/json/{word}?key={api_key}
```

**Rate Limit:** 1,000 requests/day (free tier)

**Example Response:**
```json
[
  {
    "meta": {
      "id": "casa",
      "stems": ["casa", "casas"]
    },
    "hwi": { "hw": "casa" },
    "fl": "noun",
    "def": [
      {
        "sseq": [
          [
            ["sense", { "dt": [["text", "house, home"]] }]
          ]
        ]
      }
    ]
  }
]
```

**Error Handling:**
- Empty array `[]` → word not found
- 403 → invalid API key
- 429 → rate limit exceeded

---

### ElevenLabs Text-to-Speech

**Endpoint:**
```
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream
```

**Headers:**
```
xi-api-key: {api_key}
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Hola mundo",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75
  }
}
```

**Rate Limit:** 10,000 characters/month (free tier)

**Response:** MP3 audio stream

**Error Handling:**
- 401 → invalid API key
- 429 → quota exceeded
- 500 → service error

---
