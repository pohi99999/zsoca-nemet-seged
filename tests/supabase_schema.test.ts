import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getSupabaseBrowserClient } from '../src/lib/supabase/client';
import { getSupabaseServerClient } from '../src/lib/supabase/server';

describe('Database Schema Migration', () => {
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260815000000_init_schema.sql');

  it('should have migration file created', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('should contain all required tables and relationships', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Check table definitions
    expect(sql).toMatch(/CREATE TABLE (IF NOT EXISTS )?profiles/i);
    expect(sql).toMatch(/CREATE TABLE (IF NOT EXISTS )?assessment_results/i);
    expect(sql).toMatch(/CREATE TABLE (IF NOT EXISTS )?learning_plans/i);
    expect(sql).toMatch(/CREATE TABLE (IF NOT EXISTS )?modules/i);
    expect(sql).toMatch(/CREATE TABLE (IF NOT EXISTS )?user_vocabulary_memory/i);

    // Check key columns & foreign keys
    expect(sql).toContain('current_level');
    expect(sql).toContain('strengths');
    expect(sql).toContain('focus_areas');
    expect(sql).toContain('german_word');
    expect(sql).toContain('hungarian_translation');
    expect(sql).toContain('pronunciation_notes');
    expect(sql).toContain('difficulty_score');
  });
});

describe('Supabase Client Wrappers', () => {
  it('should initialize browser client gracefully with fallback/defaults', () => {
    const client = getSupabaseBrowserClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe('function');
  });

  it('should initialize server client gracefully with fallback/defaults', () => {
    const client = getSupabaseServerClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe('function');
  });
});
