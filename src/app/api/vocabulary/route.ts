import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export interface VocabularyItem {
  id?: string;
  user_id?: string;
  german_word: string;
  hungarian_translation: string;
  pronunciation_notes?: string;
  difficulty_score: number; // 1: Könnyű, 2: Közepes, 3: Nehéz
  category?: string;
  last_practiced_at?: string;
  created_at?: string;
}

export interface DifficultyStats {
  total: number;
  easy: number; // 1
  medium: number; // 2
  hard: number; // 3
}

export const DEFAULT_SEED_VOCABULARY: VocabularyItem[] = [
  {
    id: 'seed-1',
    german_word: 'Ich hätte gerne...',
    hungarian_translation: 'Szeretnék kérni...',
    pronunciation_notes: 'ih het-te ger-ne',
    difficulty_score: 1,
    category: 'Rendelés & Étkezés',
  },
  {
    id: 'seed-2',
    german_word: 'Was kostet das?',
    hungarian_translation: 'Mennyibe kerül ez?',
    pronunciation_notes: 'vasz kosz-tet dasz',
    difficulty_score: 1,
    category: 'Vásárlás & Pénz',
  },
  {
    id: 'seed-3',
    german_word: 'Entschuldigung, wo ist der Bahnhof?',
    hungarian_translation: 'Elnézést, hol van a pályaudvar?',
    pronunciation_notes: 'ent-sul-di-gung, vo iszt der bán-hóf',
    difficulty_score: 2,
    category: 'Útbaigazítás',
  },
  {
    id: 'seed-4',
    german_word: 'Zusammen oder getrennt?',
    hungarian_translation: 'Együtt vagy külön?',
    pronunciation_notes: 'cu-zam-men o-der ge-trent',
    difficulty_score: 2,
    category: 'Fizetés',
  },
  {
    id: 'seed-5',
    german_word: 'Könnten Sie das bitte wiederholen?',
    hungarian_translation: 'Meg tudná ezt kérem ismételni?',
    pronunciation_notes: 'kön-ten zí dasz bit-te ví-der-hó-len',
    difficulty_score: 3,
    category: 'Társalgás',
  },
  {
    id: 'seed-6',
    german_word: 'Ich habe eine Reservierung',
    hungarian_translation: 'Van egy szobafoglalásom',
    pronunciation_notes: 'ih há-be áj-ne re-zer-ví-rung',
    difficulty_score: 1,
    category: 'Szálloda',
  },
  {
    id: 'seed-7',
    german_word: 'Ich verstehe nur ein bisschen Deutsch',
    hungarian_translation: 'Csak egy kicsit értek németül',
    pronunciation_notes: 'ih fer-sté-e nur ájn bisz-hyen dojcs',
    difficulty_score: 2,
    category: 'Társalgás',
  },
  {
    id: 'seed-8',
    german_word: 'Vielen Dank für Ihre Hilfe!',
    hungarian_translation: 'Nagyon köszönöm a segítségét!',
    pronunciation_notes: 'fí-len dank für í-re hil-fe',
    difficulty_score: 1,
    category: 'Udvariasság',
  },
  {
    id: 'seed-9',
    german_word: 'Biegen Sie an der Kreuzung links ab',
    hungarian_translation: 'Forduljon be a kereszteződésnél balra',
    pronunciation_notes: 'bí-gen zí an der kroj-cung linksz ap',
    difficulty_score: 3,
    category: 'Útbaigazítás',
  },
  {
    id: 'seed-10',
    german_word: 'Ich habe Halsschmerzen und Fieber',
    hungarian_translation: 'Fáj a torkom és lázas vagyok',
    pronunciation_notes: 'ih há-be halsz-smer-cen und fí-ber',
    difficulty_score: 2,
    category: 'Egészség & Orvos',
  },
];

/**
 * Filters a list of vocabulary items by search term and difficulty
 */
export function filterVocabulary(
  items: VocabularyItem[],
  search: string = '',
  difficulty: string = 'all'
): VocabularyItem[] {
  const query = search.trim().toLowerCase();

  return items.filter((item) => {
    const matchesSearch =
      !query ||
      item.german_word.toLowerCase().includes(query) ||
      item.hungarian_translation.toLowerCase().includes(query) ||
      (item.pronunciation_notes && item.pronunciation_notes.toLowerCase().includes(query)) ||
      (item.category && item.category.toLowerCase().includes(query));

    const matchesDifficulty =
      difficulty === 'all' ||
      !difficulty ||
      String(item.difficulty_score) === String(difficulty);

    return matchesSearch && matchesDifficulty;
  });
}

