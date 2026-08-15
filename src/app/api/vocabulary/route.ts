import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import {
  VocabularyItem,
  DEFAULT_SEED_VOCABULARY,
  filterVocabulary,
  calculateDifficultyStats,
} from '@/lib/vocabulary';

export type { VocabularyItem, DifficultyStats } from '@/lib/vocabulary';

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
            id: newItem.id?.startsWith('voc-') || newItem.id?.startsWith('seed-') ? undefined : newItem.id,
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
