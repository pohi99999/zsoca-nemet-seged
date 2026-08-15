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
4. **Könnyű elérés:**
   - Next.js PWA alkalmazás (Vercel-en hosztolva), amit a felhasználó egyetlen linken keresztül könnyen megnyithat és kitűzhet a telefonja kezdőképernyőjére.

---

## Projekt Állapot
- **Jelenlegi fázis:** Tervezési fázis befejezve (Design Doc elkészült). Következő lépés: Részletes megvalósítási terv (Implementation Plan) készítése.
- **Dizájn dokumentum:** `docs/superpowers/specs/2026-08-15-zsoca-nemet-seged-design.md`
- **Git Repo:** `https://github.com/pohi99999/zsoca-nemet-seged.git`

---

## Agent Használati Útmutató
Minden fejlesztési lépés, döntés és állapotváltozás után ezt a fájlt frissíteni kell. A fejlesztő ágensek a feladatok átvételekor ebből a fájlból tájékozódnak.
