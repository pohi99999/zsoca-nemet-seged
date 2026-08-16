import { NextResponse } from 'next/server';
import {
  generateGeminiJson,
  createAssessmentPrompt,
  createEvaluationPrompt,
  getMockAssessmentQuestion,
  getMockAssessmentResult,
  AssessmentDialogueResponse,
  AssessmentResult,
} from '@/lib/ai/gemini';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

const TOTAL_ASSESSMENT_QUESTIONS = 5;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { history = [], userId, userName = 'Zsóca' } = body;

    // Filter user responses to count completed answers
    const userResponses = history.filter((msg: any) => msg.role === 'user');
    const userTurnCount = userResponses.length;

    // 1. Initial Start (Question 1)
    if (userTurnCount === 0) {
      const q1 = getMockAssessmentQuestion(1);
      return NextResponse.json({
        done: false,
        questionIndex: 1,
        totalQuestions: TOTAL_ASSESSMENT_QUESTIONS,
        message: {
          role: 'assistant',
          content: q1.content,
          translation_hu: q1.translation_hu,
          audio_text: q1.audio_text,
        },
      });
    }

    // 2. Intermediate Questions (Questions 2 to 5)
    if (userTurnCount < TOTAL_ASSESSMENT_QUESTIONS) {
      const nextQuestionIndex = userTurnCount + 1;
      const fallbackQuestion = getMockAssessmentQuestion(nextQuestionIndex);

      let questionPayload: any = fallbackQuestion;

      const apiKey = process.env.GITHUB_TOKEN || process.env.GITHUB_MODELS_TOKEN;
      if (apiKey) {
        const prompt = createAssessmentPrompt(nextQuestionIndex, history);
        const generated = await generateGeminiJson<{
          content: string;
          translation_hu: string;
          audio_text: string;
        }>(prompt, undefined, fallbackQuestion);

        if (generated && generated.content) {
          questionPayload = {
            content: generated.content,
            translation_hu: generated.translation_hu || fallbackQuestion.translation_hu,
            audio_text: generated.audio_text || generated.content,
          };
        }
      }

      return NextResponse.json({
        done: false,
        questionIndex: nextQuestionIndex,
        totalQuestions: TOTAL_ASSESSMENT_QUESTIONS,
        message: {
          role: 'assistant',
          content: questionPayload.content,
          translation_hu: questionPayload.translation_hu,
          audio_text: questionPayload.audio_text,
        },
      });
    }

    // 3. Final Evaluation (Assessment Finished)
    const fallbackResult = getMockAssessmentResult();
    let finalEvaluation: AssessmentResult = fallbackResult;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (apiKey) {
      const evaluationPrompt = createEvaluationPrompt(history);
      const generatedResult = await generateGeminiJson<AssessmentResult>(
        evaluationPrompt,
        undefined,
        fallbackResult
      );

      if (generatedResult && generatedResult.estimated_level) {
        finalEvaluation = generatedResult;
      }
    }

    // Persist into Supabase if possible and configured (gracefully fail-safe)
    try {
      if (userId && isSupabaseConfigured()) {
        const supabase = getSupabaseServerClient();
        // Update user profile level
        await supabase
          .from('profiles')
          .update({ current_level: finalEvaluation.estimated_level })
          .eq('id', userId);

        // Save assessment result
        await supabase.from('assessment_results').insert({
          user_id: userId,
          summary: finalEvaluation.summary,
          strengths: finalEvaluation.strengths,
          focus_areas: finalEvaluation.focus_areas,
        });
      }
    } catch (dbErr) {
      console.warn('Could not persist assessment result to Supabase:', dbErr);
    }

    return NextResponse.json({
      done: true,
      summary: finalEvaluation.summary,
      estimated_level: finalEvaluation.estimated_level,
      strengths: finalEvaluation.strengths,
      focus_areas: finalEvaluation.focus_areas,
      recommended_modules: finalEvaluation.recommended_modules || fallbackResult.recommended_modules,
    });
  } catch (error: any) {
    console.error('Error in assessment API route:', error);
    const fallback = getMockAssessmentQuestion(1);
    return NextResponse.json(
      {
        done: false,
        questionIndex: 1,
        totalQuestions: TOTAL_ASSESSMENT_QUESTIONS,
        message: {
          role: 'assistant',
          content: fallback.content,
          translation_hu: fallback.translation_hu,
          audio_text: fallback.audio_text,
        },
      },
      { status: 200 }
    );
  }
}
