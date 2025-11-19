# Timezone-Aware Word Generation Architecture Plan

## 🚨 CURRENT PROBLEM ANALYSIS

### Issues Identified:
1. **Single Timezone Generation**: Words generated once globally in server timezone (UTC)
2. **User Expectation Mismatch**: Users expect words at midnight in THEIR timezone
3. **Missing User Timezone**: No user timezone storage in current system
4. **Cron Authorization**: Existing cron needs Bearer token but no actual scheduler

### Root Cause:
```
Server (UTC): 2025-11-19 00:22 → "Generate today's word"
User (EST):   2025-11-18 19:22 → "Where's today's word??"
User (PST):   2025-11-18 16:22 → "Still yesterday for me!"
```

## 🎯 SOLUTION ARCHITECTURE

### Phase 1: User Timezone Storage
```typescript
// Add to users table or preferences
interface UserProfile {
  user_id: string
  timezone: string // 'America/New_York', 'Europe/London', etc.
  preferred_language: 'spanish' | 'latin'
  created_at: timestamp
}
```

### Phase 2: Timezone-Based Generation Strategy

#### Option A: Major Timezone Batch Generation (RECOMMENDED)
```
Major timezones to support:
- Americas: America/New_York, America/Los_Angeles, America/Chicago
- Europe: Europe/London, Europe/Paris, Europe/Berlin
- Asia: Asia/Tokyo, Asia/Singapore
- Oceania: Australia/Sydney

Generate words for each timezone as it hits midnight.
```

#### Option B: Per-User Generation (OVERKILL)
```
Generate word individually for each user when they first access the app each day.
Pros: Perfect personalization
Cons: High compute cost, complex coordination
```

### Phase 3: Supabase Edge Function Architecture

#### Edge Function: `timezone-word-generator`
```typescript
// Deployed to multiple regions for low latency
// Triggered via cron for each major timezone

export default async function handler() {
  // 1. Determine current timezone hitting midnight
  const currentTimezone = getCurrentMidnightTimezone()

  // 2. Check if word already generated for this timezone today
  const existingWord = await checkExistingWord(currentTimezone, today)
  if (existingWord) return

  // 3. Generate words for all languages
  const languages = ['spanish', 'latin']
  for (const lang of languages) {
    await generateWordForTimezoneDate(lang, currentTimezone, today)
  }

  // 4. Notify users in this timezone (push notifications)
  await notifyUsersInTimezone(currentTimezone)
}
```

#### Scheduling Strategy:
```yaml
Cron Schedule: "0 0 * * *" # Every midnight UTC
Edge Function Logic:
  - Calculate which timezone is hitting midnight now
  - Generate word for that specific timezone-date combination
  - Store with timezone context

Alternative: Multiple Cron Jobs
  - 24 separate cron jobs for each major timezone
  - Each runs at midnight in that timezone
```

### Phase 4: API Updates for Timezone Context

#### Updated word-of-day API:
```typescript
// GET /api/word-of-day?language=spanish&timezone=America/New_York
export async function GET(request: Request) {
  const { language, timezone } = extractParams(request)
  const userTimezone = timezone || 'UTC'

  // Calculate what date it is in user's timezone
  const userToday = getTodayInTimezone(userTimezone)

  // Try to get word for user's date in their timezone
  let word = await getWordForTimezoneDate(language, userTimezone, userToday)

  // Fallback: get word from any timezone for this date
  if (!word) {
    word = await getWordForDate(language, userToday)
  }

  // Final fallback: get most recent word
  if (!word) {
    word = await getMostRecentWord(language)
  }

  return { word, timezone_context: userTimezone, date: userToday }
}
```

## 🔧 IMPLEMENTATION PHASES

### Phase 1: Database Schema Updates (IMMEDIATE)
```sql
-- Add timezone context to existing word_of_day table
ALTER TABLE word_of_day ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE word_of_day ADD COLUMN timezone_date DATE;

-- Create index for efficient timezone queries
CREATE INDEX idx_word_timezone_date ON word_of_day(language, timezone, timezone_date);

-- Add user timezone preferences
ALTER TABLE user_preferences ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
```

### Phase 2: Timezone Detection (FRONTEND)
```typescript
// Detect user timezone and store in preferences
function detectAndStoreUserTimezone() {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  // Store in user preferences
  updateUserPreference('timezone', userTimezone)
}
```

### Phase 3: Supabase Edge Function Deployment
```bash
# Deploy timezone-aware word generator
supabase functions deploy timezone-word-generator --project-ref YOUR_PROJECT

# Set up cron trigger
supabase functions schedule timezone-word-generator --cron "0 0 * * *"
```

### Phase 4: API Migration
- Update word-of-day API to accept timezone parameter
- Add fallback logic for timezone mismatches
- Update frontend to pass user timezone

## 🚀 DEPLOYMENT STRATEGY

### Week 1: Schema & Backend
1. Deploy database schema changes
2. Update APIs to handle timezone context
3. Add timezone detection to frontend

### Week 2: Edge Function
1. Deploy Supabase Edge Function
2. Test timezone-aware generation
3. Set up cron scheduling

### Week 3: Migration & Testing
1. Migrate existing words to timezone context
2. Test across multiple timezones
3. Monitor for edge cases

### Week 4: Rollout
1. Enable timezone-aware generation
2. Backfill missing timezone words
3. Monitor user experience

## 🔍 EDGE CASES & CONSIDERATIONS

### DST (Daylight Saving Time)
- Use timezone-aware date calculations
- Handle DST transitions gracefully
- Test during DST change periods

### User Travel
- Allow manual timezone override
- Detect timezone changes
- Maintain word availability during travel

### Fallback Strategy
```
User requests word →
├─ Word exists for user's timezone/date? ✓ Return it
├─ Word exists for ANY timezone on this date? ✓ Return it
├─ Word exists for yesterday in user's timezone? ✓ Return it
└─ Return most recent available word + "showing recent" message
```

### Performance Considerations
- Cache timezone calculations
- Pre-generate for major timezones only
- Use CDN for global availability
- Monitor Edge Function costs

## 🎯 SUCCESS METRICS

### User Experience:
- Word availability at user's local midnight: >95%
- Reduced "no word found" messages: <5%
- User timezone accuracy: >90%

### Technical:
- Edge Function execution time: <500ms
- API response time: <200ms
- Timezone calculation accuracy: 100%
- Cron job reliability: >99%

## 🚨 RISKS & MITIGATION

### Risk: Edge Function Failures
**Mitigation**: Backup cron on main server + manual generation endpoint

### Risk: Timezone Calculation Errors
**Mitigation**: Extensive testing across timezones + fallback logic

### Risk: High Compute Costs
**Mitigation**: Generate for major timezones only + efficient caching

### Risk: User Timezone Detection Issues
**Mitigation**: Graceful fallbacks + manual override option