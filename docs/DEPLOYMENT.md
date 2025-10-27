# Deployment Guide

Complete guide for deploying the Interlinear Reader to Google Cloud Run.

## Prerequisites

### Required Tools
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud` CLI)
- [OpenTofu](https://opentofu.org/docs/intro/install/) or Terraform
- [Docker](https://docs.docker.com/get-docker/)
- Git

### Required Access
- GCP Project with Owner or Editor role
- GitHub repository access for CI/CD setup

### Required APIs
Enable these APIs in your GCP project:
```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com
```

## Initial Setup

### 1. GCP Project Configuration

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Authenticate
gcloud auth login
gcloud auth application-default login
```

### 2. Create GCS Backend Bucket

```bash
# Create bucket for Terraform state
gsutil mb gs://YOUR_SHARED_TFSTATE_BUCKET

# Enable versioning
gsutil versioning set on gs://YOUR_SHARED_TFSTATE_BUCKET

# Update terraform/main.tf with your bucket name
```

### 3. Configure Environment Files

Update `terraform/environments/staging.tfvars`:
```hcl
project_id   = "your-actual-project-id"
region       = "us-central1"
supabase_url = "https://your-staging-project.supabase.co"
```

Update `terraform/environments/prod.tfvars`:
```hcl
project_id   = "your-actual-project-id"
region       = "us-central1"
supabase_url = "https://your-prod-project.supabase.co"
```

### 4. Create Secrets in Secret Manager

```bash
# Staging secrets
echo -n "your-staging-supabase-anon-key" | \
  gcloud secrets create supabase-anon-key-staging --data-file=-

echo -n "your-staging-elevenlabs-key" | \
  gcloud secrets create elevenlabs-api-key-staging --data-file=-

# Production secrets
echo -n "your-prod-supabase-anon-key" | \
  gcloud secrets create supabase-anon-key-prod --data-file=-

echo -n "your-prod-elevenlabs-key" | \
  gcloud secrets create elevenlabs-api-key-prod --data-file=-
```

## Deployment Workflow

### Step 1: Deploy Infrastructure (First Time Only)

```bash
# Deploy staging infrastructure
./scripts/deploy-infra.sh staging

# Deploy production infrastructure (when ready)
./scripts/deploy-infra.sh prod
```

This will:
- Initialize Tofu with GCS backend
- Validate Terraform configuration
- Show infrastructure changes plan
- Apply changes after confirmation
- Create Cloud Run service, Artifact Registry, IAM resources

### Step 2: Build and Deploy Application

```bash
# Deploy to staging
./scripts/deploy-app.sh staging

# Deploy to production
./scripts/deploy-app.sh prod

# Deploy specific git commit
./scripts/deploy-app.sh staging abc1234
```

This will:
- Build Docker image with Next.js standalone output
- Push to Artifact Registry
- Deploy to Cloud Run
- Output the service URL

### Step 3: Verify Deployment

```bash
# Get service URL
gcloud run services describe interlinear-staging \
  --region=us-central1 \
  --format='value(status.url)'

# Test the endpoint
curl https://interlinear-staging-xxx.run.app

# View logs
gcloud run services logs read interlinear-staging \
  --region=us-central1 \
  --limit=50
```

## CI/CD Setup

### GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
GCP_SA_KEY              # Service account JSON key
GCP_PROJECT_ID          # Your GCP project ID
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key
```

### Create Service Account for CI/CD

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Create and download key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com

# Add the key contents to GitHub secrets as GCP_SA_KEY
cat github-actions-key.json
```

### Workflow Behavior

- **Pull Requests**: Runs CI checks (lint, typecheck, test, build)
- **Main Branch**: Builds and pushes container to Artifact Registry
- **Deployment**: Manual via deployment scripts for control

## Rollback Procedure

### Quick Rollback

```bash
# Interactive rollback with revision selection
./scripts/rollback.sh staging

# Or manually
gcloud run services update-traffic interlinear-staging \
  --to-revisions=interlinear-staging-00042=100 \
  --region=us-central1
```

### Emergency Rollback

