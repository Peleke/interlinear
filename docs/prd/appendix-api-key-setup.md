# Appendix: API Key Setup

## Merriam-Webster Spanish Dictionary

1. Go to: https://dictionaryapi.com/register/index
2. Sign up for free developer account
3. Select "Spanish-English Dictionary"
4. Copy API key
5. Add to `.env.local`: `MERRIAM_WEBSTER_API_KEY=xxx`

## ElevenLabs

1. Go to: https://elevenlabs.io/sign-up
2. Sign up (free tier: 10,000 chars/month)
3. Navigate to Profile → API Keys
4. Generate new key
5. Add to `.env.local`: `ELEVENLABS_API_KEY=xxx`

## Supabase

1. Go to: https://supabase.com/dashboard
2. Create new project
3. Copy Project URL and anon key from Settings → API
4. Add to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...`

---
