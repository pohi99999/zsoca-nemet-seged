import { NextResponse } from 'next/server';

export async function GET() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
  return NextResponse.json({
    hasGeminiKey: Boolean(geminiKey),
    keyLength: geminiKey.length,
    keyPrefix: geminiKey.slice(0, 4),
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasSupabaseServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
}
