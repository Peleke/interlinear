# GitHub Secrets Setup - Quick Reference

Complete guide for adding secrets to enable staging CI/CD.

## Overview

You need to add 4 repository secrets to enable automated deployments to `interlinear-93`.

## Step-by-Step Instructions

### 1. Navigate to Repository Secrets

1. Go to your GitHub repository
2. Click: `Settings` → `Secrets and variables` → `Actions`
3. Click: `New repository secret`

### 2. Add Each Secret

Add these 4 secrets one by one:

---

#### Secret 1: `GCP_PROJECT_ID`

**Name**: `GCP_PROJECT_ID`

**Value**:
```
interlinear-93
```

**What it's for**: Tells GitHub Actions which GCP project to deploy to

---

#### Secret 2: `GCP_SA_KEY`

**Name**: `GCP_SA_KEY`

**Value**: Copy the **entire JSON** from the file `github-actions-staging-key.json`

The key was generated at: `/home/peleke/Documents/Projects/swae/interlinear/github-actions-staging-key.json`

**To get the value**:
```bash
cat /home/peleke/Documents/Projects/swae/interlinear/github-actions-staging-key.json
```

**Important**:
- Copy the ENTIRE JSON (starting with `{` and ending with `}`)
- Include all newlines and formatting
- Don't add extra spaces or modify it

**What it's for**: Authenticates GitHub Actions to deploy to GCP

---

#### Secret 3: `NEXT_PUBLIC_SUPABASE_URL`

**Name**: `NEXT_PUBLIC_SUPABASE_URL`

**Value**: Your Supabase project URL (for staging environment)

**How to find it**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your staging project (or main project if using one for all environments)
3. Click: `Settings` → `API`
4. Copy the **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)

**Example**:
```
https://pvigmyvestuzlcrclosp.supabase.co
```

**What it's for**: Connects the app to Supabase for database and auth

---

#### Secret 4: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Value**: Your Supabase anonymous/public API key

**How to find it**:
1. Same location as above: Supabase Dashboard → Settings → API
2. Copy the **anon/public** key (starts with `eyJ...`)

**Example**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2aWdteXZlc3R1emxjcmNsb3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk5NTg2MzcsImV4cCI6MjA0NTUzNDYzN30.hBg7xXqO8YLJwFPOKFW0jYGE6Ry6zqPvV3zOm1234567
```

**What it's for**: Allows the client-side app to authenticate with Supabase

---

## Verification

After adding all 4 secrets, verify they're set:

1. Go to: `Settings` → `Secrets and variables` → `Actions`
2. You should see:
   - ✅ `GCP_PROJECT_ID`
   - ✅ `GCP_SA_KEY`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`

## Security Notes

⚠️ **Important**:
- Never commit `github-actions-staging-key.json` to git
- Keep the service account key file secure
- Don't share these secrets publicly
- Rotate keys if compromised

The key file is already in `.gitignore` as `*key.json`.

## Troubleshooting

### Can't find the service account key file?

Generate a new one:
```bash
cd /home/peleke/Documents/Projects/swae/interlinear
gcloud iam service-accounts keys create github-actions-staging-key.json \
  --iam-account=github-actions-staging@interlinear-93.iam.gserviceaccount.com \
  --project=interlinear-93
```

### GitHub says "Invalid JSON" for GCP_SA_KEY

- Make sure you copied the **entire** JSON object
- Check that it starts with `{` and ends with `}`
- No extra characters before or after
- Paste directly from `cat` command output

### Don't have a Supabase project?

You need to create one:
1. Go to [supabase.com](https://supabase.com)
2. Create new project (or use existing)
3. Get URL and anon key from Settings → API

### Secrets not taking effect?

- Re-run the GitHub Action workflow
- Check workflow logs for authentication errors
- Verify secret names match exactly (case-sensitive)

## Next Steps

After adding secrets:

1. ✅ Create staging branch: `git checkout -b staging && git push -u origin staging`
2. ✅ Create test feature: `git checkout -b feature/test-cicd`
3. ✅ Make small change and push
4. ✅ Create PR to staging
5. ✅ Watch PR checks run
6. ✅ Merge and watch auto-deployment

See `STAGING_SETUP_GUIDE.md` for complete testing walkthrough.
