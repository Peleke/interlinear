# Story 1.3 - Quick Start Guide

**TL;DR**: Run migration SQL → Run seeding script → Done!

---

## ⚡ Quick Deploy

### 1. Apply Migration (60 seconds)
```bash
# Copy this file to Supabase SQL Editor and run:
supabase/migrations/20251102_lesson_content_structure.sql
```

### 2. Seed Content (30 seconds)
```bash
npm run seed:lessons:v2 -- lessons
```

### 3. Verify (10 seconds)
```sql
SELECT COUNT(*) FROM grammar_concepts;      -- Should be 3
SELECT COUNT(*) FROM lesson_vocabulary_items; -- Should be ~45
SELECT COUNT(*) FROM lessons WHERE id IN ('1', '2', '3'); -- Should be 3
```

---

## 📚 What You Get

**3 Complete A1 Spanish Lessons**:
1. **Saludos** - Greetings and introductions with SER verb
2. **La Familia** - Family vocabulary with possessives
3. **Los Números** - Numbers 0-20 and expressing age with TENER

**Each Lesson Includes**:
- Authentic dialog (6-8 exchanges)
- Grammar concept explanations
- Vocabulary items (11-33 per lesson)
- Translation exercises (6-8 per lesson)
- Cultural notes

---

## 🔧 Troubleshooting

### Migration fails with "table already exists"
**Fix**: Tables use `IF NOT EXISTS`, safe to re-run. If still fails, check existing tables don't conflict.

### Seeding fails with "table not found"
**Fix**: Migration not applied yet. Run Step 1 first.

### Seeding creates duplicates
**Fix**: Script is idempotent - duplicates shouldn't happen due to unique constraints. Safe to re-run.

---

## 📖 Full Documentation

- **Architecture**: `LESSON_CONTENT_ARCHITECTURE.md`
- **Implementation**: `STORY-1.3-IMPLEMENTATION-SUMMARY.md`
- **Deployment**: `READY-TO-DEPLOY.md`

---

**Questions?** Check the full docs or review the migration/seeding files directly.
