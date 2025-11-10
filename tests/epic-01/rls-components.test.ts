/**
 * EPIC-01 Story 1.4: RLS Policy Tests for Component Tables
 * GitHub Issue: #11
 *
 * Tests verify component tables inherit lesson permissions:
 * - lesson_dialogs
 * - dialog_exchanges
 * - lesson_vocabulary
 * - exercises
 * - lesson_grammar_concepts
 * - lesson_readings
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const AUTHOR_A = {
  email: 'component-author-a@example.com',
  password: 'test-password-789',
  userId: '',
};

const AUTHOR_B = {
  email: 'component-author-b@example.com',
  password: 'test-password-012',
  userId: '',
};

let adminClient: SupabaseClient;
let authorAClient: SupabaseClient;
let authorBClient: SupabaseClient;

let authorADraftLessonId: string;
let authorAPublishedLessonId: string;
let dialogId: string;
let vocabularyId: string;
let exerciseId: string;

describe('EPIC-01.4: Component Table RLS Policies', () => {
  beforeAll(async () => {
    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create test users
    const { data: userA } = await adminClient.auth.admin.createUser({
      email: AUTHOR_A.email,
      password: AUTHOR_A.password,
      email_confirm: true,
    });
    AUTHOR_A.userId = userA.user!.id;

    const { data: userB } = await adminClient.auth.admin.createUser({
      email: AUTHOR_B.email,
      password: AUTHOR_B.password,
      email_confirm: true,
    });
    AUTHOR_B.userId = userB.user!.id;

    // Sign in clients
    authorAClient = createClient(supabaseUrl, supabaseAnonKey);
    await authorAClient.auth.signInWithPassword({
      email: AUTHOR_A.email,
      password: AUTHOR_A.password,
    });

    authorBClient = createClient(supabaseUrl, supabaseAnonKey);
    await authorBClient.auth.signInWithPassword({
      email: AUTHOR_B.email,
      password: AUTHOR_B.password,
    });

    // Create test lessons
    const { data: draftLesson } = await authorAClient
      .from('lessons')
      .insert({
        title: 'Draft Lesson for Components',
        status: 'draft',
        language: 'es',
        author_id: AUTHOR_A.userId,
      })
      .select()
      .single();
    authorADraftLessonId = draftLesson!.id;

    const { data: publishedLesson } = await authorAClient
      .from('lessons')
      .insert({
        title: 'Published Lesson for Components',
        status: 'published',
        language: 'es',
        author_id: AUTHOR_A.userId,
        overview: 'Test overview',
      })
      .select()
      .single();
    authorAPublishedLessonId = publishedLesson!.id;

    // Create test components for draft lesson
    const { data: dialog } = await authorAClient
      .from('lesson_dialogs')
      .insert({
        lesson_id: authorADraftLessonId,
        title: 'Test Dialog',
        context: 'Test context',
      })
      .select()
      .single();
    dialogId = dialog!.id;

    // Create vocabulary (need to create vocabulary entry first)
    const { data: vocabEntry } = await authorAClient
      .from('vocabulary')
      .insert({
        user_id: AUTHOR_A.userId,
        spanish: 'hola',
        english: 'hello',
        language: 'es',
      })
      .select()
      .single();
    vocabularyId = vocabEntry!.id;

    await authorAClient
      .from('lesson_vocabulary')
      .insert({
        lesson_id: authorADraftLessonId,
        vocabulary_id: vocabularyId,
      });

    // Create exercise
    const { data: exercise } = await authorAClient
      .from('exercises')
      .insert({
        lesson_id: authorADraftLessonId,
        type: 'fill_blank',
        question_spanish: '__ día',
        answer: 'buen',
      })
      .select()
      .single();
    exerciseId = exercise!.id;
  });

  afterAll(async () => {
    // Cleanup components
    await adminClient.from('lesson_vocabulary').delete().eq('lesson_id', authorADraftLessonId);
    await adminClient.from('vocabulary').delete().eq('id', vocabularyId);
    await adminClient.from('lesson_dialogs').delete().eq('id', dialogId);
    await adminClient.from('exercises').delete().eq('id', exerciseId);

    // Cleanup lessons
    await adminClient.from('lessons').delete().eq('id', authorADraftLessonId);
    await adminClient.from('lessons').delete().eq('id', authorAPublishedLessonId);

    // Cleanup users
    await adminClient.auth.admin.deleteUser(AUTHOR_A.userId);
    await adminClient.auth.admin.deleteUser(AUTHOR_B.userId);
  });

  describe('lesson_dialogs RLS', () => {
    it('should allow author to view dialogs of their draft lesson', async () => {
      const { data, error } = await authorAClient
        .from('lesson_dialogs')
        .select('*')
        .eq('lesson_id', authorADraftLessonId);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.length).toBeGreaterThan(0);
    });

    it('should prevent non-author from viewing dialogs of draft lesson', async () => {
      const { data, error } = await authorBClient
        .from('lesson_dialogs')
        .select('*')
        .eq('lesson_id', authorADraftLessonId);

      expect(error).toBeNull();
      expect(data).toEqual([]); // Empty array, no access
    });

    it('should allow all users to view dialogs of published lesson', async () => {
      // Create dialog for published lesson
      const { data: pubDialog } = await authorAClient
        .from('lesson_dialogs')
        .insert({
          lesson_id: authorAPublishedLessonId,
          title: 'Published Dialog',
          context: 'Public context',
        })
        .select()
        .single();

      const { data, error } = await authorBClient
        .from('lesson_dialogs')
        .select('*')
        .eq('lesson_id', authorAPublishedLessonId);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.length).toBeGreaterThan(0);

      // Cleanup
      await adminClient.from('lesson_dialogs').delete().eq('id', pubDialog!.id);
    });

    it('should prevent non-author from creating dialogs for draft lesson', async () => {
      const { data, error } = await authorBClient
        .from('lesson_dialogs')
        .insert({
          lesson_id: authorADraftLessonId,
          title: 'Malicious Dialog',
          context: 'Should fail',
        })
        .select()
        .single();

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });
  });

  describe('lesson_vocabulary RLS', () => {
    it('should allow author to view vocabulary of their draft lesson', async () => {
      const { data, error } = await authorAClient
        .from('lesson_vocabulary')
        .select('*')
        .eq('lesson_id', authorADraftLessonId);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.length).toBeGreaterThan(0);
    });

    it('should prevent non-author from viewing vocabulary of draft lesson', async () => {
      const { data, error } = await authorBClient
        .from('lesson_vocabulary')
        .select('*')
        .eq('lesson_id', authorADraftLessonId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('should prevent non-author from adding vocabulary to draft lesson', async () => {
      // Create vocab for Author B
      const { data: vocabB } = await authorBClient
        .from('vocabulary')
        .insert({
          user_id: AUTHOR_B.userId,
          spanish: 'adiós',
          english: 'goodbye',
          language: 'es',
        })
        .select()
        .single();

      const { data, error } = await authorBClient
        .from('lesson_vocabulary')
        .insert({
          lesson_id: authorADraftLessonId,
          vocabulary_id: vocabB!.id,
        })
        .select()
        .single();

      expect(error).toBeTruthy();
      expect(data).toBeNull();

      // Cleanup
      await adminClient.from('vocabulary').delete().eq('id', vocabB!.id);
    });
  });

  describe('exercises RLS', () => {
    it('should allow author to view exercises of their draft lesson', async () => {
      const { data, error } = await authorAClient
        .from('exercises')
        .select('*')
        .eq('lesson_id', authorADraftLessonId);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.length).toBeGreaterThan(0);
    });

    it('should prevent non-author from viewing exercises of draft lesson', async () => {
      const { data, error } = await authorBClient
        .from('exercises')
        .select('*')
        .eq('lesson_id', authorADraftLessonId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('should allow all users to view exercises of published lesson', async () => {
      // Create exercise for published lesson
      const { data: pubExercise } = await authorAClient
        .from('exercises')
        .insert({
          lesson_id: authorAPublishedLessonId,
          type: 'multiple_choice',
          question_spanish: '¿Cómo estás?',
          answer: 'bien',
        })
        .select()
        .single();

      const { data, error } = await authorBClient
        .from('exercises')
        .select('*')
        .eq('lesson_id', authorAPublishedLessonId);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.length).toBeGreaterThan(0);

      // Cleanup
      await adminClient.from('exercises').delete().eq('id', pubExercise!.id);
    });

    it('should prevent non-author from creating exercises for draft lesson', async () => {
      const { data, error } = await authorBClient
        .from('exercises')
        .insert({
          lesson_id: authorADraftLessonId,
          type: 'fill_blank',
          question_spanish: 'Malicious',
          answer: 'fail',
        })
        .select()
        .single();

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });
  });
});
