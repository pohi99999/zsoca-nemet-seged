import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';

  let liveTest: any = { attempted: false };
  if (geminiKey) {
    try {
      const t0 = Date.now();
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hello in German in one short sentence.' }] }] }),
        }
      );
      const bodyText = await res.text();
      liveTest = {
        attempted: true,
        status: res.status,
        elapsedMs: Date.now() - t0,
        bodyPreview: bodyText.slice(0, 1500),
      };
    } catch (err: any) {
      liveTest = { attempted: true, error: String(err?.message || err) };
    }
  }

  return NextResponse.json({
    hasGeminiKey: Boolean(geminiKey),
    keyLength: geminiKey.length,
    keyPrefix: geminiKey.slice(0, 4),
    liveTest,
  });
}
