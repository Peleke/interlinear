# Epic 10: GitOps CI/CD Pipeline

**Status**: Planning
**Priority**: P1
**Estimated Effort**: 4-6 hours
**Owner**: DevOps/Engineering
**Dependencies**: GCP infrastructure, GitHub repository setup

---

## Overview

Implement a professional, lightweight GitOps workflow with automated staging deployments and gated production releases. Enable fast iteration cycles while maintaining production safety through quality gates and approval flows.

---

## Goals

### Primary Goals
1. **Fast Feedback Loop**: PRs validated in < 5 minutes
2. **Safe Staging**: Auto-deploy to staging on merge for rapid testing
3. **Gated Production**: Manual approval required for production deploys
4. **Rollback Ready**: Every deployment tagged and reversible
5. **Cost Effective**: No expensive preview environments, efficient resource usage

### Success Metrics
- ✅ PR checks complete in < 5 minutes
- ✅ Staging deploys in < 5 minutes from merge
- ✅ Zero production incidents from bad deploys (rollback < 2 minutes)
- ✅ 100% deployment traceability (commit SHA → image → deployment)
- ✅ Infrastructure cost < $30/month (staging + prod)

---

## Epic Breakdown

### Story 10.1: PR Quality Gates
**Effort**: 1 hour
**Priority**: P0

**Description**: Implement automated quality checks for all PRs to `main` and `staging` branches.

**Acceptance Criteria**:
- [ ] TypeScript type-checking runs on every PR
- [ ] ESLint validation runs on every PR
- [ ] Next.js build validation runs on every PR
- [ ] Docker container build test runs on every PR
- [ ] Build cache optimized (< 5 min total runtime)
- [ ] PR blocked if any check fails
- [ ] Clear error messages displayed in PR comments

**Implementation Tasks**:
1. Create `.github/workflows/pr-check.yml`
2. Configure Node.js caching for fast installs
3. Configure Docker buildx with GitHub Actions cache
4. Add status checks to GitHub branch protection rules
5. Test with sample PR

**Testing**:
- Create test PR with intentional type error → should fail
- Create test PR with lint error → should fail
- Create test PR with valid code → should pass in < 5 mins

---

### Story 10.2: Staging Auto-Deploy Pipeline
**Effort**: 1.5 hours
**Priority**: P0

**Description**: Fully automated deployment pipeline for staging environment on merge to `staging` branch.

**Acceptance Criteria**:
- [ ] Merges to `staging` trigger automatic build
- [ ] Docker image built with staging env vars
- [ ] Image pushed to Artifact Registry with `staging-` prefix
- [ ] Cloud Run service updated automatically
- [ ] Deployment summary posted to GitHub Actions
- [ ] Service URL accessible immediately after deploy
- [ ] Deploy completes in < 5 minutes

**Implementation Tasks**:
1. Create `.github/workflows/staging-deploy.yml`
2. Configure GCP authentication with service account
3. Set up Artifact Registry push with proper tagging
4. Configure Cloud Run deployment with staging secrets
5. Add deployment summary with URL and image tag
6. Test end-to-end flow

**Environment Setup**:
- GitHub Environment: `staging` (no protection rules)
- GCP Secrets: `supabase-anon-key-staging`, `elevenlabs-api-key-staging`, `openai-api-key-staging`
- Cloud Run: `interlinear-staging` service

**Testing**:
- Merge dummy commit to staging → verify auto-deploy
- Check service URL returns 200
- Verify correct image tag in Cloud Run
- Verify deployment completes in < 5 mins

---

### Story 10.3: Production Build Pipeline
**Effort**: 1 hour
**Priority**: P0

**Description**: Automated container build on merge to `main` without automatic deployment (gated).

**Acceptance Criteria**:
- [ ] Merges to `main` trigger container build
- [ ] Docker image built with production env vars
- [ ] Image pushed with multiple tags: `prod-{sha}`, `prod-{timestamp}`, `prod-latest`
- [ ] Build summary includes deployment instructions
- [ ] No automatic deployment occurs
- [ ] Build completes in < 5 minutes

**Implementation Tasks**:
1. Create `.github/workflows/prod-build.yml`
2. Configure production environment variables
3. Implement multi-tag strategy for rollback flexibility
4. Add build summary with next-step instructions
5. Test build process

**Testing**:
- Merge to main → verify build completes
- Check 3 image tags exist in Artifact Registry
- Verify no Cloud Run deployment occurred
- Verify build summary shows correct instructions