```bash
# List revisions
gcloud run revisions list \
  --service=interlinear-staging \
  --region=us-central1 \
  --limit=5

# Immediate rollback to previous
PREVIOUS=$(gcloud run revisions list \
  --service=interlinear-staging \
  --region=us-central1 \
  --limit=2 \
  --format='value(metadata.name)' | tail -1)

gcloud run services update-traffic interlinear-staging \
  --to-revisions=$PREVIOUS=100 \
  --region=us-central1
```

## Monitoring

### View Logs

```bash
# Real-time logs
gcloud run services logs tail interlinear-staging \
  --region=us-central1

# Recent logs with filters
gcloud run services logs read interlinear-staging \
  --region=us-central1 \
  --limit=100 \
  --filter='severity>=ERROR'
```

### View Metrics

```bash
# Open Cloud Console monitoring
gcloud run services describe interlinear-staging \
  --region=us-central1 \
  --format='value(status.url)'

# View in console: Cloud Run → Select Service → Metrics
```

### Key Metrics to Monitor
- Request count
- Request latency (p50, p95, p99)
- Error rate (5xx responses)
- Container CPU utilization
- Container memory utilization
- Active instances

## Validation Checklist

### Pre-Deployment
- [ ] Secrets created in Secret Manager
- [ ] Environment tfvars updated with correct values
- [ ] GCS backend configured and accessible
- [ ] Docker installed and running
- [ ] gcloud authenticated

### Post-Deployment
- [ ] Service URL accessible and returns 200 OK
- [ ] Authentication flow works (login/signup)
- [ ] Reader page loads and displays content
- [ ] Audio generation works
- [ ] Vocabulary tracking saves correctly
- [ ] Profile page displays stats
- [ ] No console errors in browser
- [ ] Logs show no ERROR/CRITICAL entries
- [ ] Metrics show healthy response times

## Common Issues

### Issue: Tofu init fails with backend error
**Solution**: Verify GCS bucket exists and you have access
```bash
gsutil ls gs://YOUR_SHARED_TFSTATE_BUCKET
```

### Issue: Docker build fails
**Solution**: Ensure you have enough disk space and Docker is running
```bash
docker system prune -a  # Free up space
docker info             # Verify Docker is running
```

### Issue: Cloud Run deployment fails with "service account not found"
**Solution**: Verify infrastructure was deployed first
```bash
./scripts/deploy-infra.sh staging
```

### Issue: Application crashes with "NEXT_PUBLIC_SUPABASE_URL is undefined"
**Solution**: Verify secrets exist and Cloud Run service has access
```bash
gcloud secrets versions access latest --secret=supabase-anon-key-staging
```

### Issue: 403 Forbidden when accessing service
**Solution**: Verify IAM policy allows public access
```bash
gcloud run services get-iam-policy interlinear-staging \
  --region=us-central1
```

## Cost Optimization

### Staging Environment
- CPU: 1 vCPU
- Memory: 512Mi
- Min instances: 0 (scales to zero)
- Max instances: 3

**Estimated cost**: $0-5/month (depending on usage)

### Production Environment
- CPU: 2 vCPU
- Memory: 1Gi
- Min instances: 1 (always-on for fast response)
- Max instances: 10

**Estimated cost**: $10-30/month (depending on traffic)

### Reduce Costs
1. Set `min_instances = 0` for staging (cold starts acceptable)
2. Use smaller instance sizes if performance allows
3. Enable request-based scaling only
4. Monitor and adjust max_instances based on actual traffic

## Security Best Practices

1. **Secrets Management**
   - Never commit secrets to git
   - Use Secret Manager for all sensitive values
   - Rotate secrets regularly

2. **IAM Configuration**
   - Grant minimum necessary permissions
   - Use service accounts, not user accounts
   - Regularly audit IAM policies

3. **Network Security**
   - Cloud Run services are HTTPS-only by default
   - Consider adding Cloud Armor for DDoS protection
   - Use VPC connectors for private resource access

4. **Container Security**
   - Scan images for vulnerabilities
   - Use non-root user in containers
   - Keep base images updated

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [OpenTofu Documentation](https://opentofu.org/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Google Cloud Logging](https://cloud.google.com/logging/docs)
