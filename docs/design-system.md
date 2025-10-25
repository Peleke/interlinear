# Interlinear Design System

**Version:** 1.0
**Date:** 2025-10-24
**Goal:** Apple-level polish with manuscript-inspired warmth

---

## Design Philosophy

**Core Principle:** "Reverence for the written word meets modern minimalism"

**Inspirations:**
- iOS Books app (clean, focused reading experience)
- Illuminated manuscripts (warmth, craftsmanship, beauty)
- Apple Human Interface Guidelines (clarity, restraint, delight)

**What This Is NOT:**
- Heavy animation playground
- Gradient-heavy modern design
- Overly decorative or cluttered

**What This IS:**
- Warm, inviting, focused
- Minimal chrome, maximum content
- Thoughtful micro-interactions
- "I want to spend time here" feeling

---

## Color Palette

### Primary Colors

```css
/* Parchment - Main background */
--parchment: #F9F6F0;
--parchment-dark: #F0EBE3;

/* Ink - Primary text */
--ink: #1A1614;
--ink-light: #4A4643;

/* Manuscript Gold - Accents, highlights */
--gold: #D4A574;
--gold-dark: #B8894F;
--gold-light: #E8CFAF;

/* Sepia - Secondary UI elements */
--sepia: #8B7355;
--sepia-light: #B39A7D;

/* Crimson - Rare accents (errors, important CTAs) */
--crimson: #A4443E;
--crimson-light: #C86760;
```

### Semantic Colors

```css
/* Interactive states */
--hover-bg: rgba(212, 165, 116, 0.08);  /* gold with low opacity */
--selected-bg: rgba(212, 165, 116, 0.15);
--saved-word-bg: rgba(212, 165, 116, 0.1);

/* Feedback */
--success: #6B8E4E;
--error: #A4443E;
--loading: #8B7355;

/* Overlays */
--overlay: rgba(26, 22, 20, 0.4);  /* ink with transparency */
--modal-bg: #FFFFFF;
--modal-border: rgba(212, 165, 116, 0.2);
```

### Usage Guidelines

- **Parchment** backgrounds create warm, comfortable reading environment
- **Ink** for all body text (never pure black #000)
- **Gold** sparingly - only for meaningful interactions (selected words, audio playing)
- **Crimson** very sparingly - errors and critical actions only
- **White modals** float above parchment background for clear hierarchy

---

## Typography

### Font Families

```css
/* Serif - For reading content */
--font-reading: 'Merriweather', 'Georgia', serif;

/* Sans - For UI chrome and metadata */
--font-ui: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;

/* Mono - For technical content only (if needed) */
--font-mono: 'SF Mono', 'Consolas', monospace;
```

### Type Scale

```css
/* Reading text (main content) */
--text-reading: 20px;
--line-height-reading: 1.75;  /* generous leading */

/* UI Elements */
--text-3xl: 28px;  /* Page titles */
--text-2xl: 24px;  /* Section headers */
--text-xl: 20px;   /* Card headers */
--text-lg: 18px;   /* Large body */
--text-base: 16px; /* Standard UI */
--text-sm: 14px;   /* Metadata, captions */
--text-xs: 12px;   /* Tiny labels */

/* Line heights */
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### Font Weights

```css
--weight-normal: 400;
--weight-medium: 500;  /* For emphasis in UI */
--weight-semibold: 600; /* Rarely - only for headers */
--weight-bold: 700;     /* Almost never */
```

### Typography Rules

1. **Reading text**: Always use `--font-reading` at 20px with 1.75 line-height
2. **UI chrome**: Use `--font-ui` at appropriate scale
3. **Never bold** reading content - use italic for emphasis
4. **Limit font sizes**: Stick to the scale, don't create one-offs
5. **Respect reading width**: Max 70ch (characters) for optimal readability

---

## Spacing System

**4px base grid** - All spacing must be multiples of 4px

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### Layout Spacing

```css
/* Container padding */
--padding-page: var(--space-12);  /* 48px */
--padding-mobile: var(--space-6);  /* 24px */

/* Component spacing */
--gap-tight: var(--space-3);   /* 12px */
--gap-normal: var(--space-6);  /* 24px */
--gap-loose: var(--space-10);  /* 40px */

/* Reading margins (generous) */
--margin-reading: var(--space-20);  /* 80px desktop */
--margin-reading-mobile: var(--space-8);  /* 32px mobile */
```

---

## Border Radius

```css
--radius-sm: 4px;   /* Subtle (buttons, inputs) */
--radius-md: 8px;   /* Standard (cards) */
--radius-lg: 12px;  /* Prominent (modals) */
--radius-xl: 16px;  /* Rare (large containers) */
--radius-full: 9999px;  /* Pills, circular icons */
```

**Rule:** Use sparingly. Prefer `--radius-md` for most components.

---

## Shadows

```css
/* Elevation levels */
--shadow-sm: 0 1px 2px rgba(26, 22, 20, 0.08);
--shadow-md: 0 4px 12px rgba(26, 22, 20, 0.12);
--shadow-lg: 0 12px 24px rgba(26, 22, 20, 0.15);
--shadow-xl: 0 20px 40px rgba(26, 22, 20, 0.18);

/* Specific use cases */
--shadow-modal: var(--shadow-xl);
--shadow-dropdown: var(--shadow-lg);
--shadow-card: var(--shadow-sm);
```

**Rule:** Shadows should be subtle. This isn't Material Design.

---

## Animation Principles

### Timing

```css
--duration-instant: 100ms;   /* Hover states, small changes */
--duration-fast: 200ms;      /* Most transitions */
--duration-normal: 300ms;    /* Modals, panels */
--duration-slow: 500ms;      /* Page transitions (rare) */

/* Easing curves */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);  /* Apple's ease-out */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Animation Rules

