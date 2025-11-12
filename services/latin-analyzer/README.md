# Latin Analyzer Service

FastAPI service providing Latin morphological analysis using CLTK and Stanza.

## Quick Start

```bash
# Development (with volume caching)
docker compose up -d latin-analyzer

# Production (models pre-baked in image)
docker build -t latin-analyzer:prod .
docker run -p 8000:8000 latin-analyzer:prod
```

## Model Caching Strategies

### 1. **Docker Volume** (Development - CURRENT SETUP)
Models cached across rebuilds. **First run downloads ~500MB, subsequent rebuilds instant.**

```yaml
# docker-compose.yml
volumes:
  - latin-models:/root/cltk_data
  - latin-models:/root/stanza_resources
```

**Pros**: Fast rebuilds, models persist  
**Cons**: Volume needs manual cleanup if corrupted

### 2. **Pre-Baked Models** (Production - IN DOCKERFILE)
Models downloaded during Docker build. **Image is ~1.2GB but starts instantly.**

```dockerfile
# Dockerfile
RUN python -c "from cltk import NLP; nlp = NLP(language='lat'); ..."
```

**Pros**: No runtime downloads, predictable startup  
**Cons**: Larger image size, slower builds

## Performance

| Scenario | First Request | Subsequent | Rebuild Time |
|----------|--------------|------------|--------------|
| **Volume Cache** (dev) | ~10 min (first time only) | < 1s | ~30s |
| **Pre-Baked** (prod) | < 1s | < 1s | ~15 min |
| **No Cache** (butthole) | ~10 min (every time) | < 1s | ~30s |

## Production: Which to Use?

**Use Volume Cache if:**
- Deploying to VM/server with persistent storage
- Want faster builds
- Don't mind volume management

**Use Pre-Baked if:**
- Deploying to Cloud Run / Lambda / Fargate
- Want guaranteed instant startup
- Don't care about build time

## API Endpoints

### Health Check
```bash
curl http://localhost:8000/health
```

### Analyze Latin Text
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "puella bona est"}'
```

## Troubleshooting

### Clear model cache
```bash
docker volume rm interlinear_latin-models
docker compose up -d --build latin-analyzer
```

### Check logs
```bash
docker compose logs latin-analyzer --follow
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PYTHONUNBUFFERED` | `1` | Disable Python output buffering |
| `CLTK_INTERACTIVE` | `false` | Auto-approve model downloads |

## License
MIT
