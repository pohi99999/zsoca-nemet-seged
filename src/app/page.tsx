'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Target,
  BookOpen,
  CheckCircle2,
  Lock,
  Play,
  Clock,
  RotateCcw,
  ChevronRight,
  Award,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { LearningPlanResponse, LearningPlanModule, getMockLearningPlan } from '@/lib/ai/gemini';

export default function DashboardPage() {
  const [userName, setUserName] = useState('Zsóca');
  const [levelBadge, setLevelBadge] = useState('A2 - Beszéd Felelevenítés');
  const [plan, setPlan] = useState<LearningPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [assessmentDone, setAssessmentDone] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      let storedLevel = 'A2 - Beszéd Felelevenítés';
      let hasAssessment = false;
      let assessmentSummaryData = null;

      if (typeof window !== 'undefined') {
        const localLevel = localStorage.getItem('zsoca_level');
        if (localLevel) {
          storedLevel = localLevel.includes('A2')
            ? 'A2 - Beszéd Felelevenítés'
            : localLevel;
          setLevelBadge(storedLevel);
        }

        const localAssessment = localStorage.getItem('zsoca_assessment_done');
        if (localAssessment === 'true') {
          hasAssessment = true;
          setAssessmentDone(true);
        }

        const storedSummary = localStorage.getItem('zsoca_assessment_summary');
        if (storedSummary) {
          try {
            assessmentSummaryData = JSON.parse(storedSummary);
          } catch (e) {
            console.warn('Failed to parse assessment summary:', e);
          }
        }

        // Check if cached plan exists in localStorage
        const cachedPlanStr = localStorage.getItem('zsoca_learning_plan');
        if (cachedPlanStr) {
          try {
            const cached = JSON.parse(cachedPlanStr);
            setPlan(cached);
            setIsLoading(false);
            return;
          } catch (e) {
            console.warn('Failed to parse cached plan:', e);
          }
        }
      }

      // If assessment just completed or no cached plan, fetch/generate from API
      if (hasAssessment && assessmentSummaryData) {
        setIsGeneratingPlan(true);
        try {
          const res = await fetch('/api/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userName: 'Zsóca',
              estimated_level: storedLevel,
              strengths: assessmentSummaryData.strengths || [],
              focus_areas: assessmentSummaryData.focus_areas || [],
            }),
          });
          const data = await res.json();
          if (data.plan) {
            setPlan(data.plan);
            if (typeof window !== 'undefined') {
              localStorage.setItem('zsoca_learning_plan', JSON.stringify(data.plan));
            }
            setIsGeneratingPlan(false);
            setIsLoading(false);
            return;
          }
        } catch (planApiErr) {
          console.warn('Could not generate plan from API, using fallback:', planApiErr);
        } finally {
          setIsGeneratingPlan(false);
        }
      }

      // Fallback: Fetch standard plan or mock
      try {
        const res = await fetch('/api/plan');
        const data = await res.json();
        if (data.plan) {
          setPlan(data.plan);
          if (typeof window !== 'undefined') {
            localStorage.setItem('zsoca_learning_plan', JSON.stringify(data.plan));
          }
        } else {
          setPlan(getMockLearningPlan(storedLevel));
        }
      } catch (err) {
        setPlan(getMockLearningPlan(storedLevel));
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
      setPlan(getMockLearningPlan('A2'));
    } finally {
      setIsLoading(false);
    }
  };

  const modules = plan?.modules || [];
  const completedCount = modules.filter((m) => m.status === 'completed').length;
  const progressPercentage =
    modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-slate-50 text-slate-900 pb-24">
      {/* Top Mobile Header */}
      <header className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white px-5 pt-7 pb-6 rounded-b-[2rem] shadow-lg relative overflow-hidden">
        {/* Background decorative bubbles */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-blue-400/20 rounded-full blur-lg pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border border-white/30 text-white">
                DE
              </div>
              <div>
                <p className="text-xs font-medium text-blue-100 uppercase tracking-wider">
                  Német Beszéd Segéd
                </p>
                <h1 className="text-xl font-bold text-white leading-tight">
                  Hallo {userName}! 👋
                </h1>
              </div>
            </div>

            <Link
              href="/assessment"
              className="p-2.5 bg-white/15 hover:bg-white/25 active:scale-95 transition-all rounded-xl border border-white/20 text-white flex items-center justify-center"
              title="Szintfelmérő újraindítása"
            >
              <RotateCcw className="w-4 h-4" />
            </Link>
          </div>

          {/* Level Badge & Progress Bar Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-semibold text-blue-50">Jelenlegi szint:</span>
              </div>
              <span className="text-xs font-bold bg-amber-400/90 text-slate-900 px-2.5 py-0.5 rounded-full shadow-sm">
                {levelBadge}
              </span>
            </div>

            {/* Overall Progress */}
            <div>
              <div className="flex items-center justify-between text-xs text-blue-100 font-medium mb-1.5">
                <span>Tanterv haladás</span>
                <span>
                  {completedCount} / {modules.length} modul ({progressPercentage}%)
                </span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden border border-white/10">
                <div
                  className="bg-emerald-400 h-2 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.max(5, progressPercentage)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 pt-5 space-y-5">
        {/* Banner if assessment not done */}
        {!assessmentDone && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl shadow-sm flex items-start space-x-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl flex-shrink-0 mt-0.5">
              <Target className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-amber-900">
                Végezd el az 5 perces szintfelmérőt!
              </h2>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Tedd próbára magad a barátságos szituációs beszélgetésben a személyre szabott tantervedhez.
              </p>
              <Link
                href="/assessment"
                className="inline-flex items-center space-x-1 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-3 py-1.5 rounded-lg mt-2.5 transition-colors"
              >
                <span>Felmérés indítása</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Gyakorlati Szituációk</span>
            </h2>
            <p className="text-xs text-slate-500">
              5 lépés a magabiztos mindennapi beszédhez
            </p>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            5 Modul
          </span>
        </div>

        {/* Loading State */}
        {isLoading || isGeneratingPlan ? (
          <div className="space-y-3 py-4">
            <div className="text-center py-6">
              <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-medium text-slate-600">
                {isGeneratingPlan
                  ? 'Személyre szabott tanterv generálása Gemini AI-val...'
                  : 'Modulok betöltése...'}
              </p>
            </div>
          </div>
        ) : (
          /* Modules List */
          <div className="space-y-3.5">
            {modules.map((module: LearningPlanModule, index: number) => {
              const isAvailable = module.status === 'available';
              const isCompleted = module.status === 'completed';
              const isLocked = module.status === 'locked';

              return (
                <div
                  key={module.id || `module-${module.order_index || index + 1}`}
                  className={`bg-white rounded-2xl p-4 border transition-all shadow-sm ${
                    isAvailable
                      ? 'border-blue-300 ring-2 ring-blue-500/10 shadow-blue-50/50'
                      : isCompleted
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isAvailable
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {module.order_index || index + 1}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {module.title}
                      </h3>
                    </div>

                    {/* Status Badge */}
                    {isCompleted ? (
                      <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Kész</span>
                      </span>
                    ) : isAvailable ? (
                      <span className="flex items-center space-x-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full animate-pulse">
                        <span>Aktív</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Zárolva</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed pl-9">
                    {module.description}
                  </p>

                  {/* Goal & Duration */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 pl-9">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{module.estimated_duration || '10-15 perc'}</span>
                    </div>

                    {/* Action Button */}
                    {isAvailable || isCompleted ? (
                      <Link
                        href={`/practice/${module.id || module.order_index || index + 1}`}
                        className="inline-flex items-center space-x-1 font-bold text-xs px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl shadow-sm transition-transform active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isCompleted ? 'Ismétlés' : 'Gyakorlás indítása'}</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium cursor-not-allowed">
                        Előző modul után elérhető
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3 flex items-center justify-around z-20 shadow-lg">
        <Link
          href="/"
          className="flex flex-col items-center space-y-1 text-blue-600 font-bold transition-colors"
        >
          <div className="p-1 bg-blue-50 rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-[11px]">Tanterv</span>
        </Link>

        <Link
          href="/vocabulary"
          className="flex flex-col items-center space-y-1 text-slate-500 hover:text-blue-600 transition-colors"
        >
          <div className="p-1 rounded-xl">
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