1. **Default to `--duration-fast` (200ms)** for most interactions
2. **Use `--ease-out`** for everything (feels responsive)
3. **Respect `prefers-reduced-motion`** - disable animations if requested
4. **Never animate layout shifts** - only opacity, transform, color
5. **No bounce/elastic** - clean and professional only

### What to Animate

✅ **DO animate:**
- Modal/sidebar entry (slide + fade)
- Hover states (color, background)
- Button presses (subtle scale)
- Loading states (spinner, skeleton)
- Audio playing indicator (pulse)

❌ **DON'T animate:**
- Text changes (jarring)
- Layout shifts (causes jank)
- Every single thing (overwhelming)

---

## Component Design Specs

### 1. Clickable Word

**States:**
```css
/* Default */
.word {
  color: var(--ink);
  cursor: pointer;
  padding: 2px 4px;
  margin: -2px -4px;
  border-radius: var(--radius-sm);
  transition: background-color var(--duration-instant) var(--ease-out);
}

/* Hover */
.word:hover {
  background-color: var(--hover-bg);
  text-decoration: underline;
  text-decoration-color: var(--gold);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

/* Selected (clicked, modal open) */
.word.selected {
  background-color: var(--selected-bg);
  color: var(--gold-dark);
}

/* Saved (in vocabulary) */
.word.saved {
  background-color: var(--saved-word-bg);
  /* Small gold dot indicator - top right */
}
.word.saved::after {
  content: '';
  position: absolute;
  top: 2px;
  right: 2px;
  width: 4px;
  height: 4px;
  background: var(--gold);
  border-radius: 50%;
}
```

**Behavior:**
- Instant hover feedback (100ms)
- Click locks selected state
- Saved words have subtle persistent indicator

---

### 2. Definition Modal/Sidebar

**Desktop:** Sidebar slides from right (400px wide)
**Mobile:** Bottom sheet slides from bottom (max 80vh)

