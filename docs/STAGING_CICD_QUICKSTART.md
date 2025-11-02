# Staging CI/CD Quickstart

Fast setup for automated staging deployments.

## What You Get

- ✅ **PR Checks**: Auto-validate type-check, lint, build on every PR
- ✅ **Auto-Deploy**: Merge to `staging` → auto-deploy to Cloud Run
- ✅ **Fast Feedback**: Results in ~5 minutes

## Setup (10 minutes)

### 1. Create GitHub Secrets

Go to: **Settings → Secrets and variables → Actions → New repository secret**

Add these 3 secrets:

```
Name: GCP_SA_KEY
Value: [Paste service account JSON key from Terraform output]

Name: GCP_PROJECT_ID
Value: your-gcp-project-id

Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://your-project.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: your-supabase-anon-key
```

### 2. Create GitHub Environment

Go to: **Settings → Environments → New environment**

```
Name: staging
Protection rules: None (auto-deploy, no approval needed)
```

### 3. Verify GCP Secrets Exist

Make sure these exist in GCP Secret Manager:

```bash
gcloud secrets list | grep staging

# Should see:
# supabase-anon-key-staging
# elevenlabs-api-key-staging
# openai-api-key-staging
```

If missing, create them:

```bash
echo -n "your-supabase-anon-key" | \
  gcloud secrets create supabase-anon-key-staging \
  --data-file=- --replication-policy=automatic

echo -n "your-elevenlabs-key" | \
  gcloud secrets create elevenlabs-api-key-staging \
  --data-file=- --replication-policy=automatic

echo -n "your-openai-key" | \
  gcloud secrets create openai-api-key-staging \
  --data-file=- --replication-policy=automatic
```

### 4. Commit and Push Workflows

```bash
git add .github/workflows/
git commit -m "ci: add staging CI/CD workflows"
git push origin main
```

## Usage

### PR Workflow
```bash
# 1. Create feature branch
git checkout -b feature/cool-thing

# 2. Make changes
# ... code code code ...

# 3. Push and create PR to staging
git push origin feature/cool-thing

# 4. Go to GitHub → Create PR to `staging`
# PR checks run automatically:
#   - Type check
#   - Lint
#   - Build
#   - Docker build test

# 5. Get approval and merge
# (or just merge if no protection rules)
```

### Auto-Deploy Flow
```bash
# When PR merges to staging:
# 1. GitHub Actions triggers automatically
# 2. Builds Docker container with staging env vars
# 3. Pushes to Artifact Registry
# 4. Deploys to Cloud Run (interlinear-staging)
# 5. Posts deployment summary with URL

# Total time: ~3-5 minutes
```

### Check Deployment

```bash
# Get staging URL
gcloud run services describe interlinear-staging \
  --region=us-east4 \
  --format='value(status.url)'

# Test it
curl https://interlinear-staging-xxxx.a.run.app
```

## What Gets Deployed

**On every merge to `staging`:**
- New Docker image: `staging-{git-sha}`
- Also tagged: `staging-latest`
- Cloud Run service updated automatically
- Environment variables set from GitHub secrets
- Runtime secrets from GCP Secret Manager

## Troubleshooting

### PR Checks Failing

**Type check fails:**
```bash
npm run type-check
# Fix TypeScript errors locally
```

**Lint fails:**
```bash
npm run lint
# Fix ESLint errors locally
```

**Build fails:**
```bash
npm run build
# Check for build errors
```

**Docker build fails:**
```bash
docker build -t test .
# Check Dockerfile and build args
```

### Deployment Fails

**Check GitHub Actions logs:**
1. Go to Actions tab
2. Click failing workflow
3. Check error messages

**Common issues:**

**Missing secrets:**
```bash
# Verify GitHub secrets are set
gh secret list

# Verify GCP secrets exist
gcloud secrets list
```

**Authentication fails:**
```bash
# Check service account key is valid
cat github-actions-key.json | jq .

# Verify SA has correct permissions
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions@*"
```

**Cloud Run deploy fails:**
```bash
# Check service exists (or will be created)
gcloud run services describe interlinear-staging \
  --region=us-east4

# Check logs
gcloud run services logs read interlinear-staging \
  --region=us-east4 \
  --limit=50
```

## Quick Commands

```bash
# Check PR status
gh pr checks

# View staging logs
gcloud run services logs tail interlinear-staging --region=us-east4

# List recent deployments
gcloud run revisions list --service=interlinear-staging --region=us-east4

# Rollback if needed
gcloud run services update-traffic interlinear-staging \
  --to-revisions=<good-revision>=100 \
  --region=us-east4
```

## Next Steps

Once staging is working smoothly:

1. **Add E2E tests** to PR workflow (optional)
2. **Set up production pipeline** (when ready)
3. **Configure branch protection** on `staging` branch
4. **Add monitoring/alerts** for staging service

## Summary

**Total setup time**: ~10 minutes
**PR feedback time**: ~5 minutes
**Deploy time**: ~3-5 minutes
**Manual steps**: Zero after setup

You now have:
- ✅ Automated quality gates on PRs
- ✅ Auto-deploy to staging on merge
- ✅ Fast iteration cycles
- ✅ Traceable deployments (git SHA → image → Cloud Run)

**Ready to ship!** 🚀
