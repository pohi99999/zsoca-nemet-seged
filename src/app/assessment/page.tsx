'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Volume2,
  Mic,
  MicOff,
  Send,
  Languages,
  CheckCircle2,
  Target,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  VolumeX,
} from 'lucide-react';
import { speakGerman, stopSpeaking } from '@/lib/speech/speechSynthesis';
import { isSpeechRecognitionSupported } from '@/lib/speech/speechRecognition';
import { useSpeechRecorder } from '@/lib/speech/useSpeechRecorder';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  translation_hu?: string;
  audio_text?: string;
  showTranslation?: boolean;
}

interface AssessmentResultData {
  summary: string;
  estimated_level: string;
  strengths: string[];
  focus_areas: string[];
  recommended_modules?: string[];
}

export default function AssessmentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [isComplete, setIsComplete] = useState(false);
  const [resultData, setResultData] = useState<AssessmentResultData | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  // Initialize Speech Support & Initial Question
  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
    startAssessment();

    return () => {
      stopSpeaking();
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const startAssessment = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: [] }),
      });
      const data = await res.json();

      if (data.message) {
        const initialMsg: Message = {
          id: 'msg-1',
          role: 'assistant',
          content: data.message.content,
          translation_hu: data.message.translation_hu,
          audio_text: data.message.audio_text,
          showTranslation: false,
        };
        setMessages([initialMsg]);
        setQuestionIndex(data.questionIndex || 1);
        setTotalQuestions(data.totalQuestions || 5);

        // Auto speak first greeting
        speakGerman(data.message.audio_text || data.message.content, {
          onEnd: () => setIsSpeakingId(null),
        });
        setIsSpeakingId('msg-1');
      }
    } catch (err) {
      console.error('Failed to load initial assessment question:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (msg: Message) => {
    if (isSpeakingId === msg.id) {
      stopSpeaking();
      setIsSpeakingId(null);
      return;
    }

    setIsSpeakingId(msg.id);
    speakGerman(msg.audio_text || msg.content, {
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

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    // Stop active speech or mic
    stopSpeaking();
    setIsSpeakingId(null);
    if (isRecording) {
      stopRecording();
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const apiHistory = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: apiHistory }),
      });

      const data = await res.json();

      if (data.done) {
        setIsComplete(true);
        setResultData({
          summary: data.summary,
          estimated_level: data.estimated_level,
          strengths: data.strengths || [],
          focus_areas: data.focus_areas || [],
          recommended_modules: data.recommended_modules || [],
        });

        // Save result in localStorage for offline dashboard support
        if (typeof window !== 'undefined') {
          localStorage.setItem('zsoca_assessment_done', 'true');
          localStorage.setItem('zsoca_level', data.estimated_level || 'A2');
          localStorage.setItem('zsoca_assessment_summary', JSON.stringify(data));
        }
      } else if (data.message) {
        const nextMsg: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.message.content,
          translation_hu: data.message.translation_hu,
          audio_text: data.message.audio_text,
          showTranslation: false,
        };
        setMessages([...newHistory, nextMsg]);
        setQuestionIndex(data.questionIndex || questionIndex + 1);

        // Auto read next question
        speakGerman(data.message.audio_text || data.message.content, {
          onEnd: () => setIsSpeakingId(null),
        });
        setIsSpeakingId(nextMsg.id);
      }
    } catch (err) {
      console.error('Error submitting assessment answer:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              DE
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Szintfelmérő</h1>
              <p className="text-xs text-slate-500">Zsóca Német Segéd</p>
            </div>
          </div>

          {!isComplete && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                {questionIndex} / {totalQuestions} kérdés
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {!isComplete && (
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, ((questionIndex - 1) / totalQuestions) * 100 + 10)}%`,
              }}
            />
          </div>
        )}
      </header>

      {/* Main Content: Chat Dialogue OR Completion Screen */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {isComplete && resultData ? (
          /* Assessment Completed Screen */
          <div className="space-y-4 py-2 animate-fade-in">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Szintfelmérés Befejezve!
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                A válaszaid alapján elkészült a személyes értékelésed.
              </p>

              <div className="inline-block bg-blue-50 border border-blue-200 text-blue-800 font-bold px-4 py-1.5 rounded-full text-sm mb-4">
                Becsült szint: {resultData.estimated_level}
              </div>

              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 text-left">
                {resultData.summary}
              </p>
            </div>

            {/* Strengths */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Erősségeid:</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {resultData.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Focus Areas */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm mb-3">
                <Target className="w-4 h-4 text-blue-600" />
                <span>Fókuszterületek a fejlődéshez:</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {resultData.focus_areas.map((area, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Modules */}
            {resultData.recommended_modules && resultData.recommended_modules.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 text-purple-700 font-bold text-sm mb-3">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>Javasolt gyakorló témakörök:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {resultData.recommended_modules.map((mod, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg"
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Button */}
            <div className="pt-2">
              <Link
                href="/"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-md transition-colors text-center"
              >
                <span>Tovább a személyes tantervemhez</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Chat Conversation Flow */
          <>
            <div className="text-center my-2">
              <span className="text-[11px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                Válaszolj németül hanggal vagy gépeléssel!
              </span>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'assistant' ? 'items-start' : 'items-end'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-sm ${
                    msg.role === 'assistant'
                      ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                      : 'bg-blue-600 text-white rounded-tr-sm'
                  }`}
                >
                  <p className="leading-relaxed font-medium">{msg.content}</p>

                  {/* Hungarian Translation Accordion for AI */}
                  {msg.role === 'assistant' && msg.translation_hu && (
                    <>
                      {msg.showTranslation && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60">
                          <span className="font-semibold text-amber-800">Magyarul: </span>
                          {msg.translation_hu}
                        </div>
                      )}

                      {/* Action buttons on AI message */}
                      <div className="flex items-center space-x-2 mt-3 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSpeak(msg)}
                          className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                            isSpeakingId === msg.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Német kiejtés felolvasása"
                        >
                          {isSpeakingId === msg.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                              <span>Megállítás</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Kiejtés</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleTranslation(msg.id)}
                          className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg border bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 transition-colors"
                          title="Magyar fordítás megtekintése"
                        >
                          <Languages className="w-3.5 h-3.5 text-blue-600" />
                          <span>{msg.showTranslation ? 'Elrejtés' : 'Magyarul'}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

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
                <span>Tanár válaszol...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </>
        )}
      </main>

      {/* Bottom Interactive Response Bar (Visible during assessment) */}
      {!isComplete && (
        <footer className="bg-white border-t border-slate-200 p-3 sticky bottom-0 z-10">
          {/* Quick Starter Suggestions */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-[11px] text-slate-400 whitespace-nowrap">Gyors segítség:</span>
            <button
              type="button"
              onClick={() =>
                handleSendMessage('Ich möchte bitte ein Brötchen und einen Kaffee.')
              }
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
            >
              🥐 Példa válasz
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Ich verstehe nicht ganz, kannst du helfen?')}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
            >
              ❓ Nem értem pontosan
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Big Mic Button */}
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
                    : 'Beszéd mikrofonnal (németül)'
                  : 'Böngésző mikrofon nem támogatott'
              }
            >
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Input Field */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isRecording ? 'Hallgatlak... mondd németül!' : 'Írd be vagy mondd a választ...'
                }
                disabled={isLoading}
                className="w-full bg-slate-100 text-slate-900 placeholder:text-slate-400 text-sm rounded-full pl-4 pr-10 py-3 border border-transparent focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 shadow-sm"
              title="Válasz elküldése"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
