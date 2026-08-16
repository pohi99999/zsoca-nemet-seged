'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  Languages,
  Lightbulb,
  Sparkles,
  CheckCircle2,
  Trophy,
  BookOpen,
  RotateCcw,
  ArrowRight,
  BookmarkCheck,
  Zap,
} from 'lucide-react';
import { speakGerman, stopSpeaking } from '@/lib/speech/speechSynthesis';
import { isSpeechRecognitionSupported } from '@/lib/speech/speechRecognition';
import { useSpeechRecorder } from '@/lib/speech/useSpeechRecorder';
import {
  SituationalVocabularySuggestion,
  SituationalChatMessage,
  SituationalChatResponse,
  getMockLearningPlan,
} from '@/lib/ai/gemini';
import { VocabularyItem } from '@/lib/vocabulary';

interface ChatMessageItem extends SituationalChatMessage {
  id: string;
  showTranslation?: boolean;
  showGrammar?: boolean;
}

export default function SituationalPracticePage() {
  const params = useParams();
  const router = useRouter();
  const rawModuleId = Array.isArray(params?.moduleId)
    ? params.moduleId[0]
    : (params?.moduleId as string) || '1';
  const moduleId = rawModuleId.replace(/[^0-9]/g, '') || '1';

  const [moduleTitle, setModuleTitle] = useState('Pékség & Kávézó - Rendelés');
  const [moduleGoal, setModuleGoal] = useState('Ételek, italok rendelése és fizetés.');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { isRecording, toggle: toggleRecording, stop: stopRecording } = useSpeechRecorder(
    (text, isFinal) => {
      setInputText((prev) => {
        if (isFinal) {
          return prev ? `${prev} ${text}`.trim() : text;
        }
        return text;
      });
    }
  );

  // Load Module metadata & Saved Vocabulary
  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());

    // Load saved words from localStorage
    if (typeof window !== 'undefined') {
      try {
        const storedVocab = localStorage.getItem('zsoca_vocabulary');
        if (storedVocab) {
          const parsed: VocabularyItem[] = JSON.parse(storedVocab);
          setSavedWords(
            new Set(parsed.filter((w) => w.german_word).map((w) => w.german_word.toLowerCase()))
          );
        }

        // Load module title from learning plan
        const cachedPlanStr = localStorage.getItem('zsoca_learning_plan');
        if (cachedPlanStr) {
          const plan = JSON.parse(cachedPlanStr);
          const found = plan.modules?.find(
            (m: any) => String(m.order_index) === moduleId || String(m.id) === moduleId
          );
          if (found) {
            setModuleTitle(found.title);
            if (found.situational_goal) setModuleGoal(found.situational_goal);
          }
        } else {
          const mockPlan = getMockLearningPlan('A2');
          const mod = mockPlan.modules.find(
            (m) => String(m.order_index) === moduleId
          );
          if (mod) {
            setModuleTitle(mod.title);
            if (mod.situational_goal) setModuleGoal(mod.situational_goal);
          }
        }
      } catch (err) {
        console.warn('Error reading module metadata:', err);
      }
    }

    startPracticeSession();

    return () => {
      stopSpeaking();
      stopRecording();
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const showToast = (text: string) => {
    setToastMessage(text);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const startPracticeSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          moduleTitle,
          messages: [],
          userMessage: 'INIT',
          turnCount: 0,
        }),
      });

      const data: SituationalChatResponse & { turnCount: number } = await res.json();

      const initialMessage: ChatMessageItem = {
        id: `ai-msg-1`,
        role: 'assistant',
        german_text: data.german_text,
        audio_text: data.audio_text,
        hungarian_translation: data.hungarian_translation,
        vocabulary_suggestions: data.vocabulary_suggestions || [],
        grammar_tip: data.grammar_tip || '',
        showTranslation: false,
        showGrammar: false,
      };

      setMessages([initialMessage]);
      setTurnCount(data.turnCount || 1);

      // Auto play opening greeting
      speakGerman(data.audio_text || data.german_text, {
        onEnd: () => setIsSpeakingId(null),
      });
      setIsSpeakingId('ai-msg-1');
    } catch (err) {
      console.error('Failed to initialize situational practice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text: string, id: string) => {
    if (isSpeakingId === id) {
      stopSpeaking();
      setIsSpeakingId(null);
      return;
    }

    setIsSpeakingId(id);
    speakGerman(text, {
      onEnd: () => setIsSpeakingId(null),
      onError: () => setIsSpeakingId(null),
    });
  };

  const toggleTranslation = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, showTranslation: !msg.showTranslation } : msg
      )
    );
  };

  const toggleGrammar = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, showGrammar: !msg.showGrammar } : msg
      )
    );
  };

  const handleSaveWord = (vocab: SituationalVocabularySuggestion) => {
    // 1. Speak word
    speakGerman(vocab.german);

    // 2. Persist to localStorage using the same VocabularyItem shape the
    // Szókincstár screen and /api/vocabulary expect.
    if (typeof window !== 'undefined') {
      try {
        const storedStr = localStorage.getItem('zsoca_vocabulary');
        const list: VocabularyItem[] = storedStr ? JSON.parse(storedStr) : [];
        const exists = list.some(
          (w) => w.german_word && w.german_word.toLowerCase() === vocab.german.toLowerCase()
        );

        if (!exists) {
          const newWord: VocabularyItem = {
            id: `vocab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            german_word: vocab.german,
            hungarian_translation: vocab.hungarian,
            pronunciation_notes: vocab.pronunciation_hint || '',
            difficulty_score: 1,
            category: moduleTitle,
            last_practiced_at: new Date().toISOString(),
          };
          list.unshift(newWord);
          localStorage.setItem('zsoca_vocabulary', JSON.stringify(list));
          setSavedWords((prev) => new Set([...Array.from(prev), vocab.german.toLowerCase()]));
          showToast(`"${vocab.german}" elmentve a szókincstáradba! 📖`);
        } else {
          showToast(`"${vocab.german}" már szerepel a szókincstáradban! ✨`);
        }
      } catch (e) {
        console.warn('Failed to save vocabulary locally:', e);
      }
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    // Stop active audio or mic
    stopSpeaking();
    setIsSpeakingId(null);
    if (isRecording) {
      stopRecording();
    }

    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      german_text: textToSend.trim(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const apiMessages = newHistory.map((m) => ({
        role: m.role,
        content: m.german_text || m.content || '',
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          moduleTitle,
          messages: apiMessages,
          userMessage: textToSend.trim(),
          turnCount,
        }),
      });

      const data: SituationalChatResponse & { turnCount: number } = await res.json();

      const aiMsg: ChatMessageItem = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        german_text: data.german_text,
        audio_text: data.audio_text,
        hungarian_translation: data.hungarian_translation,
        vocabulary_suggestions: data.vocabulary_suggestions || [],
        grammar_tip: data.grammar_tip || '',
        showTranslation: false,
        showGrammar: false,
      };

      setMessages([...newHistory, aiMsg]);
      setTurnCount(data.turnCount || turnCount + 1);

      // Auto speak AI response
      speakGerman(data.audio_text || data.german_text, {
        onEnd: () => setIsSpeakingId(null),
      });
      setIsSpeakingId(aiMsg.id);

      if (data.is_completed) {
        handleModuleCompletion();
      }
    } catch (err) {
      console.error('Error submitting practice message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModuleCompletion = () => {
    setIsCompleted(true);

    // Update local storage learning plan
    if (typeof window !== 'undefined') {
      try {
        const storedPlan = localStorage.getItem('zsoca_learning_plan');
        if (storedPlan) {
          const plan = JSON.parse(storedPlan);
          const currentIdx = plan.modules?.findIndex(
            (m: any) => String(m.order_index) === moduleId || String(m.id) === moduleId
          );

          if (currentIdx !== -1 && plan.modules[currentIdx]) {
            plan.modules[currentIdx].status = 'completed';
            // Unlock next module if available
            if (plan.modules[currentIdx + 1] && plan.modules[currentIdx + 1].status === 'locked') {
              plan.modules[currentIdx + 1].status = 'available';
            }
            localStorage.setItem('zsoca_learning_plan', JSON.stringify(plan));
          }
        }
      } catch (err) {
        console.warn('Error updating module status in localStorage:', err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const restartPractice = () => {
    setIsCompleted(false);
    setTurnCount(0);
    setMessages([]);
    startPracticeSession();
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg backdrop-blur-sm border border-slate-700 animate-fade-in flex items-center space-x-2">
          <BookmarkCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sticky Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link
              href="/"
              className="p-2 -ml-1 text-slate-600 hover:text-slate-900 active:bg-slate-100 rounded-xl transition-colors"
              title="Vissza a Tantervhez"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                {moduleId}. Modul Gyakorlása
              </span>
              <h1 className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                {moduleTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              {Math.min(turnCount, 4)} / 4 kör
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (turnCount / 4) * 100)}%` }}
          />
        </div>
      </header>

      {/* Chat Stream */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-4 shadow-sm text-sm ${
                  isAssistant
                    ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm space-y-3'
                    : 'bg-blue-600 text-white rounded-tr-sm'
                }`}
              >
                {/* Main German Sentence */}
                <p className="leading-relaxed font-semibold text-[15px]">
                  {msg.german_text || msg.content}
                </p>

                {isAssistant && (
                  <>
                    {/* Hungarian Translation Accordion */}
                    {msg.showTranslation && msg.hungarian_translation && (
                      <div className="text-xs text-slate-700 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/70 animate-fade-in">
                        <span className="font-bold text-amber-900 block mb-0.5">
                          🇭🇺 Magyar jelentés:
                        </span>
                        {msg.hungarian_translation}
                      </div>
                    )}

                    {/* Vocabulary Pills Section */}
                    {msg.vocabulary_suggestions && msg.vocabulary_suggestions.length > 0 && (
                      <div className="pt-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          <span>Hasznos kifejezések:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.vocabulary_suggestions.map((vocab, vIdx) => {
                            const isSaved = savedWords.has(vocab.german.toLowerCase());

                            return (
                              <button
                                key={vIdx}
                                type="button"
                                onClick={() => handleSaveWord(vocab)}
                                className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center space-x-1 transition-all active:scale-95 ${
                                  isSaved
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200 hover:border-blue-300'
                                }`}
                                title="Kattints a kiejtéshez és mentéshez a szótárba!"
                              >
                                <span>{vocab.german}</span>
                                <span className="text-[10px] text-slate-400">
                                  ({vocab.hungarian})
                                </span>
                                {isSaved ? (
                                  <BookmarkCheck className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Volume2 className="w-3 h-3 text-blue-500 opacity-70" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Collapsible Grammar Tip Card */}
                    {msg.grammar_tip && (
                      <div>
                        {msg.showGrammar ? (
                          <div className="bg-indigo-50 border border-indigo-200 text-indigo-950 p-2.5 rounded-xl text-xs space-y-1 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <span className="font-bold flex items-center space-x-1 text-indigo-800">
                                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Nyelvtani megjegyzés:</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleGrammar(msg.id)}
                                className="text-[10px] text-indigo-600 underline font-semibold"
                              >
                                Elrejtés
                              </button>
                            </div>
                            <p className="leading-relaxed">{msg.grammar_tip}</p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleGrammar(msg.id)}
                            className="text-[11px] font-semibold text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <Lightbulb className="w-3 h-3 text-indigo-500" />
                            <span>📖 Nyelvtani tipp megtekintése</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Action Bar on AI message */}
                    <div className="flex items-center space-x-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleSpeak(msg.audio_text || msg.german_text || '', msg.id)}
                        className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                          isSpeakingId === msg.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Kiejtés felolvasása"
                      >
                        {isSpeakingId === msg.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Kiejtés</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleTranslation(msg.id)}
                        className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg border bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 transition-colors"
                        title="Magyar fordítás"
                      >
                        <Languages className="w-3.5 h-3.5 text-blue-600" />
                        <span>{msg.showTranslation ? 'Elrejtés' : 'Magyarul'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs pl-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
            <div
              className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
              style={{ animationDelay: '0.2s' }}
            />
            <div
              className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
              style={{ animationDelay: '0.4s' }}
            />
            <span>Beszélgetőtárs gondolkodik...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </main>

      {/* Completion Modal Overlay */}
      {isCompleted && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 rounded-2xl flex items-center justify-center mx-auto shadow-md transform rotate-3">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">
                Szép volt, Zsóca! 🎉
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Sikeresen végigcsináltad a(z) <span className="font-semibold">{moduleTitle}</span> szituációs beszélgetést!
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs space-y-1">
              <div className="font-bold flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Modul Teljesítve</span>
              </div>
              <p className="text-emerald-700 text-[11px]">
                A tanterved automatikusan frissült, a következő modul megnyílt számodra!
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-colors text-sm"
              >
                <span>Vissza a tantervhez</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/vocabulary"
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors text-xs"
              >
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Szókincstár megtekintése</span>
              </Link>

              <button
                type="button"
                onClick={restartPractice}
                className="text-xs text-slate-500 hover:text-slate-700 py-1 font-semibold block mx-auto transition-colors"
              >
                🔄 Szituáció újragyakorlása
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Bar */}
      {!isCompleted && (
        <footer className="bg-white border-t border-slate-200 p-3 sticky bottom-0 z-20 shadow-md">
          {/* Quick situation response suggestions */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium">
              Gyors mondatok:
            </span>
            <button
              type="button"
              onClick={() => handleSendMessage('Ich möchte bitte einen Kaffee und ein Croissant.')}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
            >
              ☕ Ich möchte bitte...
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Was kostet das zusammen?')}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
            >
              💶 Was kostet das?
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Vielen Dank, auf Wiedersehen!')}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
            >
              👋 Auf Wiedersehen!
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Pulsating Big Microphone Button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white ring-4 ring-rose-200 animate-pulse'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 active:scale-95'
              }`}
              title={
                speechSupported
                  ? isRecording
                    ? 'Felvétel leállítása'
                    : 'Beszéd németül mikrofonnal'
                  : 'A böngésző nem támogatja a mikrofonos felismerést'
              }
            >
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isRecording
                    ? 'Hallgatlak... mondd németül!'
                    : 'Írd be vagy mondd a választ...'
                }
                disabled={isLoading}
                className="w-full bg-slate-100 text-slate-900 placeholder:text-slate-400 text-sm rounded-full pl-4 pr-4 py-3 border border-transparent focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 shadow-sm"
              title="Üzenet elküldése"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
