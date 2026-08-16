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
