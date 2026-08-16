-- Supabase Schema Migration: Initial setup for Zsóca Német Segéd
-- Created on 2026-08-15

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  current_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Level Assessment Results
CREATE TABLE IF NOT EXISTS assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  summary TEXT,
  strengths TEXT[],
  focus_areas TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Personalized Learning Plans
CREATE TABLE IF NOT EXISTS learning_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Learning Modules
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES learning_plans(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'available'
);

-- 5. Vocabulary Memory & Pronunciation Storage
CREATE TABLE IF NOT EXISTS user_vocabulary_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  german_word TEXT NOT NULL,
  hungarian_translation TEXT NOT NULL,
  pronunciation_notes TEXT,
  difficulty_score INT DEFAULT 1,
  last_practiced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Required for the upsert(..., { onConflict: 'user_id,german_word' })
  -- call in /api/chat's vocabulary persistence.
  UNIQUE (user_id, german_word)
);

-- Row Level Security: this app has no end-user auth, so its server-side API
-- routes are the only writers/readers. Grant access to the service_role
-- (preferred) and to anon (fallback, since the app degrades to using the
-- anon key server-side when no service_role key is configured).
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vocabulary_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_profiles" ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_assessment_results" ON assessment_results FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_learning_plans" ON learning_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_modules" ON modules FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_user_vocabulary_memory" ON user_vocabulary_memory FOR ALL TO service_role USING (true) WITH CHECK (true);
