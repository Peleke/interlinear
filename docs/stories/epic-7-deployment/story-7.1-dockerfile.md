# Story 7.1: Dockerfile & Container Build

## Summary
Create production-ready Dockerfile for Next.js app with multi-stage build.

## Acceptance Criteria
- Multi-stage build (dependencies → builder → runner)
- Optimized for Cloud Run (standalone output)
- Minimal image size (<200MB)
- Non-root user for security
- Health check endpoint

## Implementation

### Dockerfile
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### next.config.js
```javascript
// Enable standalone output for Docker
module.exports = {
  output: 'standalone',
  // ... existing config
}
```

### .dockerignore
```
node_modules
.next
.git
.env.local
README.md
docs/
*.md
.vscode
.idea
```

## Testing Locally
```bash
# Build image
docker build -t interlinear:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=xxx \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx \
  -e ELEVENLABS_API_KEY=xxx \
  interlinear:latest

# Test
curl http://localhost:3000/api/health
```

## Expected Effort
⏱️ **1 hour** - Write Dockerfile, test build, optimize size
