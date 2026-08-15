# Zsóca Német Segéd - Rendszerterv & Specifikáció (Design Doc)

**Dátum:** 2026-08-15  
**Projekt:** Zsóca Német Segéd (`zsoca-nemet-seged`)  
**Státusz:** Jóváhagyva  

---

## 1. Áttekintés & Célkitűzés

A **Zsóca Német Segéd** egy interaktív, okostelefonra optimalizált Progressive Web Application (PWA), amely kifejezetten a beszéd- és kommunikációfókuszú német nyelvfejlesztést, illetve a meglévő nyelvtudás felelevenítését szolgálja.

### Fő funkciók:
1. **Dinamikus Szintfelmérő:** 5-8 barátságos szituációs kérdés alapján felméri a felhasználó (Zsóca) szókincsét és szóbeli készségeit.
2. **Személyre Szabott Tanterv:** Az AI által generált 4-6 témakörből álló modulrendszer.
3. **Hangalapú & Interaktív Szituációk:** A Web Speech API (SpeechSynthesis német kiejtéssel & SpeechRecognition mikrofonnal) segítségével segíti a kiejtést és a beszédet. A nyelvtan másodlagos, csak kérésre jelenik meg.
4. **Hosszú Távú AI Memória:** Supabase adatbázisban tárolja a haladást, a megtanult szavakat és a kiejtési nehézségeket.

---

## 2. Rendszerarchitektúra & Technológiai Stack

```
[ Okostelefon Böngésző / PWA ] 
          │
          ├── Web Speech API (Audió felolvasás & Mikrofonos felismerés)
          │
          ▼
[ Next.js 14/15 App Router (TypeScript + Tailwind CSS) ]
          │
          ├── Serverless API Routes (Vercel)
          │         │
          │         ├── Gemini API (AI Szintfelmérő, Tanterv & Párbeszédek)
          │         │
          │         └── Supabase Client (Hitelesítés & Adatkezelés)
          │
          ▼
[ Supabase PostgreSQL Adatbázis ]
   ├── profiles
   ├── assessment_results
   ├── learning_plans / modules
   └── user_vocabulary_memory
```

* **Frontend:** Next.js (App Router, React, TypeScript), PWA Manifest + Service Worker, Tailwind CSS (Mobile-First responsive UI).
* **Backend:** Next.js Serverless API routes (Vercel).
* **Adatbázis & Memória:** Supabase PostgreSQL.
* **AI Model:** Gemini API (Vercel serverless környezetből meghívva).
* **Audio Engine:** Web Speech API (`SpeechSynthesis` + `SpeechRecognition`).

---

## 3. Adatbázis Séma (Supabase PostgreSQL)

### `profiles`
- `id` (UUID, primary key)
- `name` (TEXT)
- `current_level` (TEXT, pl. "A2-B1 felelevenítés")
- `created_at` (TIMESTAMP)

### `assessment_results`
- `id` (UUID, primary key)
- `user_id` (UUID, FK -> profiles.id)
- `summary` (TEXT, AI összefoglaló a szintfejlettségről)
- `strengths` (TEXT[])
- `focus_areas` (TEXT[])
- `created_at` (TIMESTAMP)

### `learning_plans`
- `id` (UUID, primary key)
- `user_id` (UUID, FK -> profiles.id)
- `title` (TEXT)
- `status` (TEXT: "active", "completed")
- `created_at` (TIMESTAMP)

### `modules`
- `id` (UUID, primary key)
- `plan_id` (UUID, FK -> learning_plans.id)
- `order_index` (INT)
- `title` (TEXT, pl. "Pékségben és Kávézóban")
- `description` (TEXT)
- `status` (TEXT: "locked", "available", "completed")

### `user_vocabulary_memory`
- `id` (UUID, primary key)
- `user_id` (UUID, FK -> profiles.id)
- `german_word` (TEXT)
- `hungarian_translation` (TEXT)
- `pronunciation_notes` (TEXT)
- `difficulty_score` (INT, 1-5)
- `last_practiced_at` (TIMESTAMP)

---

## 4. UI/UX & Képernyő Terv (Mobil optimalizált)

1. **Onboarding & Szintfelmérő Képernyő:**
   - Kártya alapú chat felület.
   - Minden kérdés mellett hangszóró gomb (német kiejtés) és mikrofon gomb (szóbeli válasz).
2. **Dashboard / Tanterv Képernyő:**
   - Zsóca szintje, haladási sávja.
   - Generált modulok kártyái egykattintásos indítással.
   - "Gyors Szókincs Felelevenítés" gomb.
3. **Interaktív Szituációs Gyakorló Képernyő:**
   - Csevegő nézet nagy gombokkal.
   - AI üzenet kártya:
     - 🔊 Felolvasás gomb (Web Speech).
     - 🇭🇺 Magyar fordítás gomb.
     - Interaktív szókattintás (lassú felolvasás + tipp).
     - 📖 Nyelvtan kártya (alapértelmezetten rejtett, gombra nyílik).
   - Zsóca válaszsávja: Nagy mikrofon gomb + gépelési mező.
4. **Szókincstár Képernyő:**
   - Mentett szavak listája hangszóró felolvasással és kiejtés-fejlesztési tippekkel.

---

## 5. AI Prompt & Pedagógiai Stratégia

- **Persona:** Bátorító, türelmes és gyakorlatias német beszélgetőpartner/oktató.
- **Interakció:** Elsődlegesen érthető német nyelven beszél Zsócához. Megakadás esetén magyarul segít, majd visszatereli a beszélgetést német nyelvre.
- **Nyelvtani Szabály:** Nem javítja ki az apró nyelvtani hibákat, ha a mondat érthető. Csak akkor nyújt nyelvtani magyarázatot, ha a megértést akadályozza a hiba, vagy ha Zsóca rákattint a nyelvtan gombra.

---

## 6. Hibakezelés & Fallback Megoldások

- **Mikrofon támogatás hiánya (Web Speech STT fallback):** Ha a böngésző nem támogatja a mikrofonos felismerést (pl. régebbi mobil iOS Safari), az app gépelési mezőre és előre gyártott válaszlehetőség gombokra vált.
- **Hálózati megszakadás:** Az adatok elmentődnek a helyi IndexedDB-ben, majd az internet helyreállásakor szinkronizálódnak a Supabase-be.

---

## 7. Tesztelési Stratégia

- **Unit & Component Tesztek (Vitest + React Testing Library):** UI elemek, gombok és hangszóró/mikrofon állapota.
- **E2E Tesztek (Playwright):** Szintfelmérő flow ➔ Tanterv generálás ➔ Szituációs párbeszéd szimuláció.
