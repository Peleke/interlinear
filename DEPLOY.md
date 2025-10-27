# Deployment Walkthrough

Practical step-by-step guide to deploy Interlinear Reader to production.

## Quick Start

### Test Docker Build Locally

```bash
# Make sure your .env.local exists with all required variables
# Then build and run with docker-compose:

docker-compose up --build

# Visit http://localhost:3000 to verify it works
# Ctrl+C to stop

# Or run in background:
docker-compose up -d --build

# View logs:
docker-compose logs -f

# Stop and clean up:
docker-compose down
```

### Manual Docker Commands (Alternative)

```bash
# Build image
docker build -t interlinear-test .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
  -e ELEVENLABS_API_KEY="your-elevenlabs-key" \
  interlinear-test

# Visit http://localhost:3000 to verify it works
# Ctrl+C to stop, then clean up:
docker rm $(docker ps -aq --filter ancestor=interlinear-test)
```

## Part 1: OpenTofu/Terraform Setup

### Step 1: Install OpenTofu

```bash
# macOS
brew install opentofu

# Linux
snap install opentofu --classic

# Verify installation
tofu --version
```

### Step 2: Set Up GCP Project

```bash
# Install gcloud if you haven't
# https://cloud.google.com/sdk/docs/install

# Login and set project
gcloud auth login
gcloud auth application-default login

# Set your project (use your existing staging project)
export PROJECT_ID="your-existing-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com
```

### Step 3: Create GCS Backend Bucket (One Time)

```bash
# Use your existing Terraform state bucket or create new one
# If you already have a bucket for your other project, just use that

# Example: if you don't have one yet
gsutil mb -p $PROJECT_ID gs://${PROJECT_ID}-tfstate
gsutil versioning set on gs://${PROJECT_ID}-tfstate
```

### Step 4: Update Terraform Configuration

Edit `terraform/main.tf` - update the backend bucket:
```hcl
backend "gcs" {
  bucket = "your-actual-bucket-name"  # <- Change this
  prefix = "interlinear"
}
```

Edit `terraform/environments/staging.tfvars`:
```hcl
environment     = "staging"
project_id      = "your-actual-project-id"     # <- Your GCP project
region          = "us-central1"
supabase_url    = "https://xxx.supabase.co"    # <- Your Supabase URL

cpu_limit       = "1"
memory_limit    = "512Mi"
min_instances   = 0
max_instances   = 3
```

Edit `terraform/environments/prod.tfvars` (if you want prod):
```hcl
environment     = "prod"
project_id      = "your-actual-project-id"     # <- Same project is fine
region          = "us-central1"
supabase_url    = "https://xxx.supabase.co"    # <- Could be same Supabase

cpu_limit       = "2"
memory_limit    = "1Gi"
min_instances   = 1
max_instances   = 10
```

### Step 5: Create Secrets in GCP

```bash
# Staging secrets
echo -n "your-supabase-anon-key-here" | \
  gcloud secrets create supabase-anon-key-staging \
  --data-file=- \
  --replication-policy=automatic

echo -n "your-elevenlabs-api-key-here" | \
  gcloud secrets create elevenlabs-api-key-staging \
  --data-file=- \
  --replication-policy=automatic

# Production secrets (if doing prod)
echo -n "your-supabase-anon-key-here" | \
  gcloud secrets create supabase-anon-key-prod \
  --data-file=- \
  --replication-policy=automatic

echo -n "your-elevenlabs-api-key-here" | \
  gcloud secrets create elevenlabs-api-key-prod \
  --data-file=- \
  --replication-policy=automatic

# Verify they were created
gcloud secrets list
```

### Step 6: Deploy Base Infrastructure with Tofu

**Important**: We deploy infrastructure in two phases:
1. **First**: Base infrastructure (Artifact Registry, IAM, Secrets) - needed before we can push containers
2. **Second**: Cloud Run service - after container image exists

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy staging base infrastructure (NO Cloud Run yet)
./scripts/deploy-infra.sh staging

# This will:
# 1. Initialize Tofu with your GCS backend
# 2. Validate the configuration
# 3. Show you the plan (what will be created)
# 4. Ask for confirmation
# 5. Create: Artifact Registry, IAM resources, Secret Manager setup

# If you want prod too:
./scripts/deploy-infra.sh prod
```

**Expected Output:**
```
[INFO] Deploying base infrastructure to staging environment (registry, IAM, secrets)
[INFO] Project: your-project-id | Region: us-central1
Deploy Tofu infrastructure to staging? [y/N]: y
[INFO] Initializing Tofu...
[INFO] Validating configuration...
[INFO] Planning infrastructure changes...
Apply these changes? [y/N]: y
[INFO] Applying infrastructure...
[INFO] ✓ Base infrastructure deployed to staging

