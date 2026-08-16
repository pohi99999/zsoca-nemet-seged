import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPlanPrompt,
  getMockLearningPlan,
  LearningPlanResponse,
  LearningPlanModule,
} from '../src/lib/ai/gemini';
import { GET as getPlanHandler, POST as postPlanHandler } from '../src/app/api/plan/route';

describe('Learning Plan Generator AI & Helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('should generate a valid prompt for learning plan generation', () => {
    const prompt = createPlanPrompt({
      userName: 'Zsóca',
      estimated_level: 'A2 (Felelevenítő)',
      strengths: ['Bátor beszédkészség', 'Alapvető kifejezések'],
      focus_areas: ['Múlt idő (Perfekt)', 'Névelők'],
    });

    expect(prompt).toContain('Zsóca');
    expect(prompt).toContain('A2 (Felelevenítő)');
    expect(prompt).toContain('Múlt idő (Perfekt)');
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('5 modul');
  });

  it('should return mock 5 modules from getMockLearningPlan', () => {
    const mockPlan = getMockLearningPlan('A2');
    expect(mockPlan).toBeDefined();
    expect(mockPlan.title).toBeDefined();
    expect(mockPlan.modules).toHaveLength(5);
    expect(mockPlan.modules[0].title).toContain('Pékség & Kávézó');
    expect(mockPlan.modules[1].title).toContain('Útbaigazítás');
    expect(mockPlan.modules[2].title).toContain('Szállodai bejelentkezés');
    expect(mockPlan.modules[3].title).toContain('Hétköznapi csevegés');
    expect(mockPlan.modules[4].title).toContain('Orvosnál & Gyógyszertárban');

    mockPlan.modules.forEach((mod: LearningPlanModule, idx: number) => {
      expect(mod.order_index).toBe(idx + 1);
      expect(mod.title).toBeDefined();
      expect(mod.description).toBeDefined();
      expect(mod.estimated_duration).toBeDefined();
      expect(['available', 'locked', 'completed']).toContain(mod.status);
    });
  });
});

describe('Learning Plan API Route Handler (/api/plan)', () => {
  beforeEach(() => {
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_MODELS_TOKEN;
    vi.restoreAllMocks();
  });

  describe('GET /api/plan', () => {
    it('should return the active learning plan with 5 modules', async () => {
      const request = new Request('http://localhost:3000/api/plan?userId=zsoca-test');
      const response = await getPlanHandler(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.plan).toBeDefined();
      expect(data.plan.modules).toHaveLength(5);
      expect(data.plan.modules[0].status).toBe('available');
    });
  });

  describe('POST /api/plan', () => {
    it('should generate personalized 5-module plan based on assessment data', async () => {
      const request = new Request('http://localhost:3000/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: 'Zsóca',
          estimated_level: 'A2 - Beszéd Felelevenítés',
          strengths: ['Bátor kommunikáció', 'Alap szókincs'],
          focus_areas: ['Perfekt múlt idő', 'Rendelés és fizetés'],
        }),
      });

      const response = await postPlanHandler(request);
      expect(response.status).toBe(200);

      const data: { plan: LearningPlanResponse } = await response.json();
      expect(data.plan).toBeDefined();
      expect(data.plan.title).toBeDefined();
      expect(data.plan.level).toContain('A2');
      expect(data.plan.modules).toHaveLength(5);

      const firstModule = data.plan.modules[0];
      expect(firstModule.order_index).toBe(1);
      expect(firstModule.title).toBeDefined();
      expect(firstModule.description).toBeDefined();
      expect(firstModule.status).toBe('available');
    });

    it('should use the AI provider when a GitHub token is set and parsed correctly', async () => {
      process.env.GITHUB_TOKEN = 'test-github-token';

      const customPlan = {
        title: 'Zsóca Egyéni Német Beszédfejlesztő Tanterve',
        level: 'B1',
        summary: 'Kifejezetten a magabiztos társalgásra és szituációs gyakorlásra tervezve.',
        modules: [
          {
            order_index: 1,
            title: 'Pékség & Kávézó - Rendelés magabiztosan',
            description: 'Kávé, péksütemény rendelése és számlakérés.',
            estimated_duration: '10-15 perc',
            status: 'available',
            situational_goal: 'Magabiztos rendelés.',
          },
          {
            order_index: 2,
            title: 'Útbaigazítás a városban',
            description: 'Közlekedés és tájékozódás.',
            estimated_duration: '10-15 perc',
            status: 'locked',
            situational_goal: 'Útvonal kérése.',
          },
          {
            order_index: 3,
            title: 'Szállodai bejelentkezés & Kérések',
            description: 'Szoba elfoglalása és kérések a recepción.',
            estimated_duration: '15 perc',
            status: 'locked',
            situational_goal: 'Recepció kezelése.',
          },
          {
            order_index: 4,
            title: 'Hétköznapi csevegés & Hobbik',
            description: 'Beszélgetés szabadidőről és tervekről.',
            estimated_duration: '15 perc',
            status: 'locked',
            situational_goal: 'Kötetlen csevegés.',
          },
          {
            order_index: 5,
            title: 'Orvosnál & Gyógyszertárban',
            description: 'Tünetek leírása és gyógyszerkérés.',
            estimated_duration: '15 perc',
            status: 'locked',
            situational_goal: 'Egészségügyi szituációk.',
          },
        ],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { role: 'assistant', content: JSON.stringify(customPlan) },
            },
          ],
        }),
      } as any);

      const request = new Request('http://localhost:3000/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: 'Zsóca',
          estimated_level: 'B1',
        }),
      });

      const response = await postPlanHandler(request);
      const data = await response.json();
      expect(data.plan.level).toBe('B1');
      expect(data.plan.modules).toHaveLength(5);
      expect(data.plan.modules[0].title).toBe('Pékség & Kávézó - Rendelés magabiztosan');
    });
  });
});
