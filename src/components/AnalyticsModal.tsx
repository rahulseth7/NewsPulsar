import React, { useState, useEffect } from 'react';
import { NewsSourceInfo } from '../types';
import { X, Rss, BarChart3, CheckCircle2, AlertCircle, RefreshCw, Layers, Database, Download, FileSpreadsheet, FileJson, FileText, HardDrive } from 'lucide-react';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: NewsSourceInfo[];
  stats: {
    categoryCounts: Record<string, number>;
    sourceCounts: Record<string, number>;
    sentimentCounts: Record<string, number>;
  };
  totalArticles: number;
  refreshCount: number;
  lastRefreshedAt: string;
  onToggleSourceActive: (sourceId: string, active: boolean) => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  sources,
  stats,
  totalArticles,
  refreshCount,
  lastRefreshedAt,
  onToggleSourceActive,
}) => {
  const [storageInfo, setStorageInfo] = useState<{
    storageFile: string;
    excelFile: string;
    fileSizeKb: number;
    totalArticlesStored: number;
    lastModified: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/news/storage-info')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setStorageInfo(data);
          }
        })
        .catch(err => console.error('Error fetching storage info:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalSourcesCount = sources.length;
  const activeSourcesCount = sources.filter(s => s.active).length;

  return (
    <div className="fixed inset-0 z-50 w-full h-full min-h-screen bg-[#faf8f5] flex flex-col overflow-hidden font-neo animate-fade-in">
      <div className="relative w-full h-full flex flex-col overflow-hidden text-black bg-[#faf8f5]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-4 border-b-[2.5px] border-black bg-[#ccff00] shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 border-2 border-black bg-white hover:bg-[#ffe600] text-black font-neo font-black text-xs transition-all neo-shadow-sm cursor-pointer"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-black" />
              <h2 className="text-sm sm:text-base font-black text-black uppercase tracking-wide">
                ⚡ LIVE SCRAPER ANALYTICS & DISK DATABASE
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-black bg-black text-white hover:bg-zinc-800 transition-colors cursor-pointer neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#fffdfa]">
          
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#00f0ff]/20 p-4 border-2 border-black neo-shadow-sm text-center">
              <span className="text-2xl sm:text-3xl font-black text-black font-mono">{totalArticles}</span>
              <p className="text-xs font-bold text-black mt-1 uppercase">Stored Articles</p>
            </div>

            <div className="bg-[#ccff00]/30 p-4 border-2 border-black neo-shadow-sm text-center">
              <span className="text-2xl sm:text-3xl font-black text-black font-mono">{activeSourcesCount}/{totalSourcesCount}</span>
              <p className="text-xs font-bold text-black mt-1 uppercase">Active Feeds</p>
            </div>

            <div className="bg-[#ffe600]/30 p-4 border-2 border-black neo-shadow-sm text-center">
              <span className="text-2xl sm:text-3xl font-black text-black font-mono">10m</span>
              <p className="text-xs font-bold text-black mt-1 uppercase">Scrape Cycle</p>
            </div>

            <div className="bg-[#ff2a85]/20 p-4 border-2 border-black neo-shadow-sm text-center">
              <span className="text-2xl sm:text-3xl font-black text-black font-mono">#{refreshCount}</span>
              <p className="text-xs font-bold text-black mt-1 uppercase">Runs Count</p>
            </div>
          </div>

          {/* Persistent Database Storage & Download Center */}
          <div className="bg-white p-4 sm:p-5 border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#b057ff] text-white border-2 border-black neo-shadow-sm">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-black uppercase">Disk Database Center</h3>
                  <p className="text-xs text-zinc-600 font-body">
                    Automated real-time persistence and deduplication on server disk.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-black bg-[#00f5a0] text-black border-2 border-black neo-shadow-sm">
                <HardDrive className="w-3.5 h-3.5" />
                ACTIVE ON DISK
              </span>
            </div>

            {storageInfo && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-black bg-[#faf7ee] p-3 border-2 border-black font-mono">
                <div>
                  <span className="text-zinc-600 block text-[10px] font-bold">DB FILE</span>
                  <span className="text-black font-black">{storageInfo.storageFile}</span>
                </div>
                <div>
                  <span className="text-zinc-600 block text-[10px] font-bold">DB SIZE</span>
                  <span className="text-black font-black">{storageInfo.fileSizeKb} KB</span>
                </div>
                <div>
                  <span className="text-zinc-600 block text-[10px] font-bold">LAST WRITE</span>
                  <span className="text-black font-black">{new Date(storageInfo.lastModified).toLocaleTimeString()}</span>
                </div>
              </div>
            )}

            {/* Download Data Buttons */}
            <div className="space-y-2">
              <span className="text-xs font-black text-black uppercase tracking-wider block">Export Live Scraped Data:</span>
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href="/api/news/export/excel"
                  download
                  className="flex items-center gap-2 px-3.5 py-2 bg-[#00f5a0] text-black border-2 border-black text-xs font-black hover:bg-[#00d68c] transition-all cursor-pointer neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download Excel (.xlsx)</span>
                </a>

                <a
                  href="/api/news/export/json"
                  download
                  className="flex items-center gap-2 px-3.5 py-2 bg-[#ffe600] text-black border-2 border-black text-xs font-black hover:bg-[#e6cf00] transition-all cursor-pointer neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
                >
                  <FileJson className="w-4 h-4" />
                  <span>Download JSON (.json)</span>
                </a>

                <a
                  href="/api/news/export/csv"
                  download
                  className="flex items-center gap-2 px-3.5 py-2 bg-[#00f0ff] text-black border-2 border-black text-xs font-black hover:bg-[#00cbe6] transition-all cursor-pointer neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download CSV (.csv)</span>
                </a>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="space-y-3 bg-white p-4 border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000]">
            <h3 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5 font-neo">
              <Layers className="w-4 h-4 text-black" />
              Category Breakdown
            </h3>
            <div className="space-y-2.5">
              {Object.entries(stats.categoryCounts || {}).map(([cat, count]) => {
                const numCount = Number(count) || 0;
                const pct = totalArticles > 0 ? Math.round((numCount / totalArticles) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-black font-neo">
                      <span>{cat}</span>
                      <span className="font-mono">{numCount} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-2.5 border border-black overflow-hidden">
                      <div className="bg-[#ff2a85] h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Sources Management Checklist */}
          <div className="space-y-3 bg-white p-4 border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000]">
            <h3 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5 font-neo">
              <Rss className="w-4 h-4 text-black" />
              Connected News Sources ({sources.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sources.map((src) => (
                <div
                  key={src.id}
                  className="flex items-center justify-between p-3 bg-[#faf7ee] border-2 border-black neo-shadow-sm"
                >
                  <div className="truncate pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-black truncate">{src.name}</span>
                      <span className="px-1.5 py-0.2 text-[10px] font-black bg-[#ffe600] text-black border border-black">{src.category}</span>
                    </div>
                    <p className="text-[10px] text-zinc-600 truncate mt-0.5 font-mono">{src.feedUrl}</p>
                  </div>

                  <button
                    onClick={() => onToggleSourceActive(src.id, !src.active)}
                    className={`px-3 py-1 text-xs font-black border-2 border-black transition-all shrink-0 cursor-pointer neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5 ${
                      src.active
                        ? 'bg-[#00f5a0] text-black'
                        : 'bg-zinc-200 text-zinc-500'
                    }`}
                  >
                    {src.active ? 'ACTIVE' : 'PAUSED'}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t-[2.5px] border-black bg-[#faf7ee] flex items-center justify-between text-xs font-mono text-black">
          <span className="font-bold">Disk DB: `scraped_articles_db.json`</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-black text-[#ccff00] font-neo font-black hover:bg-zinc-800 border-2 border-black neo-shadow-sm cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