Next steps:
  1. Build and push container: ./scripts/deploy-app.sh staging
  2. Deploy Cloud Run: ./scripts/deploy-infra.sh staging --with-cloud-run
```

## Part 2: Build and Push Container

### Step 7: Build and Push Docker Image

```bash
# Build and push to staging
./scripts/deploy-app.sh staging

# This will:
# 1. Authenticate to GCP
# 2. Build Docker image with NEXT_PUBLIC_* vars
# 3. Push to Artifact Registry
# 4. Tell you to run the next command

# Build and push to prod (if you set it up):
./scripts/deploy-app.sh prod
```

**Expected Output:**
```
[INFO] Deploying app to staging environment
[INFO] Project: your-project-id | Region: us-central1
[INFO] Image tag: abc1234
Build and deploy app to staging? [y/N]: y
[INFO] Authenticating to GCP...
[INFO] Fetching Supabase anon key from Secret Manager...
[INFO] Building Docker image with environment variables...
[INFO] Pushing image to Artifact Registry...
[INFO] ✓ Container built and pushed successfully
[INFO] Image: us-central1-docker.pkg.dev/your-project-id/interlinear/app:abc1234

Next: Deploy Cloud Run service with Terraform:
  ./scripts/deploy-infra.sh staging --with-cloud-run --image-tag abc1234
```

## Part 3: Deploy Cloud Run Service

### Step 8: Deploy Cloud Run with Tofu

Now that the container image exists in the registry, we can create the Cloud Run service:

```bash
# Deploy Cloud Run service to staging (use the image tag from previous step)
./scripts/deploy-infra.sh staging --with-cloud-run --image-tag abc1234

# This will:
# 1. Run Terraform with deploy_cloud_run=true and your specific image tag
# 2. Create Cloud Run service pointing to your container image
# 3. Configure environment variables and secrets
# 4. Set up IAM for public access

# Deploy to prod (if you set it up):
./scripts/deploy-infra.sh prod --with-cloud-run --image-tag abc1234
```

**Expected Output:**
```
[INFO] Deploying infrastructure + Cloud Run to staging environment
[INFO] Project: your-project-id | Region: us-central1
Deploy Cloud Run service to staging? (requires container image) [y/N]: y
[INFO] Planning infrastructure changes...
Apply these changes? [y/N]: y
[INFO] Applying infrastructure...
[INFO] ✓ Infrastructure + Cloud Run deployed to staging
```

### Step 9: Test Your Deployment

```bash
# Get the URL
gcloud run services describe interlinear-staging \
  --region=us-central1 \
  --format='value(status.url)'

# Test it
curl https://interlinear-staging-xxxxx.a.run.app

# Or just open in browser and verify:
# - Home page loads
# - Login/signup works
# - Reader page works
# - Audio generation works
# - Vocabulary tracking works
# - Profile page shows stats
```

## Part 4: GitHub CI/CD Setup

### Step 10: Create Service Account for GitHub Actions

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions CI/CD"

# Grant permissions to write to Artifact Registry
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Grant storage admin (for accessing GCS)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Create and download key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@${PROJECT_ID}.iam.gserviceaccount.com

# Show the key (copy this entire JSON)
cat github-actions-key.json
```

### Step 11: Add GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret

Add these 4 secrets:

**GCP_SA_KEY**
```
Paste the entire JSON from github-actions-key.json
```

**GCP_PROJECT_ID**
```
your-actual-project-id
```

**NEXT_PUBLIC_SUPABASE_URL**
```
https://your-project.supabase.co
```

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
your-supabase-anon-key
```

### Step 12: Test CI/CD

```bash
# Create a test branch
git checkout -b test-ci

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "test: verify CI/CD pipeline"
git push origin test-ci

# Go to GitHub and create a Pull Request
# You should see the CI workflow run automatically:
# - Install dependencies
# - Type check
# - Lint
# - Build

# Once PR is merged to main:
# - Build workflow runs
# - Container is built and pushed to Artifact Registry
# - You'll see deployment commands in the workflow output
```

### Step 13: Deploy After CI Build

After merging to main, GitHub Actions builds and pushes the container. To deploy:

```bash
# CI/CD will build and push container automatically with git commit SHA as tag
# Check the Actions tab for the commit SHA (e.g., abc1234)

# Then manually run Terraform to update Cloud Run with that specific tag:
./scripts/deploy-infra.sh staging --with-cloud-run --image-tag abc1234

# Terraform will detect the image tag change and update the service
```

## Part 5: Ongoing Operations

### View Logs

```bash
# Real-time logs (tail)
gcloud run services logs tail interlinear-staging \
  --region=us-central1

# Recent logs
gcloud run services logs read interlinear-staging \
  --region=us-central1 \
  --limit=100

