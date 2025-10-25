# v0 Prompts for Interlinear Components

**How to Use These Prompts:**
1. Copy prompt exactly as written
2. Paste into v0.dev chat
3. Review generated code
4. Iterate if needed with follow-up prompts
5. Copy code into your Next.js project

**Design System Reference:** See `design-system.md` for complete specs

---

## Prompt 1: Authentication Page (Login/Signup)

```
Create a modern authentication page for a language learning app called "Interlinear" using Next.js 15, React 19, and Tailwind CSS.

DESIGN STYLE:
- Warm, manuscript-inspired aesthetic (like Apple Books app meets illuminated manuscripts)
- Background: #F9F6F0 (warm parchment color)
- Primary accent: #D4A574 (manuscript gold)
- Text: #1A1614 (ink color, never pure black)

LAYOUT:
- Centered card (max-width 400px) on parchment background
- Card has white background (#FFFFFF) with subtle shadow
- Border radius: 12px
- Padding: 40px inside card
- Responsive: Full viewport height, vertically centered

COMPONENTS:
1. Logo/Title:
   - "Interlinear" text in Merriweather or Georgia serif font
   - Size: 28px
   - Color: #B8894F (dark gold)
   - Centered at top of card
   - Margin bottom: 32px

2. Form Inputs:
   - Email input (type="email")
   - Password input (type="password")
   - Background: #F9F6F0 (parchment)
   - Border: 1px solid #E8CFAF (light gold)
   - Border radius: 4px
   - Padding: 16px
   - Font: System UI font, 16px
   - Margin between inputs: 16px
   - Focus state: border color changes to #D4A574 (gold) with subtle shadow

3. Primary Button:
   - Text: "Sign In" or "Create Account"
   - Full width
   - Background: #D4A574 (gold)
   - Color: white
   - Padding: 16px
   - Border radius: 4px
   - Font weight: 500
   - Hover: Background becomes #B8894F (darker gold), subtle lift effect
   - Transition: 200ms ease-out

4. Secondary Link:
   - Below button
   - Text: "Don't have an account? Sign up" or "Already have an account? Log in"
   - Color: #8B7355 (sepia)
   - Underline on hover
   - Center aligned

BEHAVIOR:
- Form validation on submit
- Show error messages inline below inputs (color: #A4443E - crimson)
- Disable button during submission with loading spinner
- Smooth transitions (200ms ease-out)

TECHNICAL REQUIREMENTS:
- Use Tailwind CSS for styling
- TypeScript with proper type definitions
- Form uses controlled inputs (useState)
- Include handleSubmit function placeholder
- Accessible: proper labels, ARIA attributes
- Keyboard navigation support

ADDITIONAL DETAILS:
- Clean, minimal design - no clutter
- Generous whitespace
- All transitions use cubic-bezier(0.16, 1, 0.3, 1) easing
- Mobile responsive (reduce padding on small screens)

Please create both login and signup variants as separate components in a single file.
```

---

## Prompt 2: Text Input Panel (Paste & Render)

