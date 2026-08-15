# Zsóca Német Segéd Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Next.js PWA German learning app for Zsóca with cloud memory (Supabase), AI-powered level assessment, personalized learning plans, and speech synthesis/recognition (Web Speech API).

**Architecture:** Next.js App Router (TypeScript, Tailwind CSS) deployed on Vercel with PWA manifest/service worker. Supabase PostgreSQL for persistence (profiles, level assessment, generated plans, vocabulary memory). Vercel Serverless API routes for Gemini API integration. Web Speech API for TTS (`de-DE`) and STT (`SpeechRecognition`).

**Tech Stack:** Next.js 14/15, TypeScript, Tailwind CSS, Supabase JS Client, Gemini API (via `@google/genai` or standard REST API), Web Speech API, Vitest, React Testing Library, Playwright.

---

## File Structure & Map

- `package.json`
- `next.config.mjs` (PWA config with `@ducanh2912/next-pwa` or custom service worker)
- `public/manifest.json` (PWA mobile installation metadata)
- `public/icons/` (App icons for mobile home screen)
- `src/lib/supabase/client.ts` (Supabase browser client)
- `src/lib/supabase/server.ts` (Supabase server client)
- `src/lib/speech/speechSynthesis.ts` (TTS reader for German words/sentences)
- `src/lib/speech/speechRecognition.ts` (STT listener for microphone answers)
- `src/lib/ai/gemini.ts` (Gemini API prompt runner for level assessment, plan generation, and dialogue)
- `src/app/api/assessment/route.ts` (Serverless API route for level assessment)
- `src/app/api/plan/route.ts` (Serverless API route for learning plan generation)
- `src/app/api/chat/route.ts` (Serverless API route for situational chat practice)
- `src/app/layout.tsx` (Mobile shell layout, viewport, PWA headers)
- `src/app/page.tsx` (Dashboard & learning plan overview)
- `src/app/assessment/page.tsx` (Interactive level assessment chat view)
- `src/app/practice/[moduleId]/page.tsx` (Conversational practice screen with TTS & Microphone buttons)
- `src/app/vocabulary/page.tsx` (Saved vocabulary & pronunciation review)
- `supabase/migrations/20260815000000_init_schema.sql` (PostgreSQL schema migration)

---

### Task 1: Project Scaffolding & Next.js PWA Setup

**Files:**
- Create: `package.json`
- Create: `next.config.mjs`
- Create: `public/manifest.json`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Test: `tests/pwa.test.ts`

- [ ] **Step 1: Write failing test for PWA manifest existence & structure**

```typescript
// tests/pwa.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA Setup', () => {
  it('should have a valid public/manifest.json file', () => {
    const manifestPath = path.join(process.cwd(), 'public/manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(content.name).toBe('Zsóca Német Segéd');
    expect(content.display).toBe('standalone');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/pwa.test.ts`  
Expected: FAIL with "manifest.json not found"

- [ ] **Step 3: Create Next.js application & manifest file**

```json
// public/manifest.json
{
  "name": "Zsóca Német Segéd",
  "short_name": "NémetSegéd",
  "description": "Beszédfókuszú német nyelvtanulást segítő alkalmazás Zsócának",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/pwa.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: setup Next.js project scaffolding and PWA manifest"
```

---

### Task 2: Supabase Schema Migration & Database Client Setup

**Files:**
- Create: `supabase/migrations/20260815000000_init_schema.sql`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Test: `tests/supabase_schema.test.ts`

- [x] **Step 1: Write test for SQL schema file definition**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Create SQL migration script & Supabase clients**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

```bash
git add supabase/ src/lib/supabase/ tests/
git commit -m "feat: add Supabase schema migration and client wrappers"
```

---

### Task 3: Web Speech API Helper Utilities (TTS & STT)

**Files:**
- Create: `src/lib/speech/speechSynthesis.ts`
- Create: `src/lib/speech/speechRecognition.ts`
- Test: `tests/speech.test.ts`

- [x] **Step 1: Write test for SpeechSynthesis parameters**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement SpeechSynthesis & SpeechRecognition helpers**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

```bash
git add src/lib/speech/ tests/
git commit -m "feat: implement Web Speech API TTS and STT helpers"
```

---

### Task 4: Interactive Level Assessment Flow & Gemini Integration

**Files:**
- Create: `src/app/api/assessment/route.ts`
- Create: `src/app/assessment/page.tsx`
- Test: `tests/assessment_api.test.ts`

- [x] **Step 1: Write test for level assessment API payload**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement Serverless Assessment API Route & UI Component**
- [x] **Step 4: Verify test suite**
- [x] **Step 5: Commit**

```bash
git add src/app/api/assessment/ src/app/assessment/ tests/
git commit -m "feat: add level assessment API and mobile chat view"
```

---

### Task 5: Personalized Learning Plan Generator & Dashboard UI

**Files:**
- Create: `src/app/api/plan/route.ts`
- Create: `src/app/page.tsx`
- Test: `tests/plan_dashboard.test.ts`

- [x] **Step 1: Write test for learning plan module generator**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement plan API route and main mobile dashboard view**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 6: Conversational Situational Practice Screen

**Files:**
- Create: `src/app/api/chat/route.ts`
- Create: `src/app/practice/[moduleId]/page.tsx`
- Test: `tests/practice_chat.test.ts`

- [x] **Step 1: Write test for practice chat handler with TTS/STT toggle logic**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement practice chat page with audio playback, mic recording, translation toggle, and optional grammar card**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 7: Vocabulary & Memory Storage Screen

**Files:**
- Create: `src/app/api/vocabulary/route.ts`
- Create: `src/app/vocabulary/page.tsx`
- Test: `tests/vocabulary.test.ts`

- [x] **Step 1: Write test for vocabulary retrieval and audio playback item creation**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement vocabulary page with saved words, difficulty indicators, and instant audio playback**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

```bash
git add src/app/api/vocabulary/ src/app/vocabulary/ tests/vocabulary.test.ts
git commit -m "feat: implement vocabulary memory storage screen and review API"
```

---

### Task 8: End-to-End Testing & Verification with Playwright

**Files:**
- Create: `e2e/mobile_flow.spec.ts`

- [ ] **Step 1: Write E2E test for complete user flow**
- [ ] **Step 2: Run E2E test to verify**
- [ ] **Step 3: Commit**

```bash
git add e2e/
git commit -m "test: add Playwright E2E tests for mobile assessment and practice flow"
```
