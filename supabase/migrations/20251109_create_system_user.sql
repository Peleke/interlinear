-- Migration: Create system user for curriculum content
-- Created: 2025-11-09
-- Description: Creates a system user to own curriculum lessons

-- =============================================================================
-- CREATE SYSTEM USER
-- =============================================================================

-- Insert system user into auth.users
-- This user will own all curriculum/legacy lessons
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Fixed UUID for system user
  '00000000-0000-0000-0000-000000000000',
  'system@interlinear.app',
  '$2a$10$AAAAAAAAAAAAAAAAAAAAAO', -- Dummy bcrypt hash (can't login)
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"system","providers":["system"]}',
  '{"name":"System","is_system_user":true}',
  false,
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN auth.users.id IS 'System user (00000000-0000-0000-0000-000000000000) owns curriculum content';