```
Create a text input panel component for a Spanish language learning app using Next.js 15, React 19, and Tailwind CSS.

DESIGN SYSTEM:
- Background: #F9F6F0 (warm parchment)
- Primary accent: #D4A574 (manuscript gold)
- Text: #1A1614 (ink color)
- Card background: white
- Border: #E8CFAF (light gold)

LAYOUT:
- Container: max-width 800px, centered with 80px margin top
- Padding: 32px
- Background: parchment color

COMPONENTS:

1. Heading:
   - Text: "Paste Your Spanish Text"
   - Font: Merriweather or Georgia serif, 24px
   - Color: #B8894F (dark gold)
   - Margin bottom: 24px

2. Textarea:
   - Full width
   - Min height: 300px
   - Padding: 24px
   - Font: Merriweather or Georgia serif, 20px
   - Line height: 1.75 (generous leading)
   - Background: white
   - Border: 2px solid #E8CFAF (light gold)
   - Border radius: 12px
   - Color: #1A1614 (ink)
   - Placeholder: "Paste your Spanish text here..." (color: #B39A7D, italic)
   - Resize: vertical only
   - Focus: Border color #D4A574 with subtle shadow (0 0 0 4px rgba(212, 165, 116, 0.1))

3. Character Counter:
   - Below textarea, right aligned
   - Font: System UI, 14px
   - Color: #8B7355 (sepia)
   - Text: "XXX words" or "XXX / 2000 words"
   - Warning state (> 1800 words): Color changes to #A4443E (crimson)
   - Margin top: 8px

4. Render Button:
   - Full width
   - Padding: 16px 24px
   - Margin top: 24px
   - Background: #D4A574 (gold)
   - Color: white
   - Font: System UI, 18px, weight 500
   - Border radius: 8px
   - Text: "Render Interactive Text"
   - Hover: Background #B8894F, lift effect (translateY(-2px)), shadow
   - Disabled state: opacity 0.5, cursor not-allowed
   - Transition: 200ms ease-out

BEHAVIOR:
- Count words (split by whitespace) and update counter in real-time
- Enable button only when textarea has content
- Disable button if word count > 2000
- Show warning message if exceeding limit
- handleRender callback on button click
- Smooth transitions

TECHNICAL REQUIREMENTS:
- TypeScript with proper props interface
- Controlled textarea (value, onChange)
- Word counting utility function
- Callback prop: onRender(text: string) => void
- Accessible: proper labels, ARIA
- Keyboard support (Tab navigation)

STYLING:
- Use Tailwind utility classes
- Custom CSS for focus states
- Mobile responsive (reduce margins on small screens)
- Respect prefers-reduced-motion

Please create as a single React component with TypeScript.
```

---

## Prompt 3: Interactive Text with Clickable Words

```
Create an interactive text rendering component for a language learning app using Next.js 15, React 19, and Tailwind CSS.

DESIGN SYSTEM:
- Background: #F9F6F0 (parchment)
- Text: #1A1614 (ink)
- Gold accent: #D4A574
- Hover background: rgba(212, 165, 116, 0.08)
- Selected background: rgba(212, 165, 116, 0.15)
- Saved word background: rgba(212, 165, 116, 0.1)

LAYOUT:
- Container: max-width 800px, centered
- Padding: 80px horizontal (generous margins for reading)
- Mobile: 32px horizontal padding
- Background: parchment

TYPOGRAPHY:
- Font: Merriweather or Georgia serif
- Size: 20px
- Line height: 1.75 (very generous for reading comfort)
- Color: #1A1614 (ink, not pure black)
- Max width: 70ch (optimal reading length)

WORD COMPONENT:
Each word is a clickable span with these states:

1. Default:
   - Color: #1A1614 (ink)
   - Cursor: pointer
   - Padding: 2px 4px
   - Margin: -2px -4px (to allow padding without affecting layout)
   - Border radius: 4px
   - Transition: background 100ms ease-out

2. Hover:
   - Background: rgba(212, 165, 116, 0.08) (very subtle gold)
   - Text decoration: underline
   - Underline color: #D4A574 (gold)
   - Underline thickness: 1px
   - Underline offset: 3px

3. Selected (currently clicked, modal open):
   - Background: rgba(212, 165, 116, 0.15)
   - Color: #B8894F (dark gold)

4. Saved (in vocabulary list):
   - Background: rgba(212, 165, 116, 0.1)
   - Small gold dot indicator (pseudo-element ::after):
     - 4px × 4px circle
     - Background: #D4A574
     - Position: absolute top-right of word
     - Border radius: 50%

BEHAVIOR:
- Each word is clickable
- onClick calls onWordClick(word, index)
- Preserve punctuation attached to words (don't split)
- Maintain original spacing and line breaks
- Selected word remains highlighted when modal is open
- Smooth hover transitions (100ms)

DATA STRUCTURE:
```typescript
interface Token {
  id: string;          // "word-0", "word-1", etc.
  text: string;        // "Hola", "mundo", etc.
  isWhitespace: boolean;
  isSaved: boolean;    // true if in vocabulary
  isSelected: boolean; // true if currently clicked
}
```

TECHNICAL REQUIREMENTS:
- TypeScript component
- Props:
  - tokens: Token[]
  - onWordClick: (word: string, index: number) => void
  - selectedWordId?: string
- Map over tokens and render as spans
- Non-breaking behavior for punctuation
- Accessible:
  - role="button" on clickable words
  - tabindex="0"
  - aria-label="Click to see definition of {word}"
  - Keyboard support (Enter/Space to click)
- Focus states with visible outline

ADDITIONAL:
- White background card container with subtle shadow
- Border radius: 12px
- Padding inside card: 48px
- Edit button at top-right corner:
  - Text: "Edit Text"
  - Small, subtle
  - Color: #8B7355 (sepia)
  - Hover: underline

Please create as a TypeScript React component with all states and interactions.
```

