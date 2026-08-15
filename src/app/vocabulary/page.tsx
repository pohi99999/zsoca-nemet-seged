'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Volume2,
  Search,
  Plus,
  Trash2,
  Zap,
  BookOpen,
  Target,
  Sparkles,
  Layers,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Award,
  Filter,
} from 'lucide-react';
import { speakGerman, stopSpeaking } from '@/lib/speech/speechSynthesis';
import {
  VocabularyItem,
  DEFAULT_SEED_VOCABULARY,
  calculateDifficultyStats,
  DifficultyStats,
} from '@/lib/vocabulary';

export default function VocabularyPage() {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);

  // New word modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGerman, setNewGerman] = useState('');
  const [newHungarian, setNewHungarian] = useState('');
  const [newPronunciation, setNewPronunciation] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<number>(1);
  const [newCategory, setNewCategory] = useState('Általános');
  const [isSaving, setIsSaving] = useState(false);

  // Flashcard mode state
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    setIsLoading(true);
    try {
      let cached: VocabularyItem[] | null = null;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('zsoca_vocabulary');
        if (stored) {
          try {
            cached = JSON.parse(stored);
            if (cached && cached.length > 0) {
              setItems(cached);
              setIsLoading(false);
            }
          } catch (e) {
            console.warn('Error parsing cached vocabulary:', e);
          }
        }
      }

      // Fetch from API
      const res = await fetch('/api/vocabulary');
      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          setItems(data.items);
          if (typeof window !== 'undefined') {
            localStorage.setItem('zsoca_vocabulary', JSON.stringify(data.items));
          }
        }
      } else if (!cached) {
        setItems(DEFAULT_SEED_VOCABULARY);
      }
    } catch (e) {
      console.error('Failed to load vocabulary:', e);
      if (items.length === 0) {
        setItems(DEFAULT_SEED_VOCABULARY);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (item: VocabularyItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlayingId(item.id || item.german_word);
    speakGerman(item.german_word, {
      rate: 0.85,
      onEnd: () => setPlayingId(null),
      onError: () => setPlayingId(null),
    });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zsoca_vocabulary', JSON.stringify(updated));
    }

    try {
      await fetch(`/api/vocabulary?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Error syncing delete to API:', err);
    }
  };

  const handleAddNewWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGerman.trim() || !newHungarian.trim()) return;

    setIsSaving(true);
    const newItem: VocabularyItem = {
      id: `voc-${Date.now()}`,
      german_word: newGerman.trim(),
      hungarian_translation: newHungarian.trim(),
      pronunciation_notes: newPronunciation.trim() || undefined,
      difficulty_score: newDifficulty,
      category: newCategory.trim() || 'Általános',
      last_practiced_at: new Date().toISOString(),
    };

    const updated = [newItem, ...items];
    setItems(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zsoca_vocabulary', JSON.stringify(updated));
    }

    try {
      await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
    } catch (err) {
      console.warn('Failed to sync new word to API:', err);
    } finally {
      setIsSaving(false);
      setNewGerman('');
      setNewHungarian('');
      setNewPronunciation('');
      setNewDifficulty(1);
      setNewCategory('Általános');
      setIsAddModalOpen(false);
    }
  };

  // Filter items
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchQuery =
        !query ||
        item.german_word.toLowerCase().includes(query) ||
        item.hungarian_translation.toLowerCase().includes(query) ||
        (item.pronunciation_notes && item.pronunciation_notes.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query));

      const matchDifficulty =
        selectedDifficulty === 'all' ||
        String(item.difficulty_score) === selectedDifficulty;

      return matchQuery && matchDifficulty;
    });
  }, [items, searchQuery, selectedDifficulty]);

  const stats: DifficultyStats = useMemo(() => {
    return calculateDifficultyStats(items);
  }, [items]);

  // Flashcard items
  const activeFlashcardList = filteredItems.length > 0 ? filteredItems : items;
  const currentCard = activeFlashcardList[currentCardIndex] || activeFlashcardList[0];

  const handleNextCard = () => {
    setIsCardFlipped(false);
    stopSpeaking();
    setCurrentCardIndex((prev) => (prev + 1) % activeFlashcardList.length);
  };

  const handlePrevCard = () => {
    setIsCardFlipped(false);
    stopSpeaking();
    setCurrentCardIndex((prev) =>
      prev === 0 ? activeFlashcardList.length - 1 : prev - 1
    );
  };

  const openFlashcardModal = () => {
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    setIsFlashcardOpen(true);
    if (activeFlashcardList.length > 0) {
      speakGerman(activeFlashcardList[0].german_word, { rate: 0.85 });
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-slate-50 text-slate-900 pb-24">
      {/* Top Header */}
      <header className="bg-gradient-to-br from-indigo-700 via-blue-600 to-blue-700 text-white px-5 pt-7 pb-6 rounded-b-[2rem] shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-indigo-400/20 rounded-full blur-lg pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border border-white/30 text-white">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-100 uppercase tracking-wider">
                  Zsóca Memória Tára
                </p>
                <h1 className="text-xl font-bold text-white leading-tight">
                  Szókincstár 📖
                </h1>
              </div>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="p-2.5 bg-white/20 hover:bg-white/30 active:scale-95 transition-all rounded-xl border border-white/30 text-white flex items-center justify-center shadow-sm"
              title="Új szó hozzáadása"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats & Pronunciation Practice Button */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-50 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Mentett kifejezések:</span>
              </span>
              <span className="text-sm font-black bg-white/20 px-2.5 py-0.5 rounded-full">
                {stats.total} szó
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
              <div className="bg-emerald-500/20 border border-emerald-400/30 py-1.5 px-2 rounded-xl text-emerald-100">
                <span className="block text-emerald-300 font-bold text-sm">{stats.easy}</span>
                <span>Könnyű</span>
              </div>
              <div className="bg-amber-500/20 border border-amber-400/30 py-1.5 px-2 rounded-xl text-amber-100">
                <span className="block text-amber-300 font-bold text-sm">{stats.medium}</span>
                <span>Közepes</span>
              </div>
              <div className="bg-rose-500/20 border border-rose-400/30 py-1.5 px-2 rounded-xl text-rose-100">
                <span className="block text-rose-300 font-bold text-sm">{stats.hard}</span>
                <span>Nehéz</span>
              </div>
            </div>

            {/* Flashcard Button */}
            <button
              onClick={openFlashcardModal}
              disabled={items.length === 0}
              className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-900 font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <Layers className="w-4 h-4 text-slate-900" />
              <span>Hangos Kiejtés Mód (Kártyák)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 px-4 pt-4 space-y-4">
        {/* Search & Filters */}
        <div className="space-y-2.5">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Keresés németül vagy magyarul..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Difficulty Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedDifficulty('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                selectedDifficulty === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Mind ({stats.total})
            </button>
            <button
              onClick={() => setSelectedDifficulty('1')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                selectedDifficulty === '1'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              🟢 Könnyű ({stats.easy})
            </button>
            <button
              onClick={() => setSelectedDifficulty('2')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                selectedDifficulty === '2'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              🟡 Közepes ({stats.medium})
            </button>
            <button
              onClick={() => setSelectedDifficulty('3')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                selectedDifficulty === '3'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              🔴 Nehéz ({stats.hard})
            </button>
          </div>
        </div>

        {/* Word Cards List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium text-slate-500">Kifejezések betöltése...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Nem található kifejezés</h3>
            <p className="text-xs text-slate-500">
              {searchQuery
                ? 'Próbálj más keresőkifejezést vagy kapcsold ki a szűrőket!'
                : 'Még nincsenek mentett kifejezések ebben a kategóriában.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDifficulty('all');
                }}
                className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100"
              >
                Szűrők törlése
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredItems.map((item, index) => {
              const isPlaying = playingId === (item.id || item.german_word);
              const difficultyLabel =
                item.difficulty_score === 1
                  ? 'Könnyű'
                  : item.difficulty_score === 2
                  ? 'Közepes'
                  : 'Nehéz';

              const difficultyColor =
                item.difficulty_score === 1
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : item.difficulty_score === 2
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-rose-700 bg-rose-50 border-rose-200';

              return (
                <div
                  key={item.id || `voc-item-${index}`}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 hover:border-blue-300 shadow-sm transition-all flex items-start justify-between gap-3"
                >
                  <div className="flex-1 space-y-1.5">
                    {/* Top Row: Category & Difficulty */}
                    <div className="flex items-center space-x-2">
                      {item.category && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${difficultyColor}`}
                      >
                        {difficultyLabel}
                      </span>
                    </div>

                    {/* German Word */}
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-black text-slate-900 leading-snug">
                        {item.german_word}
                      </h3>
                    </div>

                    {/* Pronunciation note */}
                    {item.pronunciation_notes && (
                      <p className="text-[11px] font-mono text-indigo-600 bg-indigo-50/70 inline-block px-1.5 py-0.5 rounded border border-indigo-100">
                        [{item.pronunciation_notes}]
                      </p>
                    )}

                    {/* Hungarian Translation */}
                    <p className="text-xs text-slate-600 font-medium">
                      {item.hungarian_translation}
                    </p>
                  </div>

                  {/* Right side Action Buttons */}
                  <div className="flex flex-col items-center space-y-2">
                    {/* Audio Play Button */}
                    <button
                      onClick={(e) => handleSpeak(item, e)}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                        isPlaying
                          ? 'bg-blue-600 text-white animate-pulse shadow-md scale-105'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95'
                      }`}
                      title="Német kiejtés meghallgatása"
                    >
                      <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-bounce' : ''}`} />
                    </button>

                    {/* Delete / Remove Action */}
                    {item.id && (
                      <button
                        onClick={(e) => handleDelete(item.id!, e)}
                        className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                        title="Törlés a listából"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add New Word Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Új Kifejezés Hozzáadása</span>
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewWord} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Német kifejezés *
                </label>
                <input
                  type="text"
                  required
                  value={newGerman}
                  onChange={(e) => setNewGerman(e.target.value)}
                  placeholder="pl. Guten Morgen!"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Magyar fordítás *
                </label>
                <input
                  type="text"
                  required
                  value={newHungarian}
                  onChange={(e) => setNewHungarian(e.target.value)}
                  placeholder="pl. Jó reggelt!"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kiejtési segédlet (fonetikus)
                </label>
                <input
                  type="text"
                  value={newPronunciation}
                  onChange={(e) => setNewPronunciation(e.target.value)}
                  placeholder="pl. gú-ten mor-gen"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nehézség
                  </label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>🟢 Könnyű</option>
                    <option value={2}>🟡 Közepes</option>
                    <option value={3}>🔴 Nehéz</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Témakör
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="pl. Rendelés"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSaving ? 'Mentés...' : 'Mentés'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flashcard Modal */}
      {isFlashcardOpen && currentCard && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 relative">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                {currentCardIndex + 1} / {activeFlashcardList.length} Kártya
              </span>
              <button
                onClick={() => {
                  stopSpeaking();
                  setIsFlashcardOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Flip Card Area */}
            <div
              onClick={() => setIsCardFlipped(!isCardFlipped)}
              className="w-full min-h-[220px] bg-gradient-to-br from-slate-50 to-blue-50/40 border-2 border-blue-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-inner relative transition-transform duration-300"
            >
              <span className="absolute top-3 right-3 text-[10px] font-bold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <RotateCw className="w-3 h-3" />
                <span>Koppints a megfordításhoz</span>
              </span>

              {!isCardFlipped ? (
                /* Front side: German */
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Német kifejezés
                  </span>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    {currentCard.german_word}
                  </h3>
                  {currentCard.pronunciation_notes && (
                    <p className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 inline-block">
                      [{currentCard.pronunciation_notes}]
                    </p>
                  )}
                </div>
              ) : (
                /* Back side: Hungarian */
                <div className="space-y-3 animate-in fade-in">
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">
                    Magyar jelentés
                  </span>
                  <h3 className="text-lg font-bold text-emerald-900 leading-snug">
                    {currentCard.hungarian_translation}
                  </h3>
                  {currentCard.category && (
                    <p className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-md inline-block border border-slate-200">
                      Téma: {currentCard.category}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Big Audio Play Button */}
            <div className="flex justify-center">
              <button
                onClick={(e) => handleSpeak(currentCard, e)}
                className="w-14 h-14 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform"
                title="Kiejtés felolvasása"
              >
                <Volume2 className="w-7 h-7" />
              </button>
            </div>

            {/* Card Navigation Controls */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={handlePrevCard}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Előző</span>
              </button>

              <button
                onClick={handleNextCard}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1 shadow-sm"
              >
                <span>Következő</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3 flex items-center justify-around z-20 shadow-lg">
        <Link
          href="/"
          className="flex flex-col items-center space-y-1 text-slate-500 hover:text-blue-600 transition-colors"
        >
          <div className="p-1 rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-[11px]">Tanterv</span>
        </Link>

        <Link
          href="/vocabulary"
          className="flex flex-col items-center space-y-1 text-blue-600 font-bold transition-colors"
        >
          <div className="p-1 bg-blue-50 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-[11px]">Szókincstár</span>
        </Link>

        <Link
          href="/assessment"
          className="flex flex-col items-center space-y-1 text-slate-500 hover:text-blue-600 transition-colors"
        >
          <div className="p-1 rounded-xl">
            <Target className="w-5 h-5" />
          </div>
          <span className="text-[11px]">Szintfelmérő</span>
        </Link>
      </nav>
    </div>
  );
}
