# Story 7.5.5: Integrate Real-Time Feedback

**Epic**: 7.5 - Real-Time Tutor Feedback
**Status**: ✅ Completed
**Priority**: P0
**Estimated Effort**: 2 hours
**Dependencies**:
  - Story 7.5.3 (Per-Turn Correction API)
  - Story 7.5.4 (Collapsible Feedback Component)

---

## User Story

**As a** language learner
**I want** corrections to appear automatically after each message I send
**So that** I learn from my mistakes in real-time during the conversation

---

## Acceptance Criteria

- [ ] MessageCorrection component displays below user messages
- [ ] Corrections appear immediately after API response
- [ ] Correction data stored in message history
- [ ] Historical messages show corrections on scroll
- [ ] Corrections available for flashcard creation
- [ ] No performance degradation with many messages
- [ ] Error handling shows graceful fallback
- [ ] Works on mobile and desktop

---

## Technical Specification

### Update DialogView Component

**File**: `components/tutor/DialogView.tsx`

#### 1. Update Message Interface
```typescript
interface Message {
  role: 'user' | 'assistant'
  content: string
  correction?: TurnCorrection  // NEW: Store correction data
  timestamp?: Date
}
```

#### 2. Update State Management
```typescript
const [messages, setMessages] = useState<Message[]>([])

const handleSendMessage = async () => {
  if (!inputValue.trim()) return

  setSending(true)
  try {
    // Add user message without correction initially
    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    // Call API
    const response = await fetch('/api/tutor/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: inputValue
      })
    })

    const data = await response.json()

    // Update user message with correction
    setMessages(prev => {
      const updated = [...prev]
      const lastUserMsg = updated.findLast(m => m.role === 'user')
      if (lastUserMsg) {
        lastUserMsg.correction = data.correction
      }
      return updated
    })

    // Add AI response
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: data.aiMessage,
        timestamp: new Date()
      }
    ])

    setTurnNumber(data.turnNumber)

    // Check if conversation should end
    if (data.shouldEnd) {
      // Handle end-of-conversation logic
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    toast.error('Failed to send message. Please try again.')
  } finally {
    setSending(false)
  }
}
```

#### 3. Update Message Rendering
```typescript
<div className="space-y-4">
  {messages.map((message, idx) => (
    <div
      key={idx}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          message.role === 'user'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <p>{message.content}</p>

        {/* NEW: Show correction for user messages */}
        {message.role === 'user' && message.correction && (
          <MessageCorrection
            correction={message.correction}
            isUserMessage={true}
          />
        )}
      </div>
    </div>
  ))}
</div>
```

---

## Implementation Steps

1. **Update Message Type Definition**
   ```typescript
   // types/tutor.ts
   export interface Message {
     role: 'user' | 'assistant'
     content: string
     correction?: TurnCorrection
     timestamp?: Date
   }
   ```

2. **Import MessageCorrection Component**
   ```typescript
   import { MessageCorrection } from './MessageCorrection'
   ```

3. **Update `handleSendMessage` Logic**
   - Store user message immediately
   - Update with correction after API response
   - Handle error cases gracefully

4. **Update Message Rendering**
   - Add MessageCorrection below user messages
   - Ensure proper styling and spacing
   - Test with multiple messages

5. **Add Error Handling**
   ```typescript
   try {
     // API call
   } catch (error) {
     // Fallback: show message without correction
     setMessages(prev => {
       const updated = [...prev]
       const lastUserMsg = updated.findLast(m => m.role === 'user')
       if (lastUserMsg && !lastUserMsg.correction) {
         lastUserMsg.correction = {
           hasErrors: false,
           correctedText: lastUserMsg.content,
           errors: []
         }
       }
       return updated
     })
   }
   ```

6. **Optimize Performance**
   - Memoize message list rendering
   - Use React.memo for MessageCorrection
   - Virtualize if >50 messages

---

## Testing Checklist

### Unit Tests
- [ ] Message interface includes correction field
- [ ] handleSendMessage updates user message correctly
- [ ] Error handling adds fallback correction
- [ ] Multiple messages render with corrections

### Integration Tests
- [ ] Send message → see correction appear
- [ ] No errors → see positive feedback
- [ ] Has errors → see collapsible correction
- [ ] Multiple turns work correctly
- [ ] Scroll through history shows all corrections
- [ ] API timeout handled gracefully

### E2E Tests
- [ ] Complete 10-turn conversation with corrections
- [ ] Intentional errors show corrections
- [ ] Perfect messages show positive feedback
- [ ] Mobile layout works correctly
- [ ] Fast typing doesn't break state

---

## Flashcard Integration Prep

### Store Corrections for Later Use

```typescript
// When user clicks "Save as Flashcard" in ErrorTooltip
const createFlashcardFromCorrection = (
  error: ErrorDetail,
  originalMessage: string
) => {
  return {
    front: error.errorText,
    back: error.correction,
    notes: error.explanation,
    context: originalMessage,
    source: 'tutor_session',
    sourceId: sessionId
  }
}

// Will be used in Epic 8 (Flashcard System)
```

### Export Conversation Data

```typescript
const exportConversationForReview = () => {
  return messages
    .filter(m => m.role === 'user' && m.correction?.hasErrors)
    .map(m => ({
      message: m.content,
      correction: m.correction
    }))
}
```

---

## Performance Optimization

### Memoization Strategy
```typescript
const MessageList = React.memo(({ messages }: { messages: Message[] }) => {
  return (
    <>
      {messages.map((msg, idx) => (
        <MessageItem key={idx} message={msg} />
      ))}
    </>
  )
})

const MessageItem = React.memo(({ message }: { message: Message }) => {
  // Rendering logic
})
```

### Virtual Scrolling (if needed)
```typescript
// Only if >50 messages
import { useVirtualizer } from '@tanstack/react-virtual'

const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 100
})
```

---

## Success Criteria

**Story Complete When**:
- ✅ Corrections appear after each user message
- ✅ Historical messages show corrections
- ✅ No performance issues with many messages
- ✅ Error handling works correctly
- ✅ Mobile and desktop tested
- ✅ Correction data ready for flashcard creation
- ✅ All tests passing
- ✅ Code reviewed and merged

---

## Related Files

```
components/tutor/DialogView.tsx           # Main integration
components/tutor/MessageCorrection.tsx    # Component to integrate
app/api/tutor/turn/route.ts              # API providing data
types/tutor.ts                            # TypeScript interfaces
```

---

## Technical Notes

### State Update Pattern

**Problem**: React state updates are asynchronous
**Solution**: Use functional updates to ensure correctness

```typescript
// ❌ Bad - may miss updates
setMessages([...messages, newMessage])

// ✅ Good - guaranteed to use latest state
setMessages(prev => [...prev, newMessage])
```

### Scroll Behavior

Auto-scroll to new messages:
```typescript
const messagesEndRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [messages])
```

---

**Created**: 2025-10-31
**Author**: James (Dev Agent)
