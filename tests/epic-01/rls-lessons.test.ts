/**
 * EPIC-01 Story 1.3: RLS Policy Tests for Lessons Table
 * GitHub Issue: #10
 *
 * Tests verify:
 * - Authors can view their own drafts
 * - All authenticated users can view published lessons
 * - Authors can create new lessons (author_id = self)
 * - Authors can update ONLY their own lessons
 * - Authors can delete ONLY their own draft lessons (not published)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Test users (create these in Supabase auth for testing)
const AUTHOR_A = {
  email: 'author-a-test@example.com',
  password: 'test-password-123',
  userId: '', // Will be set in beforeAll
};

const AUTHOR_B = {
  email: 'author-b-test@example.com',
  password: 'test-password-456',
  userId: '', // Will be set in beforeAll
};

let adminClient: SupabaseClient;
let authorAClient: SupabaseClient;
let authorBClient: SupabaseClient;

let authorADraftLessonId: string;
let authorAPublishedLessonId: string;
let authorBDraftLessonId: string;

describe('EPIC-01.3: Lessons Table RLS Policies', () => {
  beforeAll(async () => {
    // Setup admin client (bypasses RLS)
    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create or sign in test users
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

    // Create authenticated clients
    authorAClient = createClient(supabaseUrl, supabaseAnonKey);
    const { error: signInAError } = await authorAClient.auth.signInWithPassword({
      email: AUTHOR_A.email,
      password: AUTHOR_A.password,
    });
    if (signInAError) throw signInAError;

    authorBClient = createClient(supabaseUrl, supabaseAnonKey);
    const { error: signInBError } = await authorBClient.auth.signInWithPassword({
      email: AUTHOR_B.email,
      password: AUTHOR_B.password,
    });
    if (signInBError) throw signInBError;

    // Create test lessons as Author A
    const { data: draftLesson } = await authorAClient
      .from('lessons')
      .insert({
        title: 'Author A Draft Lesson',
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
        title: 'Author A Published Lesson',
        status: 'published',
        language: 'es',
        author_id: AUTHOR_A.userId,
        overview: 'Test overview',
      })
      .select()
      .single();
    authorAPublishedLessonId = publishedLesson!.id;

    // Create test lesson as Author B
    const { data: draftLessonB } = await authorBClient
      .from('lessons')
      .insert({
        title: 'Author B Draft Lesson',
        status: 'draft',
        language: 'es',
        author_id: AUTHOR_B.userId,
      })
      .select()
      .single();
    authorBDraftLessonId = draftLessonB!.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test lessons
    await adminClient.from('lessons').delete().eq('id', authorADraftLessonId);
    await adminClient.from('lessons').delete().eq('id', authorAPublishedLessonId);
    await adminClient.from('lessons').delete().eq('id', authorBDraftLessonId);

    // Cleanup: Delete test users
    await adminClient.auth.admin.deleteUser(AUTHOR_A.userId);
    await adminClient.auth.admin.deleteUser(AUTHOR_B.userId);
  });

  describe('SELECT Policy: "Authors can view own draft lessons"', () => {
    it('should allow Author A to see their own draft', async () => {
      const { data, error } = await authorAClient
        .from('lessons')
        .select('*')
        .eq('id', authorADraftLessonId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.id).toBe(authorADraftLessonId);
      expect(data.status).toBe('draft');
    });

    it('should prevent Author B from seeing Author A\'s draft', async () => {
      const { data, error } = await authorBClient
        .from('lessons')
        .select('*')
        .eq('id', authorADraftLessonId)
        .single();

      // Should return no rows (not an error, just empty)
      expect(data).toBeNull();
      expect(error?.code).toBe('PGRST116'); // Row not found
    });

    it('should allow all users to see published lessons', async () => {
      const { data: dataA, error: errorA } = await authorAClient
        .from('lessons')
        .select('*')
        .eq('id', authorAPublishedLessonId)
        .single();

      expect(errorA).toBeNull();
      expect(dataA).toBeTruthy();

      const { data: dataB, error: errorB } = await authorBClient
        .from('lessons')
        .select('*')
        .eq('id', authorAPublishedLessonId)
        .single();

      expect(errorB).toBeNull();
      expect(dataB).toBeTruthy();
      expect(dataB.id).toBe(authorAPublishedLessonId);
    });
  });

  describe('INSERT Policy: "Authors can create lessons"', () => {
    it('should allow user to create lesson with their own author_id', async () => {
      const { data, error } = await authorAClient
        .from('lessons')
        .insert({
          title: 'New Test Lesson',
          status: 'draft',
          language: 'es',
          author_id: AUTHOR_A.userId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.author_id).toBe(AUTHOR_A.userId);

      // Cleanup
      if (data) {
        await adminClient.from('lessons').delete().eq('id', data.id);
      }
    });

    it('should prevent user from creating lesson with different author_id', async () => {
      const { data, error } = await authorAClient
        .from('lessons')
        .insert({
          title: 'Malicious Lesson',
          status: 'draft',
          language: 'es',
          author_id: AUTHOR_B.userId, // Trying to impersonate Author B
        })
        .select()
        .single();

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });
  });

  describe('UPDATE Policy: "Authors can update own lessons"', () => {
    it('should allow author to update their own lesson', async () => {
      const { data, error } = await authorAClient
        .from('lessons')
        .update({ title: 'Updated Title' })
        .eq('id', authorADraftLessonId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.title).toBe('Updated Title');
    });

    it('should prevent author from updating another author\'s lesson', async () => {
      const { data, error } = await authorBClient
        .from('lessons')
        .update({ title: 'Malicious Update' })
        .eq('id', authorADraftLessonId)
        .select()
        .single();

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });
  });

  describe('DELETE Policy: "Authors can delete own draft lessons"', () => {
    it('should allow author to delete their own draft lesson', async () => {
      // Create a draft lesson to delete
      const { data: newDraft } = await authorAClient
        .from('lessons')
        .insert({
          title: 'Draft to Delete',
          status: 'draft',
          language: 'es',
          author_id: AUTHOR_A.userId,
        })
        .select()
        .single();

      const { error } = await authorAClient
        .from('lessons')
        .delete()
        .eq('id', newDraft!.id);

      expect(error).toBeNull();

      // Verify deletion
      const { data: checkData } = await adminClient
        .from('lessons')
        .select('*')
        .eq('id', newDraft!.id)
        .single();
      expect(checkData).toBeNull();
    });

    it('should prevent author from deleting published lesson', async () => {
      const { error } = await authorAClient
        .from('lessons')
        .delete()
        .eq('id', authorAPublishedLessonId);

      expect(error).toBeTruthy();

      // Verify lesson still exists
      const { data: checkData } = await adminClient
        .from('lessons')
        .select('*')
        .eq('id', authorAPublishedLessonId)
        .single();
      expect(checkData).toBeTruthy();
    });

    it('should prevent author from deleting another author\'s draft', async () => {
      const { error } = await authorBClient
        .from('lessons')
        .delete()
        .eq('id', authorADraftLessonId);

      expect(error).toBeTruthy();

      // Verify lesson still exists
      const { data: checkData } = await adminClient
        .from('lessons')
        .select('*')
        .eq('id', authorADraftLessonId)
        .single();
      expect(checkData).toBeTruthy();
    });
  });
});
