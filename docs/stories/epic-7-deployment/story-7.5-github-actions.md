# Story 7.5: GitHub Actions CI Pipeline

## Summary
Automated testing and container building with GitHub Actions. Deployment remains manual via scripts.

## Acceptance Criteria
- CI on PRs (lint, typecheck, test, build)
- Container build and push on main merge
- Image cleanup workflow
- Manual deployment via scripts (Story 7.4)

## Workflows

### .github/workflows/ci.yml
```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run type-check

      - name: Run linter
        run: npm run lint

      - name: Run tests (if exist)
        run: npm test --if-present

      - name: Build app
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

### .github/workflows/build.yml
```yaml
name: Build and Push Container

on:
  push:
    branches: [main]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: us-central1
  REGISTRY: us-central1-docker.pkg.dev

jobs:
  build:
    runs-on: ubuntu-latest

    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: |
          gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build and push container
        run: |
          docker build -t ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/interlinear/app:${{ github.sha }} \
                       -t ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/interlinear/app:latest .
          docker push ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/interlinear/app:${{ github.sha }}
          docker push ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/interlinear/app:latest

      - name: Output deployment commands
        run: |
          echo "✓ Container built and pushed"
          echo ""
          echo "To deploy to staging:"
          echo "  ./scripts/deploy-app.sh staging ${{ github.sha }}"
          echo ""
          echo "To deploy to prod:"
          echo "  ./scripts/deploy-app.sh prod ${{ github.sha }}"
```

### .github/workflows/cleanup.yml (Optional)
```yaml
name: Cleanup Old Images

on:
  schedule:
    - cron: '0 2 * * 0' # Weekly on Sunday 2 AM

jobs:
  cleanup:
    runs-on: ubuntu-latest

    steps:
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Delete old images
        run: |
          # Keep last 10 images, delete older ones
          gcloud artifacts docker images list \
            ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/interlinear/app \
            --format="get(version)" --sort-by="~CREATE_TIME" \
            | tail -n +11 \
            | xargs -I {} gcloud artifacts docker images delete \
              ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/interlinear/app:{} \
              --quiet
```

## Required GitHub Secrets
Set in repo Settings > Secrets and variables > Actions:

```
GCP_SA_KEY                       # GCP service account JSON key
GCP_PROJECT_ID                   # GCP project ID
NEXT_PUBLIC_SUPABASE_URL         # Supabase URL (for build step)
NEXT_PUBLIC_SUPABASE_ANON_KEY    # Supabase anon key (for build step)
```

## Deployment Workflow

### 1. CI on Pull Requests
- Lint, typecheck, and test automatically run on every PR
- Build verification ensures code can be built
- Blocks merge if CI fails

### 2. Container Build on Main
- Push to main triggers container build and push
- Creates two tags: `latest` and commit SHA
- No automatic deployment (manual via scripts)

### 3. Manual Deployment
After container is built, deploy manually using scripts:

```bash
# Get commit SHA from GitHub Actions output
# or use: git rev-parse --short HEAD

# Deploy to staging
./scripts/deploy-app.sh staging <commit-sha>

# Test on staging, then deploy to prod
./scripts/deploy-app.sh prod <commit-sha>
```

## Testing Workflows

### Test CI locally
```bash
# Install act (GitHub Actions runner)
brew install act  # or download from https://github.com/nektos/act

# Test CI workflow
act pull_request -W .github/workflows/ci.yml
```

### Build workflow
```bash
# Push to main triggers build automatically
git checkout main
git merge feature-branch
git push origin main

# Monitor build at:
# https://github.com/your-repo/actions

# Then deploy manually using printed commands
```

## Expected Effort
⏱️ **1 hour** - Write CI + build workflows, configure secrets, test
