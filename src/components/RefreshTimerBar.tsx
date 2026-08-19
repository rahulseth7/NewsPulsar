import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap, Pause, Play, Database, CheckCircle2, Sparkles } from 'lucide-react';

interface RefreshTimerBarProps {
  lastRefreshedAt: string;
  nextRefreshAt: string;
  refreshIntervalSeconds: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  totalArticles: number;
}

export const RefreshTimerBar: React.FC<RefreshTimerBarProps> = ({
  lastRefreshedAt,
  nextRefreshAt,
  refreshIntervalSeconds = 600, // 10 minutes default
  onRefresh,
  isRefreshing,
  totalArticles,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!nextRefreshAt) return 600;
      const targetTime = new Date(nextRefreshAt).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
      return diff;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      if (isPaused) return;
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0 && !isRefreshing) {
        console.log('10 minute countdown finished. Triggering auto-refresh...');
        onRefresh();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextRefreshAt, isRefreshing, isPaused, onRefresh]);

  const progressPercent = Math.min(100, Math.max(0, ((refreshIntervalSeconds - timeLeft) / refreshIntervalSeconds) * 100));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedLastScraped = lastRefreshedAt
    ? new Date(lastRefreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  return (
    <div className="bg-slate-50/90 border-b border-slate-200 px-3 sm:px-6 py-2 text-xs text-slate-700 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-3">
        
        {/* Status Badges */}
        <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 flex-wrap text-center sm:text-left w-full md:w-auto">
          <span className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-xs shadow-2xs">
            <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{totalArticles}</span> Stories Live
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px] bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded-xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Sync Active</span>
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-slate-500 text-[11px] sm:text-xs">
            Last update: <span className="text-slate-800 font-mono font-medium">{formattedLastScraped}</span>
          </span>
        </div>

        {/* 10-Minute Auto-Refresh Countdown Progress */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full md:w-auto border-t md:border-t-0 border-slate-200 pt-1.5 md:pt-0">
          <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium shrink-0">
            <span>Next Drop:</span>
            <span className="text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 border border-blue-200 rounded-xs text-[11px]">
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Sleek Blue Progress Bar */}
          <div className="flex-1 sm:w-28 md:w-32 bg-slate-200 h-2 rounded-full relative min-w-[50px] overflow-hidden">
            <div
              className="h-full transition-all duration-1000 ease-linear bg-blue-600 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Controls: Pause and Quick Refresh */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer min-w-[28px] min-h-[28px] rounded-xs flex items-center justify-center shadow-2xs"
              title={isPaused ? 'Resume 10-min news drop cycle' : 'Pause auto-refresh cycle'}
              aria-label={isPaused ? 'Resume auto-refresh' : 'Pause auto-refresh'}
            >
              {isPaused ? <Play className="w-3 h-3 fill-slate-700 text-slate-700" /> : <Pause className="w-3 h-3 text-slate-700" />}
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 transition-all disabled:opacity-50 cursor-pointer min-w-[28px] min-h-[28px] rounded-xs flex items-center justify-center shadow-xs"
              title="Trigger instant news drop"
              aria-label="Refresh news now"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
