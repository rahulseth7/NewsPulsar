import React from 'react';
import { ArrowLeft, BarChart3, Database, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { AdminDashboard } from '../components/AdminDashboard';
import { NewsArticle } from '../types';

interface DashboardPageProps {
  onBackToNews: () => void;
  onNavigatePage: (page: 'about' | 'advertise' | 'contact' | 'privacy' | 'dashboard') => void;
  articles: NewsArticle[];
  onArticlesUpdated: (updatedArticles: NewsArticle[]) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onBackToNews,
  onNavigatePage,
  articles,
  onArticlesUpdated
}) => {
  return (
    <div className="w-full bg-[#faf7ee] text-black font-neo pb-16 min-h-screen">
      {/* 1. Breadcrumb Bar */}
      <div className="bg-[#ffe600] border-b-2 border-black py-2.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase">
            <button 
              onClick={onBackToNews}
              className="flex items-center gap-1.5 bg-black text-[#ccff00] px-3 py-1 border border-black hover:bg-zinc-800 transition-all cursor-pointer neo-shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Live News</span>
            </button>
            <span className="text-black/40">/</span>
            <span className="bg-white px-2 py-0.5 border border-black">NEWSROOM COMMAND &amp; ANALYTICS DASHBOARD</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span className="bg-black text-[#ccff00] px-2 py-0.5 border border-black">
              LIVE TELEMETRY ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* 2. Embedded Standalone Full-Page Admin Dashboard View */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 pt-6">
        <AdminDashboard
          isOpen={true}
          onClose={onBackToNews}
          articles={articles}
          onArticlesUpdated={onArticlesUpdated}
        />
      </div>
    </div>
  );
};
