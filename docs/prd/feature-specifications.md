# Feature Specifications

## Feature 1: Authentication Flow

**Components:**
- `LoginPage` - Email/password form
- `SignupPage` - Registration form
- `AuthProvider` - Supabase auth context wrapper

**Flow:**
1. User lands on `/` → redirect to `/login` if not authenticated
2. User clicks "Sign up" → navigate to `/signup`
3. User submits form → `supabase.auth.signUp(email, password)`
4. On success → redirect to `/reader`
5. On error → display error message inline

**Edge Cases:**
- Email already exists → "Account already exists. Please log in."
- Network error → "Unable to connect. Please try again."
- Weak password → "Password must be at least 8 characters."

---

## Feature 2: Text Tokenization Engine

**Algorithm:**
```typescript
function tokenizeText(text: string): Token[] {
  // Split by whitespace but preserve punctuation
  const words = text.split(/(\s+)/);

  return words.map((word, index) => ({
    id: `word-${index}`,
    text: word,
    isWhitespace: /^\s+$/.test(word),
    sentence: detectSentence(words, index), // sentence boundary detection
  }));
}
```

**Sentence Detection:**
- Sentence ends at: `. ` `? ` `! `
- Handle edge cases: abbreviations (Dr., Sr.), decimals (3.14)
- Simple heuristic: period followed by space + capital letter

**Output:**
```typescript
interface Token {
  id: string;          // "word-42"
  text: string;        // "hola"
  isWhitespace: boolean;
  sentenceId: number;  // sentence grouping
}
```

---

## Feature 3: Dictionary API Integration

**Proxy Endpoint:** `/api/dictionary/lookup`

**Request:**
```typescript
POST /api/dictionary/lookup
{
  "word": "libro",
  "language": "es"
}
```

**Response (Success):**
```typescript
{
  "word": "libro",
  "definitions": [
    {
      "partOfSpeech": "noun",
      "translation": "book",
      "examples": ["un libro interesante"]
    }
  ],
  "cached": false
}
```

**Response (Not Found):**
```typescript
{
  "error": "WORD_NOT_FOUND",
  "message": "No definition available for this word.",
  "suggestions": ["libros", "libre"]  // optional
}
```

**Implementation:**
```typescript
// app/api/dictionary/lookup/route.ts
export async function POST(req: Request) {
  const { word } = await req.json();

  const response = await fetch(
    `https://www.dictionaryapi.com/api/v3/references/spanish/json/${word}?key=${process.env.MERRIAM_WEBSTER_API_KEY}`
  );

  const data = await response.json();

  // Transform Merriam-Webster format to our format
  return NextResponse.json(transformDefinition(data));
}
```

---

## Feature 4: Text-to-Speech Integration

**Proxy Endpoint:** `/api/tts/speak`

**Request:**
```typescript
POST /api/tts/speak
{
  "text": "Hola, ¿cómo estás?",
  "voiceId": "pNInz6obpgDQGcFmaJgB"  // optional, defaults to Spanish voice
}
```

**Response:**
- Content-Type: `audio/mpeg`
- Streams audio directly to client

**Implementation:**
```typescript
// app/api/tts/speak/route.ts
export async function POST(req: Request) {
  const { text, voiceId = 'pNInz6obpgDQGcFmaJgB' } = await req.json();

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    }
  );

  // Stream response directly
  return new Response(response.body, {
    headers: { 'Content-Type': 'audio/mpeg' }
  });
}
```

**Client-Side Usage:**
```typescript
async function playAudio(text: string) {
  const response = await fetch('/api/tts/speak', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  await audio.play();
}
```

---

## Feature 5: Vocabulary Persistence

**Auto-Save Logic:**
```typescript
async function handleWordClick(word: Token) {
  // 1. Fetch definition (if not cached)
  const definition = await fetchDefinition(word.text);

  // 2. Show in UI
  setSelectedWord({ word, definition });

  // 3. Save to database (async, non-blocking)
  saveVocabulary({
    word: word.text,
    definition,
    sentenceId: word.sentenceId,
    language: 'es'
  });
}
```

**Deduplication:**
- Check if word exists: `SELECT * FROM vocabulary_entries WHERE user_id = $1 AND word = $2`
- If exists: `UPDATE click_count = click_count + 1`
- If new: `INSERT INTO vocabulary_entries`

**Row-Level Security (RLS):**
```sql
-- Users can only read their own vocabulary
CREATE POLICY "Users can view own vocabulary"
ON vocabulary_entries FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own vocabulary
CREATE POLICY "Users can insert own vocabulary"
ON vocabulary_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---
