# Zsóca Német Segéd - Projekt Áttekintés & Agent Dokumentáció

## Projekt Összefoglaló
A **Zsóca Német Segéd** egy interaktív, okostelefonra optimalizált webes (PWA) német nyelvtanulást segítő alkalmazás, kifejezetten a beszélt nyelv felfrissítésére és a gyakorlati kommunikációra fókuszálva.

### Fő funkciók & Célok:
1. **Szintfelmérés & Személyre szabott tanulási terv:**
   - Kezdő szituációs szintfelmérés a felhasználó (Zsóca) aktuális tudásának felmérésére.
   - Egyéni tanterv összeállítása a hiányosságok és célok alapján.
2. **Memória (Hosszú távú kontextus):**
   - Supabase adatbázisban megjegyzi a felhasználó haladását, kiejtési nehézségeit, megtanult szavait és preferenciáit.
3. **Interaktív Beszédfókuszú Tanulás:**
   - Kiejtéssegítés: Szavak, mondatok és kifejezések felolvasása (Web Speech API Text-to-Speech).
   - Beszédcentrikus kommunikáció (Mikrofonos válaszadás Web Speech STT segítségével).
   - Nyelvtan csak kérésre / másodlagos elemként jelenik meg.
4. **Könnyű elérés & Mobil élmény:**
   - Next.js PWA alkalmazás (Vercel-en hosztolva), amit a felhasználó egyetlen linken keresztül könnyen megnyithat és kitűzhet a telefonja kezdőképernyőjére.
5. **Tudásbázis & Obsidian integráció:**
   - A projekt információi és specifikációi szinkronizálva vannak a tudástárba/Obsidian rendszerbe.

---

## Projekt Állapot & Haladás
- **Dizájn dokumentum:** [`docs/superpowers/specs/2026-08-15-zsoca-nemet-seged-design.md`](docs/superpowers/specs/2026-08-15-zsoca-nemet-seged-design.md)
- **Megvalósítási terv:** [`docs/superpowers/plans/2026-08-15-zsoca-nemet-seged-implementation.md`](docs/superpowers/plans/2026-08-15-zsoca-nemet-seged-implementation.md)
- **Git Repo:** `https://github.com/pohi99999/zsoca-nemet-seged.git`

### Feladatok állapota (Tasks):
- [x] **Task 1: Project Scaffolding & Next.js PWA Setup** (Elkészült, tesztek: 2/2 ✅, Kódminőség: Jóváhagyva ✅)
- [x] **Task 2: Supabase Schema Migration & Database Client Setup** (Elkészült, tesztek: 4/4 ✅, Kódminőség: Jóváhagyva ✅)
- [x] **Task 3: Web Speech API Helper Utilities (TTS & STT)** (Elkészült, tesztek: 11/11 ✅, Kódminőség: Jóváhagyva ✅)
- [x] **Task 4: Interactive Level Assessment Flow & Gemini Integration** (Elkészült, tesztek: 6/6 ✅, Kódminőség: Jóváhagyva ✅)
- [x] **Task 5: Personalized Learning Plan Generator & Dashboard UI** (Elkészült, tesztek: 4/4 ✅, Kódminőség: Jóváhagyva ✅)
- [x] **Task 6: Conversational Situational Practice Screen** (Elkészült, tesztek: 6/6 ✅, Kódminőség: Jóváhagyva ✅)
- [x] **Task 7: Vocabulary & Memory Storage Screen** (Elkészült, tesztek: 8/8 ✅, Kódminőség: Jóváhagyva ✅)
- [x] **Task 8: End-to-End Testing & Verification with Playwright** (Elkészült, tesztek: 55/55 ✅, Build: Sikeres ✅, Kódminőség: Jóváhagyva ✅)

---

## Agent Használati Útmutató
Minden fejlesztési lépés, döntés és állapotváltozás után ezt a fájlt frissíteni kell. A fejlesztő ágensek a feladatok átvételekor ebből a fájlból tájékozódnak.

