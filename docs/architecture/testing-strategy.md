# Testing Strategy

## Testing Pyramid

```
        E2E Tests (Playwright)
       /                    \
      Integration Tests
     /                      \
    Unit Tests (Vitest + RTL)
```

## Test Organization

- **Unit tests:** `*.test.ts` alongside source files
- **Component tests:** `*.test.tsx` alongside components
- **E2E tests:** `tests/e2e/*.spec.ts`

## Coverage Goals

- ✅ **Unit tests:** 80%+ coverage for utilities/services
- ✅ **Component tests:** Cover critical user interactions
- ✅ **E2E tests:** Cover 2-3 critical paths (auth → lookup → audio)

---
