# API Specification

Since we're using **REST API** via Next.js API Routes, here's the OpenAPI 3.0 specification for our proxy endpoints:

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: Interlinear API
  version: 1.0.0
  description: |
    Internal API for Interlinear application. These routes proxy external services
    (Merriam-Webster, ElevenLabs) to protect API keys and enable caching.

    All routes require authentication via Supabase session cookies.

servers:
  - url: http://localhost:3000/api/v1
    description: Local development
  - url: https://interlinear-<hash>.run.app/api/v1
    description: Production (Cloud Run)

components:
  securitySchemes:
    cookieAuth:
      type: apiKey
      in: cookie
      name: sb-access-token
      description: Supabase session cookie (automatically sent by browser)

  schemas:
    DefinitionResponse:
      type: object
      required:
        - word
        - definitions
        - cached
      properties:
        word:
          type: string
          example: "libro"
        definitions:
          type: array
          items:
            type: object
            properties:
              partOfSpeech:
                type: string
                example: "noun"
              translation:
                type: string
                example: "book"
              examples:
                type: array
                items:
                  type: string
                example: ["un libro interesante"]
        cached:
          type: boolean
          description: Whether this result came from server-side cache

    DefinitionError:
      type: object
      required:
        - error
        - message
      properties:
        error:
          type: string
          enum: [WORD_NOT_FOUND, API_ERROR, RATE_LIMIT]
        message:
          type: string
          example: "No definition found for 'xyz'"
        suggestions:
          type: array
          items:
            type: string
          description: Similar words (if available)

    TTSRequest:
      type: object
      required:
        - text
      properties:
        text:
          type: string
          maxLength: 200
          example: "Hola, ¿cómo estás?"
          description: Spanish text to convert to speech
        voiceId:
          type: string
          example: "pNInz6obpgDQGcFmaJgB"
          description: ElevenLabs voice ID (defaults to Spanish voice)

    TTSError:
      type: object
      required:
        - error
        - message
      properties:
        error:
          type: string
          enum: [QUOTA_EXCEEDED, TTS_ERROR, INVALID_TEXT]
        message:
          type: string

paths:
  /dictionary/lookup:
    post:
      summary: Look up Spanish word definition
      description: |
        Proxies request to Merriam-Webster Spanish Dictionary API.
        Results are cached server-side to reduce API calls.
      security:
        - cookieAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - word
                - language
              properties:
                word:
                  type: string
                  example: "hablar"
                  description: Spanish word to look up
                language:
                  type: string
                  enum: [es]
                  example: "es"
                  description: Language code (always "es" for MVP)
      responses:
        '200':
          description: Definition found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DefinitionResponse'
        '404':
          description: Word not found in dictionary
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DefinitionError'
        '429':
          description: Rate limit exceeded (1000 requests/day)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DefinitionError'
        '500':
          description: Merriam-Webster API error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DefinitionError'
        '401':
          description: Unauthorized (no valid session)
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: "UNAUTHORIZED"

  /tts/speak:
    post:
      summary: Convert Spanish text to speech
      description: |
        Proxies request to ElevenLabs TTS API. Streams audio directly to client.
        Character limit: 200 (prevents quota abuse on free tier).
      security:
        - cookieAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TTSRequest'
      responses:
        '200':
          description: Audio stream
          content:
            audio/mpeg:
              schema:
                type: string
                format: binary
          headers:
            Content-Type:
              schema:
                type: string
                example: "audio/mpeg"
        '400':
          description: Invalid text (empty or > 200 chars)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TTSError'
        '429':
          description: Quota exceeded (10,000 chars/month on free tier)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TTSError'
        '500':
          description: ElevenLabs API error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TTSError'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
```

## Implementation Notes

1. **Authentication**: All routes check for valid Supabase session via `createClient()` from `@supabase/ssr`
2. **Server-side caching**: Dictionary lookups use an in-memory Map (lives until container restart)
3. **Rate limiting**: None for MVP (rely on external API limits). Could add later with `node-rate-limiter-flexible`.
4. **Error handling**: All endpoints return consistent error format for frontend parsing.
5. **CORS**: Not needed (API routes and frontend served from same domain).

## Design Decisions

1. **POST for dictionary lookups** - Avoids URL encoding issues with special chars (¿, ñ, etc.)
2. **Streaming audio** - Direct pipe from ElevenLabs to client (no intermediate storage)
3. **v1 versioning** - Future-proof API changes
4. **Cookie auth** - Supabase SSR handles automatically; no need for Bearer tokens
5. **200-char TTS limit** - Prevents quota abuse; user selects sentences not paragraphs

---
