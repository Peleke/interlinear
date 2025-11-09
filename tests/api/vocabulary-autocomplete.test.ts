/**
 * EPIC-02 Story 2.4: Vocabulary Autocomplete API Tests
 * Tests the /api/lessons/vocabulary/search endpoint
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

let adminClient: ReturnType<typeof createClient>;
let testUserId: string;
let testVocabIds: string[] = [];
let testLessonId: string;

describe('EPIC-02.4: Vocabulary Autocomplete API', () => {
  beforeAll(async () => {
    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create test user
    const { data: userData } = await adminClient.auth.admin.createUser({
      email: `vocab-api-test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      email_confirm: true,
    });
    testUserId = userData.user!.id;

    // Create test lesson
    const { data: lesson } = await adminClient
      .from('lessons')
      .insert({
        title: 'Test Lesson for Vocab API',
        status: 'draft',
        language: 'es',
        author_id: testUserId,
      })
      .select()
      .single();
    testLessonId = lesson!.id;

    // Create test vocabulary items
    const vocabItems = [
      { spanish: 'ser', english: 'to be', language: 'es' },
      { spanish: 'estar', english: 'to be (location/condition)', language: 'es' },
      { spanish: 'serpiente', english: 'snake', language: 'es' },
      { spanish: 'servir', english: 'to serve', language: 'es' },
      { spanish: 'vera', english: 'to see', language: 'is' }, // Icelandic
    ];

    const { data: createdVocab } = await adminClient
      .from('lesson_vocabulary_items')
      .insert(vocabItems)
      .select();

    testVocabIds = createdVocab!.map((v) => v.id);

    // Link some vocab to lesson (to create usage counts)
    await adminClient.from('lesson_vocabulary').insert([
      { lesson_id: testLessonId, vocabulary_id: testVocabIds[0] }, // ser: 1 usage
      { lesson_id: testLessonId, vocabulary_id: testVocabIds[1] }, // estar: 1 usage
    ]);

    // Wait for trigger to update usage counts
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    // Cleanup
    await adminClient.from('lesson_vocabulary').delete().eq('lesson_id', testLessonId);
    await adminClient
      .from('lesson_vocabulary_items')
      .delete()
      .in('id', testVocabIds);
    await adminClient.from('lessons').delete().eq('id', testLessonId);
    await adminClient.auth.admin.deleteUser(testUserId);
  });

  describe('Search Functionality', () => {
    it('should return matching vocabulary for partial search', async () => {
      const response = await fetch(`${baseUrl}/api/lessons/vocabulary/search?q=ser&language=es`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions).toBeDefined();
      expect(data.suggestions.length).toBeGreaterThan(0);

      // Should match: ser, servir, serpiente (all contain "ser")
      const spanishWords = data.suggestions.map((s: any) => s.spanish);
      expect(spanishWords).toContain('ser');
    });

    it('should rank results by usage_count descending', async () => {
      const response = await fetch(`${baseUrl}/api/lessons/vocabulary/search?q=ser&language=es`);
      const data = await response.json();

      expect(response.status).toBe(200);

      // ser and estar both have usage_count=1 (linked to lesson)
      // serpiente and servir have usage_count=0 (not linked)
      const suggestions = data.suggestions;

      // First results should have higher usage counts
      for (let i = 0; i < suggestions.length - 1; i++) {
        expect(suggestions[i].usage_count).toBeGreaterThanOrEqual(
          suggestions[i + 1].usage_count
        );
      }
    });

    it('should filter by language', async () => {
      // Search Spanish
      const esResponse = await fetch(
        `${baseUrl}/api/lessons/vocabulary/search?q=&language=es`
      );
      const esData = await esResponse.json();
      const esSuggestions = esData.suggestions;

      // All results should be Spanish
      esSuggestions.forEach((s: any) => {
        expect(s.language).toBe('es');
      });

      // Search Icelandic
      const isResponse = await fetch(
        `${baseUrl}/api/lessons/vocabulary/search?q=&language=is`
      );
      const isData = await isResponse.json();
      const isSuggestions = isData.suggestions;

      // All results should be Icelandic
      isSuggestions.forEach((s: any) => {
        expect(s.language).toBe('is');
      });

      // Should find Icelandic word
      const icelandicWords = isSuggestions.map((s: any) => s.spanish);
      expect(icelandicWords).toContain('vera');
    });

    it('should include usage badges', async () => {
      const response = await fetch(`${baseUrl}/api/lessons/vocabulary/search?q=ser&language=es`);
      const data = await response.json();

      expect(response.status).toBe(200);

      const serSuggestion = data.suggestions.find((s: any) => s.spanish === 'ser');
      expect(serSuggestion).toBeDefined();
      expect(serSuggestion.badge).toContain('Used in');
      expect(serSuggestion.badge).toContain('lesson');
      expect(serSuggestion.reusable).toBe(true);

      const serpienteSuggestion = data.suggestions.find((s: any) => s.spanish === 'serpiente');
      if (serpienteSuggestion) {
        expect(serpienteSuggestion.badge).toBe('New word');
        expect(serpienteSuggestion.reusable).toBe(false);
      }
    });

    it('should handle empty query', async () => {
      const response = await fetch(`${baseUrl}/api/lessons/vocabulary/search?q=&language=es`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions).toBeDefined();
      // Empty query returns all vocab (up to limit)
    });

    it('should respect limit parameter', async () => {
      const response = await fetch(
        `${baseUrl}/api/lessons/vocabulary/search?q=&language=es&limit=2`
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid language', async () => {
      const response = await fetch(
        `${baseUrl}/api/lessons/vocabulary/search?q=test&language=fr`
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid language');
    });

    it('should require authentication', async () => {
      // Test without auth (would need to mock unauthenticated request)
      // This is a placeholder - actual implementation depends on test setup
    });
  });

  describe('Performance', () => {
    it('should return results in under 100ms', async () => {
      const start = Date.now();
      const response = await fetch(`${baseUrl}/api/lessons/vocabulary/search?q=ser&language=es`);
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(100); // Target: <100ms
    });
  });
});
