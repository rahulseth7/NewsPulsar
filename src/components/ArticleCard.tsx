import React, { useState, useEffect } from 'react';
import { NewsArticle, Language } from '../types';
import { formatReadingTime } from '../utils/readingTime';
import { getArticleImageUrl } from '../utils/imageUtils';
import { getCleanArticleLink } from '../utils/linkUtils';
import { CATEGORY_HINDI_MAP } from '../utils/hindiTranslator';
import { Bookmark, Clock, ExternalLink, Calendar, User, Share2, Sparkles } from 'lucide-react';

interface ArticleCardProps {
  article: NewsArticle;
  isBookmarked: boolean;
  onToggleBookmark: (article: NewsArticle) => void;
  onOpenArticle: (article: NewsArticle) => void;
  onSelectTag?: (tag: string) => void;
  language?: Language;
}

function formatDate(dateStr: string, language: string = 'en'): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return language === 'hi' ? 'हाल ही में' : 'Recent';
  }
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  isBookmarked,
  onToggleBookmark,
  onOpenArticle,
  language = 'en',
}) => {
  const initialImg = getArticleImageUrl(article.imageUrl, article.category, article.title);
  const [imgSrc, setImgSrc] = useState(initialImg);

  useEffect(() => {
    setImgSrc(getArticleImageUrl(article.imageUrl, article.category, article.title));
  }, [article.imageUrl, article.category, article.title]);

  const handleImageError = () => {
    setImgSrc(getArticleImageUrl(undefined, article.category, article.title));
  };

  const isHindi = language === 'hi';
  const displayCategory = isHindi ? (CATEGORY_HINDI_MAP[article.category] || article.category) : article.category;
  const displayTitle = isHindi
    ? (article.hindi?.title || article.aiSummary?.rephrasedTitle || article.title)
    : (article.aiSummary?.rephrasedTitle || article.title);
  const displayLead = isHindi
    ? (article.hindi?.contentSnippet || article.hindi?.rephrasedLead || article.hindi?.description || article.aiSummary?.rephrasedLead || article.description)
    : (article.aiSummary?.rephrasedLead || article.aiSummary?.rephrasedStory || article.description);

  const cleanLink = getCleanArticleLink(article);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // If button was clicked (e.g. AI Summary, Bookmark, Share), let button handler manage it
    if (target.closest('button')) {
      return;
    }
    window.open(cleanLink, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({ title: displayTitle, url: cleanLink });
      } catch {
        // user cancelled
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(cleanLink);
      } catch {
        // clipboard fallback
      }
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className="group flex flex-col bg-white border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[7px_7px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer overflow-hidden font-neo"
      aria-label={`Article: ${displayTitle}`}
    >
      {/* Image Frame */}
      <a
        href={cleanLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button')) e.preventDefault();
        }}
        className="relative h-48 sm:h-52 w-full overflow-hidden bg-zinc-100 border-b-2 border-black block"
      >
        <img
          src={imgSrc}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={handleImageError}
        />

        {/* Category Pill on top of image */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
          <span className="px-2 py-0.5 text-[10px] font-neo font-black uppercase tracking-wider bg-[#ccff00] text-black border border-black neo-shadow-sm">
            {displayCategory}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-neo font-bold bg-black text-white border border-black">
            {article.source}
          </span>
          {isHindi && (
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-black bg-[#ff2a85] text-white border border-black">
              ⚡ हिन्दी
            </span>
          )}
        </div>

        {/* Bookmark Action Top Right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggleBookmark(article);
          }}
          className={`absolute top-2.5 right-2.5 p-1.5 bg-white border-2 border-black neo-shadow-sm transition-all cursor-pointer hover:bg-[#ffe600] active:translate-x-0.5 active:translate-y-0.5 z-10 ${
            isBookmarked ? 'text-[#ff2a85] bg-[#ffe600]' : 'text-black'
          }`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#ff2a85]' : ''}`} />
        </button>
      </a>

      {/* Article Body Content */}
      <div className="flex-1 p-4 flex flex-col justify-between gap-3">
        <div>
          {/* Metadata Row */}
          <div className="flex items-center gap-2.5 text-[11px] text-zinc-600 mb-2 font-mono font-semibold">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-black" />
              {formatDate(article.pubDate, language)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-black" />
              {isHindi ? `${article.readTimeMinutes || 2} मिनट` : formatReadingTime(article)}
            </span>
          </div>

          {/* Headline - Opens in New Window */}
          <a
            href={cleanLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-neo font-black text-base sm:text-lg text-black group-hover:text-[#ff2a85] transition-colors line-clamp-2 leading-snug tracking-tight block hover:underline"
          >
            {displayTitle}
          </a>

          {/* Narrative / Lead Excerpt */}
          <p className="mt-2 text-xs sm:text-[13px] text-zinc-800 line-clamp-3 leading-relaxed font-body font-medium">
            {displayLead}
          </p>
        </div>

        {/* Footer Actions Row */}
        <div className="pt-3 border-t-2 border-black flex items-center justify-between gap-2 text-xs font-neo">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenArticle(article);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-black bg-[#ccff00] hover:bg-[#b8e600] border-2 border-black neo-shadow-sm transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            title="Read AI Analysis and Summary"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isHindi ? '⚡ AI सम्पूर्ण विवरण' : 'AI SUMMARY'}</span>
          </button>

          <div className="flex items-center gap-1.5 text-black">
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 hover:bg-[#00f0ff] border border-black bg-white neo-shadow-sm transition-all cursor-pointer"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <a
              href={cleanLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-2 py-1.5 bg-black hover:bg-zinc-800 text-[#ccff00] font-black text-xs border border-black neo-shadow-sm flex items-center gap-1 transition-all cursor-pointer"
              title="Open full post in new window"
            >
              <span className="hidden sm:inline">OPEN</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </article>
  );
};


