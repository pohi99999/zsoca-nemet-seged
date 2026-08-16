import { NextResponse } from 'next/server';
import {
  generateGeminiJson,
  createPlanPrompt,
  getMockLearningPlan,
  LearningPlanResponse,
  MOCK_LEARNING_PLAN_MODULES,
} from '@/lib/ai/gemini';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // 1. Try to fetch active plan from Supabase
    if (userId && isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseServerClient();
        const { data: plans } = await supabase
          .from('learning_plans')
          .select('id, title, status, created_at')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (plans && plans.length > 0) {
          const planRecord = plans[0];
          const { data: dbModules } = await supabase
            .from('modules')
            .select('id, order_index, title, description, status')
            .eq('plan_id', planRecord.id)
            .order('order_index', { ascending: true });

          if (dbModules && dbModules.length > 0) {
            const planResponse: LearningPlanResponse = {
              id: planRecord.id,
              title: planRecord.title,
              level: 'A2 - Beszéd Felelevenítés',
              modules: dbModules.map((m: any) => ({
                id: m.id,
                order_index: m.order_index,
                title: m.title,
                description: m.description,
                estimated_duration: '10-15 perc',
                status: m.status || (m.order_index === 1 ? 'available' : 'locked'),
              })),
            };
            return NextResponse.json({ plan: planResponse });
          }
        }
      } catch (dbErr) {
        console.warn('Could not fetch learning plan from Supabase:', dbErr);
      }
    }

    // Default mock fallback plan
    const fallbackPlan = getMockLearningPlan('A2');
    return NextResponse.json({ plan: fallbackPlan });
  } catch (error) {
    console.error('Error in GET /api/plan:', error);
    return NextResponse.json({ plan: getMockLearningPlan('A2') }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      userId,
      userName = 'Zsóca',
      estimated_level = 'A2 - Beszéd Felelevenítés',
      strengths = [],
      focus_areas = [],
    } = body;

    const fallbackPlan = getMockLearningPlan(estimated_level);
    let finalPlan: LearningPlanResponse = fallbackPlan;

    // Check Gemini API Key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (apiKey) {
      const prompt = createPlanPrompt({
        userName,
        estimated_level,
        strengths,
        focus_areas,
      });

      const generatedPlan = await generateGeminiJson<LearningPlanResponse>(
        prompt,
        'Te egy tapasztalt német anyanyelvi mentor és tantervkészítő vagy.',
        fallbackPlan
      );

      if (
        generatedPlan &&
        Array.isArray(generatedPlan.modules) &&
        generatedPlan.modules.length > 0
      ) {
        // Ensure 5 modules with sequential order_index and initial status
        const sanitizedModules = generatedPlan.modules.slice(0, 5).map((mod, idx) => ({
          order_index: idx + 1,
          title: mod.title || fallbackPlan.modules[idx]?.title || `Modul ${idx + 1}`,
          description:
            mod.description ||
            fallbackPlan.modules[idx]?.description ||
            'Gyakorlati szituációs beszédfejlesztés.',
          estimated_duration: mod.estimated_duration || '10-15 perc',
          status: (idx === 0 ? 'available' : mod.status || 'locked') as 'available' | 'locked' | 'completed',
          situational_goal:
            mod.situational_goal || fallbackPlan.modules[idx]?.situational_goal,
          key_phrases: mod.key_phrases || fallbackPlan.modules[idx]?.key_phrases,
        }));

        finalPlan = {
          title: generatedPlan.title || `${userName} Személyre Szabott Tanulási Terve`,
          level: generatedPlan.level || estimated_level,
          summary: generatedPlan.summary || fallbackPlan.summary,
          modules: sanitizedModules,
        };
      }
    }

    // Persist to Supabase if userId is provided and configured
    try {
      if (userId && isSupabaseConfigured()) {
        const supabase = getSupabaseServerClient();
        // Deactivate older active plans
        await supabase
          .from('learning_plans')
          .update({ status: 'archived' })
          .eq('user_id', userId)
          .eq('status', 'active');

        // Create new learning plan record
        const { data: newPlan } = await supabase
          .from('learning_plans')
          .insert({
            user_id: userId,
            title: finalPlan.title,
            status: 'active',
          })
          .select()
          .single();

        if (newPlan && newPlan.id) {
          finalPlan.id = newPlan.id;

          // Insert modules
          const moduleRows = finalPlan.modules.map((m) => ({
            plan_id: newPlan.id,
            order_index: m.order_index,
            title: m.title,
            description: m.description,
            status: m.status,
          }));

          await supabase.from('modules').insert(moduleRows);
        }
      }
    } catch (dbErr) {
      console.warn('Could not persist learning plan to Supabase:', dbErr);
    }

    return NextResponse.json({
      success: true,
      plan: finalPlan,
    });
  } catch (error) {
    console.error('Error in POST /api/plan:', error);
    const fallback = getMockLearningPlan('A2');
    return NextResponse.json(
      {
        success: true,
        plan: fallback,
      },
      { status: 200 }
    );
  }
}