# Error logs only
gcloud run services logs read interlinear-staging \
  --region=us-central1 \
  --limit=50 \
  --filter='severity>=ERROR'
```

### Rollback if Needed

```bash
# Interactive rollback (shows last 5 revisions, pick one)
./scripts/rollback.sh staging

# Manual rollback
gcloud run revisions list \
  --service=interlinear-staging \
  --region=us-central1

gcloud run services update-traffic interlinear-staging \
  --to-revisions=interlinear-staging-00042=100 \
  --region=us-central1
```

### Update Environment Variables

```bash
# Update a secret
echo -n "new-api-key-value" | \
  gcloud secrets versions add elevenlabs-api-key-staging \
  --data-file=-

# Force new deployment to pick up secret
gcloud run services update interlinear-staging \
  --region=us-central1
```

### Scale Resources

Edit `terraform/environments/staging.tfvars`:
```hcl
max_instances   = 5  # Increase if needed
```

Then re-apply:
```bash
./scripts/deploy-infra.sh staging
```

## Troubleshooting

### Build fails locally
```bash
# Check Docker is running
docker info

# Free up space
docker system prune -a

# Check your .env file has correct values
```

### Tofu fails with "bucket not found"
```bash
# Verify bucket exists
gsutil ls

# Update terraform/main.tf with correct bucket name
```

### Cloud Run deployment fails
```bash
# Check service account exists
gcloud iam service-accounts list

# Verify secrets exist
gcloud secrets list

# Check Cloud Run logs
gcloud run services logs read interlinear-staging \
  --region=us-central1 \
  --limit=50
```

### App crashes on startup
```bash
# Most common: missing secrets
# Verify all 3 env vars are set in Cloud Run:
gcloud run services describe interlinear-staging \
  --region=us-central1 \
  --format=yaml

# Check for NEXT_PUBLIC_SUPABASE_URL, secret refs for ANON_KEY and ELEVENLABS_KEY
```

### GitHub Actions fails
```bash
# Check secrets are set correctly in GitHub
# Verify service account has correct permissions:
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions@*"
```

## Cost Management

### Current Setup Costs (Estimate)

**Staging** (min_instances=0):
- Free tier covers most usage
- Only pay for requests: ~$0-2/month

**Production** (min_instances=1):
- Always-on instance: ~$10-15/month
- Additional requests: ~$5-10/month
- **Total: ~$15-25/month**

### Reduce Costs

```bash
# Scale down prod if not heavily used
# Edit terraform/environments/prod.tfvars:
min_instances = 0  # Allow scale to zero

# Smaller instance
cpu_limit = "1"
memory_limit = "512Mi"

# Re-apply
./scripts/deploy-infra.sh prod
```

## Quick Reference

```bash
# Common commands you'll use:

# Deploy new code (after CI builds container):
./scripts/deploy-app.sh staging                                      # Build and push container
./scripts/deploy-infra.sh staging --with-cloud-run --image-tag <tag> # Deploy to Cloud Run

# View logs
gcloud run services logs tail interlinear-staging --region=us-central1

# Rollback
./scripts/rollback.sh staging

# Update base infrastructure
./scripts/deploy-infra.sh staging

# Get URL
gcloud run services describe interlinear-staging \
  --region=us-central1 \
  --format='value(status.url)'
```

## Deployment Workflow Summary

**Initial Setup (one time)**:
1. `./scripts/deploy-infra.sh staging` - Create base infrastructure
2. `./scripts/deploy-app.sh staging` - Build and push first container (outputs image tag)
3. `./scripts/deploy-infra.sh staging --with-cloud-run --image-tag <tag>` - Create Cloud Run service

**Subsequent Deployments**:
1. `./scripts/deploy-app.sh staging` - Build and push new container (outputs image tag)
2. `./scripts/deploy-infra.sh staging --with-cloud-run --image-tag <tag>` - Update Cloud Run with new image

**Or deploy specific git commit**:
1. `./scripts/deploy-app.sh staging abc1234` - Build specific commit
2. `./scripts/deploy-infra.sh staging --with-cloud-run --image-tag abc1234` - Deploy that version

## Success Checklist

- [ ] OpenTofu installed and working
- [ ] GCP project configured with APIs enabled
- [ ] GCS bucket created for Terraform state
- [ ] tfvars files updated with your values
- [ ] Secrets created in Secret Manager
- [ ] Infrastructure deployed successfully
- [ ] Container built and deployed
- [ ] App accessible at Cloud Run URL
- [ ] Login/signup works
- [ ] Reader page functional
- [ ] Audio generation works
- [ ] GitHub secrets configured
- [ ] CI workflow passing on PRs
- [ ] Build workflow running on main

You're done! 🚀
