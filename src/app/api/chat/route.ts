import { NextResponse } from 'next/server';
import {
  generateGeminiJson,
  createSituationalChatPrompt,
  getMockSituationalResponse,
  SituationalChatResponse,
} from '@/lib/ai/gemini';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      moduleId = '1',
      moduleTitle = 'Gyakorlati Szituáció',
      messages = [],
      history = [],
      userMessage = '',
      turnCount = 0,
      userId = 'zsoca-user',
      userName = 'Zsóca',
    } = body;

    const chatHistory = (messages.length > 0 ? messages : history).map((m: any) => ({
      role: m.role as 'assistant' | 'user',
      content: m.german_text || m.content || '',
    }));

    const nextTurnCount = (typeof turnCount === 'number' ? turnCount : 0) + 1;
    const isInitial = userMessage === 'INIT' || chatHistory.length === 0;

    const fallbackResponse = getMockSituationalResponse(
      moduleId,
      isInitial ? 1 : nextTurnCount,
      userMessage
    );

    const prompt = createSituationalChatPrompt({
      moduleId,
      moduleTitle,
      history: chatHistory,
      userMessage: isInitial ? 'Hallo!' : userMessage,
      turnCount: nextTurnCount,
      userName,
    });

    const systemInstruction = `Te egy barátságos, bátorító német beszélgetőpartner vagy. A szituáció: ${moduleTitle}. Beszélj németül egyszerű és életszerű mondatokkal.`;

    const aiResult = await generateGeminiJson<SituationalChatResponse>(
      prompt,
      systemInstruction,
      fallbackResponse
    );

    const isCompleted = nextTurnCount >= 4 || Boolean(aiResult.is_completed);

    const finalResponse: SituationalChatResponse & { turnCount: number } = {
      german_text: aiResult.german_text || fallbackResponse.german_text,
      audio_text: aiResult.audio_text || aiResult.german_text || fallbackResponse.audio_text,
      hungarian_translation:
        aiResult.hungarian_translation || fallbackResponse.hungarian_translation,
      vocabulary_suggestions:
        aiResult.vocabulary_suggestions && aiResult.vocabulary_suggestions.length > 0
          ? aiResult.vocabulary_suggestions
          : fallbackResponse.vocabulary_suggestions,
      grammar_tip: aiResult.grammar_tip || fallbackResponse.grammar_tip || '',
      is_completed: isCompleted,
      turnCount: nextTurnCount,
    };

    // If Supabase is configured, persist vocabulary suggestions into user_vocabulary_memory
    if (isSupabaseConfigured() && finalResponse.vocabulary_suggestions?.length > 0) {
      try {
        const supabase = getSupabaseServerClient();
        const records = finalResponse.vocabulary_suggestions.map((v) => ({
          user_id: userId,
          german_word: v.german,
          hungarian_translation: v.hungarian,
          pronunciation_notes: v.pronunciation_hint || '',
          difficulty_score: 1,
          last_practiced_at: new Date().toISOString(),
        }));

        await supabase.from('user_vocabulary_memory').upsert(records, {
          onConflict: 'user_id,german_word',
          ignoreDuplicates: false,
        });
      } catch (dbErr) {
        console.warn('Could not persist vocabulary to Supabase:', dbErr);
      }
    }

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error('Error in situational chat route:', error);
    const mock = getMockSituationalResponse('1', 1);
    return NextResponse.json(
      {
        ...mock,
        turnCount: 1,
      },
      { status: 200 }
    );
  }
}
