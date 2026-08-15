export interface AssessmentMessage {
  role: 'assistant' | 'user';
  content: string;
  translation_hu?: string;
  audio_text?: string;
}

export interface AssessmentDialogueResponse {
  done: boolean;
  questionIndex: number;
  totalQuestions: number;
  message: {
    role: 'assistant';
    content: string;
    translation_hu: string;
    audio_text: string;
  };
}

export interface AssessmentResult {
  summary: string;
  estimated_level: string;
  strengths: string[];
  focus_areas: string[];
  recommended_modules?: string[];
}

export interface AssessmentApiResponse {
  done: boolean;
  questionIndex?: number;
  totalQuestions?: number;
  message?: {
    role: 'assistant';
    content: string;
    translation_hu: string;
    audio_text: string;
  };
  summary?: string;
  estimated_level?: string;
  strengths?: string[];
  focus_areas?: string[];
  recommended_modules?: string[];
}

const MOCK_QUESTIONS = [
  {
    content: 'Hallo Zsóca! Schön dich kennenzulernen. Wie geht es dir heute und woher kommst du?',
    translation_hu: 'Szia Zsóca! Örülök, hogy megismerhetlek. Hogy vagy ma és honnan jössz?',
    audio_text: 'Hallo Zsóca! Schön dich kennenzulernen. Wie geht es dir heute und woher kommst du?',
  },
  {
    content: 'Sehr schön! Stell dir vor, du bist in einer gemütlichen Bäckerei in Wien. Was möchtest du bestellen?',
    translation_hu: 'Nagyon jó! Képzeld el, hogy egy hangulatos bécsi pékségben vagy. Mit szeretnél rendelni?',
    audio_text: 'Sehr schön! Stell dir vor, du bist in einer gemütlichen Bäckerei in Wien. Was möchtest du bestellen?',
  },
  {
    content: 'Lecker! Was machst du normalerweise am Wochenende oder in deiner Freizeit?',
    translation_hu: 'Finom! Mit szoktál általában csinálni hétvégén vagy a szabadidődben?',
    audio_text: 'Lecker! Was machst du normalerweise am Wochenende oder in deiner Freizeit?',
  },
  {
    content: 'Toll! Wenn du in Berlin nach dem Weg zum Bahnhof fragen musst, wie würdest du fragen?',
    translation_hu: 'Szuper! Ha Berlinben meg kell kérdezned az utat a pályaudvarhoz, hogyan kérdeznéd?',
    audio_text: 'Toll! Wenn du in Berlin nach dem Weg zum Bahnhof fragen musst, wie würdest du fragen?',
  },
  {
    content: 'Super! Wohin reist du am liebsten im Urlaub und warum?',
    translation_hu: 'Remek! Hová utazol legszívesebben nyaralni és miért?',
    audio_text: 'Super! Wohin reist du am liebsten im Urlaub und warum?',
  },
];

const MOCK_FINAL_RESULT: AssessmentResult = {
  summary: 'Zsóca szilárd alapokkal és bátor kommunikációval rendelkezik. A mindennapi szituációkban (bemutatkozás, rendelés, útbaigazítás) magabiztosan megérteti magát, szókincse felelevenítésre és a múlt idejű szerkezetek (Perfekt) megerősítésére vár.',
  estimated_level: 'A2 (Újrakezdő / Felelevenítő)',
  strengths: [
    'Bátor megszólalás és határozott kommunikációs készség',
    'Alapvető udvariassági fordulatok és szituációs szókincs ismerete',
    'Gyors reagálás a mindennapi élethelyzetekben',
  ],
  focus_areas: [
    'Múlt idejű mondatalkotás (Perfekt és segédigék)',
    'Német névelők (der/die/das) és esetek gyakorlása',
    'Szókincsbővítés éttermi és utazási témakörökben',
  ],
  recommended_modules: [
    'Pékségben és Kávézóban (Rendelés & Fizetés)',
    'Útbaigazítás és Városi Közlekedés',
    'Mindennapok és Szabadidő',
    'Utazás és Szállásfoglalás',
  ],
};

/**
 * Strips markdown code fences from JSON strings
 */
export function parseAssessmentResponse<T = AssessmentResult>(rawText: string): T | null {
  try {
    let clean = rawText.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(clean) as T;
  } catch {
    return null;
  }
}

/**
 * Creates prompt for the next assessment question
 */