---

## Prompt 4: Definition Sidebar/Modal

```
Create a definition sidebar/modal component for a language learning app using Next.js 15, React 19, Tailwind CSS, and Framer Motion.

DESIGN SYSTEM:
- Background: white
- Text: #1A1614 (ink)
- Accent: #D4A574 (gold)
- Border: rgba(212, 165, 116, 0.2)
- Divider: #E8CFAF (light gold)

DESKTOP LAYOUT (≥ 768px):
- Sidebar slides in from right
- Width: 400px
- Full height
- Background: white
- Border radius: 12px 0 0 12px (rounded left corners only)
- Shadow: 0 20px 40px rgba(26, 22, 20, 0.18) (substantial shadow)
- Padding: 32px
- Animation: slideInRight 300ms cubic-bezier(0.16, 1, 0.3, 1)

MOBILE LAYOUT (< 768px):
- Bottom sheet slides up from bottom
- Max height: 80vh
- Border radius: 12px 12px 0 0 (rounded top corners)
- Drag handle at top:
  - 40px wide × 4px tall
  - Background: #B39A7D (light sepia)
  - Border radius: 2px
  - Centered, 12px from top

COMPONENTS:

1. Header:
   - Display: flex, justify-between, align-items center
   - Margin bottom: 24px

   Word Title:
   - Font: Merriweather or Georgia serif
   - Size: 28px
   - Color: #B8894F (dark gold)
   - Weight: 400

   Close Button:
   - Position: absolute top-right
   - Size: 32px × 32px
   - Icon: X (cross)
   - Color: #8B7355 (sepia)
   - Background: transparent
   - Hover: Background #F9F6F0 (parchment)
   - Border radius: 4px
   - Transition: 200ms

2. Audio Button:
   - Full width
   - Display: flex, align-items center, gap 12px
   - Padding: 16px 24px
   - Background: #F9F6F0 (parchment)
   - Border: 1px solid #E8CFAF
   - Border radius: 8px
   - Color: #B8894F (dark gold)
   - Font: System UI, 16px
   - Icon: 🔊 or speaker SVG
   - Text: "Listen to pronunciation"
   - Margin bottom: 24px
   - Hover: Background #E8CFAF, transform translateY(-1px)
   - States:
     - Idle: Static speaker icon
     - Loading: Spinning circle animation
     - Playing: Pulsing sound wave icon, background changes to #D4A574 (gold), text color white

3. Divider:
   - Height: 1px
   - Background: #E8CFAF
   - Margin: 24px 0

4. Part of Speech:
   - Font: System UI, 12px, uppercase
   - Color: #8B7355 (sepia)
   - Letter spacing: 0.05em
   - Margin bottom: 16px

5. Definitions List:
   - Font: System UI, 16px
   - Color: #1A1614 (ink)
   - Line height: 1.5
   - Each definition as bullet point
   - Margin between definitions: 8px

6. Examples Section (if available):
   - Margin top: 24px
   - Label: "Examples:" (12px, #8B7355, uppercase)
   - Example text:
     - Font: System UI, 14px, italic
     - Color: #4A4643 (lighter ink)
     - Background: #F9F6F0 (parchment)
     - Padding: 12px
     - Border radius: 4px
     - Margin top: 8px

ANIMATIONS:
- Desktop slide-in from right:
  ```css
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  ```

- Mobile slide-up from bottom:
  ```css
  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  ```

- Background overlay:
  - Fixed position, full screen
  - Background: rgba(26, 22, 20, 0.4)
  - Fade in 300ms
  - Click to close

BEHAVIOR:
- Opens when word is clicked
- Closes when X button clicked or overlay clicked
- Escape key closes modal
- Click outside closes on desktop
- Swipe down closes on mobile (optional)
- Loading state while fetching definition
- Error state if definition not found

DATA STRUCTURE:
```typescript
interface Definition {
  word: string;
  partOfSpeech: string;  // "noun", "verb", etc.
  definitions: string[]; // Array of translations
  examples?: string[];   // Optional usage examples
}
```

TECHNICAL REQUIREMENTS:
- TypeScript React component
- Framer Motion for animations
- Props:
  - isOpen: boolean
  - definition: Definition | null
  - loading: boolean
  - error: string | null
  - onClose: () => void
  - onPlayAudio: (word: string) => void
- Responsive (desktop sidebar / mobile bottom sheet)
- Focus trap when open
- Accessible: aria-modal="true", proper labels
- Keyboard support (Tab, Escape)

Please create as a fully functional TypeScript component with Framer Motion animations.
```

