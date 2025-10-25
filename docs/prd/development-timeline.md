# Development Timeline

## Day 1: Core Foundation (8-10 hours)

### Morning (4 hours)
**Goal:** Authentication + Project Setup

- [ ] **Hour 1: Project Initialization**
  - Create Next.js 15 project with TypeScript
  - Install dependencies: Tailwind, Supabase client, UI libraries
  - Set up ESLint + Prettier
  - Configure environment variables (.env.local template)
  - Initialize Git repository

- [ ] **Hour 2-3: Supabase Setup**
  - Create Supabase project
  - Run database migrations (create tables)
  - Configure RLS policies
  - Test auth flow locally
  - Create `AuthProvider` component

- [ ] **Hour 3-4: Auth Pages**
  - Build `LoginPage` component
  - Build `SignupPage` component
  - Protected route wrapper
  - Test registration → login → logout flow

**Checkpoint:** User can sign up, log in, and see authenticated "Reader" page

---

### Afternoon (4-6 hours)
**Goal:** Text Input + Dictionary Integration

- [ ] **Hour 5: Reader Layout**
  - Create `ReaderPage` skeleton
  - Build mode switcher (input/render/vocabulary)
  - Create `TextInputPanel` with textarea
  - Character count + render button

- [ ] **Hour 6-7: Tokenization Engine**
  - Implement `tokenizeText()` function
  - Sentence boundary detection
  - Create `ClickableWord` component
  - Test rendering with sample Spanish text

- [ ] **Hour 8-9: Dictionary API**
  - Create `/api/dictionary/lookup` route
  - Integrate Merriam-Webster API
  - Transform API response to internal format
  - Error handling (404, 429, 500)

- [ ] **Hour 9-10: Definition Sidebar**
  - Build `DefinitionSidebar` component
  - Connect click handler → API call → display
  - Loading states + error states
  - Close button functionality

**Checkpoint:** User can paste text, click words, see definitions

---

## Day 2: TTS + Vocabulary + Polish (8-10 hours)

### Morning (4 hours)
**Goal:** Text-to-Speech Integration

- [ ] **Hour 1-2: TTS API Route**
  - Create `/api/tts/speak` endpoint
  - Integrate ElevenLabs streaming API
  - Test audio playback in browser
  - Error handling (quota, network)

- [ ] **Hour 3: Word Pronunciation**
  - Add `AudioPlayer` component to sidebar
  - Speaker icon → plays word audio
  - Visual feedback (loading, playing states)
  - Cache audio in localStorage

- [ ] **Hour 4: Selection Playback**
  - Detect text selection with `window.getSelection()`
  - Show floating "Play" button on selection
  - Send selection to TTS API
  - Handle long selections (character limit)

**Checkpoint:** User can hear word + sentence pronunciation

---

### Afternoon (4-6 hours)
**Goal:** Vocabulary Persistence + UI Polish

- [ ] **Hour 5-6: Vocabulary Auto-Save**
  - Create vocabulary save function (Supabase insert/update)
  - Hook up to word click handler
  - Deduplicate logic (increment click_count)
  - Visual indicator for saved words

- [ ] **Hour 7: Vocabulary List View**
  - Build `VocabularyList` component
  - Fetch user's vocabulary on load
  - Display list with sort (recent first)
  - Empty state design

- [ ] **Hour 8-9: UI Polish**
  - Typography improvements (fonts, spacing)
  - Smooth animations (sidebar, mode transitions)
  - Mobile responsive adjustments
  - Accessibility audit (ARIA labels, keyboard nav)

- [ ] **Hour 10: Final Testing**
  - End-to-end user flow test
  - Cross-browser testing (Chrome, Firefox, Safari)
  - Mobile device testing
  - Fix critical bugs

**Checkpoint:** Fully functional MVP ready for demo

---

## Day 3: Deployment + DevOps (6-8 hours)

### Morning (4 hours)
**Goal:** Containerization + IaC

- [ ] **Hour 1: Dockerfile**
  - Create optimized Next.js Dockerfile
  - Multi-stage build (build → runtime)
  - Test local Docker build
  - Push to Google Container Registry

- [ ] **Hour 2-3: OpenTofu Configuration**
  - Write Terraform configs for Cloud Run service
  - Configure environment variables (secrets)
  - Set up custom domain (optional)
  - Test local `tofu apply`

- [ ] **Hour 4: Manual Deployment Test**
  - Deploy to Cloud Run manually
  - Verify environment variables
  - Test production URLs
  - Check logs for errors

**Checkpoint:** App running on Cloud Run

---

### Afternoon (2-4 hours)
**Goal:** CI/CD Pipeline

- [ ] **Hour 5-6: GitHub Actions Workflow**
  - Create `.github/workflows/deploy.yml`
  - Set up GitHub secrets (API keys, GCP credentials)
  - Configure workflow triggers (push to main)
  - Add build → test → deploy steps

- [ ] **Hour 7: Pipeline Testing**
  - Push test commit to trigger workflow
  - Monitor Actions logs
  - Debug any failures
  - Verify deployment success

- [ ] **Hour 8: Demo Preparation**
  - Prepare demo script/talking points
  - Create demo account with sample data
  - Test demo flow end-to-end
  - Screen recording (backup if live demo fails)

**Checkpoint:** Fully deployed with CI/CD, ready to present

---