/**
 * Calculates difficulty distribution stats
 */
export function calculateDifficultyStats(items: VocabularyItem[]): DifficultyStats {
  const stats: DifficultyStats = {
    total: items.length,
    easy: 0,
    medium: 0,
    hard: 0,
  };

  items.forEach((item) => {
    if (item.difficulty_score === 1) stats.easy += 1;
    else if (item.difficulty_score === 2) stats.medium += 1;
    else if (item.difficulty_score === 3) stats.hard += 1;
    else stats.easy += 1;
  });

  return stats;
}

/**
 * GET /api/vocabulary
 * Returns vocabulary list from Supabase or default seed vocabulary
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || 'all';

    let allItems: VocabularyItem[] = [...DEFAULT_SEED_VOCABULARY];

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
          .from('user_vocabulary_memory')
          .select('*')
          .order('last_practiced_at', { ascending: false });

        if (!error && data && data.length > 0) {
          allItems = data as VocabularyItem[];
        }
      } catch (dbErr) {
        console.warn('Error reading vocabulary from Supabase, falling back to seed:', dbErr);
      }
    }

    const filtered = filterVocabulary(allItems, search, difficulty);
    const stats = calculateDifficultyStats(allItems);

    return NextResponse.json({
      items: filtered,
      stats,
      totalCount: allItems.length,
    });
  } catch (error) {
    console.error('Vocabulary GET error:', error);
    return NextResponse.json(
      {
        items: DEFAULT_SEED_VOCABULARY,
        stats: calculateDifficultyStats(DEFAULT_SEED_VOCABULARY),
        error: 'Failed to retrieve vocabulary',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vocabulary
 * Adds or updates a vocabulary word in memory
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      german_word,
      hungarian_translation,
      pronunciation_notes = '',
      difficulty_score = 1,
      category = 'Általános',
      user_id,
      id,
    } = body;

    if (!german_word || !german_word.trim() || !hungarian_translation || !hungarian_translation.trim()) {
      return NextResponse.json(
        { error: 'A német kifejezés és a magyar fordítás megadása kötelező!' },
        { status: 400 }
      );
    }

    const newItem: VocabularyItem = {
      id: id || `voc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: user_id || undefined,
      german_word: german_word.trim(),
      hungarian_translation: hungarian_translation.trim(),
      pronunciation_notes: pronunciation_notes.trim(),
      difficulty_score: Number(difficulty_score) || 1,
      category: category.trim(),
      last_practiced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseServerClient();
        const { data, error } = await supabase
          .from('user_vocabulary_memory')
          .upsert({
            id: newItem.id.startsWith('voc-') || newItem.id.startsWith('seed-') ? undefined : newItem.id,
            user_id: newItem.user_id,
            german_word: newItem.german_word,
            hungarian_translation: newItem.hungarian_translation,
            pronunciation_notes: newItem.pronunciation_notes,
            difficulty_score: newItem.difficulty_score,
            last_practiced_at: newItem.last_practiced_at,
          })
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json({ item: data, success: true }, { status: 201 });
        }
      } catch (dbErr) {
        console.warn('Could not save to Supabase, returning in-memory item:', dbErr);
      }
    }

    return NextResponse.json({ item: newItem, success: true }, { status: 201 });
  } catch (error) {
    console.error('Vocabulary POST error:', error);
    return NextResponse.json({ error: 'Failed to save vocabulary item' }, { status: 500 });
  }
}

/**
 * DELETE /api/vocabulary
 * Removes a vocabulary word from memory
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // no body provided
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'A törléshez az ID megadása kötelező!' }, { status: 400 });
    }

    if (isSupabaseConfigured() && !id.startsWith('seed-') && !id.startsWith('voc-')) {
      try {
        const supabase = getSupabaseServerClient();
        await supabase.from('user_vocabulary_memory').delete().eq('id', id);
      } catch (dbErr) {
        console.warn('Failed to delete from Supabase:', dbErr);
      }
    }

    return NextResponse.json({ success: true, deletedId: id }, { status: 200 });
  } catch (error) {
    console.error('Vocabulary DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete vocabulary item' }, { status: 500 });
  }
}
