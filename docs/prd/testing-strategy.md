# Testing Strategy

## Manual Testing Checklist

**Authentication:**
- [ ] Sign up with new email → creates account
- [ ] Sign up with existing email → shows error
- [ ] Login with valid credentials → redirects to reader
- [ ] Login with invalid credentials → shows error
- [ ] Logout → clears session and redirects to login
- [ ] Return with valid session → skips login

**Text Input & Rendering:**
- [ ] Paste short text (< 100 words) → renders correctly
- [ ] Paste long text (> 2000 words) → shows warning
- [ ] Click "Render" → transitions to render mode
- [ ] Click "Edit" → returns to input mode
- [ ] Punctuation preserved (periods, commas, quotes)

**Dictionary Lookups:**
- [ ] Click common word → definition appears
- [ ] Click rare word → "not found" message
- [ ] Click same word twice → second click faster (cache)
- [ ] Click word during loading → doesn't break UI
- [ ] API error → graceful error message

**Text-to-Speech:**
- [ ] Click speaker icon → word plays
- [ ] Audio plays smoothly (< 1s delay)
- [ ] Click another word → previous audio stops
- [ ] Select text → play button appears
- [ ] Play selection → sentence audio plays
- [ ] API quota exceeded → hides audio button gracefully

**Vocabulary:**
- [ ] First click saves word to database
- [ ] Second click increments click count
- [ ] Saved indicator appears on word
- [ ] Vocabulary list shows all saved words
- [ ] List persists after page reload
- [ ] Empty vocabulary shows empty state

**UI/UX:**
- [ ] All transitions smooth (60fps)
- [ ] Mobile layout adapts correctly
- [ ] Touch targets ≥ 44px on mobile
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Screen reader announces changes (basic ARIA)

**Performance:**
- [ ] Page loads in < 2 seconds on 3G
- [ ] No layout shift during load
- [ ] Dictionary lookups < 500ms
- [ ] Audio playback starts < 1 second
- [ ] No memory leaks (DevTools profiling)

---

## Automated Testing (If Time Permits)

**Unit Tests (Vitest):**
```typescript
// lib/tokenize.test.ts
describe('tokenizeText', () => {
  it('splits text by whitespace', () => {
    const tokens = tokenizeText('Hola mundo');
    expect(tokens).toHaveLength(3); // ['Hola', ' ', 'mundo']
  });

  it('preserves punctuation', () => {
    const tokens = tokenizeText('¿Cómo estás?');
    expect(tokens[0].text).toBe('¿Cómo');
    expect(tokens[2].text).toBe('estás?');
  });
});
```

**API Route Tests:**
```typescript
// app/api/dictionary/lookup/route.test.ts
describe('POST /api/dictionary/lookup', () => {
  it('returns definition for valid word', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/dictionary/lookup', {
        method: 'POST',
        body: JSON.stringify({ word: 'casa' }),
      })
    );

    const data = await response.json();
    expect(data.word).toBe('casa');
    expect(data.definitions).toBeDefined();
  });
});
```

**E2E Tests (Playwright - Optional):**
```typescript
// tests/reader.spec.ts
test('user can look up a word', async ({ page }) => {
  await page.goto('/reader');

  // Paste text
  await page.fill('textarea', 'Hola mundo');
  await page.click('button:has-text("Render")');

  // Click word
  await page.click('text="Hola"');

  // Verify sidebar appears
  await expect(page.locator('[data-testid="definition-sidebar"]')).toBeVisible();
});
```

---