---

## Teljes audit & refaktor (2026-08-16)

A meglévő, elkészült projekten végigfutott egy teljes körű átvizsgálás. Talált és javított hibák:

- **Kritikus: szókincs-adatvesztés.** A Szókincstár oldal minden megnyitáskor felülírta a helyi (localStorage) mentett szavakat a szerver seed-listájával, mert Supabase hiányában a `/api/vocabulary` mindig csak a 10 alap szót adta vissza. Zsóca minden gyakorlás közben mentett szava elveszett volna az első Szókincstár-látogatáskor. Javítva: a kliens most a localStorage-t tekinti forrásnak, ha már van benne adat.
- **Kritikus: séma-ütközés a szómentésben.** A gyakorló képernyő (`practice/[moduleId]`) más mezőnevekkel (`german`/`hungarian`) írta a `zsoca_vocabulary` kulcsot, mint amit a Szókincstár és a `/api/vocabulary` vár (`german_word`/`hungarian_translation`). Ez böngészős teszt közben ténylegesen `TypeError`-t dobott, és a szó sosem mentődött el. Javítva: egységes `VocabularyItem` séma mindkét helyen.
- **Elavult Gemini modell.** A `gemini-1.5-flash` modell azóta megszűnt; a hívások mindig a beépített mock tartalomra estek vissza (némán, hibaüzenet nélkül). Frissítve `gemini-3.5-flash`-re (jelenlegi stabil, éles modell).
- **Hiányzó PWA ikonok.** A `manifest.json` nem létező `/icons/icon-192.png` és `/icons/icon-512.png` fájlokra mutatott — a "Hozzáadás a kezdőképernyőhöz" funkció ikon nélkül vagy hibásan működött volna. Pótolva (192/512 px + Apple touch icon + favicon), iOS/Android PWA meta-tagek hozzáadva a `layout.tsx`-hez, valamint egy egyszerű offline gyorsítótárazó service worker (`public/sw.js`).
- **Duplikált logika:** közös `useSpeechRecorder` hook kivezetve a szintfelmérő és a gyakorló oldal azonos mikrofon-kezelő kódjából; a Szókincstár saját szűrő-logikája lecserélve a meglévő `filterVocabulary` segédfüggvényre.
- Törölve egy véletlenül commitolt, üres `0.26.0` fájl a repó gyökeréből.
- Hozzáadva `.env.example` a szükséges környezeti változók (GEMINI_API_KEY, Supabase kulcsok) dokumentálásához.
- Az e2e Playwright teszt két hibás asszerciója javítva (a szituációs modul 3, nem 4 felhasználói kör után zárul le; a keresés-teszt olyan szót keresett, ami sosem lett elmentve).

Ellenőrzés: `npm test` (55/55 ✅), `npx playwright test` (1/1 ✅), `npm run build` (sikeres ✅), böngészős manuális teszt a teljes user flow-n (Tanterv → Szintfelmérő → Gyakorlás → Szókincstár).

---

## Élesítés & Gemini-integráció hibakeresése (2026-08-16, folytatás)

Az auditot követően a projekt élesítve lett a Vercelen (`brunellaagent-1630s-projects` csapat,
`https://zsoca-nemet-seged.vercel.app/`, git-kapcsolt auto-deploy) és a Supabase-adatbázis
sémája migrálva lett (`brunella` projekt, `zhybisokzmshtgwkisqv`). A Gemini AI-integráció
valódi működése több iteráción keresztül derült ki — az alábbi hibák **egymásra épülve**
takarták el egymást, ezért érdemes sorban átnézni, ha az AI-funkciók megint hallgatnak:

