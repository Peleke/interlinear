# Appendix: Quick Reference

## Environment Variables Setup

```bash
# Merriam-Webster
MERRIAM_WEBSTER_API_KEY=your-api-key

# ElevenLabs
ELEVENLABS_API_KEY=your-api-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Useful Commands

```bash
# Development
npm run dev
npm run test:watch

# Database
npm run db:reset
npm run db:types

# Deployment
npm run build
npm run build:docker
```

---

**END OF ARCHITECTURE DOCUMENT**

This document serves as the complete architectural specification for building Interlinear MVP. All technical decisions, patterns, and implementation details are designed for a 48-hour build-and-deploy cycle using AI-assisted development with integrated BDD/TDD practices.

**Key Architectural Decisions:**
- OpenTofu + Terrateam for GitOps infrastructure management
- GitHub Actions for CI/CD (test → build → push Docker)
- Cloud Run serverless deployment (simple, scalable, cost-effective)
- BDD/TDD integrated from Day 1 (tests written alongside features)
- Simplified error handling and no complex monitoring (demo/prototype focus)

For questions or clarifications, refer back to the [Project Brief](./brief.md) or [PRD](./prd.md).