---

### Story 10.4: Production Deploy Workflow (Manual)
**Effort**: 1.5 hours
**Priority**: P0

**Description**: Manual workflow for controlled production deployments with validation and health checks.

**Acceptance Criteria**:
- [ ] Workflow triggered manually via GitHub Actions UI
- [ ] Requires image tag input (e.g., `prod-abc1234`)
- [ ] Validates image tag format (must start with `prod-`)
- [ ] Verifies image exists in Artifact Registry before deploy
- [ ] Deploys to Cloud Run with production configuration
- [ ] Runs post-deployment health check
- [ ] Provides rollback instructions in summary
- [ ] Optionally requires approval (GitHub Environment protection)

**Implementation Tasks**:
1. Create `.github/workflows/prod-deploy.yml`
2. Implement `workflow_dispatch` with input validation
3. Add image existence check before deployment
4. Configure production Cloud Run deployment
5. Implement health check step
6. Generate deployment summary with rollback commands
7. Set up GitHub Environment protection (optional approval)

**Environment Setup**:
- GitHub Environment: `production` (with required reviewers)
- GCP Secrets: `supabase-anon-key-prod`, `elevenlabs-api-key-prod`, `openai-api-key-prod`
- Cloud Run: `interlinear-prod` service

**Testing**:
- Run manual deploy with valid image tag → success
- Run manual deploy with invalid tag → should fail with clear error
- Run manual deploy with non-existent image → should fail before deploy
- Verify health check runs post-deployment
- Test rollback instructions work

---

### Story 10.5: GitHub Secrets Configuration
**Effort**: 0.5 hours
**Priority**: P0

**Description**: Configure all required GitHub secrets for CI/CD workflows.

**Acceptance Criteria**:
- [ ] All repository secrets configured
- [ ] Staging environment secrets configured
- [ ] Production environment secrets configured
- [ ] Service account has correct GCP permissions
- [ ] Secrets validated (workflows run successfully)

**Secrets Required**:

**Repository Level**:
```
GCP_SA_KEY                          # Service account JSON
GCP_PROJECT_ID                      # GCP project ID
NEXT_PUBLIC_SUPABASE_URL            # Staging Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY       # Staging Supabase key
NEXT_PUBLIC_SUPABASE_URL_PROD       # Prod Supabase URL (if different)
NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD  # Prod Supabase key (if different)
```

**Implementation Tasks**:
1. Generate service account key from Terraform
2. Add all secrets to GitHub repository settings
3. Configure staging environment in GitHub
4. Configure production environment with reviewers
5. Test secrets by running workflows

**Testing**:
- Run PR check workflow → should authenticate successfully
- Run staging deploy → should access all secrets
- Run prod deploy → should access prod-specific secrets

---

### Story 10.6: Branch Protection Rules
**Effort**: 0.5 hours
**Priority**: P1

**Description**: Configure GitHub branch protection to enforce quality gates and PR workflow.

**Acceptance Criteria**:
- [ ] `main` branch protected (no direct pushes)
- [ ] `staging` branch protected (no direct pushes)
- [ ] PRs required for both branches
- [ ] Status checks required before merge
- [ ] At least 1 approval required for `main`
- [ ] Stale reviews dismissed on new commits

**Implementation Tasks**:
1. Configure `main` branch protection rules
2. Configure `staging` branch protection rules
3. Require status checks: type-check, lint, build, container-build-test
4. Set up review requirements
5. Test with dummy PRs

**Testing**:
- Try direct push to main → should fail
- Try merge without approval → should fail
- Try merge with failing checks → should fail
- Valid PR with approval → should merge

---

### Story 10.7: Rollback Procedures
**Effort**: 1 hour
**Priority**: P1

**Description**: Document and test rollback procedures for staging and production.

**Acceptance Criteria**:
- [ ] Staging rollback documented
- [ ] Production rollback documented (both methods)
- [ ] Rollback tested in staging
- [ ] Rollback playbook added to docs
- [ ] Alert/notification procedure defined

**Implementation Tasks**:
1. Document gcloud rollback commands
2. Document GitHub Actions re-deploy method
3. Create rollback script (optional)
4. Test staging rollback end-to-end
5. Add rollback section to runbook

**Rollback Methods**:

**Method 1: GitHub Actions** (Recommended)
- Go to "Deploy to Production" workflow
- Run with previous good image tag
- Approve and deploy

