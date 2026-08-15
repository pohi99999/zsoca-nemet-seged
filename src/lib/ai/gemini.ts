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

export interface LearningPlanModule {
  id?: string;
  order_index: number;
  title: string;
  description: string;
  estimated_duration: string;
  status: 'available' | 'locked' | 'completed';
  situational_goal?: string;
  key_phrases?: string[];
}

export interface LearningPlanResponse {
  id?: string;
  title: string;
  level: string;
  summary?: string;
  modules: LearningPlanModule[];
}

export const MOCK_LEARNING_PLAN_MODULES: LearningPlanModule[] = [
  {
    order_index: 1,
    title: 'Pékség & Kávézó - Rendelés magabiztosan',
    description: 'Gyakorold az ételek, italok rendelését, a választást és a fizetést egy bécsi kávézóban.',
    estimated_duration: '10-15 perc',
    status: 'available',
    situational_goal: 'Rendelés, kérések és fizetés magabiztos lebonyolítása.',
    key_phrases: ['Ich möchte bitte...', 'Was kostet das?', 'Zusammen oder getrennt?'],
  },
  {
    order_index: 2,
    title: 'Útbaigazítás a városban',
    description: 'Kérdezz és érts meg útvonalakat, tájékozódj Berlin utcáin és a pályaudvaron.',
    estimated_duration: '10-15 perc',
    status: 'locked',
    situational_goal: 'Tájékozódás és útbaigazítás kérése/megértése.',
    key_phrases: ['Entschuldigung, wo ist...?', 'Geradeaus', 'Biegen Sie links/rechts ab'],
  },
  {
    order_index: 3,
    title: 'Szállodai bejelentkezés & Kérések',
    description: 'Bejelentkezés a recepción, szobafoglalás részletei és kérések intézése.',
    estimated_duration: '15 perc',
    status: 'locked',
    situational_goal: 'Szállodai bejelentkezés és problémamegoldás.',
    key_phrases: ['Ich habe eine Reservierung', 'Gibt es WLAN?', 'Bis wann ist das Frühstück?'],
  },
  {
    order_index: 4,
    title: 'Hétköznapi csevegés & Hobbik',
    description: 'Beszélgess a hétvégéről, hobbikról és ismerkedj német anyanyelvűekkel kötetlenül.',
    estimated_duration: '15 perc',
    status: 'locked',
    situational_goal: 'Kötetlen beszélgetés és személyes élmények megosztása.',
    key_phrases: ['In meiner Freizeit...', 'Was machst du gerne?', 'Letztes Wochenende...'],
  },
  {
    order_index: 5,
    title: 'Orvosnál & Gyógyszertárban',
    description: 'Panaszok és tünetek leírása, gyógyszervásárlás és alapvető segítségkérés.',
    estimated_duration: '15 perc',
    status: 'locked',
    situational_goal: 'Egészségügyi szituációk és tünetek elmondása.',
    key_phrases: ['Ich habe Halsschmerzen', 'Haben Sie etwas gegen...?', 'Zweimal täglich'],
  },
];

export function getMockLearningPlan(level: string = 'A2'): LearningPlanResponse {
  return {
    title: 'Zsóca Személyre Szabott Tanulási Terve',
    level: level.includes('A2') ? 'A2 - Beszéd Felelevenítés' : level,
    summary: 'A mindennapi beszédkészség és szituációs magabiztosság fejlesztésére optimalizált 5 lépéses tanterv.',
    modules: MOCK_LEARNING_PLAN_MODULES,
  };
}

export function createPlanPrompt(params: {
  userName?: string;
  estimated_level?: string;
  strengths?: string[];
  focus_areas?: string[];
}): string {
  const {
    userName = 'Zsóca',
    estimated_level = 'A2',
    strengths = [],
    focus_areas = [],
  } = params;

  return `
Te egy profi német nyelvtanár vagy. Készíts egy 5 modulból álló, személyre szabott német tanulási tervet ${userName} számára.
A cél a szóbeli kommunikáció felfrissítése, a magabiztos megszólalás mindennapi életszerű helyzetekben.

Diák profilja:
- Szint: ${estimated_level}
- Erősségek: ${strengths.join(', ') || 'Bátor megszólalás, jó alapok'}
- Fejlesztendő területek: ${focus_areas.join(', ') || 'Múlt idő (Perfekt), szókincs bővítés'}

Követelmények a tervhez:
1. Pontosan 5 egymásra épülő, életszerű szituációs modul (pl. 1. Pékség & Kávézó, 2. Útbaigazítás, 3. Szálloda, 4. Hétköznapi csevegés, 5. Orvos/Gyógyszertár).
2. Az első modul státusza 'available' legyen, a többi 'locked'.
3. Becsült időtartam modulonként: 10-15 perc.

KIZÁRÓLAG érvényes JSON formátumban válaszolj, Markdown kódblokkok nélkül:
{
  "title": "${userName} Személyre Szabott Tanulási Terve",
  "level": "${estimated_level}",
  "summary": "1-2 mondatos összefoglaló a tantervről és célokról",
  "modules": [
    {
      "order_index": 1,
      "title": "Pékség & Kávézó - Rendelés magabiztosan",
      "description": "Gyakorold az ételek, italok rendelését és a fizetést egy kávézóban.",
      "estimated_duration": "10-15 perc",
      "status": "available",
      "situational_goal": "Rendelés és fizetés lebonyolítása."
    },
    {
      "order_index": 2,
      "title": "Útbaigazítás a városban",
      "description": "Kérdezz és érts meg útvonalakat a városban és a pályaudvaron.",
      "estimated_duration": "10-15 perc",
      "status": "locked",
      "situational_goal": "Tájékozódás és útbaigazítás kérése."
    },
    {
      "order_index": 3,
      "title": "Szállodai bejelentkezés & Kérések",
      "description": "Bejelentkezés a recepción, szobafoglalás és kérések intézése.",
      "estimated_duration": "15 perc",
      "status": "locked",
      "situational_goal": "Szállodai bejelentkezés és kérések."
    },
    {
      "order_index": 4,
      "title": "Hétköznapi csevegés & Hobbik",
      "description": "Beszélgess a hétvégéről, hobbikról és ismerkedj kötetlenül.",
      "estimated_duration": "15 perc",
      "status": "locked",
      "situational_goal": "Kötetlen beszélgetés és élmények megosztása."
    },
    {
      "order_index": 5,
      "title": "Orvosnál & Gyógyszertárban",
      "description": "Panaszok és tünetek leírása, gyógyszervásárlás.",
      "estimated_duration": "15 perc",
      "status": "locked",
      "situational_goal": "Egészségügyi szituációk kezelése."
    }
  ]
}
`.trim();
}