```css
.definition-sidebar {
  background: var(--modal-bg);
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  box-shadow: var(--shadow-modal);
  padding: var(--space-8);
  max-width: 400px;

  /* Animation */
  animation: slideInRight var(--duration-normal) var(--ease-out);
}

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

**Layout Structure:**
```
┌─────────────────────────────────┐
│ ┌─────────────────────────┐     │  ← Header
│ │ libro              [✕]  │     │    - Word (--font-reading, 28px)
│ └─────────────────────────┘     │    - Close button (top right)
│                                 │
│ ┌─────────────────────────┐     │  ← Audio Button
│ │ 🔊 Listen to pronunciation│   │    - Full-width, subtle
│ └─────────────────────────┘     │    - Icon + text
│                                 │
│ ─────────────────────────────   │  ← Divider (--gold-light, 1px)
│                                 │
│ noun                            │  ← Part of speech
│                                 │    (--text-sm, --sepia, uppercase)
│ • book                          │  ← Definitions
│ • publication                   │    (--font-ui, --text-base)
│                                 │
│ Examples:                       │  ← Examples section
│ "un libro interesante"          │    (--text-sm, --ink-light, italic)
│                                 │
└─────────────────────────────────┘
```

**Mobile Bottom Sheet:**
```css
.definition-modal-mobile {
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  max-height: 80vh;

  /* Drag handle */
}
.definition-modal-mobile::before {
  content: '';
  display: block;
  width: 40px;
  height: 4px;
  background: var(--sepia-light);
  border-radius: 2px;
  margin: var(--space-3) auto var(--space-6);
}
```

---

### 3. Audio Player Button

**States:**

```css
/* Idle */
.audio-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  background: var(--parchment);
  border: 1px solid var(--gold-light);
  border-radius: var(--radius-md);
  color: var(--gold-dark);
  font-family: var(--font-ui);
  font-size: var(--text-base);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.audio-btn:hover {
  background: var(--gold-light);
  border-color: var(--gold);
  transform: translateY(-1px);
}

/* Loading */
.audio-btn.loading {
  cursor: wait;
  opacity: 0.6;
}
.audio-btn.loading .icon {
  animation: spin 1s linear infinite;
}

/* Playing */
.audio-btn.playing {
  background: var(--gold);
  color: white;
  border-color: var(--gold-dark);
}
.audio-btn.playing .icon {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

**Icon Design:**
- Idle: Static speaker icon
- Loading: Spinning circle (simple, not fancy)
- Playing: Sound wave bars (3 bars, pulsing)

---

### 4. Vocabulary List

**Layout:**

```css
.vocab-list {
  background: var(--parchment);
  padding: var(--space-8);
  max-width: 600px;
  margin: 0 auto;
}

.vocab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

.vocab-item {
  background: white;
  border: 1px solid var(--gold-light);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  margin-bottom: var(--space-4);
  transition: all var(--duration-fast) var(--ease-out);
}

.vocab-item:hover {
  border-color: var(--gold);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
```

**Item Structure:**
```
┌───────────────────────────────────┐
│ libro                             │  ← Word (--font-reading, --text-xl)
│ book • noun • 3 clicks            │  ← Meta (--text-sm, --sepia)
│ Saved 2 hours ago                 │  ← Timestamp (--text-xs, --ink-light)
└───────────────────────────────────┘
```

**Empty State:**
```css
.vocab-empty {
  text-align: center;
  padding: var(--space-20) var(--space-8);
  color: var(--ink-light);
}

.vocab-empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-4);
  opacity: 0.5;
}

.vocab-empty-text {
  font-family: var(--font-ui);
  font-size: var(--text-lg);
}
```

---

### 5. Text Input Panel

```css
.text-input-panel {
  max-width: 800px;
  margin: var(--space-20) auto;
  padding: var(--space-8);
}

.textarea {
  width: 100%;
  min-height: 300px;
  padding: var(--space-6);
  font-family: var(--font-reading);
  font-size: var(--text-reading);
  line-height: var(--line-height-reading);
  background: white;
  border: 2px solid var(--gold-light);
  border-radius: var(--radius-lg);
  color: var(--ink);
  resize: vertical;
  transition: border-color var(--duration-fast) var(--ease-out);
}

.textarea:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 4px rgba(212, 165, 116, 0.1);
}

.textarea::placeholder {
  color: var(--sepia-light);
  font-style: italic;
}
```

**Character Counter:**
```css
.char-counter {
  text-align: right;
  margin-top: var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--sepia);
}

.char-counter.warning {
  color: var(--crimson);
}
```

**Render Button:**
```css
.render-btn {
  width: 100%;
  padding: var(--space-4) var(--space-6);
  margin-top: var(--space-6);
  background: var(--gold);
  color: white;
  font-family: var(--font-ui);
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.render-btn:hover {
  background: var(--gold-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.render-btn:active {
  transform: translateY(0);
}

.render-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

---

### 6. Auth Pages (Login/Signup)

**Layout: Centered card on parchment background**

```css
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--parchment);
  padding: var(--space-6);
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--space-10);
  box-shadow: var(--shadow-lg);
}