**Method 2: gcloud CLI**
```bash
gcloud run revisions list --service=interlinear-prod --region=us-east4
gcloud run services update-traffic interlinear-prod \
  --to-revisions=<good-revision>=100 --region=us-east4
```

**Testing**:
- Deploy bad version to staging
- Rollback using gcloud method
- Verify service restored
- Document time to rollback

---

### Story 10.8: Monitoring & Alerting Setup
**Effort**: 1 hour
**Priority**: P2

**Description**: Set up basic monitoring and alerting for deployments and service health.

**Acceptance Criteria**:
- [ ] Cloud Run metrics dashboard created
- [ ] Budget alerts configured
- [ ] Error rate alerting configured
- [ ] Deployment notifications configured (Slack/email)
- [ ] Uptime checks configured for production

**Implementation Tasks**:
1. Create Cloud Monitoring dashboard for Cloud Run
2. Set up GCP budget alerts ($10, $20, $30 thresholds)
3. Configure error rate alerting (>5% error rate)
4. Set up GitHub Actions notifications
5. Configure uptime monitoring (optional)

**Metrics to Monitor**:
- Request count
- Error rate (4xx, 5xx)
- Request latency (p50, p95, p99)
- CPU/Memory utilization
- Cold start count
- Instance count

**Testing**:
- Trigger test alert → verify notification received
- Deploy to staging → verify deployment notification
- Check dashboard shows metrics

---

## Implementation Sequence

### Phase 1: Core Pipeline (Day 1, ~3 hours)
1. **Story 10.5**: GitHub Secrets Configuration
2. **Story 10.1**: PR Quality Gates
3. **Story 10.2**: Staging Auto-Deploy

**Validation**: Can deploy to staging automatically on merge

### Phase 2: Production Pipeline (Day 1, ~2 hours)
4. **Story 10.3**: Production Build Pipeline
5. **Story 10.4**: Production Deploy Workflow
6. **Story 10.6**: Branch Protection Rules

**Validation**: Can safely deploy to production with approval

### Phase 3: Safety & Operations (Day 2, ~2 hours)
7. **Story 10.7**: Rollback Procedures
8. **Story 10.8**: Monitoring & Alerting

**Validation**: Can rollback bad deploys and monitor health

---

## Technical Architecture

### Workflow Dependencies
```
PR Check (pr-check.yml)
    ↓
Staging Deploy (staging-deploy.yml)
    ↓
Production Build (prod-build.yml)
    ↓
Production Deploy (prod-deploy.yml)
```

### Image Tagging Strategy
```
Staging:
  - staging-{short-sha}    (commit-specific)
  - staging-latest         (rolling)

Production:
  - prod-{short-sha}       (commit-specific, rollback target)
  - prod-{timestamp}       (time-based, audit trail)
  - prod-latest            (rolling, for reference)
```

### Environment Parity
| Setting | Staging | Production |
|---------|---------|------------|
| CPU | 1 core | 2 cores |
| Memory | 512Mi | 1Gi |
| Min Instances | 0 | 1 |
| Max Instances | 3 | 10 |
| Timeout | 60s | 60s |
| Secrets | *-staging | *-prod |

---

## Risk Management

### Risks & Mitigations

**Risk**: Accidental production deployment
- **Mitigation**: Manual workflow_dispatch only, no automatic triggers
- **Additional**: GitHub Environment protection with required reviewers

**Risk**: Failed deployment breaks production
- **Mitigation**: Health checks, multiple image tags for rollback
- **Additional**: Keep last 5 production images for fast rollback

**Risk**: Secrets exposure in logs
- **Mitigation**: Use GitHub secrets, GCP Secret Manager
- **Additional**: Mask secrets in workflow outputs

**Risk**: Build cache poisoning
- **Mitigation**: GitHub Actions cache scoped to workflow
- **Additional**: Validate builds on clean runner periodically

**Risk**: Cost overrun from misconfiguration
- **Mitigation**: Budget alerts at multiple thresholds
- **Additional**: min_instances=0 for staging

---

## Cost Estimate

### Infrastructure Costs
- **Staging**: ~$0-5/month (scales to zero)
- **Production**: ~$15-25/month (always-on, low traffic)
- **Artifact Registry**: ~$1/month (image storage)
- **Secret Manager**: Free tier
- **GitHub Actions**: Free tier (2,000 minutes/month)

