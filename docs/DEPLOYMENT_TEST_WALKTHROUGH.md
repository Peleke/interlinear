# Staging Deployment Test - Complete Walkthrough

Step-by-step guide to test your staging CI/CD pipeline end-to-end.

## Prerequisites Checklist

Before starting, verify you've completed:

- ✅ GCP APIs enabled (Cloud Run, Artifact Registry, Secret Manager)
- ✅ Artifact Registry repository created: `us-east4-docker.pkg.dev/interlinear-93/interlinear`
- ✅ Service account created: `github-actions-staging@interlinear-93.iam.gserviceaccount.com`
- ✅ Service account key generated: `github-actions-staging-key.json`
- ✅ GCP secrets created:
  - `supabase-anon-key-staging`
  - `elevenlabs-api-key-staging`
  - ⚠️  `openai-api-key-staging` (create if needed)
- ✅ GitHub secrets configured:
  - `GCP_PROJECT_ID`
  - `GCP_SA_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Missing OpenAI Secret?

If you haven't created the OpenAI secret yet:

```bash
# Option 1: If you have the API key
echo -n 'sk-proj-YOUR_OPENAI_KEY' | gcloud secrets create openai-api-key-staging \
  --data-file=- \
  --replication-policy=automatic \
  --project=interlinear-93

# Option 2: Create placeholder (update later)
echo -n 'placeholder' | gcloud secrets create openai-api-key-staging \
  --data-file=- \
  --replication-policy=automatic \
  --project=interlinear-93

# Grant service account access
gcloud secrets add-iam-policy-binding openai-api-key-staging \
  --member="serviceAccount:github-actions-staging@interlinear-93.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=interlinear-93
```

## Test Workflow

### Step 1: Verify Current Branch

```bash
# Check current branch
git branch

# Should see 'tests' branch (or another feature branch)
git status
```

### Step 2: Create Staging Branch

```bash
# Make sure we're up to date
git checkout main
git pull origin main

# Create staging branch from main
git checkout -b staging
git push -u origin staging
```

**Expected output**:
```
Total 0 (delta 0), reused 0 (delta 0)
To github.com:yourusername/interlinear.git
 * [new branch]      staging -> staging
Branch 'staging' set up to track remote branch 'staging' from 'origin'.
```

### Step 3: Create Test Feature Branch

```bash
# Create test feature from staging
git checkout staging
git checkout -b feature/test-staging-cicd

# Make a small test change
echo "# CI/CD Test - $(date)" >> CICD_TEST.md
git add CICD_TEST.md
git commit -m "test: verify staging CI/CD pipeline"

# Push to GitHub
git push -u origin feature/test-staging-cicd
```

### Step 4: Create Pull Request to Staging

1. Go to GitHub repository
2. You should see: "Compare & pull request" button
3. Click it, or go to `Pull Requests` → `New pull request`
4. Set branches:
   - **base**: `staging`
   - **compare**: `feature/test-staging-cicd`
5. Title: "Test: Verify staging CI/CD pipeline"
6. Click: "Create pull request"

### Step 5: Watch PR Checks

The PR checks should start automatically. Go to the PR and click "Checks" tab.

**Expected checks**:

#### Check 1: Quality Checks (~5-7 minutes)
- ✅ Checkout code
- ✅ Setup Node.js
- ✅ Install dependencies
- ✅ Type check
- ✅ Lint
- ✅ Build
- ✅ Install Playwright
- ✅ Run E2E tests
- ✅ Upload test results (if tests fail)

#### Check 2: Docker Build Test (~3-5 minutes)
- ✅ Checkout code
- ✅ Set up Docker Buildx
- ✅ Build container (test only)

**If checks fail**:
- Click on the failing check to see logs
- Common issues:
  - TypeScript errors → Fix in code
  - Missing secrets → Verify GitHub secrets are set
  - E2E test failures → Check Supabase connection

**If checks pass**: ✅ Ready to merge!

### Step 6: Merge to Staging

1. Click "Merge pull request"
2. Click "Confirm merge"
3. Optionally delete the feature branch

**What happens next**: The staging deployment workflow triggers automatically!

### Step 7: Watch Staging Deployment

1. Go to: `Actions` tab in GitHub
2. You should see: "Deploy to Staging" workflow running
3. Click on it to watch progress

**Expected steps** (~3-5 minutes total):

#### Build Phase (~2-3 minutes)
- ✅ Checkout code
- ✅ Authenticate to Google Cloud
- ✅ Set up Cloud SDK
- ✅ Configure Docker for Artifact Registry
- ✅ Get version info (SHA, timestamp)
- ✅ Build and push container

#### Deploy Phase (~1-2 minutes)
- ✅ Deploy to Cloud Run
- ✅ Get service URL
- ✅ Deployment summary

### Step 8: Get Staging URL

When deployment completes, look for the **Deployment summary** section in the workflow output:

```
## 🚀 Staging Deployment Complete

**Commit**: `abc1234`
**Image**: `staging-abc1234`
**URL**: https://interlinear-staging-xxxxx.a.run.app

### Quick Test
```bash
curl https://interlinear-staging-xxxxx.a.run.app
```
```

Copy the URL!

### Step 9: Verify Deployment

#### Test 1: Basic Health Check

```bash
# Replace with your actual staging URL
curl https://interlinear-staging-xxxxx.a.run.app

