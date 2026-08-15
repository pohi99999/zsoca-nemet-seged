import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSituationalChatPrompt,
  getMockSituationalResponse,
  SituationalChatResponse,
} from '../src/lib/ai/gemini';
import { POST as postChatHandler } from '../src/app/api/chat/route';

describe('Situational Practice Chat AI & Helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('should generate a valid prompt for situational roleplay', () => {
    const prompt = createSituationalChatPrompt({
      moduleId: '1',
      moduleTitle: 'Pékség & Kávézó - Rendelés magabiztosan',
      history: [
        { role: 'assistant', content: 'Guten Tag! Was darf es sein?' },
        { role: 'user', content: 'Ich möchte bitte einen Kaffee und ein Croissant.' },
      ],
      userMessage: 'Was kostet das?',
      turnCount: 2,
      userName: 'Zsóca',
    });

    expect(prompt).toContain('Pékség & Kávézó');
    expect(prompt).toContain('Zsóca');
    expect(prompt).toContain('Was darf es sein?');
    expect(prompt).toContain('Was kostet das?');
    expect(prompt).toContain('german_text');
    expect(prompt).toContain('vocabulary_suggestions');
    expect(prompt).toContain('grammar_tip');
    expect(prompt).toContain('is_completed');
  });

  it('should return valid mock situational response', () => {
    const response = getMockSituationalResponse('1', 1, 'Guten Tag');
    expect(response).toBeDefined();
    expect(response.german_text).toBeDefined();
    expect(response.hungarian_translation).toBeDefined();
    expect(response.audio_text).toBeDefined();
    expect(Array.isArray(response.vocabulary_suggestions)).toBe(true);
    expect(response.vocabulary_suggestions.length).toBeGreaterThan(0);
    expect(response.is_completed).toBe(false);
  });

  it('should mark dialogue as completed when turnCount is 4 or higher', () => {
    const response = getMockSituationalResponse('1', 4, 'Vielen Dank, auf Wiedersehen!');
    expect(response.is_completed).toBe(true);
  });
});

describe('Practice Chat Route Handler (/api/chat)', () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;
    vi.restoreAllMocks();
  });

  it('should return initial situational greeting on start', async () => {
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleId: '1',
        moduleTitle: 'Pékség & Kávézó',
        messages: [],
        userMessage: 'INIT',
        turnCount: 0,
      }),
    });

    const res = await postChatHandler(request);
    expect(res.status).toBe(200);

    const data: SituationalChatResponse & { turnCount: number } = await res.json();
    expect(data.german_text).toBeDefined();
    expect(data.hungarian_translation).toBeDefined();
    expect(data.turnCount).toBe(1);
    expect(Array.isArray(data.vocabulary_suggestions)).toBe(true);
  });

  it('should process user turn and respond in character with vocabulary hints', async () => {
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleId: '1',
        moduleTitle: 'Pékség & Kávézó',
        messages: [
          { role: 'assistant', content: 'Guten Tag! Was kann ich für Sie tun?' },
          { role: 'user', content: 'Ich hätte gerne ein Brötchen.' },
        ],
        userMessage: 'Haben Sie auch Kaffee?',
        turnCount: 1,
      }),
    });

    const res = await postChatHandler(request);
    expect(res.status).toBe(200);

    const data: SituationalChatResponse & { turnCount: number } = await res.json();
    expect(data.german_text).toBeDefined();
    expect(data.hungarian_translation).toBeDefined();
    expect(data.turnCount).toBe(2);
  });

  it('should complete situational session after 4 turns', async () => {
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleId: '1',
        moduleTitle: 'Pékség & Kávézó',
        messages: [
          { role: 'assistant', content: 'Guten Tag!' },
          { role: 'user', content: 'Kaffee bitte.' },
          { role: 'assistant', content: 'Sehr gerne, mit Milch?' },
          { role: 'user', content: 'Ja bitte.' },
          { role: 'assistant', content: 'Das macht 3 Euro 50.' },
          { role: 'user', content: 'Hier bitte.' },
        ],
        userMessage: 'Danke schön, auf Wiedersehen!',
        turnCount: 4,
      }),
    });

    const res = await postChatHandler(request);
    expect(res.status).toBe(200);

    const data: SituationalChatResponse = await res.json();
    expect(data.is_completed).toBe(true);
  });

  it('should call Gemini API when API key is provided', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';

    const aiResponse: SituationalChatResponse = {
      german_text: 'Sehr gerne! Das macht dann zusammen 4 Euro 20 bitte.',
      audio_text: 'Sehr gerne! Das macht dann zusammen 4 Euro 20 bitte.',
      hungarian_translation: 'Nagyon szívesen! Ez összesen 4 euró 20 cent lesz kérlek.',
      vocabulary_suggestions: [
        {
          german: 'zusammen',
          hungarian: 'együtt / összesen',
          pronunciation_hint: 'cu-zam-men',
        },
      ],
      grammar_tip: 'A "zusammen" kifejezést a fizetéskor használják, ha egyben fizetsz.',
      is_completed: false,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(aiResponse) }],
            },
          },
        ],
      }),
    } as any);

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleId: '1',
        moduleTitle: 'Pékség & Kávézó',
        messages: [],
        userMessage: 'Ich möchte zahlen, bitte.',
        turnCount: 2,
      }),
    });

    const res = await postChatHandler(request);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.german_text).toContain('4 Euro 20');
    expect(data.vocabulary_suggestions[0].german).toBe('zusammen');
  });
});
