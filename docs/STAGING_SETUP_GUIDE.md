# Staging CI/CD Setup Guide - Interlinear

Complete walkthrough for setting up automated staging deployments to `interlinear-93`.

## Prerequisites

Before starting, ensure you have:
- GCP project: `interlinear-93`
- GitHub repository with admin access
- `gcloud` CLI installed and authenticated
- Supabase project for staging environment

## Part 1: GCP Setup

### 1.1 Enable Required APIs

```bash
# Enable necessary Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --project=interlinear-93
```

### 1.2 Create Artifact Registry

```bash
# Create Docker repository for container images
gcloud artifacts repositories create interlinear \
  --repository-format=docker \
  --location=us-east4 \
  --description="Interlinear app container images" \
  --project=interlinear-93
```

Verify:
```bash
gcloud artifacts repositories describe interlinear \
  --location=us-east4 \
  --project=interlinear-93
```

### 1.3 Create Service Account for CI/CD

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions CI/CD" \
  --description="Service account for GitHub Actions deployments" \
  --project=interlinear-93

# Grant necessary permissions
gcloud projects add-iam-policy-binding interlinear-93 \
  --member="serviceAccount:github-actions@interlinear-93.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding interlinear-93 \
  --member="serviceAccount:github-actions@interlinear-93.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding interlinear-93 \
  --member="serviceAccount:github-actions@interlinear-93.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding interlinear-93 \
  --member="serviceAccount:github-actions@interlinear-93.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create and download key
gcloud iam service-accounts keys create ~/github-actions-key.json \
  --iam-account=github-actions@interlinear-93.iam.gserviceaccount.com \
  --project=interlinear-93

echo "⚠️  IMPORTANT: Save ~/github-actions-key.json securely - you'll need it for GitHub secrets"
```

### 1.4 Create Secrets in Secret Manager

```bash
# Create secrets for staging environment
echo -n "YOUR_SUPABASE_ANON_KEY" | gcloud secrets create supabase-anon-key-staging \
  --data-file=- \
  --replication-policy=automatic \
  --project=interlinear-93

echo -n "YOUR_ELEVENLABS_API_KEY" | gcloud secrets create elevenlabs-api-key-staging \
  --data-file=- \
  --replication-policy=automatic \
  --project=interlinear-93

echo -n "YOUR_OPENAI_API_KEY" | gcloud secrets create openai-api-key-staging \
  --data-file=- \
  --replication-policy=automatic \
  --project=interlinear-93

# Grant service account access to secrets
for secret in supabase-anon-key-staging elevenlabs-api-key-staging openai-api-key-staging; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:github-actions@interlinear-93.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --project=interlinear-93
done
```

Verify secrets:
```bash
gcloud secrets list --project=interlinear-93
```

---

## Part 2: GitHub Setup

### 2.1 Configure GitHub Environments

1. Go to your repository: `Settings → Environments`
2. Create new environment: **`staging`**
3. Environment settings:
   - **Protection rules**: None (for auto-deploy)
   - **Environment secrets**: Will use repository secrets

### 2.2 Add GitHub Repository Secrets

Go to: `Settings → Secrets and variables → Actions → New repository secret`

Add these secrets:

| Secret Name | Value | Source |
|-------------|-------|--------|
| `GCP_PROJECT_ID` | `interlinear-93` | Your GCP project ID |
| `GCP_SA_KEY` | `<contents of github-actions-key.json>` | Service account key file |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase project URL (staging) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxx...` | Supabase anon key (staging) |

**Getting the service account key:**
```bash
cat ~/github-actions-key.json
# Copy entire JSON content → paste into GCP_SA_KEY secret
```

**Finding Supabase credentials:**
- Go to Supabase Dashboard → Project Settings → API
- Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
- Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2.3 Verify Workflows Exist

Check that these files are in `.github/workflows/`:
- ✅ `pr-check.yml` - Quality gates for PRs
- ✅ `staging-deploy.yml` - Auto-deploy to staging

---

## Part 3: Testing the Setup

### 3.1 Create Staging Branch

```bash
# Ensure you're on main
git checkout main
git pull

# Create staging branch
git checkout -b staging
git push -u origin staging
```

### 3.2 Test with a Feature Branch

```bash
# Create test feature
git checkout -b feature/test-cicd

# Make a small change
echo "# CI/CD Test" >> test-cicd.md
git add test-cicd.md
git commit -m "test: verify CI/CD pipeline"

# Push and create PR to staging
git push -u origin feature/test-cicd
```

### 3.3 Open Pull Request

1. Go to GitHub → Pull Requests → New PR
2. Set **base**: `staging` ← **compare**: `feature/test-cicd`
3. Create PR
4. Watch for PR checks to run:
   - ✅ Quality Checks (type-check, lint, build, tests)
   - ✅ Docker Build Test

### 3.4 Merge and Watch Deployment

1. Once PR checks pass, merge to `staging`
2. Go to: `Actions → Deploy to Staging`
3. Watch the deployment workflow:
   - Build container
   - Push to Artifact Registry
   - Deploy to Cloud Run
   - Get service URL

**Expected timeline**: 3-5 minutes

### 3.5 Verify Deployment

Once deployment completes:

```bash
# Get service URL from GitHub Actions summary, or:
gcloud run services describe interlinear-staging \
  --region=us-east4 \
  --format='value(status.url)' \
  --project=interlinear-93
```

Test the deployment:
```bash
# Basic health check
curl https://interlinear-staging-xxxxx.a.run.app

# Should return HTML (Next.js app)
```