---

## Prompt 5: Audio Player Button Component

```
Create an audio player button component for a language learning app using Next.js 15, React 19, and Tailwind CSS.

DESIGN SYSTEM:
- Gold: #D4A574
- Dark gold: #B8894F
- Light gold: #E8CFAF
- Parchment: #F9F6F0
- Ink: #1A1614

BUTTON STATES:

1. IDLE STATE (default):
   - Display: flex, align-items center, gap 12px
   - Padding: 16px 24px
   - Background: #F9F6F0 (parchment)
   - Border: 1px solid #E8CFAF (light gold)
   - Border radius: 8px
   - Color: #B8894F (dark gold)
   - Font: System UI, 16px
   - Cursor: pointer
   - Icon: Speaker SVG (static)
   - Text: "Listen to pronunciation"
   - Hover: Background #E8CFAF, transform translateY(-1px), shadow
   - Transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1)

2. LOADING STATE:
   - Same layout as idle
   - Cursor: wait
   - Opacity: 0.6
   - Icon: Spinning circle (smooth rotation animation)
   - Text: "Loading..."
   - No hover effect

3. PLAYING STATE:
   - Background: #D4A574 (gold)
   - Color: white
   - Border color: #B8894F (dark gold)
   - Icon: Sound wave bars (3 vertical bars pulsing)
   - Text: "Playing..."
   - Pulsing animation on icon:
     ```css
     @keyframes pulse {
       0%, 100% { opacity: 1; }
       50% { opacity: 0.6; }
     }
     /* Animation: 1.5s ease-in-out infinite */
     ```

4. ERROR STATE:
   - Button hidden OR shows error icon briefly
   - No interaction

ICONS:
Use simple SVG icons (20px × 20px):

1. Speaker (idle):
   ```svg
   <svg>...</svg> <!-- Standard speaker icon -->
   ```

2. Spinner (loading):
   ```svg
   <svg>...</svg> <!-- Circle with rotating animation -->
   ```

3. Sound Waves (playing):
   ```svg
   <svg>...</svg> <!-- 3 vertical bars with pulse -->
   ```

BEHAVIOR:
- onClick triggers audio playback
- Cycles through: idle → loading → playing → idle
- Audio auto-stops at end (returns to idle)
- If clicked during playing, restart audio
- If API error, hide button gracefully

STATE MANAGEMENT:
```typescript
type AudioState = 'idle' | 'loading' | 'playing' | 'error';

