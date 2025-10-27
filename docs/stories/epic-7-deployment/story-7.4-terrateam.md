# Story 7.4: Terrateam GitOps Integration

## Summary
Configure Terrateam for PR-based infrastructure changes with plan/apply workflow.

## Acceptance Criteria
- Terrateam GitHub App installed
- `.terrateam/config.yml` configured
- PR workflow for infrastructure changes
- Plan preview on PRs
- Manual apply approval

## Setup Steps

### 1. Install Terrateam GitHub App
1. Go to https://github.com/apps/terrateam
2. Install on repository
3. Grant permissions:
   - Read/write access to pull requests
   - Read access to repository contents

### 2. Configure GCP Service Account
```bash
# Create service account for Terrateam
gcloud iam service-accounts create terrateam \
  --display-name="Terrateam Service Account"

# Grant necessary roles
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:terrateam@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/editor"

# Create key
gcloud iam service-accounts keys create terrateam-key.json \
  --iam-account=terrateam@PROJECT_ID.iam.gserviceaccount.com
```

### 3. Add GitHub Secrets
In repo settings > Secrets and variables > Actions:
- `GCP_SA_KEY`: Contents of `terrateam-key.json`
- `TF_VAR_elevenlabs_api_key`: ElevenLabs API key
- `TF_VAR_supabase_anon_key`: Supabase anon key
- `TF_VAR_project_id`: GCP project ID
- `TF_VAR_supabase_url`: Supabase URL

### 4. Create Terrateam Config

#### .terrateam/config.yml
```yaml
version: "1"

# Apply protection - require approval
apply_requirements:
  - approved

# Auto-plan on PR creation/update
auto_plan:
  enabled: true
  when_modified:
    - "terraform/**/*.tf"

# Working directory
working_dir: terraform

# Hooks
hooks:
  pre_plan:
    - run: tofu fmt -check
      description: "Check Terraform formatting"

  pre_apply:
    - run: echo "Applying infrastructure changes..."
      description: "Pre-apply notification"

# Workflows
workflows:
  default:
    plan:
      steps:
        - init
        - plan

    apply:
      steps:
        - init
        - apply
```

## Usage Workflow

### Making Infrastructure Changes
```bash
# 1. Create feature branch
git checkout -b infra/increase-memory

# 2. Modify Terraform files
vim terraform/cloud_run.tf

# 3. Commit and push
git add terraform/
git commit -m "feat: increase Cloud Run memory to 1GB"
git push origin infra/increase-memory

# 4. Create PR
# Terrateam automatically runs `tofu plan` and comments on PR

# 5. Review plan in PR comment
# Example output:
# ```
# Plan: 1 to change, 0 to add, 0 to destroy
#
# Changes to Outputs:
# ...
# ```

# 6. Approve PR (required for apply)

# 7. Comment on PR to trigger apply
# Comment: `terrateam apply`

# 8. Terrateam runs apply and updates PR
# Merge PR after successful apply
```

### Terrateam Commands (via PR comments)
- `terrateam plan` - Run plan manually
- `terrateam apply` - Apply changes (requires approval)
- `terrateam unlock` - Unlock state if locked
- `terrateam help` - Show available commands

## Backend Configuration

### terraform/backend.tf
```hcl
terraform {
  backend "gcs" {
    bucket = "interlinear-tfstate"
    prefix = "prod"
  }
}
```

### Create State Bucket
```bash
gcloud storage buckets create gs://interlinear-tfstate \
  --location=us-central1 \
  --uniform-bucket-level-access

# Enable versioning
gcloud storage buckets update gs://interlinear-tfstate \
  --versioning
```

## Expected Effort
⏱️ **1 hour** - Install app, configure workflows, test