Browser test:
1. Open staging URL in browser
2. Check that app loads
3. Try login/signup (should work with Supabase)
4. Check that reader functionality works

---

## Part 4: Verification Checklist

After successful deployment:

### GCP Resources Created ✅
- [ ] Artifact Registry repository: `us-east4-docker.pkg.dev/interlinear-93/interlinear`
- [ ] Container images with tags: `staging-<sha>`, `staging-latest`
- [ ] Cloud Run service: `interlinear-staging` in `us-east4`
- [ ] Secret Manager secrets: 3 staging secrets
- [ ] Service account: `github-actions@interlinear-93.iam.gserviceaccount.com`

### GitHub Configuration ✅
- [ ] Environment: `staging` exists
- [ ] 4 repository secrets configured
- [ ] Workflows exist: `pr-check.yml`, `staging-deploy.yml`
- [ ] PR checks run automatically
- [ ] Staging deploys on merge

### Deployment Working ✅
- [ ] Service URL accessible
- [ ] App renders correctly
- [ ] Supabase connection works
- [ ] Authentication functional
- [ ] No console errors

---

## Troubleshooting

### Build Fails: "Permission denied on Artifact Registry"

```bash
# Verify service account has permissions
gcloud projects get-iam-policy interlinear-93 \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions@interlinear-93.iam.gserviceaccount.com"
```

Should show: `roles/artifactregistry.writer`

### Deployment Fails: "Service account not found"

```bash
# Grant Service Account User role
gcloud projects add-iam-policy-binding interlinear-93 \
  --member="serviceAccount:github-actions@interlinear-93.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### Secrets Not Found at Runtime

```bash
# Verify secrets exist and have correct names
gcloud secrets list --project=interlinear-93

# Check IAM permissions
gcloud secrets get-iam-policy supabase-anon-key-staging \
  --project=interlinear-93
```

### GitHub Action: "Invalid service account key"

- Ensure `GCP_SA_KEY` contains the **entire JSON** (including `{` and `}`)
- No extra whitespace or newlines
- Valid JSON format

### Cloud Run: "Container failed to start"

```bash
# Check logs
gcloud run services logs read interlinear-staging \
  --region=us-east4 \
  --project=interlinear-93 \
  --limit=50
```

Common issues:
- Missing environment variables
- Invalid Supabase URL
- Port not exposed (should be 3000)

---

## Monitoring & Maintenance

### View Logs
```bash
# Tail logs
gcloud run services logs tail interlinear-staging \
  --region=us-east4 \
  --project=interlinear-93

# View errors only
gcloud run services logs read interlinear-staging \
  --region=us-east4 \
  --project=interlinear-93 \
  --filter='severity>=ERROR' \
  --limit=20
```

### Check Deployment Status
```bash
# Service details
gcloud run services describe interlinear-staging \
  --region=us-east4 \
  --project=interlinear-93

# Recent revisions
gcloud run revisions list \
  --service=interlinear-staging \
  --region=us-east4 \
  --project=interlinear-93 \
  --limit=5
```

### View Container Images
```bash
# List all images
gcloud artifacts docker images list \
  us-east4-docker.pkg.dev/interlinear-93/interlinear/app \
  --project=interlinear-93

# List staging tags only
gcloud artifacts docker images list \
  us-east4-docker.pkg.dev/interlinear-93/interlinear/app \
  --include-tags \
  --filter='tags:staging-*' \
  --project=interlinear-93
```

### Cost Monitoring
```bash
# Check current month costs
gcloud billing accounts list
gcloud billing projects describe interlinear-93
```

**Expected staging costs**: $0-5/month (scales to zero when idle)

---

## Clean Up (Optional)

If you need to tear down staging:

```bash
# Delete Cloud Run service
gcloud run services delete interlinear-staging \
  --region=us-east4 \
  --project=interlinear-93

# Delete container images
gcloud artifacts docker images delete \
  us-east4-docker.pkg.dev/interlinear-93/interlinear/app:staging-latest \
  --delete-tags \
  --project=interlinear-93

# Delete secrets
gcloud secrets delete supabase-anon-key-staging --project=interlinear-93
gcloud secrets delete elevenlabs-api-key-staging --project=interlinear-93
gcloud secrets delete openai-api-key-staging --project=interlinear-93

# Delete service account
gcloud iam service-accounts delete \
  github-actions@interlinear-93.iam.gserviceaccount.com \
  --project=interlinear-93
```

---

## Next Steps

After staging is working:

1. **Set up production workflows** (see `GITOPS_WORKFLOW.md`)
2. **Configure production environment** in GitHub
3. **Create production secrets** in Secret Manager
4. **Test production build workflow**
5. **Document rollback procedures**

---

## Quick Reference

**Project**: `interlinear-93`
**Region**: `us-east4`
**Registry**: `us-east4-docker.pkg.dev/interlinear-93/interlinear`
**Service**: `interlinear-staging`
**Branch strategy**: `feature/* → staging (auto-deploy) → main`

**Key Commands**:
```bash
# Get staging URL
gcloud run services describe interlinear-staging \
  --region=us-east4 \
  --format='value(status.url)' \
  --project=interlinear-93

# View logs
gcloud run services logs tail interlinear-staging \
  --region=us-east4 \
  --project=interlinear-93

# List images
gcloud artifacts docker images list \
  us-east4-docker.pkg.dev/interlinear-93/interlinear/app \
  --project=interlinear-93
```
