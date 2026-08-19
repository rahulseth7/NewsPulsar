import React from 'react';
import { Database, HardDrive, ShieldCheck, Download, RefreshCw, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';

interface DatabaseTelemetryBarProps {
  totalArticles: number;
  lastRefreshedAt?: string;
  onOpenDatabase: () => void;
  onRefreshDatabase: () => void;
  isRefreshing: boolean;
  language?: Language;
}

export const DatabaseTelemetryBar: React.FC<DatabaseTelemetryBarProps> = ({
  totalArticles,
  lastRefreshedAt,
  onOpenDatabase,
  onRefreshDatabase,
  isRefreshing,
  language = 'en',
}) => {
  return (
    <section className="w-full bg-[#ccff00] border-2 border-black neo-shadow p-3 sm:p-4 font-neo text-black mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        
        {/* Left Side: Database Status & Integrity Guarantee */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-[#ccff00] border-2 border-black flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-neo font-black text-sm sm:text-base uppercase tracking-tight">
                {language === 'hi' ? '🗄️ लाइव स्क्रैप किया गया समाचार डेटाबेस' : '🗄️ LIVE SCRAPED NEWS DATABASE'}
              </span>
              <span className="bg-black text-[#ccff00] font-mono text-xs font-black px-2 py-0.5 border border-black animate-pulse">
                {totalArticles} {language === 'hi' ? 'लेख सुरक्षित' : 'RECORDS STORED'}
              </span>
              <span className="hidden lg:inline-flex items-center gap-1 bg-white text-black font-mono text-[10px] font-black px-2 py-0.5 border border-black">
                <ShieldCheck className="w-3 h-3 text-[#00a86b]" />
                <span>ZERO DATA LOSS GUARANTEE</span>
              </span>
            </div>
            <p className="text-xs font-bold text-zinc-900 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{language === 'hi' ? 'ड्युअल-लेयर डिस्क और इंडेक्स्ड डीबी स्टोरेज' : 'Dual-layer Server Disk JSON + Browser IndexedDB storage.'}</span>
              {lastRefreshedAt && (
                <span className="font-mono text-[11px] text-zinc-800 font-normal">
                  • {language === 'hi' ? 'अंतिम सिंक:' : 'Last Synced:'} {new Date(lastRefreshedAt).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end shrink-0">
          <button
            onClick={onOpenDatabase}
            className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-[#ccff00] font-neo font-black text-xs border-2 border-black neo-shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            title="Open Full Database Explorer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'डेटाबेस देखें' : 'EXPLORE DATABASE'}</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <a
            href="/api/news/export/excel"
            download="scraped_news_database.xlsx"
            className="px-3 py-1.5 bg-white hover:bg-black hover:text-white text-black font-neo font-black text-xs border-2 border-black neo-shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download full database as Excel spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'एक्सेल (.xlsx)' : 'EXCEL (.XLSX)'}</span>
          </a>

          <button
            onClick={onRefreshDatabase}
            disabled={isRefreshing}
            className="p-1.5 bg-white hover:bg-black hover:text-[#ccff00] text-black border-2 border-black neo-shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Scrape and commit new articles immediately"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>
    </section>
  );
};
