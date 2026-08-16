import { NextResponse } from 'next/server';
import { generateGeminiText, createAssessmentPrompt } from '@/lib/ai/gemini';

export const dynamic = 'force-dynamic';

export async function GET() {
  const prompt = createAssessmentPrompt(2, [
    { role: 'assistant', content: 'Hallo Zsóca! Wie geht es dir?' },
    { role: 'user', content: 'Mir geht es gut, danke.' },
  ]);
  const rawText = await generateGeminiText(
    prompt,
    'Válaszolj kizárólag érvényes JSON formátumban.'
  );
  return NextResponse.json({ rawText });
}