1. **Elavult kulcsformátum-feltételezés.** A Google 2026 közepén áttért az `AQ.`-val kezdődő
   "Auth key" formátumra a régi `AIzaSy...` "Standard key" helyett (az utóbbiakat 2026
   szeptemberétől teljesen kivezetik). Egy `AQ.`-val kezdődő kulcs **teljesen érvényes**,
   nem hibás/rossz kulcs.
2. **Rossz hitelesítési módszer.** A kód a kulcsot `?key=...` URL-paraméterként küldte —
   ez a legacy módszer, és az új `AQ.` Auth kulcsokkal nem működik. A helyes mód: az
   `x-goog-api-key` HTTP fejléc. Javítva a `src/lib/ai/gemini.ts`-ben.
3. **Néma JSON-parse hiba a "thinking" tokenek miatt.** A `gemini-3.5-flash` alapértelmezett
   "medium" gondolkodási szintje felemésztette a `maxOutputTokens: 800` keret nagy részét
   láthatatlan reasoning tokenekre, ezért a tényleges JSON válasz derékba tört
   ("Unterminated string in JSON"). A `parseAssessmentResponse` ezt a hibát elnyeli és
   `null`-t ad vissza kivétel dobása nélkül, így a `generateGeminiJson` **figyelmeztetés
   nélkül** esett vissza mock tartalomra — ez volt a legnehezebben behatárolható hiba,
   mert a Vercel Logs semmilyen warningot nem mutatott. Javítva:
   `generationConfig.thinkingConfig.thinkingLevel: "low"` + `maxOutputTokens: 2048` +
   `responseMimeType: "application/json"` (ez utóbbi kikényszeríti a tiszta JSON választ
   markdown-fence/prózai szöveg nélkül).
4. **Ingyenes szint kvótakorlátja.** A Gemini API ingyenes csomagja `gemini-3.5-flash`-re
   **percenként 20 kérésre** korlátoz. Intenzív teszteléskor (több egymást követő hívás
   rövid idő alatt) ez `429 RESOURCE_EXHAUSTED` hibát ad. Zsóca normál, egy-egy gyakorlós
   használatánál ez valószínűleg nem lesz probléma, de ha rendszeresen mock-tartalmat kap,
   ez legyen az első gyanú (nem hiba, csak várni kell ~1 percet, vagy fizetős szintre váltani).
5. **Google-oldali átmeneti túlterheltség.** A `gemini-3.5-flash` modell időnként
   `503 UNAVAILABLE` ("high demand") hibát ad — ez Google-oldali, tőlünk független,
   átmeneti jelenség, amit a kód már ma is helyesen kezel (graceful fallback mockra).

> [!success] Az integráció megerősítve működik
> Élő teszttel igazolva: a `generateContent` hívás sikeres esetben valódi, kontextusfüggő
> német szöveget ad vissza (pl. `"Hallo, wie geht es dir?"` egy egyedi promptra). A kód
> minden ismert hibaforrást lekezel, és sosem törik meg a felhasználói élmény — legrosszabb
> esetben (kvóta/túlterheltség) a beépített, minőségi mock tartalomra esik vissza némán.

**Diagnosztikai módszer, ami bevált:** amikor a Vercel Logs UI böngészős automatizáláson
keresztül megbízhatatlannak bizonyult (szűrők/keresés nem renderelt konzisztensen), egy
**ideiglenes `/api/debug-env` végpont** (törölve a session végén) sokkal megbízhatóbb volt:
közvetlenül a JSON válaszban adta vissza a nyers Google API választ (`status`, `bodyPreview`),
kiiktatva a dashboard-UI bizonytalanságait. Hasonló helyzetben érdemes ezt a mintát újra
használni ahelyett, hogy a Logs felületet kényszerítenénk.

**Egy elhagyott `GITHUB_TOKEN` Vercel env változó maradt** egy korábbi, végül visszavont
kísérletből (GitHub Models API — 2026.07.30-án véglegesen megszűnt szolgáltatás, nem
használható). Nem árt, de törölhető a Vercel Environment Variables alól, ha valaki ránéz.
