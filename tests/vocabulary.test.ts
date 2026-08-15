import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GET as getVocabularyHandler,
  POST as postVocabularyHandler,
  DELETE as deleteVocabularyHandler,
} from '../src/app/api/vocabulary/route';
import {
  DEFAULT_SEED_VOCABULARY,
  filterVocabulary,
  calculateDifficultyStats,
  VocabularyItem,
} from '../src/lib/vocabulary';

describe('Vocabulary Memory API & Helper Logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Default Seed Vocabulary', () => {
    it('should provide comprehensive seed vocabulary with all required fields', () => {
      expect(Array.isArray(DEFAULT_SEED_VOCABULARY)).toBe(true);
      expect(DEFAULT_SEED_VOCABULARY.length).toBeGreaterThanOrEqual(6);

      DEFAULT_SEED_VOCABULARY.forEach((item: VocabularyItem) => {
        expect(item.id).toBeDefined();
        expect(item.german_word).toBeTruthy();
        expect(item.hungarian_translation).toBeTruthy();
        expect(item.pronunciation_notes).toBeTruthy();
        expect([1, 2, 3]).toContain(item.difficulty_score);
      });
    });
  });

  describe('Vocabulary Utility Functions', () => {
    const sampleItems: VocabularyItem[] = [
      {
        id: '1',
        german_word: 'der Kaffee',
        hungarian_translation: 'kávé',
        pronunciation_notes: 'kaf-fé',
        difficulty_score: 1,
      },
      {
        id: '2',
        german_word: 'die Rechnung bitte',
        hungarian_translation: 'a számlát kérem',
        pronunciation_notes: 'dí reh-nung bit-te',
        difficulty_score: 2,
      },
      {
        id: '3',
        german_word: 'Könnten Sie das wiederholen?',
        hungarian_translation: 'Meg tudná ismételni?',
        pronunciation_notes: 'kön-ten zí dasz ví-der-hó-len',
        difficulty_score: 3,
      },
    ];

    it('should filter vocabulary by search query correctly in both German and Hungarian', () => {
      const germanSearch = filterVocabulary(sampleItems, 'Kaffee', 'all');
      expect(germanSearch).toHaveLength(1);
      expect(germanSearch[0].german_word).toBe('der Kaffee');

      const hungarianSearch = filterVocabulary(sampleItems, 'számlát', 'all');
      expect(hungarianSearch).toHaveLength(1);
      expect(hungarianSearch[0].german_word).toBe('die Rechnung bitte');

      const noMatch = filterVocabulary(sampleItems, 'nemletezo', 'all');
      expect(noMatch).toHaveLength(0);
    });

    it('should filter vocabulary by difficulty score', () => {
      const easyWords = filterVocabulary(sampleItems, '', '1');
      expect(easyWords).toHaveLength(1);
      expect(easyWords[0].difficulty_score).toBe(1);

      const hardWords = filterVocabulary(sampleItems, '', '3');
      expect(hardWords).toHaveLength(1);
      expect(hardWords[0].difficulty_score).toBe(3);
    });

    it('should calculate difficulty distribution stats accurately', () => {
      const stats = calculateDifficultyStats(sampleItems);
      expect(stats.total).toBe(3);
      expect(stats.easy).toBe(1);
      expect(stats.medium).toBe(1);
      expect(stats.hard).toBe(1);
    });
  });

  describe('GET /api/vocabulary', () => {
    it('should return 200 and list of vocabulary items', async () => {
      const request = new Request('http://localhost:3000/api/vocabulary');
      const response = await getVocabularyHandler(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.length).toBeGreaterThanOrEqual(6);
      expect(data.stats).toBeDefined();
      expect(data.stats.total).toBe(data.items.length);
    });

    it('should filter returned vocabulary by query parameters', async () => {
      const request = new Request('http://localhost:3000/api/vocabulary?search=bitte&difficulty=all');
      const response = await getVocabularyHandler(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.items)).toBe(true);
      data.items.forEach((item: VocabularyItem) => {
        const text = `${item.german_word} ${item.hungarian_translation}`.toLowerCase();
        expect(text).toContain('bitte');
      });
    });
  });

  describe('POST /api/vocabulary', () => {
    it('should add a new vocabulary item successfully', async () => {
      const newItem = {
        german_word: 'Guten Abend',
        hungarian_translation: 'Jó estét',
        pronunciation_notes: 'gú-ten á-bent',
        difficulty_score: 1,
      };

      const request = new Request('http://localhost:3000/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      const response = await postVocabularyHandler(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.item).toBeDefined();
      expect(data.item.german_word).toBe('Guten Abend');
      expect(data.item.hungarian_translation).toBe('Jó estét');
      expect(data.item.difficulty_score).toBe(1);
    });

    it('should return 400 Bad Request when required fields are missing', async () => {
      const invalidItem = {
        german_word: '',
        hungarian_translation: '',
      };

      const request = new Request('http://localhost:3000/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidItem),
      });

      const response = await postVocabularyHandler(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('DELETE /api/vocabulary', () => {
    it('should delete a vocabulary item by id', async () => {
      const request = new Request('http://localhost:3000/api/vocabulary?id=seed-1', {
        method: 'DELETE',
      });

      const response = await deleteVocabularyHandler(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.deletedId).toBe('seed-1');
    });

    it('should return 400 if id is missing in DELETE request', async () => {
      const request = new Request('http://localhost:3000/api/vocabulary', {
        method: 'DELETE',
      });

      const response = await deleteVocabularyHandler(request);
      expect(response.status).toBe(400);
    });
  });
});