interface AudioPlayerProps {
  text: string;              // Text to speak
  onError?: (error: Error) => void;
  autoPlay?: boolean;        // Auto-play on mount
  className?: string;
}
```

ANIMATIONS:
- All state transitions: 200ms ease-out
- Spinner rotation: 1s linear infinite
- Sound wave pulse: 1.5s ease-in-out infinite
- Hover lift: 200ms cubic-bezier(0.16, 1, 0.3, 1)

AUDIO PLAYBACK:
- Fetch from `/api/tts/speak` endpoint
- POST with JSON body: `{ text: string }`
- Response: audio/mpeg blob
- Create Audio object from blob URL
- Play audio
- Clean up blob URL on unmount

TECHNICAL REQUIREMENTS:
- TypeScript React component
- Tailwind CSS for styling
- Native Web Audio API
- Error boundary handling
- Cleanup on unmount (stop audio, revoke blob URLs)
- Accessible:
  - aria-label describes state and text
  - aria-busy="true" during loading
  - Keyboard support (Enter/Space)
- Mobile-friendly (44px minimum touch target)

VARIANTS (optional):
- Small variant: Less padding, smaller text
- Icon-only variant: Just icon, no text
- Inline variant: Fits in running text

Please create as a reusable TypeScript component with all states and proper cleanup.
```

---

## Prompt 6: Vocabulary List Component

```
Create a vocabulary list component for a language learning app using Next.js 15, React 19, and Tailwind CSS.

DESIGN SYSTEM:
- Parchment background: #F9F6F0
- White cards: #FFFFFF
- Gold border: #D4A574
- Light gold: #E8CFAF
- Ink text: #1A1614
- Sepia meta text: #8B7355
- Light ink: #4A4643

LAYOUT:
- Container: max-width 600px, centered
- Background: #F9F6F0 (parchment)
- Padding: 32px

HEADER SECTION:
- Display: flex, justify-between, align-items center
- Margin bottom: 24px

  Title:
  - Text: "My Vocabulary (X words)"
  - Font: Merriweather or Georgia serif, 24px
  - Color: #B8894F (dark gold)

  Sort Dropdown:
  - Background: white
  - Border: 1px solid #E8CFAF
  - Padding: 8px 16px
  - Border radius: 4px
  - Font: System UI, 14px
  - Options: "Recent", "Alphabetical", "Most Clicked"
  - Icon: Chevron down

VOCABULARY ITEM CARD:
- Background: white
- Border: 1px solid #E8CFAF (light gold)
- Border radius: 8px
- Padding: 20px
- Margin bottom: 16px
- Shadow: 0 1px 2px rgba(26, 22, 20, 0.08)
- Hover: Border color #D4A574, shadow increases, transform translateY(-1px)
- Transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1)

  Card Content Structure:

  1. Word (main):
     - Font: Merriweather or Georgia serif
     - Size: 20px
     - Color: #1A1614 (ink)
     - Margin bottom: 8px

  2. Meta Line:
     - Font: System UI, 14px
     - Color: #8B7355 (sepia)
     - Format: "translation • part of speech • X clicks"
     - Bullet separator: " • "

  3. Timestamp:
     - Font: System UI, 12px
     - Color: #4A4643 (light ink)
     - Format: "Saved X hours/days ago"
     - Margin top: 4px

EMPTY STATE (when no vocabulary):
- Centered container
- Padding: 80px 32px
- Text align: center

  Icon:
  - Emoji: 📚 or similar
  - Size: 48px
  - Opacity: 0.5
  - Margin bottom: 16px

  Message:
  - Font: System UI, 18px
  - Color: #4A4643 (light ink)
  - Line 1: "No vocabulary yet"
  - Line 2: "Start clicking words to build your list!"
  - Line height: 1.5

LOADING STATE:
- Show skeleton cards (3-4)
- Animated pulse effect
- Same dimensions as regular cards
- Background: linear gradient shimmer effect

DATA STRUCTURE:
```typescript
interface VocabularyEntry {
  id: string;
  word: string;
  translation: string;
  partOfSpeech: string;    // "noun", "verb", etc.
  clickCount: number;
  createdAt: string;       // ISO timestamp
}
```

BEHAVIOR:
- Load vocabulary on mount
- Sort by selected option (recent by default)
- Smooth scroll if many items
- Infinite scroll (optional - load more as user scrolls)
- Click card to see full definition (optional enhancement)
- Refresh button to reload list

TECHNICAL REQUIREMENTS:
- TypeScript React component
- Props:
  - entries: VocabularyEntry[]
  - loading: boolean
  - onRefresh: () => void
  - onSort: (sortBy: 'recent' | 'alphabetical' | 'clicks') => void
- Format relative timestamps ("2 hours ago", "3 days ago")
- Empty state component
- Loading skeleton component
- Accessible:
  - Semantic HTML (list elements)
  - Keyboard navigation
  - ARIA labels for interactive elements
- Mobile responsive (reduce padding on small screens)

VARIANTS:
- Compact mode: Smaller cards, less padding
- Grid layout: 2 columns on desktop (optional)

ADDITIONAL FEATURES (optional):
- Search/filter bar
- Delete word button (hover reveals)
- Star/favorite system
- Export button

Please create as a complete TypeScript component with empty and loading states.
```