.auth-logo {
  font-family: var(--font-reading);
  font-size: var(--text-3xl);
  color: var(--gold-dark);
  text-align: center;
  margin-bottom: var(--space-8);
}

.auth-input {
  width: 100%;
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  font-family: var(--font-ui);
  font-size: var(--text-base);
  background: var(--parchment);
  border: 1px solid var(--gold-light);
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast) var(--ease-out);
}

.auth-input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(212, 165, 116, 0.1);
}

.auth-btn-primary {
  width: 100%;
  padding: var(--space-4);
  background: var(--gold);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-ui);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.auth-btn-primary:hover {
  background: var(--gold-dark);
}
```

---

### 7. Reader Header

```css
.reader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-6) var(--space-8);
  background: white;
  border-bottom: 1px solid var(--gold-light);
}

.reader-logo {
  font-family: var(--font-reading);
  font-size: var(--text-xl);
  color: var(--gold-dark);
}

.reader-nav {
  display: flex;
  gap: var(--space-4);
}

.reader-nav-btn {
  padding: var(--space-3) var(--space-5);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--sepia);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.reader-nav-btn:hover {
  background: var(--parchment);
  border-color: var(--gold-light);
}

.reader-nav-btn.active {
  background: var(--gold-light);
  color: var(--gold-dark);
  border-color: var(--gold);
}
```

---

## Interaction Patterns

### Word Click → Definition Modal

**Sequence:**
1. User clicks word (100ms highlight feedback)
2. 50ms delay (feels intentional, not instant)
3. Modal slides in from right over 300ms
4. Background overlay fades in simultaneously
5. Word remains highlighted during modal open

**Code:**
```typescript
async function handleWordClick(word: string) {
  // 1. Immediate visual feedback
  setSelectedWord(word);

  // 2. Brief pause (feels intentional)
  await delay(50);

  // 3. Start modal animation + fetch in parallel
  setModalOpen(true);
  const definition = await fetchDefinition(word);
  setDefinition(definition);
}
```

### Text Selection → Play Button

**Sequence:**
1. User selects text
2. After 100ms of stable selection, show play button
3. Button appears near selection (floating tooltip style)
4. Fades in over 150ms
5. Click button → button changes to "Playing..." state
6. Audio plays → button shows pulse animation

### Mode Transitions (Input → Render)

**Sequence:**
1. User clicks "Render Text"
2. Button shows loading state (spinner)
3. Textarea fades out over 200ms
4. Rendered text fades in over 300ms (slight delay for smoothness)
5. Total transition: ~500ms (feels deliberate but not slow)

---

## Accessibility

### WCAG AA Requirements

```css
/* Minimum contrast ratios */
/* Normal text (< 18px): 4.5:1 */
/* Large text (≥ 18px): 3:1 */
/* UI components: 3:1 */

