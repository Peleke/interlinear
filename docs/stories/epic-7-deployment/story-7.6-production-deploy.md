# Story 7.6: Production Deployment

## Summary
Initial production deployment checklist and validation.

## Pre-Deployment Checklist

### 1. Environment Configuration ✅
- [ ] Supabase project in production mode
- [ ] ElevenLabs API key with sufficient quota
- [ ] GCP project created
- [ ] Billing enabled
- [ ] APIs enabled:
  - Cloud Run API
  - Artifact Registry API
  - Secret Manager API
  - Cloud Build API

### 2. Infrastructure Setup ✅
- [ ] Artifact Registry repository created
- [ ] Secrets created in Secret Manager
- [ ] Service accounts configured
- [ ] IAM permissions granted
- [ ] OpenTofu state bucket created

### 3. Application Configuration ✅
- [ ] `next.config.js` has `output: 'standalone'`
- [ ] Environment variables configured
- [ ] Build succeeds locally
- [ ] Docker image builds successfully
- [ ] Health check endpoint works

### 4. DNS & Domain (Optional) ✅
- [ ] Domain purchased (if custom domain)
- [ ] DNS configured to point to Cloud Run
- [ ] SSL certificate provisioned (automatic with Cloud Run)

## Deployment Steps

### Step 1: Build and Test Locally
```bash
# Build Docker image
docker build -t interlinear:test .

# Run locally
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  -e ELEVENLABS_API_KEY=$ELEVENLABS_KEY \
  interlinear:test

# Test endpoints
curl http://localhost:3000
curl http://localhost:3000/api/health
```

### Step 2: Apply Infrastructure
```bash
cd terraform

# Initialize
tofu init

# Plan (review changes)
tofu plan

# Apply
tofu apply
# Type 'yes' to confirm
```

### Step 3: Push Initial Image
```bash
# Tag image
docker tag interlinear:test \
  us-central1-docker.pkg.dev/PROJECT_ID/interlinear/app:v1.0.0

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/PROJECT_ID/interlinear/app:v1.0.0
```

### Step 4: Deploy to Staging
```bash
# Use deployment script with specific image tag
./scripts/deploy-app.sh staging v1.0.0

# Or use latest from Artifact Registry
./scripts/deploy-app.sh staging latest
```

### Step 5: Validate Staging Deployment
```bash
# Get Cloud Run URL (staging)
SERVICE_URL=$(gcloud run services describe interlinear-staging \
  --region=us-central1 \
  --format='value(status.url)')

echo "Staging URL: $SERVICE_URL"

# Test endpoints
curl $SERVICE_URL
curl $SERVICE_URL/api/health

# Test in browser
open $SERVICE_URL
```

### Step 6: Deploy to Production (After Staging Validation)
```bash
# Only after staging looks good
./scripts/deploy-app.sh prod v1.0.0

# Get production URL
SERVICE_URL=$(gcloud run services describe interlinear-prod \
  --region=us-central1 \
  --format='value(status.url)')

echo "Production URL: $SERVICE_URL"
```

## Post-Deployment Validation

### Functional Tests
- [ ] Homepage loads
- [ ] Login/signup works
- [ ] Supabase auth flows
- [ ] Text input and rendering
- [ ] Dictionary lookups
- [ ] TTS audio generation
- [ ] Vocabulary saving and display

### Performance Tests
- [ ] Cold start time < 5s
- [ ] Page load time < 2s
- [ ] API responses < 500ms
- [ ] TTS generation < 10s

### Monitoring Setup
```bash
# View logs
gcloud run services logs read interlinear \
  --region=us-central1 \
  --limit=50

# View metrics
# Go to: https://console.cloud.google.com/run/detail/us-central1/interlinear/metrics
```

## Rollback Procedure
```bash
# Use rollback script (interactive)
./scripts/rollback.sh staging  # or prod

# Or manually specify revision
gcloud run services update-traffic interlinear-prod \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=us-central1

# Or redeploy previous image tag
./scripts/deploy-app.sh prod PREVIOUS_TAG
```

## Custom Domain Setup (Optional)
```bash
# Map custom domain
gcloud run domain-mappings create \
  --service=interlinear \
  --domain=app.yourdomain.com \
  --region=us-central1

# Follow DNS instructions from output
# Add CNAME or A record to your DNS provider
```

## Expected Effort
⏱️ **2 hours** - Initial deploy, validation, troubleshooting