---

## Prompt 7: Complete Reader Page Layout

```
Create a complete reader page layout for a language learning app using Next.js 15, React 19, and Tailwind CSS, combining multiple sub-components.

DESIGN SYSTEM:
- Parchment background: #F9F6F0
- White: #FFFFFF
- Gold: #D4A574
- Ink: #1A1614
- Sepia: #8B7355

PAGE STRUCTURE:

1. HEADER (sticky):
   - Background: white
   - Border bottom: 1px solid #E8CFAF
   - Padding: 24px 32px
   - Display: flex, justify-between, align-items center
   - Sticky top: 0
   - Z-index: 10

   Logo:
   - Font: Merriweather serif, 20px
   - Color: #B8894F (dark gold)
   - Text: "Interlinear"

   Navigation:
   - Display: flex, gap 16px
   - Buttons: "Reader", "Vocabulary", "Logout"
   - Each button:
     - Padding: 12px 20px
     - Font: System UI, 14px
     - Color: #8B7355 (sepia)
     - Background: transparent
     - Border: 1px solid transparent
     - Border radius: 4px
     - Hover: Background #F9F6F0, border #E8CFAF
     - Active state: Background #E8CFAF, color #B8894F, border #D4A574

2. MAIN CONTENT AREA:
   - Min height: calc(100vh - header height)
   - Background: #F9F6F0 (parchment)
   - Padding: 48px 32px

   This area has THREE MODES (mutually exclusive):

   MODE A: INPUT MODE
   - Shows TextInputPanel component (from Prompt 2)
   - Centered, max-width 800px

   MODE B: RENDER MODE
   - Shows InteractiveText component (from Prompt 3)
   - Shows DefinitionSidebar when word clicked (from Prompt 4)
   - Overlay when sidebar open

   MODE C: VOCABULARY MODE
   - Shows VocabularyList component (from Prompt 6)
   - Centered, max-width 600px

MODE SWITCHING BEHAVIOR:
- Click navigation buttons to switch modes
- Smooth fade transition between modes (300ms)
- Persist text in sessionStorage when switching from render mode

STATE MANAGEMENT:
```typescript
type PageMode = 'input' | 'render' | 'vocabulary';