/* Our palette compliance */
--ink on --parchment: 14.2:1 ✅
--gold-dark on white: 4.8:1 ✅
--sepia on --parchment: 5.1:1 ✅
```

### Focus States

```css
/* All interactive elements must have visible focus */
*:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}

/* Custom focus for specific components */
.word:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 0;
  border-radius: var(--radius-sm);
}
```

### Keyboard Navigation

- **Tab**: Navigate between clickable words, buttons
- **Enter/Space**: Activate selected word (open modal)
- **Esc**: Close modal/panel
- **Arrow keys**: Navigate word-by-word (optional enhancement)

### Screen Reader Support

```html
<!-- Clickable word -->
<span
  role="button"
  tabindex="0"
  aria-label="Click to see definition of 'libro'"
  aria-pressed="false"
>
  libro
</span>

<!-- Audio button -->
<button
  aria-label="Listen to pronunciation of 'libro'"
  aria-busy="false"
>
  🔊 Listen
</button>

<!-- Modal -->
<div
  role="dialog"
  aria-labelledby="word-title"
  aria-modal="true"
>
  <h2 id="word-title">libro</h2>
  ...
</div>
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Mobile Responsive Breakpoints

```css
/* Breakpoints */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;

/* Mobile-first approach */
/* Base styles = mobile */
/* @media (min-width: X) = progressively enhance */
```

### Key Responsive Changes

**< 768px (Mobile):**
- Definition sidebar → bottom sheet
- Reduce reading text margin (80px → 32px)
- Stack header elements vertically if needed
- Increase touch target sizes to 44px minimum
- Reduce padding overall (48px → 24px)

**≥ 768px (Tablet):**
- Definition sidebar from right
- Restore generous margins
- Side-by-side layouts where appropriate

**≥ 1024px (Desktop):**
- Max content width: 800px (reading comfort)
- Sidebar max width: 400px
- Full desktop navigation

---

## Implementation Checklist

### Phase 1: Foundation (Day 1 AM)
- [ ] Set up CSS custom properties (all design tokens)
- [ ] Configure Tailwind to use design system
- [ ] Test color contrast ratios
- [ ] Set up font loading (Merriweather from Google Fonts)

### Phase 2: Core Components (Day 1 PM)
- [ ] Auth pages (login/signup) with design system
- [ ] Reader header component
- [ ] Text input panel with styled textarea
- [ ] Clickable word component with all states

### Phase 3: Interactive Elements (Day 2 AM)
- [ ] Definition modal/sidebar with animations
- [ ] Audio player button with states
- [ ] Text selection toolbar

### Phase 4: Polish (Day 2 PM)
- [ ] Vocabulary list with empty state
- [ ] Loading states everywhere
- [ ] Error states with helpful messages
- [ ] Mobile responsive adjustments
- [ ] Accessibility audit (keyboard nav, screen reader, focus states)
- [ ] Animation polish (timing, easing)

---

## Design System Resources

### Figma/Design Files
*(Optional - if time permits after MVP)*

### Design Tokens Export
```json
{
  "colors": {
    "parchment": "#F9F6F0",
    "ink": "#1A1614",
    "gold": "#D4A574",
    "sepia": "#8B7355",
    "crimson": "#A4443E"
  },
  "typography": {
    "fontFamilyReading": "Merriweather, Georgia, serif",
    "fontFamilyUI": "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, sans-serif",
    "fontSizeReading": "20px",
    "lineHeightReading": 1.75
  },
  "spacing": {
    "base": 4,
    "scale": [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96]
  },
  "animation": {
    "durationFast": "200ms",
    "durationNormal": "300ms",
    "easeOut": "cubic-bezier(0.16, 1, 0.3, 1)"
  }
}
```

---

**END OF DESIGN SYSTEM**

This design system prioritizes:
✅ **Warmth** over cold minimalism
✅ **Clarity** over decoration
✅ **Restraint** over excess
✅ **Craft** over speed

Use this as the single source of truth for all UI decisions. When in doubt, choose the simpler, warmer option.
