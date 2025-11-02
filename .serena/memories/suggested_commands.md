# Suggested Commands

## Development
```bash
# Start development server (hot reload enabled)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Quality Checks
```bash
# Run linter
npm run lint

# TypeScript type checking (no emit)
npm run type-check
```

## Testing
```bash
# Run all tests (when implemented)
npm test

# Run tests in watch mode
npm test -- --watch

# Run E2E tests
npm run test:e2e
```

## Git Workflow
```bash
# Check status before any work
git status

# Create feature branch
git checkout -b feature/story-X.X

# Commit changes
git add .
git commit -m "feat: description"

# Push to remote
git push origin feature/story-X.X
```

## Utility Commands (Linux)
```bash
# List files
ls -la

# Find files
find . -name "*.tsx"

# Search in files
grep -r "search term" .

# Check running processes
ps aux | grep node

# Check port usage
netstat -tlnp | grep :3000
```

## Project-Specific
```bash
# Verify environment setup
cat .env.local.example

# Check dependencies
npm list --depth=0

# Update dependencies (carefully)
npm update
```