# Should return HTML (Next.js app)
# Look for: <!DOCTYPE html>
```

#### Test 2: Browser Test

1. Open the staging URL in your browser
2. Check that the app loads
3. Verify no console errors (F12 → Console)

#### Test 3: Authentication Test

1. Click "Sign Up"
2. Enter test email: `test@example.com`
3. Enter password: `TestPassword123!`
4. Submit form
5. Should see: "Success! Account created"
6. Check email for verification (if real email)

#### Test 4: Core Functionality

1. Login with existing account (or create one)
2. Try uploading a text
3. Check reader functionality
4. Test any other critical features

### Step 10: View Deployment Details

```bash
# Get service details
gcloud run services describe interlinear-staging \
  --region=us-east4 \
  --project=interlinear-93

# View logs
gcloud run services logs tail interlinear-staging \
  --region=us-east4 \
  --project=interlinear-93

# Check container images
gcloud artifacts docker images list \
  us-east4-docker.pkg.dev/interlinear-93/interlinear/app \
  --include-tags \
  --filter='tags:staging-*' \
  --project=interlinear-93
```

## Success Criteria

Your staging deployment is working if:

- ✅ PR checks passed (type-check, lint, build, E2E tests, Docker build)
- ✅ Deployment workflow completed successfully
- ✅ Service URL is accessible and returns HTML
- ✅ App loads in browser without errors
- ✅ Authentication works (signup/login)
- ✅ Core features are functional
- ✅ Logs show successful startup
- ✅ Container image exists in Artifact Registry

## Troubleshooting

### Deployment Failed: "Permission denied"

Check service account permissions:
```bash
gcloud projects get-iam-policy interlinear-93 \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions-staging@interlinear-93.iam.gserviceaccount.com"
```

Should show these roles:
- `roles/artifactregistry.writer`
- `roles/run.admin`
- `roles/secretmanager.secretAccessor`
- `roles/iam.serviceAccountUser`

### Container Build Failed

Check the build logs in GitHub Actions. Common issues:
- Missing build args (Supabase URL/key)
- TypeScript errors
- Missing dependencies

### Service Won't Start

View Cloud Run logs:
```bash
gcloud run services logs read interlinear-staging \
  --region=us-east4 \
  --project=interlinear-93 \
  --limit=50
```

Common issues:
- Port not exposed (should be 3000)
- Missing environment variables
- Invalid Supabase credentials
- Secret not found

### App Loads but Auth Doesn't Work

Check:
1. Supabase URL and key are correct
2. Secrets in Secret Manager match Supabase project
3. Browser console for errors
4. Cloud Run logs for auth errors

### "Secret not found" Error

Verify secret exists and has correct name:
```bash
gcloud secrets list --project=interlinear-93

# Check specific secret
gcloud secrets versions access latest --secret=supabase-anon-key-staging \
  --project=interlinear-93
```

## Next Steps

After successful staging deployment:

### 1. Set Up GitHub Environment Protection (Optional)

For extra safety, configure the staging environment:
1. Go to: `Settings` → `Environments` → `staging`
2. Add protection rules:
   - Required reviewers (optional)
   - Wait timer (optional)
   - Deployment branches: `staging` only

### 2. Create More Feature Branches

Continue development workflow:
```bash
git checkout staging
git checkout -b feature/my-new-feature
# ... develop ...
git push origin feature/my-new-feature
# Create PR to staging → auto-deploy on merge
```

### 3. Set Up Production Workflow

See: `GITOPS_WORKFLOW.md` for production setup

### 4. Document Your Staging URL

Add to your `.env.local` or docs:
```
STAGING_URL=https://interlinear-staging-xxxxx.a.run.app
```

## Monitoring

### View Recent Deployments

```bash
# List revisions
gcloud run revisions list \
  --service=interlinear-staging \
  --region=us-east4 \
  --project=interlinear-93

# Traffic split
gcloud run services describe interlinear-staging \
  --region=us-east4 \
  --project=interlinear-93 \
  --format='value(status.traffic)'
```

### Cost Monitoring

Check current usage:
```bash
# Via gcloud
gcloud run services describe interlinear-staging \
  --region=us-east4 \
  --project=interlinear-93 \
  --format='value(spec.template.spec.containers[0].resources)'

# Or go to: GCP Console → Cloud Run → interlinear-staging → Metrics
```

Expected cost: **$0-5/month** (scales to zero when idle)

## Clean Up Test Resources

After verification, clean up the test PR:

```bash
# Delete test feature branch
git checkout staging
git branch -d feature/test-staging-cicd
git push origin --delete feature/test-staging-cicd

# Delete test file
git rm CICD_TEST.md
git commit -m "chore: remove CI/CD test file"
git push origin staging
```

---

**Congratulations!** 🎉 Your staging CI/CD pipeline is working!

You now have:
- ✅ Automated PR checks
- ✅ Automated staging deployments
- ✅ Working Cloud Run service
- ✅ Full CI/CD pipeline from PR to production

**Developer workflow**:
```
feature/* → PR to staging → checks pass → merge → auto-deploy → verify
```
