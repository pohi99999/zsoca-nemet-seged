import { describe, it, expect } from 'vitest';
import { POST as assessmentHandler } from '@/app/api/assessment/route';
import { POST as planHandler, GET as getPlanHandler } from '@/app/api/plan/route';
import { POST as chatHandler } from '@/app/api/chat/route';
import {
  GET as getVocabularyHandler,
  POST as postVocabularyHandler,
} from '@/app/api/vocabulary/route';
import {
  filterVocabulary,
  calculateDifficultyStats,
} from '@/lib/vocabulary';

describe('Zsóca Német Segéd - Full User Journey End-to-End Integration Flow', () => {
  it('should complete the entire cycle from Assessment to Plan, Practice Chat, and Vocabulary Storage', async () => {
    // ----------------------------------------------------
    // STEP 1: Assessment Initial State (Question 1)
    // ----------------------------------------------------
    const startReq = new Request('http://localhost:3000/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: [] }),
    });
    const startRes = await assessmentHandler(startReq);
    expect(startRes.status).toBe(200);
    const startData = await startRes.json();

    expect(startData.done).toBe(false);
    expect(startData.questionIndex).toBe(1);
    expect(startData.message).toBeDefined();
    expect(startData.message.content).toContain('Hallo Zsóca');

    // ----------------------------------------------------
    // STEP 2: Assessment 5 Conversation Turns to Level Result
    // ----------------------------------------------------
    let history: any[] = [
      { role: 'assistant', content: startData.message.content },
      { role: 'user', content: 'Ich heiße Zsóca und möchte Deutsch für den Urlaub lernen.' },
    ];

    // Turn 2 to 4
    for (let q = 2; q <= 4; q++) {
      const qReq = new Request('http://localhost:3000/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history }),
      });
      const qRes = await assessmentHandler(qReq);
      const qData = await qRes.json();
      expect(qData.done).toBe(false);
      expect(qData.questionIndex).toBe(q);

      history.push({ role: 'assistant', content: qData.message.content });
      history.push({ role: 'user', content: `Meine Antwort für Frage ${q} auf Deutsch.` });
    }

    // Final Assessment Turn (Question 5 answer triggers evaluation)
    history.push({ role: 'assistant', content: 'Letzte Frage...' });
    history.push({ role: 'user', content: 'Ja, ich bin absolut motiviert jeden Tag zu üben!' });

    const evalReq = new Request('http://localhost:3000/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history }),
    });
    const evalRes = await assessmentHandler(evalReq);
    const evalData = await evalRes.json();

    expect(evalData.done).toBe(true);
    expect(evalData.estimated_level).toBeDefined();
    expect(evalData.strengths.length).toBeGreaterThan(0);
    expect(evalData.focus_areas.length).toBeGreaterThan(0);

    // ----------------------------------------------------
    // STEP 3: Plan Generation based on Assessment Result
    // ----------------------------------------------------
    const planReq = new Request('http://localhost:3000/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: 'Zsóca',
        estimated_level: evalData.estimated_level,
        strengths: evalData.strengths,
        focus_areas: evalData.focus_areas,
      }),
    });
    const planRes = await planHandler(planReq);
    expect(planRes.status).toBe(200);
    const planData = await planRes.json();

    expect(planData.plan).toBeDefined();
    expect(planData.plan.modules).toHaveLength(5);
    expect(planData.plan.modules[0].status).toBe('available');
    expect(planData.plan.modules[1].status).toBe('locked');

    // ----------------------------------------------------
    // STEP 4: Situational Practice Chat (Module 1 Roleplay)
    // ----------------------------------------------------
    // Initial bakery dialogue greeting
    const chatInitReq = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleId: '1',
        moduleTitle: 'Pékség & Kávézó - Rendelés',
        messages: [],
        userMessage: 'INIT',
        turnCount: 0,
      }),
    });
    const chatInitRes = await chatHandler(chatInitReq);
    expect(chatInitRes.status).toBe(200);
    const chatInitData = await chatInitRes.json();

    expect(chatInitData.german_text).toBeDefined();
    expect(chatInitData.hungarian_translation).toBeDefined();
    expect(chatInitData.vocabulary_suggestions.length).toBeGreaterThan(0);

    // Perform practice turns
    let chatHistory: any[] = [
      { role: 'assistant', content: chatInitData.german_text },
      { role: 'user', content: 'Guten Morgen! Ich möchte zwei Brötchen und einen Kaffee.' },
    ];

    const chatTurn2Req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleId: '1',
        moduleTitle: 'Pékség & Kávézó - Rendelés',
        messages: chatHistory,
        userMessage: 'Guten Morgen! Ich möchte zwei Brötchen und einen Kaffee.',
        turnCount: 1,
      }),
    });
    const chatTurn2Res = await chatHandler(chatTurn2Req);
    const chatTurn2Data = await chatTurn2Res.json();
    expect(chatTurn2Data.turnCount).toBe(2);

    // Final practice turn (turn 4 finishes module)
    const chatFinalReq = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleId: '1',
        moduleTitle: 'Pékség & Kávézó - Rendelés',
        messages: chatHistory,
        userMessage: 'Vielen Dank, auf Wiedersehen!',
        turnCount: 3,
      }),
    });
    const chatFinalRes = await chatHandler(chatFinalReq);
    const chatFinalData = await chatFinalRes.json();
    expect(chatFinalData.is_completed).toBe(true);

    // ----------------------------------------------------
    // STEP 5: Save Vocabulary Word & Retrieve Memory
    // ----------------------------------------------------
    const newVocab = {
      german_word: 'das Brötchen',
      hungarian_translation: 'zsemle',
      pronunciation_notes: 'dasz brőt-hyen',
      difficulty_score: 1,
      category: 'Pékség & Kávézó',
    };

    const saveVocabReq = new Request('http://localhost:3000/api/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVocab),
    });
    const saveVocabRes = await postVocabularyHandler(saveVocabReq);
    expect(saveVocabRes.status).toBe(201);
    const savedVocabData = await saveVocabRes.json();
    expect(savedVocabData.item.german_word).toBe('das Brötchen');

    // Retrieve vocabulary list & check filtering and stats
    const getVocabReq = new Request('http://localhost:3000/api/vocabulary?search=Brötchen');
    const getVocabRes = await getVocabularyHandler(getVocabReq);
    expect(getVocabRes.status).toBe(200);
    const vocabListData = await getVocabRes.json();
    expect(vocabListData.items).toBeDefined();
    expect(vocabListData.stats).toBeDefined();
    expect(vocabListData.stats.total).toBeGreaterThanOrEqual(1);
  });
});