export function createAssessmentPrompt(
  nextQuestionIndex: number,
  history: Array<{ role: 'assistant' | 'user'; content: string }>
): string {
  const historyText = history
    .map((m) => `${m.role === 'assistant' ? 'AI' : 'Zsóca'}: ${m.content}`)
    .join('\n');

  return `
Te egy barátságos, bátorító német nyelvtanár vagy. A diákod Zsóca, akinek felméred a beszédkészségét.
Ez a(z) ${nextQuestionIndex}. kérdés az 5 kérdésből álló szintfelmérőben.

Korábbi beszélgetés:
${historyText}

Feladat:
1. Reagálj röviden és kedvesen Zsóca legutóbbi válaszára németül (1 rövid mondat).
2. Tegyél fel egy új, életszerű szituációs kérdést németül (pl. bemutatkozás, rendelés, hobbi, útbaigazítás, utazás).
3. Add meg a magyar fordítást is, hogy segíts neki, ha elakadna.

KIZÁRÓLAG érvényes JSON formátumban válaszolj, Markdown formázás nélkül:
{
  "content": "rövid német reakció és az új német kérdés",
  "translation_hu": "a fenti német mondatok magyar fordítása",
  "audio_text": "a pontos német szöveg, amit a szövegfelolvasó kimondjon"
}
`.trim();
}

/**
 * Creates prompt for the final evaluation
 */
export function createEvaluationPrompt(
  history: Array<{ role: 'assistant' | 'user'; content: string }>
): string {
  const historyText = history
    .map((m) => `${m.role === 'assistant' ? 'AI' : 'Zsóca'}: ${m.content}`)
    .join('\n');

  return `
Te egy tapasztalt német nyelvtanár vagy. Zsóca befejezte az 5 kérdéses szituációs szintfelmérőt.
Elemezd a válaszait és készíts egy átfogó, bátorító értékelést magyar nyelven.

A felmérő párbeszédének története:
${historyText}

KIZÁRÓLAG érvényes JSON formátumban válaszolj, Markdown kódblokkok nélkül:
{
  "summary": "1-2 mondatos bátorító összefoglaló Zsóca német tudásáról",
  "estimated_level": "pl. A1-A2, A2 (Felelevenítő) vagy B1",
  "strengths": ["erősség 1", "erősség 2", "erősség 3"],
  "focus_areas": ["fejlesztendő terület 1", "fejlesztendő terület 2", "fejlesztendő terület 3"],
  "recommended_modules": ["Modul 1 címe", "Modul 2 címe", "Modul 3 címe", "Modul 4 címe"]
}
`.trim();
}

/**
 * Calls Google Gemini REST API or falls back safely
 */
export async function generateGeminiText(
  prompt: string,
  systemInstruction?: string,
  options?: { temperature?: number; maxOutputTokens?: number }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    // Return sensible mock response
    if (prompt.includes('szintfelmérő') || prompt.includes('kérdés')) {
      return MOCK_QUESTIONS[0].content;
    }
    return 'Guten Tag! Ich bin dein Deutsch-Assistent. Wie kann ich dir heute helfen?';
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload: any = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens ?? 800,
      },
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`Gemini API returned status ${res.status}. Using mock fallback.`);
      return MOCK_QUESTIONS[0].content;
    }

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText || MOCK_QUESTIONS[0].content;
  } catch (err) {
    console.warn('Gemini API call failed. Using mock fallback.', err);
    return MOCK_QUESTIONS[0].content;
  }
}

/**
 * Calls Google Gemini and parses response as JSON
 */
export async function generateGeminiJson<T>(
  prompt: string,
  systemInstruction?: string,
  fallbackData?: T
): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    return (fallbackData || (MOCK_FINAL_RESULT as unknown as T)) as T;
  }

  try {
    const text = await generateGeminiText(
      prompt,
      `${systemInstruction ? systemInstruction + '\n' : ''}Válaszolj kizárólag érvényes JSON formátumban.`
    );
    const parsed = parseAssessmentResponse<T>(text);
    if (parsed) return parsed;
    return fallbackData || (MOCK_FINAL_RESULT as unknown as T);
  } catch (err) {
    console.warn('Error parsing JSON from Gemini response:', err);
    return fallbackData || (MOCK_FINAL_RESULT as unknown as T);
  }
}

/**
 * Returns mock dialogue question by index (1-based)
 */
export function getMockAssessmentQuestion(questionIndex: number) {
  const idx = Math.max(0, Math.min(questionIndex - 1, MOCK_QUESTIONS.length - 1));
  return MOCK_QUESTIONS[idx];
}

/**
 * Returns mock final assessment
 */
export function getMockAssessmentResult(): AssessmentResult {
  return MOCK_FINAL_RESULT;
}
