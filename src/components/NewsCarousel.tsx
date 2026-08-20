import React, { useState } from 'react';
import { NewsArticle, Language } from '../types';
import { getArticleImageUrl } from '../utils/imageUtils';
import { getCleanArticleLink } from '../utils/linkUtils';
import { CATEGORY_HINDI_MAP } from '../utils/hindiTranslator';
import { ChevronLeft, ChevronRight, Sparkles, ExternalLink } from 'lucide-react';

interface NewsCarouselProps {
  articles: NewsArticle[];
  onOpenArticle: (article: NewsArticle) => void;
  language?: Language;
}

export const NewsCarousel: React.FC<NewsCarouselProps> = ({ articles, onOpenArticle, language = 'en' }) => {
  const [startIndex, setStartIndex] = useState(0);

  if (!articles || articles.length === 0) return null;

  const total = articles.length;
  const visibleCount = 4;
  const isHindi = language === 'hi';

  const handlePrev = () => {
    setStartIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev + 1) % total);
  };

  // Get 4 contiguous articles (wrapping around)
  const visibleArticles: NewsArticle[] = [];
  for (let i = 0; i < Math.min(visibleCount, total); i++) {
    const idx = (startIndex + i) % total;
    visibleArticles.push(articles[idx]);
  }

  return (
    <div className="w-full bg-[#faf7ee] border-2 border-black p-3 sm:p-4 neo-shadow font-neo">
      <div className="flex items-center justify-between mb-3 border-b-2 border-black pb-2">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-[#ccff00] border border-black neo-shadow-sm text-black">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-black">
            {isHindi ? '⚡ शीर्ष सुर्खियाँ (FEATURED)' : '⚡ TOP HIGHLIGHTS (FEATURED)'}
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold bg-black text-[#ccff00] px-2 py-0.5 border border-black">
          {startIndex + 1}-{Math.min(startIndex + visibleCount, total)} / {total}
        </span>
      </div>

      <div className="flex items-center gap-2">
        
        {/* Left Carousel Arrow */}
        <button
          onClick={handlePrev}
          className="w-8 h-20 bg-white hover:bg-[#ccff00] text-black flex items-center justify-center border-2 border-black neo-shadow-sm transition-all shrink-0 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          aria-label="Previous Stories"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* 4-Card Grid Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 flex-1 min-w-0">
          {visibleArticles.map((article) => {
            const displayTitle = isHindi
              ? (article.hindi?.title || article.aiSummary?.rephrasedTitle || article.title)
              : (article.aiSummary?.rephrasedTitle || article.title);
            const displayCategory = isHindi
              ? (CATEGORY_HINDI_MAP[article.category] || article.category)
              : article.category;
            const cleanLink = getCleanArticleLink(article);

            return (
              <a
                key={article.id}
                href={cleanLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white p-2.5 border-2 border-black hover:bg-[#ffe600]/30 hover:border-[#ff2a85] neo-shadow-sm transition-all cursor-pointer group min-w-0"
              >
                {/* Thumbnail */}
                <div className="w-16 h-14 sm:w-18 sm:h-16 shrink-0 bg-zinc-100 overflow-hidden border border-black">
                  <img
                    src={getArticleImageUrl(article.imageUrl, article.category, article.title)}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getArticleImageUrl(undefined, article.category, article.title);
                    }}
                  />
                </div>

                {/* Title & Category */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-[13px] font-black text-black group-hover:text-[#ff2a85] transition-colors line-clamp-2 leading-snug">
                    {displayTitle}
                  </h4>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-[#ccff00] text-black border border-black">
                      {displayCategory}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600 truncate">
                      {article.source}
                    </span>
                    <ExternalLink className="w-2.5 h-2.5 text-zinc-400 group-hover:text-black ml-auto shrink-0" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Right Carousel Arrow */}
        <button
          onClick={handleNext}
          className="w-8 h-20 bg-white hover:bg-[#ccff00] text-black flex items-center justify-center border-2 border-black neo-shadow-sm transition-all shrink-0 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          aria-label="Next Stories"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

      </div>
    </div>
  );
};