**Total**: ~$16-31/month

### Time Investment
- **Initial Setup**: 6 hours
- **Monthly Maintenance**: < 1 hour
- **ROI**: Prevents 1+ production incident = priceless

---

## Dependencies

### External Services
- [x] GCP project with billing enabled
- [x] Cloud Run API enabled
- [x] Artifact Registry API enabled
- [x] Secret Manager API enabled
- [x] GitHub repository with Actions enabled

### Prerequisites
- [x] Terraform infrastructure deployed
- [x] Service account created with correct IAM roles
- [x] Supabase projects (staging/prod)
- [x] API keys (ElevenLabs, OpenAI)

---

## Testing Strategy

### Validation Checklist

**PR Workflow**:
- [ ] Create PR with valid code → checks pass
- [ ] Create PR with type error → checks fail
- [ ] Create PR with lint error → checks fail
- [ ] Merge without approval (if required) → blocked

**Staging Deployment**:
- [ ] Merge to staging → auto-deploy succeeds
- [ ] Service accessible at URL
- [ ] Correct image tag deployed
- [ ] Environment variables set correctly
- [ ] Deployment time < 5 minutes

**Production Deployment**:
- [ ] Merge to main → build succeeds (no deploy)
- [ ] Manual deploy with valid tag → succeeds
- [ ] Manual deploy with invalid tag → fails gracefully
- [ ] Manual deploy with missing image → fails before deploy
- [ ] Health check runs and reports status

**Rollback**:
- [ ] Staging rollback via gcloud → succeeds
- [ ] Production rollback via GitHub Actions → succeeds
- [ ] Service restored to previous version
- [ ] Rollback time < 2 minutes

---

## Documentation Deliverables

1. **GitOps Workflow Guide** (`docs/GITOPS_WORKFLOW.md`) ✅
   - Complete workflow descriptions
   - Developer workflow guide
   - Rollback procedures
   - Troubleshooting guide

2. **Runbook** (`docs/RUNBOOK.md`)
   - Emergency procedures
   - Rollback playbook
   - Common issues and fixes
   - On-call guide

3. **Architecture Diagram**
   - Workflow visualization
   - Branch strategy diagram
   - Deployment flow chart

---

## Success Criteria

### Must Have (P0)
- ✅ All PRs validated before merge
- ✅ Staging auto-deploys on merge
- ✅ Production deploys require manual approval
- ✅ All deployments tagged and traceable
- ✅ Rollback procedures tested and documented

### Should Have (P1)
- ✅ Branch protection rules enforced
- ✅ Monitoring and alerting configured
- ✅ Cost under budget ($30/month)
- ✅ Documentation complete

### Nice to Have (P2)
- 🔲 Slack notifications for deployments
- 🔲 Automated E2E tests in pipeline
- 🔲 Canary deployments
- 🔲 Blue/green deployment strategy

---

## Timeline

**Day 1 Morning (3 hours)**:
- Story 10.5: Secrets setup (0.5h)
- Story 10.1: PR checks (1h)
- Story 10.2: Staging auto-deploy (1.5h)

**Day 1 Afternoon (2 hours)**:
- Story 10.3: Production build (1h)
- Story 10.4: Production deploy (1h)

**Day 2 Morning (2 hours)**:
- Story 10.6: Branch protection (0.5h)
- Story 10.7: Rollback procedures (1h)
- Story 10.8: Monitoring setup (0.5h)

**Day 2 Afternoon (1 hour)**:
- End-to-end testing
- Documentation review
- Team walkthrough

**Total**: 6-8 hours (1-2 days)

---

## Post-Implementation

### Week 1
- Monitor deployment frequency
- Track CI/CD execution times
- Gather team feedback
- Adjust protection rules if needed

### Week 2-4
- Optimize build caching
- Add E2E tests to pipeline (optional)
- Set up deployment notifications
- Review and optimize costs

### Ongoing
- Monthly review of deployment metrics
- Quarterly security review of secrets/permissions
- Update documentation as workflows evolve

---

## References

- [GitOps Workflow Documentation](./GITOPS_WORKFLOW.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloud Run Deployment Guide](https://cloud.google.com/run/docs/deploying)
- [Next.js Docker Documentation](https://nextjs.org/docs/app/building-your-application/deploying/docker)

---

**Epic Owner**: DevOps Team
**Last Updated**: 2025-01-11
**Status**: Ready for Implementation
