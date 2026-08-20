import React, { useState, useEffect } from 'react';
import { ChevronRight, ExternalLink, Flame } from 'lucide-react';
import { NewsArticle, Language } from '../types';
import { getCleanArticleLink } from '../utils/linkUtils';

interface TickerProps {
  breakingArticles: NewsArticle[];
  onSelectArticle: (article: NewsArticle) => void;
  language?: Language;
}

export const Ticker: React.FC<TickerProps> = ({ breakingArticles, onSelectArticle, language = 'en' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (breakingArticles.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % breakingArticles.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [breakingArticles.length]);

  if (!breakingArticles || breakingArticles.length === 0) return null;

  const activeArticle = breakingArticles[currentIndex];
  const isHindi = language === 'hi';
  const displayTitle = isHindi 
    ? (activeArticle.hindi?.title || activeArticle.aiSummary?.rephrasedTitle || activeArticle.title)
    : (activeArticle.aiSummary?.rephrasedTitle || activeArticle.title);

  return (
    <div className="bg-black text-white border-b-2 border-black text-xs font-neo">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
          
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#ff2a85] text-white font-black text-[11px] uppercase tracking-wider border border-white shrink-0 neo-shadow-sm">
            <Flame className="w-3.5 h-3.5 fill-white text-white shrink-0" />
            <span>{isHindi ? 'ताज़ा ख़बर' : 'BREAKING'}</span>
          </span>

          <a
            href={getCleanArticleLink(activeArticle)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 cursor-pointer truncate flex-1 transition-colors min-w-0"
          >
            <span className="font-bold text-zinc-100 group-hover:text-[#ccff00] truncate text-xs sm:text-[13px]">
              {displayTitle}
            </span>
            <span className="text-zinc-400 text-[11px] font-mono hidden md:inline">
              ({activeArticle.source})
            </span>
          </a>

          <a
            href={getCleanArticleLink(activeArticle)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-zinc-400 hover:text-black hover:bg-[#ffe600] border border-transparent hover:border-black transition-colors shrink-0"
            title="Open story in separate window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

        </div>

        <div className="flex items-center gap-2 shrink-0 text-zinc-400 text-[11px] font-mono">
          <span>
            {currentIndex + 1}/{breakingArticles.length}
          </span>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % breakingArticles.length)}
            className="p-1 hover:text-black hover:bg-[#ccff00] border border-transparent hover:border-black cursor-pointer transition-colors"
            aria-label="Next headline"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};