interface ReaderPageState {
  mode: PageMode;
  inputText: string;
  tokens: Token[];
  selectedWord: string | null;
  sidebarOpen: boolean;
  vocabularyEntries: VocabularyEntry[];
}
```

PAGE TRANSITIONS:
- Input → Render:
  1. Tokenize text
  2. Fade out input panel (200ms)
  3. Fade in rendered text (300ms, slight delay)

- Render → Vocabulary:
  1. Fetch user vocabulary
  2. Cross-fade (300ms)

- Any mode → Input:
  1. Fade transition (300ms)
  2. Preserve text in input

RESPONSIVE BEHAVIOR:
- Desktop (≥ 1024px):
  - Full sidebar from right
  - Navigation horizontal in header
  - Generous padding

- Tablet (768px - 1023px):
  - Sidebar still from right but narrower
  - Navigation still horizontal
  - Reduced padding

- Mobile (< 768px):
  - Bottom sheet instead of sidebar
  - Navigation becomes dropdown menu
  - Minimal padding
  - Header layout adjusts (logo + hamburger menu)

TECHNICAL REQUIREMENTS:
- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- React hooks (useState, useEffect)
- sessionStorage for text persistence
- Props/callbacks for child components:
  - onRender: (text: string) => void
  - onWordClick: (word: string) => void
  - onCloseSidebar: () => void
  - onSortVocabulary: (sortBy: string) => void

ACCESSIBILITY:
- Skip to content link
- Proper heading hierarchy (h1, h2, etc.)
- Landmark regions (header, main, nav)
- Focus management when switching modes
- Keyboard navigation
- ARIA live regions for mode changes

ADDITIONAL FEATURES:
- Loading states for async operations
- Error boundaries
- Toast notifications (success, error)
- Confirmation before leaving render mode with unsaved work

Please create the complete page layout integrating all sub-components with proper TypeScript types and state management.
```

---

## Usage Tips for v0

### Iteration Strategies

**If v0 generates something close but not quite right:**

1. **Color adjustments:**
   ```
   The gold color (#D4A574) should be used more sparingly.
   Can you reduce the gold accent to only the primary CTA button
   and word highlights?
   ```

2. **Spacing adjustments:**
   ```
   The padding feels cramped. Can you increase the padding inside
   the card from 32px to 48px and add more space between the
   input fields (24px instead of 16px)?
   ```

3. **Animation refinements:**
   ```
   The transition feels too slow. Can you reduce the modal
   animation duration from 500ms to 300ms and use
   cubic-bezier(0.16, 1, 0.3, 1) easing for a snappier feel?
   ```

4. **Responsive issues:**
   ```
   On mobile, the text is too small. Can you increase the
   base font size to 18px on screens below 768px and reduce
   the container padding to 24px?
   ```

### Common Follow-up Prompts

**After initial generation:**

```
This looks great! A few tweaks:
1. Make the hover effect more subtle (reduce opacity to 0.08)
2. Add a focus state with a gold outline
3. Ensure the component respects prefers-reduced-motion
4. Add TypeScript prop validation with JSDoc comments
```

**For accessibility:**

```
Can you enhance accessibility by:
1. Adding proper ARIA labels to all interactive elements
2. Ensuring keyboard navigation works (Tab, Enter, Escape)
3. Adding a focus trap when the modal is open
4. Including skip-to-content links
```

**For performance:**

```
Can you optimize this component by:
1. Memoizing expensive calculations
2. Using React.memo for child components that don't need frequent re-renders
3. Adding virtualization for the vocabulary list (react-window)
```

---

## Integration Checklist

After generating components with v0:

- [ ] Copy generated code into Next.js project
- [ ] Verify all Tailwind classes work with your config
- [ ] Test responsive behavior on mobile/tablet/desktop
- [ ] Verify color contrast ratios (WCAG AA)
- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Connect to real API endpoints
- [ ] Test with real data
- [ ] Performance audit (Lighthouse)
- [ ] Cross-browser testing

---

## Design System Quick Reference

**Colors:**
- Parchment: `#F9F6F0`
- Ink: `#1A1614`
- Gold: `#D4A574`
- Dark Gold: `#B8894F`
- Light Gold: `#E8CFAF`
- Sepia: `#8B7355`
- Crimson: `#A4443E`

**Typography:**
- Reading: Merriweather/Georgia, 20px, line-height 1.75
- UI: System UI, 16px, line-height 1.5

**Spacing:**
- Base: 4px grid
- Common: 8px, 16px, 24px, 32px, 48px

**Animation:**
- Fast: 200ms
- Normal: 300ms
- Easing: cubic-bezier(0.16, 1, 0.3, 1)

**Border Radius:**
- Small: 4px
- Medium: 8px
- Large: 12px

---

**END OF V0 PROMPTS**

These prompts are designed to be copy-paste ready for v0.dev. Each one is detailed enough to generate high-quality, production-ready components that match your design system.

Iterate as needed, and don't hesitate to ask v0 for specific refinements!
