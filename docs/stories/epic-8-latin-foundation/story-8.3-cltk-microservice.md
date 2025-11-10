# Story 8.3: CLTK Python Microservice Setup

## Story
**As a** developer
**I want to** create a FastAPI microservice for CLTK morphological analysis
**So that** we can enrich Latin dictionary entries with lemmatization and POS tagging

## Priority
**P0 - Epic 8, Story 3**

## Estimated Time
2-3 hours

## Dependencies
Story 8.2 (need database schema for caching)

## Acceptance Criteria
- [ ] FastAPI service running on port 8001
- [ ] Endpoint `/analyze/latin` accepts word, returns morphology
- [ ] CLTK models downloaded and working
- [ ] Lemmatization functional
- [ ] POS tagging functional
- [ ] Service containerized with Docker
- [ ] Health check endpoint exists

## Technical Details

### CLTK Capabilities
- ✅ Lemmatization: Backoff lemmatizer (corpus-based)
- ✅ POS Tagging: TnT tagger trained on Latin corpora
- ✅ Morphological Analysis: Full inflection generation
- ✅ Tokenization: Sentence and word tokenization

### Service Architecture
**Directory**: `services/cltk-latin/`
- `main.py` - FastAPI application
- `requirements.txt` - Python dependencies
- `Dockerfile` - Container definition

### Endpoints
1. `GET /` - Health check
2. `POST /analyze/latin` - Analyze word morphology
3. `POST /lemmatize` - Batch lemmatization

## Tasks

### 1. Create Service Directory
```bash
mkdir -p services/cltk-latin
cd services/cltk-latin
```

### 2. Install Dependencies
```txt
fastapi==0.109.0
uvicorn==0.27.0
cltk==1.3.0
pydantic==2.5.0
```

### 3. Implement FastAPI Service
See EPIC-BREAKDOWN-LATIN.md Story 8.3 for complete implementation.

### 4. Create Dockerfile
Multi-stage build with CLTK models pre-downloaded.

### 5. Add to docker-compose.yml
Service definition on port 8001.

## Testing Checklist
- [ ] Service starts without errors
- [ ] Health check works: `curl http://localhost:8001/`
- [ ] Analyze endpoint works
- [ ] Returns lemma correctly
- [ ] Returns POS tag
- [ ] Returns morphological features
- [ ] Batch lemmatize works
- [ ] Docker container runs successfully

## Architecture References
- `/docs/PRD-v3-LATIN.md` - CLTK integration
- `/docs/EPIC-BREAKDOWN-LATIN.md` - Story 8.3 details

## Definition of Done
- [ ] FastAPI service implemented
- [ ] CLTK models downloaded
- [ ] All endpoints tested and working
- [ ] Dockerfile created
- [ ] Added to docker-compose.yml
- [ ] Service runs in container
- [ ] Test script passes

---

## Dev Agent Record

### Agent Model Used
_To be filled during implementation_

### Tasks Completed
- [ ] Created service directory structure
- [ ] Implemented FastAPI application
- [ ] Created requirements.txt
- [ ] Implemented analyze endpoint
- [ ] Implemented lemmatize endpoint
- [ ] Created Dockerfile
- [ ] Added to docker-compose.yml
- [ ] Created test script

### Status
**Status**: Draft
