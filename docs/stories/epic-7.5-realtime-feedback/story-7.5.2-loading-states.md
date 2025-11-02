# Story 7.5.2: Add Loading States to Dialog

**Epic**: 7.5 - Real-Time Tutor Feedback
**Status**: ✅ Completed
**Priority**: P1
**Estimated Effort**: 1 hour
**Dependencies**: None

---

## User Story

**As a** language learner
**I want to** see clear feedback when actions are processing
**So that** I know the app is working and not frozen

---

## Acceptance Criteria

- [ ] "Terminar Dialog" button shows loading state while analyzing
- [ ] Button disabled during processing to prevent double-clicks
- [ ] Loading spinner or text indicates progress
- [ ] Toast notification on analysis completion
- [ ] Message sending shows loading state
- [ ] Voice input shows recording/processing state
- [ ] Graceful error handling with user-friendly messages

---

## Technical Specification

### Components to Update

#### 1. DialogView - "Terminar Dialog" Button
```typescript
const [analyzing, setAnalyzing] = useState(false)

const handleEndDialog = async () => {
  setAnalyzing(true)
  try {
    const response = await fetch('/api/tutor/analyze', {
      method: 'POST',
      body: JSON.stringify({ sessionId, messages })
    })
    const data = await response.json()
    onAnalysisComplete(data.errors)

    // Show success toast
    toast.success(`Analysis complete! Found ${data.errors.length} areas for improvement`)
  } catch (error) {
    toast.error('Failed to analyze conversation. Please try again.')
  } finally {
    setAnalyzing(false)
  }
}

// Button component
<Button
  onClick={handleEndDialog}
  disabled={loading || analyzing}
  variant="outline"
>
  {analyzing ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Analyzing...
    </>
  ) : (
    'Terminar Dialog'
  )}
</Button>
```

#### 2. Message Sending State
```typescript
const [sending, setSending] = useState(false)

const handleSendMessage = async () => {
  if (!inputValue.trim()) return

  setSending(true)
  try {
    const userMessage = { role: 'user', content: inputValue }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    const response = await fetch('/api/tutor/turn', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message: inputValue })
    })

    const data = await response.json()
    setMessages(prev => [...prev, { role: 'assistant', content: data.aiMessage }])
  } catch (error) {
    toast.error('Failed to send message. Please try again.')
  } finally {
    setSending(false)
  }
}

// Send button
<Button disabled={sending || !inputValue.trim()}>
  {sending ? <Loader2 className="animate-spin" /> : <Send />}
</Button>
```

#### 3. Voice Input State
```typescript
// In VoiceInput.tsx
const [recording, setRecording] = useState(false)
const [processing, setProcessing] = useState(false)

<Button onClick={handleVoiceInput} disabled={recording || processing}>
  {recording ? (
    <>
      <Mic className="animate-pulse text-red-500" />
      Recording...
    </>
  ) : processing ? (
    <>
      <Loader2 className="animate-spin" />
      Processing...
    </>
  ) : (
    <Mic />
  )}
</Button>
```

---

## Implementation Steps

1. **Install Dependencies** (if needed)
   ```bash
   npm install lucide-react  # Already installed
   npm install sonner        # For toast notifications (lightweight)
   ```

2. **Add Toast Provider**
   ```tsx
   // app/layout.tsx
   import { Toaster } from 'sonner'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Toaster position="top-right" />
         </body>
       </html>
     )
   }
   ```

3. **Update DialogView Component**
   - Add `analyzing` state
   - Update "Terminar Dialog" button with loading
   - Add error handling with toast
   - Add success notification

4. **Update Message Sending**
   - Add `sending` state
   - Disable input during send
   - Show spinner in send button
   - Handle errors gracefully

5. **Update VoiceInput Component**
   - Add `recording` and `processing` states
   - Animate microphone icon during recording
   - Show processing state after recording stops
   - Handle browser compatibility errors

---

## Testing Checklist

### Unit Tests
- [ ] Button disabled during loading
- [ ] Loading state shows correct text/icon
- [ ] State resets after completion
- [ ] State resets after error

### Integration Tests
- [ ] End dialog → see "Analyzing..." → see toast
- [ ] Send message → button disabled → re-enabled after response
- [ ] Voice input → recording state → processing state → done
- [ ] Network error → toast error message displayed

### E2E Tests
- [ ] Complete dialog flow with loading states
- [ ] Test on slow network (throttle to 3G)
- [ ] Test error scenarios (disconnect, API down)
- [ ] Multiple rapid clicks don't cause issues

---

## UI/UX Design

### Loading States Visual Design

**Terminar Dialog Button**
```
Normal:     [Terminar Dialog]
Loading:    [⟳ Analyzing...]        (spinning icon)
Success:    [✓ Analysis Complete]   (brief, then hide)
```

**Send Message Button**
```
Normal:     [→]  (send icon)
Loading:    [⟳]  (spinning)
```

**Voice Input Button**
```
Normal:     [🎤]
Recording:  [🔴] (pulsing red)
Processing: [⟳]  (spinning)
```

### Toast Notifications
```typescript
// Success
toast.success('Analysis complete! Found 3 areas for improvement')

// Error
toast.error('Failed to analyze. Please try again.')

// Info (optional)
toast.info('Recording... Speak clearly in Spanish')
```

---

## Technical Notes

### Toast Library Options

**Option 1: Sonner** (Recommended)
- Lightweight (4KB)
- Beautiful default styling
- Accessible
- `npm install sonner`

**Option 2: React Hot Toast**
- Popular alternative
- 3KB
- `npm install react-hot-toast`

**Option 3: Custom Toast**
- Use existing UI components
- More control but more code

### Timeout Configuration
```typescript
// API call timeouts
const ANALYZE_TIMEOUT = 30000  // 30 seconds
const TURN_TIMEOUT = 10000      // 10 seconds
const VOICE_TIMEOUT = 5000      // 5 seconds

// Toast durations
const SUCCESS_DURATION = 3000   // 3 seconds
const ERROR_DURATION = 5000     // 5 seconds
```

---

## Success Criteria

**Story Complete When**:
- ✅ All buttons show loading states appropriately
- ✅ Users can't double-click/spam buttons
- ✅ Toast notifications inform users of outcomes
- ✅ Error handling provides clear feedback
- ✅ Loading states tested on slow connections
- ✅ All tests passing
- ✅ Code reviewed and merged

---

## Related Files

```
components/tutor/DialogView.tsx       # Main component
components/tutor/VoiceInput.tsx       # Voice input state
app/layout.tsx                         # Toast provider
package.json                           # Add sonner dependency
```

---

**Created**: 2025-10-31
**Author**: James (Dev Agent)
