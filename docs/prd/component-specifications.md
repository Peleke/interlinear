# Component Specifications

## Component: `ClickableWord`

**Props:**
```typescript
interface ClickableWordProps {
  token: Token;
  isSelected: boolean;
  isSaved: boolean;
  onClick: (token: Token) => void;
}
```

**Behavior:**
- Renders word as clickable `<span>`
- Applies hover effect (underline)
- Shows visual indicator if saved (subtle background color)
- Active state when selected (highlighted)

**Styling:**
```css
.word {
  cursor: pointer;
  transition: background-color 150ms ease;
}

.word:hover {
  text-decoration: underline;
}

.word.saved {
  background-color: rgba(59, 130, 246, 0.1);
}

.word.selected {
  background-color: rgba(59, 130, 246, 0.2);
}
```

---

## Component: `DefinitionSidebar`

**Props:**
```typescript
interface DefinitionSidebarProps {
  word: string;
  definition: Definition | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onPlayAudio: (text: string) => void;
}
```

**Layout:**
```
┌─────────────────────────┐
│ Word: libro         [X] │  ← Header with close button
├─────────────────────────┤
│ 🔊 Listen              │  ← Audio button
├─────────────────────────┤
│ noun                    │  ← Part of speech
│ • book                  │  ← Definitions
│ • publication           │
├─────────────────────────┤
│ Examples:               │  ← Examples (if available)
│ "un libro interesante"  │
└─────────────────────────┘
```

**Animation:**
- Slides in from right (desktop) or bottom (mobile)
- 300ms ease-out transition
- Overlay darkens background (30% opacity)

---

## Component: `VocabularyList`

**Props:**
```typescript
interface VocabularyListProps {
  entries: VocabularyEntry[];
  loading: boolean;
  onRefresh: () => void;
}
```

**Layout:**
```
┌─────────────────────────────────┐
│ My Vocabulary (42 words)        │
│ [Sort: Recent ▼] [Filter...]    │
├─────────────────────────────────┤
│ libro                           │
│ book • noun • 3 clicks          │
│ Saved 2 hours ago               │
├─────────────────────────────────┤
│ hablar                          │
│ to speak • verb • 1 click       │
│ Saved 5 hours ago               │
├─────────────────────────────────┤
│ ...                             │
└─────────────────────────────────┘
```

**Empty State:**
```
┌─────────────────────────────────┐
│                                 │
│    📚 No vocabulary yet         │
│    Start clicking words to      │
│    build your list!             │
│                                 │
└─────────────────────────────────┘
```

---

## Component: `AudioPlayer`

**Props:**
```typescript
interface AudioPlayerProps {
  text: string;
  autoPlay?: boolean;
  onError?: (error: Error) => void;
}
```

**States:**
- Idle: Speaker icon (gray)
- Loading: Spinner animation
- Playing: Animated sound waves
- Error: Icon hidden or error indicator

**Implementation:**
```typescript
function AudioPlayer({ text, autoPlay = false }: AudioPlayerProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing'>('idle');

  const play = async () => {
    setStatus('loading');

    try {
      const response = await fetch('/api/tts/speak', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('TTS failed');

      const blob = await response.blob();
      const audio = new Audio(URL.createObjectURL(blob));

      setStatus('playing');
      await audio.play();

      audio.onended = () => setStatus('idle');
    } catch (error) {
      setStatus('idle');
      // Show error notification
    }
  };

  return (
    <button onClick={play} disabled={status === 'loading'}>
      {status === 'idle' && <SpeakerIcon />}
      {status === 'loading' && <Spinner />}
      {status === 'playing' && <SoundWaveIcon />}
    </button>
  );
}
```

---
