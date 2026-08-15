import { test, expect } from '@playwright/test';

test.describe('Zsóca Német Segéd - Mobile User Journey E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before test run
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('Complete Mobile Flow: Dashboard -> Assessment -> Dashboard Plan -> Practice Roleplay -> Vocabulary & Flashcards', async ({
    page,
  }) => {
    // ----------------------------------------------------
    // STEP 1: Landing on Dashboard
    // ----------------------------------------------------
    await page.goto('/');

    // Verify main header elements
    await expect(page.locator('h1')).toContainText('Hallo Zsóca!');
    await expect(page.getByText('Jelenlegi szint:')).toBeVisible();
    await expect(page.getByText('A2 - Beszéd Felelevenítés')).toBeVisible();

    // Verify assessment invitation banner
    await expect(page.getByText('Végezd el az 5 perces szintfelmérőt!')).toBeVisible();
    const startAssessmentBtn = page.getByRole('link', { name: 'Felmérés indítása' });
    await expect(startAssessmentBtn).toBeVisible();

    // Verify default modules are listed
    await expect(page.getByText('Gyakorlati Szituációk')).toBeVisible();
    await expect(page.getByText('Pékség & Kávézó - Rendelés')).toBeVisible();

    // ----------------------------------------------------
    // STEP 2: Navigate to Assessment & Complete 5 Questions
    // ----------------------------------------------------
    await startAssessmentBtn.click();
    await expect(page).toHaveURL('/assessment');
    await expect(page.locator('h1')).toContainText('Szintfelmérő');

    // Wait for first AI greeting/question
    const messageInput = page.getByPlaceholder('Írd be vagy mondd a választ...');
    await expect(messageInput).toBeVisible({ timeout: 10000 });

    // Test Speaker / Pronunciation button
    const speakerBtn = page.locator('button[title="Német kiejtés felolvasása"]').first();
    await expect(speakerBtn).toBeVisible();
    await speakerBtn.click();

    // Test Translation Accordion
    const translationBtn = page.locator('button[title="Magyar fordítás megtekintése"]').first();
    await expect(translationBtn).toBeVisible();
    await translationBtn.click();
    await expect(page.getByText('Magyarul:').first()).toBeVisible();
    await translationBtn.click(); // toggle hide

    // Send Answer 1
    await messageInput.fill('Ich heiße Zsóca und ich möchte mein Deutsch wieder aktivieren.');
    await page.locator('button[title="Válasz elküldése"]').click();

    // Wait for Question 2 & Send Answer 2
    await expect(page.getByText('2 / 5 kérdés')).toBeVisible({ timeout: 10000 });
    await messageInput.fill('Ich verstehe ziemlich viel, aber das Sprechen fällt mir schwer.');
    await page.locator('button[title="Válasz elküldése"]').click();

    // Wait for Question 3 & Send Answer 3
    await expect(page.getByText('3 / 5 kérdés')).toBeVisible({ timeout: 10000 });
    await messageInput.fill('Ich möchte im Urlaub im Hotel und im Restaurant fließend bestellen.');
    await page.locator('button[title="Válasz elküldése"]').click();

    // Wait for Question 4 & Send Answer 4
    await expect(page.getByText('4 / 5 kérdés')).toBeVisible({ timeout: 10000 });
    await messageInput.fill('Ich lerne am besten durch kurze tägliche Dialoge und Hören.');
    await page.locator('button[title="Válasz elküldése"]').click();

    // Wait for Question 5 & Send Answer 5
    await expect(page.getByText('5 / 5 kérdés')).toBeVisible({ timeout: 10000 });
    await messageInput.fill('Ja, ich bin bereit jeden Tag 10 Minuten zu üben!');
    await page.locator('button[title="Válasz elküldése"]').click();

    // Verify Assessment Completion Result Screen
    await expect(page.getByText('Szintfelmérés Befejezve!')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Becsült szint:')).toBeVisible();
    await expect(page.getByText('Erősségeid:')).toBeVisible();
    await expect(page.getByText('Fókuszterületek a fejlődéshez:')).toBeVisible();

    // Click CTA to continue to personalized learning plan
    const continueToPlanBtn = page.getByRole('link', { name: 'Tovább a személyes tantervemhez' });
    await expect(continueToPlanBtn).toBeVisible();
    await continueToPlanBtn.click();

    // ----------------------------------------------------
    // STEP 3: Return to Dashboard with Active Modules
    // ----------------------------------------------------
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Hallo Zsóca!');
    await expect(page.getByText('Gyakorlati Szituációk')).toBeVisible();

    // The first module should have an active practice button
    const startPracticeBtn = page.getByRole('link', { name: 'Gyakorlás indítása' }).first();
    await expect(startPracticeBtn).toBeVisible();

    // ----------------------------------------------------
    // STEP 4: Launch Situational Practice Module (Bakery Roleplay)
    // ----------------------------------------------------
    await startPracticeBtn.click();
    await expect(page).toHaveURL(/\/practice\//);
    await expect(page.getByText('Modul Gyakorlása')).toBeVisible();

    // Wait for bakery chat dialogue
    const practiceInput = page.getByPlaceholder('Írd be vagy mondd a választ...');
    await expect(practiceInput).toBeVisible({ timeout: 10000 });

    // Test Audio speech button in practice
    const practiceAudioBtn = page.locator('button[title="Kiejtés felolvasása"]').first();
    await expect(practiceAudioBtn).toBeVisible();
    await practiceAudioBtn.click();

    // Test Hungarian Translation Accordion
    const practiceTransBtn = page.locator('button[title="Magyar fordítás"]').first();
    await expect(practiceTransBtn).toBeVisible();
    await practiceTransBtn.click();
    await expect(page.getByText('Magyar jelentés:').first()).toBeVisible();

    // Test Grammar Tip Card toggle
    const grammarBtn = page.getByText('Nyelvtani tipp megtekintése').first();
    if (await grammarBtn.isVisible()) {
      await grammarBtn.click();
      await expect(page.getByText('Nyelvtani megjegyzés:').first()).toBeVisible();
    }

    // Test saving a vocabulary word chip
    const vocabChip = page.locator('button[title="Kattints a kiejtéshez és mentéshez a szótárba!"]').first();
    if (await vocabChip.isVisible()) {
      await vocabChip.click();
      await expect(page.getByText(/elmentve a szókincstáradba/i)).toBeVisible({ timeout: 5000 });
    }

    // Roleplay Turn 1
    await practiceInput.fill('Guten Morgen! Ich möchte bitte zwei Brötchen und einen Kaffee.');
    await page.locator('button[title="Üzenet elküldése"]').click();

    // Roleplay Turn 2
    await expect(page.getByText(/2 \/ 4 kör|3 \/ 4 kör/)).toBeVisible({ timeout: 10000 });
    await practiceInput.fill('Was kostet das zusammen?');
    await page.locator('button[title="Üzenet elküldése"]').click();

    // Roleplay Turn 3
    await expect(page.getByText(/3 \/ 4 kör|4 \/ 4 kör/)).toBeVisible({ timeout: 10000 });
    await practiceInput.fill('Ich bezahle mit Karte, bitte.');
    await page.locator('button[title="Üzenet elküldése"]').click();

    // Roleplay Turn 4 (Final completion turn)
    await expect(page.getByText(/4 \/ 4 kör/)).toBeVisible({ timeout: 10000 });
    await practiceInput.fill('Vielen Dank, auf Wiedersehen!');
    await page.locator('button[title="Üzenet elküldése"]').click();

    // Verify Completion Modal
    await expect(page.getByText('Szép volt, Zsóca! 🎉')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Modul Teljesítve')).toBeVisible();

    // Click link to Vocabulary screen
    const goToVocabBtn = page.getByRole('link', { name: 'Szókincstár megtekintése' });
    await expect(goToVocabBtn).toBeVisible();
    await goToVocabBtn.click();

    // ----------------------------------------------------
    // STEP 5: Vocabulary Storage & Flashcard Quiz Modal
    // ----------------------------------------------------
    await expect(page).toHaveURL('/vocabulary');
    await expect(page.locator('h1')).toContainText('Szókincstár');
    await expect(page.getByText('Mentett kifejezések:')).toBeVisible();

    // Test Search input
    const searchInput = page.getByPlaceholder('Keresés németül vagy magyarul...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Kaffee');
    await expect(page.getByText('der Kaffee').or(page.getByText('Kaffee'))).toBeVisible();

    // Clear search
    await searchInput.fill('');

    // Test Difficulty filter tabs
    const easyFilterBtn = page.getByRole('button', { name: /🟢 Könnyű/ });
    await expect(easyFilterBtn).toBeVisible();
    await easyFilterBtn.click();

    const allFilterBtn = page.getByRole('button', { name: /Mind/ });
    await allFilterBtn.click();

    // Test Pronunciation audio on a vocabulary item
    const vocabAudioBtn = page.locator('button[title="Német kiejtés meghallgatása"]').first();
    await expect(vocabAudioBtn).toBeVisible();
    await vocabAudioBtn.click();

    // Test Flashcard Mode Modal
    const flashcardModeBtn = page.getByRole('button', { name: 'Hangos Kiejtés Mód (Kártyák)' });
    await expect(flashcardModeBtn).toBeVisible();
    await flashcardModeBtn.click();

    // Flashcard modal is open
    await expect(page.getByText(/Kártya/)).toBeVisible();
    await expect(page.getByText('Koppints a megfordításhoz')).toBeVisible();
    await expect(page.getByText('Német kifejezés')).toBeVisible();

    // Flip the card to view Hungarian translation
    const flipArea = page.getByText('Koppints a megfordításhoz');
    await flipArea.click();
    await expect(page.getByText('Magyar jelentés')).toBeVisible();

    // Navigate to Next card
    const nextCardBtn = page.getByRole('button', { name: 'Következő' });
    await nextCardBtn.click();

    // Close Flashcard modal
    const closeBtn = page.locator('div.fixed').locator('button').filter({ has: page.locator('svg.lucide-x') }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });
});
