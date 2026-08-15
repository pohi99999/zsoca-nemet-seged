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
- [ ] **Task 2: Supabase Schema Migration & Database Client Setup** (Következő feladat)
- [ ] **Task 3: Web Speech API Helper Utilities (TTS & STT)**
- [ ] **Task 4: Interactive Level Assessment Flow & Gemini Integration**
- [ ] **Task 5: Personalized Learning Plan Generator & Dashboard UI**
- [ ] **Task 6: Conversational Situational Practice Screen**
- [ ] **Task 7: Vocabulary & Memory Storage Screen**
- [ ] **Task 8: End-to-End Testing & Verification with Playwright**

---

## Agent Használati Útmutató
Minden fejlesztési lépés, döntés és állapotváltozás után ezt a fájlt frissíteni kell. A fejlesztő ágensek a feladatok átvételekor ebből a fájlból tájékozódnak.
