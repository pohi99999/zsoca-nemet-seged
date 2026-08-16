import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateGeminiText,
  generateGeminiJson,
  createAssessmentPrompt,
  createEvaluationPrompt,
  parseAssessmentResponse,
  AssessmentResult,
  AssessmentDialogueResponse,
} from '../src/lib/ai/gemini';
import { POST as assessmentHandler } from '../src/app/api/assessment/route';

describe('Gemini AI Service & Prompt Helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('generateGeminiText (fallback & mock mode)', () => {
    it('should return mock text when GEMINI_API_KEY is not set', async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_AI_API_KEY;

      const result = await generateGeminiText('Hallo, wie geht es dir?');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should call fetch when GEMINI_API_KEY is configured', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Guten Tag! Mir geht es sehr gut.' }],
            },
          },
        ],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await generateGeminiText('Wie geht es dir?');
      expect(result).toBe('Guten Tag! Mir geht es sehr gut.');
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    it('should gracefully fallback to mock when fetch fails', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await generateGeminiText('Hallo');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('generateGeminiJson', () => {
    it('should parse JSON response from Gemini API', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      const mockJsonPayload = {
        done: false,
        message: {
          content: 'Was frühstücken Sie gerne?',
          translation_hu: 'Mit szoktál reggelizni?',
          audio_text: 'Was frühstücken Sie gerne?',
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockJsonPayload) }],
              },
            },
          ],
        }),
      } as any);

      const result = await generateGeminiJson<AssessmentDialogueResponse>(
        'Generate question',
        undefined,
        mockJsonPayload
      );

      expect(result.done).toBe(false);
      expect(result.message.content).toBe('Was frühstücken Sie gerne?');
    });

    it('should return fallback data when API key is missing or parsing fails', async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_AI_API_KEY;

      const fallback: AssessmentResult = {
        summary: 'Kezdő szintű német tudás, jó beszédkészség.',
        estimated_level: 'A2 (Felelevenítés)',
        strengths: ['Alapvető kifejezések', 'Bátran megszólal'],
        focus_areas: ['Múlt idő (Perfekt)', 'Névelők'],
      };

      const result = await generateGeminiJson<AssessmentResult>(
        'Evaluate level',
        undefined,
        fallback
      );

      expect(result.estimated_level).toBe('A2 (Felelevenítés)');
      expect(result.strengths.length).toBe(2);
    });
  });

  describe('createAssessmentPrompt & createEvaluationPrompt', () => {
    it('should generate valid prompt structures for assessment questions', () => {
      const prompt = createAssessmentPrompt(1, [
        { role: 'assistant', content: 'Hallo! Wie heißt du?' },
        { role: 'user', content: 'Ich heiße Zsóca.' },
      ]);

      expect(prompt).toContain('Zsóca');
      expect(prompt).toContain('Hallo! Wie heißt du?');
      expect(prompt).toContain('JSON');
    });

    it('should generate valid evaluation prompt for final assessment results', () => {
      const history = [
        { role: 'assistant', content: 'Q1' },
        { role: 'user', content: 'A1' },
        { role: 'assistant', content: 'Q2' },
        { role: 'user', content: 'A2' },
        { role: 'assistant', content: 'Q3' },
        { role: 'user', content: 'A3' },
        { role: 'assistant', content: 'Q4' },
        { role: 'user', content: 'A4' },
        { role: 'assistant', content: 'Q5' },
        { role: 'user', content: 'A5' },
      ];

      const prompt = createEvaluationPrompt(history);
      expect(prompt).toContain('estimated_level');
      expect(prompt).toContain('strengths');
      expect(prompt).toContain('focus_areas');
    });
  });

  describe('parseAssessmentResponse', () => {
    it('should strip markdown json blocks and parse clean object', () => {
      const raw = '```json\n{"summary":"Nagyszerű haladás!","estimated_level":"A2","strengths":["Beszéd"],"focus_areas":["Nyelvtan"]}\n```';
      const parsed = parseAssessmentResponse(raw);
      expect(parsed).not.toBeNull();
      expect(parsed?.estimated_level).toBe('A2');
      expect(parsed?.summary).toBe('Nagyszerű haladás!');
    });
  });
});

describe('Assessment API Route Handler (/api/assessment)', () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;
    vi.restoreAllMocks();
  });

  it('should return initial greeting question when history is empty', async () => {
    const request = new Request('http://localhost:3000/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: [] }),
    });

    const response = await assessmentHandler(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.done).toBe(false);
    expect(data.questionIndex).toBe(1);
    expect(data.totalQuestions).toBe(5);
    expect(data.message.content).toBeDefined();
    expect(data.message.translation_hu).toBeDefined();
    expect(data.message.audio_text).toBeDefined();
  });

  it('should return next conversational question when history has 1-4 user turns', async () => {
    const request = new Request('http://localhost:3000/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history: [
          { role: 'assistant', content: 'Hallo! Wie heißt du?' },
          { role: 'user', content: 'Ich heiße Zsóca und ich komme aus Ungarn.' },
        ],
      }),
    });

    const response = await assessmentHandler(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.done).toBe(false);
    expect(data.questionIndex).toBe(2);
    expect(data.message.content).toBeDefined();
    expect(data.message.translation_hu).toBeDefined();
  });

  it('should return final assessment result when history has 5 user turns', async () => {
    const request = new Request('http://localhost:3000/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history: [
          { role: 'assistant', content: 'Q1' },
          { role: 'user', content: 'A1' },
          { role: 'assistant', content: 'Q2' },
          { role: 'user', content: 'A2' },
          { role: 'assistant', content: 'Q3' },
          { role: 'user', content: 'A3' },
          { role: 'assistant', content: 'Q4' },
          { role: 'user', content: 'A4' },
          { role: 'assistant', content: 'Q5' },
          { role: 'user', content: 'A5' },
        ],
      }),
    });

    const response = await assessmentHandler(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.done).toBe(true);
    expect(data.summary).toBeDefined();
    expect(data.estimated_level).toBeDefined();
    expect(Array.isArray(data.strengths)).toBe(true);
    expect(Array.isArray(data.focus_areas)).toBe(true);
  });
});
