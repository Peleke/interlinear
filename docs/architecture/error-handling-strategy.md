# Error Handling Strategy

## Error Response Format

```typescript
interface ApiError {
  error: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}
```

**Pattern:** All API routes return consistent error format. Frontend displays user-friendly messages.

---
