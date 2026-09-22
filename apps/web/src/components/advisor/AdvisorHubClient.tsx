'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Sparkles, 
  MessageSquare, 
  TrendingUp, 
  Activity, 
  FileBadge, 
  CheckCircle2, 
  Lightbulb,
  ShieldCheck
} from 'lucide-react';
import { AskNnooChat } from '@/components/assistant/AskNnooChat';
import { InsightsDashboard } from '@/components/insights/InsightsDashboard';
import { HealthScoreDashboard } from '@/components/health/HealthScoreDashboard';
import { CreditPassportDashboard } from '@/components/credit-passport/CreditPassportDashboard';

interface AdvisorHubProps {
  businessId: string;
  businessSlug: string;
  businessName: string;
  currencyCode: string;
  userRole: string;
  userName: string;
  initialTab?: string;
  initialFacts: any;
  initialHistory: any[];
}

export function AdvisorHubClient({
  businessId,
  businessSlug,
  businessName,
  currencyCode = 'NGN',
  userRole,
  userName,
  initialTab = 'chat',
  initialFacts,
  initialHistory = [],
}: AdvisorHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || initialTab;

  const setTab = (tab: string) => {
    router.replace(`/app/${businessSlug}/advisor?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header & Advisor Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8F25C]/10 border border-[#B8F25C]/20 text-[#B8F25C] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI Business Advisor & Intelligence
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">AI Advisor & Health</h1>
          <p className="text-white/60 text-sm mt-1">
            Chat with Ask NNOO, review your business health, and generate verified credit passports.
          </p>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTab('chat')}
            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-medium transition"
          >
            💬 Ask: &quot;How much profit this week?&quot;
          </button>
          <button
            onClick={() => setTab('passport')}
            className="px-3 py-1.5 rounded-full bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-medium transition flex items-center gap-1.5"
          >
            <FileBadge className="w-3.5 h-3.5" />
            Get Loan Passport
          </button>
        </div>
      </div>

      {/* Hero Plain-English Advisory Card */}
      <div className="bg-gradient-to-r from-[#143628] via-[#102d21] to-[#0A1C16] border border-[#B8F25C]/20 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#B8F25C]/20 text-[#B8F25C] flex items-center justify-center shrink-0 border border-[#B8F25C]/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Your Business Intelligence Center</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B8F25C] text-[#0A1C16] font-bold">
                  Active
                </span>
              </div>
              <p className="text-xs text-white/70 mt-1 max-w-xl">
                NNOO continuously checks your sales, margins, expenses, and invoices to give you verified advice with zero guesswork.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setTab('health')}
              className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold rounded-xl text-xs hover:bg-emerald-500/30 transition"
            >
              Check Health Score
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar p-1.5 bg-black/30 border border-white/10 rounded-2xl">
          <button
            onClick={() => setTab('chat')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Ask NNOO (Chat)
          </button>
          <button
            onClick={() => setTab('insights')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'insights'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Smart Insights
          </button>
          <button
            onClick={() => setTab('health')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'health'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-4 h-4" />
            Business Health Score
          </button>
          <button
            onClick={() => setTab('passport')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'passport'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileBadge className="w-4 h-4" />
            Credit Passport (Bank Proof)
          </button>
        </div>

        {/* TAB 1: CHAT (ASK NNOO) */}
        {activeTab === 'chat' && (
          <div className="w-full">
            <AskNnooChat
              businessId={businessId}
              businessSlug={businessSlug}
              userRole={userRole}
              userName={userName}
            />
          </div>
        )}

        {/* TAB 2: SMART INSIGHTS */}
        {activeTab === 'insights' && (
          <div className="w-full">
            <InsightsDashboard
              businessSlug={businessSlug}
              businessName={businessName}
              currencyCode={currencyCode}
              initialFacts={initialFacts}
              initialHistory={initialHistory}
            />
          </div>
        )}

        {/* TAB 3: BUSINESS HEALTH SCORE */}
        {activeTab === 'health' && (
          <div className="w-full">
            <HealthScoreDashboard
              businessId={businessId}
              businessSlug={businessSlug}
              userRole={userRole}
            />
          </div>
        )}

        {/* TAB 4: CREDIT PASSPORT */}
        {activeTab === 'passport' && (
          <div className="w-full">
            <CreditPassportDashboard
              businessId={businessId}
              businessSlug={businessSlug}
              userRole={userRole}
            />
          </div>
        )}
      </div>
    </div>
  );
}
