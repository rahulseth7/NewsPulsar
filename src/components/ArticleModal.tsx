import React, { useState, useEffect } from 'react';
import { NewsArticle, AISummaryResponse, Language } from '../types';
import { fetchAISummary, translateArticleToHindi } from '../services/newsApi';
import { formatReadingTime } from '../utils/readingTime';
import { getArticleImageUrl } from '../utils/imageUtils';
import { getCleanArticleLink } from '../utils/linkUtils';
import { CATEGORY_HINDI_MAP } from '../utils/hindiTranslator';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SocialShare } from './SocialShare';
import { 
  X, 
  ExternalLink, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Bookmark, 
  Share2, 
  Check, 
  Clock, 
  Radio, 
  Copy,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Type,
  History,
  TrendingUp,
  Compass,
  Layers,
  FileText,
  Calendar
} from 'lucide-react';

interface ArticleModalProps {
  article: NewsArticle | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (article: NewsArticle) => void;
  onNextArticle?: () => void;
  onPrevArticle?: () => void;
  hasNextArticle?: boolean;
  hasPrevArticle?: boolean;
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
  isBookmarked,
  onToggleBookmark,
  onNextArticle,
  onPrevArticle,
  hasNextArticle = false,
  hasPrevArticle = false,
  language = 'en',
  onLanguageChange,
}) => {
  const [modalLanguage, setModalLanguage] = useState<Language>(language);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingHindi, setLoadingHindi] = useState(false);
  const [summaryData, setSummaryData] = useState<AISummaryResponse['summary'] | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [readerMode, setReaderMode] = useState(false);
  const [readerFontSize, setReaderFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [readerFontFamily, setReaderFontFamily] = useState<'serif' | 'sans'>('serif');
  const [readerTheme, setReaderTheme] = useState<'paper' | 'white' | 'sepia' | 'dark'>('paper');

  useEffect(() => {
    setModalLanguage(language);
  }, [language]);

  useEffect(() => {
    if (!article) {
      setSummaryData(null);
      setIsSpeaking(false);
      setShowShareMenu(false);
      return;
    }

    setShowShareMenu(false);

    if (article.aiSummary) {
      setSummaryData(article.aiSummary);
    } else {
      loadSummary();
    }

    if (modalLanguage === 'hi' && !article.hindi) {
      loadHindiTranslation();
    }

    // Dynamic SEO Metadata Injection
    const originalTitle = document.title;
    document.title = `${article.title} - ${article.source} | NewsPulse`;

    // Local keyboard shortcuts inside article modal
    const handleModalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setReaderMode(prev => !prev);
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowRight') {
        if (hasNextArticle && onNextArticle) {
          e.preventDefault();
          onNextArticle();
        }
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowLeft') {
        if (hasPrevArticle && onPrevArticle) {
          e.preventDefault();
          onPrevArticle();
        }
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setShowShareMenu(prev => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        onToggleBookmark(article);
      }
    };

    window.addEventListener('keydown', handleModalKeyDown);

    // Inject Meta Keywords & Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', article.metaDescription || article.description);

    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', (article.seoKeywords || []).join(', '));

    // Inject Schema.org JSON-LD NewsArticle Structured Data
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'seo-news-jsonld';
    jsonLdScript.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      'headline': article.title,
      'description': article.description,
      'image': article.imageUrl ? [article.imageUrl] : [],
      'datePublished': article.pubDate,
      'author': {
        '@type': 'Organization',
        'name': article.source,
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'NewsPulse Live',
      },
      'keywords': (article.seoKeywords || []).join(','),
      'mainEntityOfPage': getCleanArticleLink(article)
    });
    document.head.appendChild(jsonLdScript);

    return () => {
      window.removeEventListener('keydown', handleModalKeyDown);
      document.title = originalTitle;
      const existingJsonLd = document.getElementById('seo-news-jsonld');
      if (existingJsonLd) existingJsonLd.remove();
    };
  }, [article, hasNextArticle, hasPrevArticle, onNextArticle, onPrevArticle, onClose, onToggleBookmark, modalLanguage]);

  const loadSummary = async (forceRefresh = false) => {
    if (!article) return;
    setLoadingSummary(true);
    try {
      const res = await fetchAISummary(article);
      if (res.success && res.summary) {
        setSummaryData(res.summary);
      }
    } catch (err) {
      console.error('Failed to rephrase article:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadHindiTranslation = async () => {
    if (!article || article.hindi) return;
    setLoadingHindi(true);
    try {
      const res = await translateArticleToHindi(article);
      if (res) {
        article.hindi = res;
      }
    } catch (err) {
      console.error('Failed to translate to Hindi:', err);
    } finally {
      setLoadingHindi(false);
    }
  };

  const handleToggleLang = (newLang: Language) => {
    setModalLanguage(newLang);
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
    if (newLang === 'hi' && article && !article.hindi) {
      loadHindiTranslation();
    }
  };


  const isHindi = modalLanguage === 'hi';

  const handleSpeak = () => {
    if (!('speechSynthesis' in window) || !article) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let textToRead = '';
    if (isHindi) {
      const hi = article.hindi;
      const titleText = hi?.title || article.aiSummary?.rephrasedTitle || article.title;
      const storyText = hi?.rephrasedStory || hi?.rephrasedLead || hi?.description || article.description;
      const pointsText = hi?.bulletPoints ? `मुख्य बातें: ${hi.bulletPoints.join('. ')}.` : '';
      const whyText = hi?.whyItMatters ? `विश्लेषण: ${hi.whyItMatters}` : '';
      textToRead = `${titleText}. ${storyText} ${pointsText} ${whyText}`.trim();
    } else {
      const titleText = summaryData?.rephrasedTitle || article.title;
      const storyText = summaryData?.rephrasedStory || summaryData?.rephrasedLead || article.description;
      const pointsText = summaryData?.bulletPoints ? `Key developments: ${summaryData.bulletPoints.join('. ')}.` : '';
      const whyText = summaryData?.whyItMatters ? `Analysis: ${summaryData.whyItMatters}` : '';
      textToRead = `${titleText}. ${storyText} ${pointsText} ${whyText}`.trim();
    }

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = isHindi ? 'hi-IN' : 'en-US';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const copyToClipboard = () => {
    if (!article) return;
    const cleanLink = getCleanArticleLink(article);
    navigator.clipboard.writeText(cleanLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleNativeShare = async () => {
    if (!article) return;
    const cleanLink = getCleanArticleLink(article);

    const shareData = {
      title: isHindi ? (article.hindi?.title || article.title) : (summaryData?.rephrasedTitle || article.title),
      text: isHindi ? (article.hindi?.rephrasedLead || article.description) : (summaryData?.rephrasedLead || article.description),
      url: cleanLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  // Social platform sharing links
  const getSocialShareUrls = () => {
    if (!article) return {};
    const link = encodeURIComponent(getCleanArticleLink(article));
    const title = encodeURIComponent(isHindi ? (article.hindi?.title || article.title) : (summaryData?.rephrasedTitle || article.title));
    const summary = encodeURIComponent(isHindi ? (article.hindi?.rephrasedLead || article.description) : (summaryData?.rephrasedLead || summaryData?.rephrasedStory || article.description));

    return {
      x: `https://twitter.com/intent/tweet?text=${title}&url=${link}`,
      whatsapp: `https://api.whatsapp.com/send?text=${title}%20${link}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${link}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${link}`,
      telegram: `https://t.me/share/url?url=${link}&text=${title}`,
      reddit: `https://reddit.com/submit?url=${link}&title=${title}`,
      email: `mailto:?subject=${title}&body=${summary}%0A%0ARead%20more%3A%20${link}`,
    };
  };

  const socialLinks = getSocialShareUrls();

  if (!article) return null;

  // Theme styling for Reader Mode
  const themeClasses = {
    paper: 'bg-[#fbfaf8] text-[#1c1917]',
    white: 'bg-white text-zinc-900',
    sepia: 'bg-[#f4ecd8] text-[#433422]',
    dark: 'bg-[#18181b] text-[#e4e4e7]',
  };

  const themeHeaderClasses = {
    paper: 'bg-[#f5f2eb] border-[#e7e1d5] text-[#1c1917]',
    white: 'bg-zinc-50 border-zinc-200 text-zinc-900',
    sepia: 'bg-[#eae0c6] border-[#d8caa6] text-[#433422]',
    dark: 'bg-[#27272a] border-[#3f3f46] text-[#e4e4e7]',
  };

  const fontClasses = readerFontFamily === 'serif' ? 'font-serif' : 'font-sans';
  const sizeClasses = 
    readerFontSize === 'normal' ? 'text-base sm:text-lg leading-relaxed' :
    readerFontSize === 'large' ? 'text-lg sm:text-xl leading-relaxed sm:leading-loose' :
    'text-xl sm:text-2xl leading-loose';

  const displayCategory = isHindi ? (CATEGORY_HINDI_MAP[article.category] || article.category) : article.category;
  const displayTitle = isHindi 
    ? (article.hindi?.title || article.aiSummary?.rephrasedTitle || article.title)
    : (summaryData?.rephrasedTitle || article.title);
  const displayLead = isHindi
    ? (article.hindi?.rephrasedLead || article.hindi?.description || article.aiSummary?.rephrasedLead || article.description)
    : (summaryData?.rephrasedLead || summaryData?.oneLineSummary || article.aiSummary?.rephrasedLead);
  const displayStory = isHindi
    ? (article.hindi?.rephrasedStory || article.hindi?.description || summaryData?.rephrasedStory || article.description)
    : (summaryData?.rephrasedStory || article.description);
  const displayBulletPoints = isHindi
    ? (article.hindi?.bulletPoints || summaryData?.bulletPoints)
    : summaryData?.bulletPoints;
  const displayWhyItMatters = isHindi
    ? (article.hindi?.whyItMatters || summaryData?.whyItMatters)
    : summaryData?.whyItMatters;
  const displayTags = isHindi
    ? (article.hindi?.tags || summaryData?.tags || article.tags)
    : (summaryData?.tags || article.tags);

  return (
    <div className="fixed inset-0 z-50 w-full h-full min-h-screen bg-black/70 backdrop-blur-xs flex flex-col overflow-hidden animate-fade-in">
      
      {/* ---------------- READER MODE VIEW ---------------- */}
      {readerMode ? (
        <div className={`relative w-full h-full flex flex-col overflow-hidden transition-colors duration-200 ${themeClasses[readerTheme]}`}>
          
          {/* Distraction-Free Reader Header Toolbar */}
          <header className={`flex items-center justify-between px-4 sm:px-8 py-3 border-b transition-colors duration-200 safe-top shrink-0 ${themeHeaderClasses[readerTheme]}`}>
            
            {/* Left: Exit Reader Mode */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setReaderMode(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-current text-xs font-semibold hover:opacity-80 transition-all cursor-pointer"
                title="Exit reader mode (R)"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Exit Reader Mode</span>
                <span className="sm:hidden">Exit</span>
              </button>
              <span className="text-xs font-medium opacity-60 hidden md:inline">
                {article.source} • {formatReadingTime(article)}
              </span>
            </div>

            {/* Middle / Right: Typography & Theme Controls */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              
              {/* Font Family (Serif / Sans) */}
              <div className="flex items-center border border-current rounded-full overflow-hidden text-xs">
                <button
                  onClick={() => setReaderFontFamily('serif')}
                  className={`px-2.5 py-1 font-serif transition-colors cursor-pointer ${readerFontFamily === 'serif' ? 'bg-current text-white font-bold' : 'hover:opacity-75'}`}
                  style={readerFontFamily === 'serif' ? { color: readerTheme === 'dark' ? '#18181b' : '#fff', backgroundColor: readerTheme === 'dark' ? '#e4e4e7' : '#1c1917' } : {}}
                  title="Serif font"
                >
                  Serif
                </button>
                <button
                  onClick={() => setReaderFontFamily('sans')}
                  className={`px-2.5 py-1 font-sans transition-colors cursor-pointer ${readerFontFamily === 'sans' ? 'bg-current text-white font-bold' : 'hover:opacity-75'}`}
                  style={readerFontFamily === 'sans' ? { color: readerTheme === 'dark' ? '#18181b' : '#fff', backgroundColor: readerTheme === 'dark' ? '#e4e4e7' : '#1c1917' } : {}}
                  title="Sans-serif font"
                >
                  Sans
                </button>
              </div>

              {/* Font Size Adjusters */}
              <div className="flex items-center border border-current rounded-full overflow-hidden text-xs">
                <button
                  onClick={() => {
                    if (readerFontSize === 'xlarge') setReaderFontSize('large');
                    else if (readerFontSize === 'large') setReaderFontSize('normal');
                  }}
                  disabled={readerFontSize === 'normal'}
                  className="px-2.5 py-1 hover:opacity-75 disabled:opacity-30 transition-opacity cursor-pointer flex items-center gap-0.5"
                  title="Decrease font size"
                >
                  <Type className="w-3 h-3" />
                  <span className="text-[10px]">-</span>
                </button>
                <span className="px-1.5 text-[11px] font-mono opacity-80 select-none">
                  {readerFontSize === 'normal' ? '1x' : readerFontSize === 'large' ? '1.25x' : '1.5x'}
                </span>
                <button
                  onClick={() => {
                    if (readerFontSize === 'normal') setReaderFontSize('large');
                    else if (readerFontSize === 'large') setReaderFontSize('xlarge');
                  }}
                  disabled={readerFontSize === 'xlarge'}
                  className="px-2.5 py-1 hover:opacity-75 disabled:opacity-30 transition-opacity cursor-pointer flex items-center gap-0.5"
                  title="Increase font size"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span className="text-[10px]">+</span>
                </button>
              </div>

              {/* Theme Selector */}
              <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-current/20">
                <button
                  onClick={() => setReaderTheme('paper')}
                  className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${readerTheme === 'paper' ? 'ring-2 ring-offset-1 ring-current scale-110' : 'opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: '#fbfaf8', borderColor: '#dcd7cd' }}
                  title="Paper theme"
                />
                <button
                  onClick={() => setReaderTheme('white')}
                  className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${readerTheme === 'white' ? 'ring-2 ring-offset-1 ring-current scale-110' : 'opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: '#ffffff', borderColor: '#e4e4e7' }}
                  title="Clean white theme"
                />
                <button
                  onClick={() => setReaderTheme('sepia')}
                  className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${readerTheme === 'sepia' ? 'ring-2 ring-offset-1 ring-current scale-110' : 'opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: '#f4ecd8', borderColor: '#d4c7a6' }}
                  title="Sepia book theme"
                />
                <button
                  onClick={() => setReaderTheme('dark')}
                  className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${readerTheme === 'dark' ? 'ring-2 ring-offset-1 ring-current scale-110' : 'opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: '#18181b', borderColor: '#52525b' }}
                  title="Dark night theme"
                />
              </div>

              {/* Audio Listen in Reader Mode */}
              <button
                onClick={handleSpeak}
                className={`p-2 rounded-full border border-current transition-all cursor-pointer ${
                  isSpeaking ? 'bg-rose-500 text-white animate-pulse' : 'hover:opacity-75'
                }`}
                title={isSpeaking ? 'Stop audio' : 'Listen to audio recap'}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Close (Esc) */}
              <button
                onClick={onClose}
                className="p-2 rounded-full border border-current hover:opacity-75 transition-opacity cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Reader Mode Distraction-Free Content */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-10 sm:py-16 touch-scrolling">
            <article className={`max-w-2xl sm:max-w-3xl mx-auto space-y-8 ${fontClasses}`}>
              
              {/* Publication Metadata */}
              <div className="space-y-3 border-b border-current/20 pb-6 text-sm opacity-70">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold tracking-wide uppercase text-xs">
                    {article.source}
                  </span>
                  <span>•</span>
                  <span>{new Date(article.pubDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span>•</span>
                  <span>{formatReadingTime(article)}</span>
                </div>
              </div>

              {/* Clean Large Display Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight sm:leading-tight">
                {article.aiSummary?.rephrasedTitle || article.title}
              </h1>

              {/* Lead Paragraph */}
              {(article.aiSummary?.rephrasedLead || summaryData?.rephrasedLead || summaryData?.oneLineSummary) && (
                <p className="text-xl sm:text-2xl leading-relaxed opacity-90 font-medium italic border-l-3 border-current/40 pl-5 my-6">
                  {article.aiSummary?.rephrasedLead || summaryData?.rephrasedLead || summaryData?.oneLineSummary}
                </p>
              )}

              {/* Clean Image (without loud borders) */}
              <div className="my-8 overflow-hidden rounded-md">
                <img
                  src={getArticleImageUrl(article.imageUrl, article.category, article.title)}
                  alt=""
                  className="w-full max-h-[460px] object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getArticleImageUrl(undefined, article.category, article.title);
                  }}
                />
              </div>

              {/* Distraction-Free Article Body Text */}
              <div className={`space-y-6 ${sizeClasses}`}>
                {displayStory ? (
                  displayStory.split(/\n\n+/).map((paragraph, pIdx) => (
                    <p key={pIdx} className="leading-relaxed sm:leading-loose">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="leading-relaxed sm:leading-loose">
                    {article.description}
                  </p>
                )}
              </div>

              {/* Context & Background Deep Dive */}
              {(summaryData?.backgroundContext || article.hindi?.backgroundContext) && (
                <div className="my-8 p-6 rounded-md border border-current/20 bg-current/5 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    <span>Background & Historical Context</span>
                  </h3>
                  <p className={`${sizeClasses} leading-relaxed opacity-90`}>
                    {isHindi ? (article.hindi?.backgroundContext || summaryData?.backgroundContext) : summaryData?.backgroundContext}
                  </p>
                </div>
              )}

              {/* Stakeholder & Market Impact */}
              {(summaryData?.stakeholderImpact || article.hindi?.stakeholderImpact) && (
                <div className="my-8 p-6 rounded-md border border-current/20 bg-current/5 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>Stakeholder & Sector Impact</span>
                  </h3>
                  <p className={`${sizeClasses} leading-relaxed opacity-90`}>
                    {isHindi ? (article.hindi?.stakeholderImpact || summaryData?.stakeholderImpact) : summaryData?.stakeholderImpact}
                  </p>
                </div>
              )}

              {/* Strategic Future Outlook */}
              {(summaryData?.futureOutlook || article.hindi?.futureOutlook) && (
                <div className="my-8 p-6 rounded-md border border-current/20 bg-current/5 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Strategic Forward Outlook</span>
                  </h3>
                  <p className={`${sizeClasses} leading-relaxed opacity-90`}>
                    {isHindi ? (article.hindi?.futureOutlook || summaryData?.futureOutlook) : summaryData?.futureOutlook}
                  </p>
                </div>
              )}

              {/* Key Highlights / Bullet Points */}
              {displayBulletPoints && displayBulletPoints.length > 0 && (
                <div className="my-10 pt-6 border-t border-current/20 space-y-4">
                  <h3 className="text-sm font-bold tracking-wider uppercase opacity-80 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Key Developments</span>
                  </h3>
                  <ul className={`space-y-3 ${sizeClasses}`}>
                    {displayBulletPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-current opacity-60 mt-1">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strategic Takeaways */}
              {summaryData?.keyTakeaways && summaryData.keyTakeaways.length > 0 && (
                <div className="my-8 p-6 rounded-md border border-current/20 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
                    <Compass className="w-4 h-4" />
                    <span>Strategic Takeaways</span>
                  </h4>
                  <ul className={`space-y-2 ${sizeClasses}`}>
                    {summaryData.keyTakeaways.map((takeaway, tIdx) => (
                      <li key={tIdx} className="flex items-start gap-2.5 opacity-90">
                        <span className="mt-1 text-xs">◆</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timeline Milestones */}
              {summaryData?.timeline && summaryData.timeline.length > 0 && (
                <div className="my-8 p-6 rounded-md border border-current/20 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Key Milestones & Timeline</span>
                  </h4>
                  <div className="space-y-3 pt-2">
                    {summaryData.timeline.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm sm:text-base">
                        <span className="px-2 py-0.5 rounded-full border border-current/30 text-xs font-mono font-bold shrink-0 mt-0.5">
                          {item.timeOrPhase}
                        </span>
                        <p className="opacity-90 leading-relaxed">{item.event}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategic Importance */}
              {displayWhyItMatters && (
                <div className="p-6 rounded-md border border-current/20 my-8 opacity-95">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">
                    Why It Matters
                  </h4>
                  <p className={`${sizeClasses} italic`}>
                    {displayWhyItMatters}
                  </p>
                </div>
              )}

              {/* Social Media Sharing in Reader Mode */}
              <div className="pt-6 border-t border-current/20">
                <SocialShare article={article} variant="card" className="bg-transparent border-current" />
              </div>

              {/* Clean Footer Bar within Reader Mode */}
              <div className="pt-8 border-t border-current/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm opacity-80">
                <button
                  onClick={() => setReaderMode(false)}
                  className="hover:underline cursor-pointer"
                >
                  ← Return to standard interactive view
                </button>

                <a
                  href={getCleanArticleLink(article)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-semibold hover:underline"
                >
                  <span>Read original source on {article.source}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

            </article>
          </div>
        </div>
      ) : (
        /* ---------------- STANDARD MODAL VIEW ---------------- */
        <div className="relative w-full h-full flex flex-col overflow-hidden text-black bg-[#faf7ee] font-neo">
          
          {/* Full Window Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b-2 border-black bg-[#ffe600] safe-top shrink-0 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Back Button */}
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black bg-white hover:bg-black hover:text-[#ccff00] text-black text-xs font-black neo-shadow-sm transition-all cursor-pointer shrink-0 active:translate-x-0.5 active:translate-y-0.5"
                title="Return to feed (Esc)"
                aria-label="Back to feed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">BACK</span>
                <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-black text-[#ccff00] border border-black font-mono">
                  ESC
                </kbd>
              </button>

              <span className="px-2.5 py-1 text-xs font-black uppercase bg-black text-[#ccff00] border border-black truncate max-w-[140px] sm:max-w-[220px]">
                {article.source}
              </span>
              <span className="px-2.5 py-1 text-[11px] font-black bg-[#ff2a85] text-white border border-black shrink-0 uppercase">
                {article.category}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {/* Reader Mode Button */}
              <button
                onClick={() => setReaderMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black bg-white hover:bg-[#ccff00] text-black text-xs font-black neo-shadow-sm transition-all cursor-pointer shrink-0 active:translate-x-0.5 active:translate-y-0.5"
                title="Distraction-Free Reader Mode (R)"
                aria-label="Enter reader mode"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">READER MODE</span>
                <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] bg-black text-[#ccff00] border border-black font-mono">
                  R
                </kbd>
              </button>

              {/* Prev Article */}
              {onPrevArticle && (
                <button
                  onClick={onPrevArticle}
                  disabled={!hasPrevArticle}
                  className="flex items-center justify-center p-2 border-2 border-black bg-white hover:bg-[#00f0ff] disabled:opacity-30 text-black transition-all cursor-pointer disabled:cursor-not-allowed min-w-[34px] min-h-[34px] neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
                  title="Previous article (K or ←)"
                  aria-label="Previous article (K)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {/* Next Article */}
              {onNextArticle && (
                <button
                  onClick={onNextArticle}
                  disabled={!hasNextArticle}
                  className="flex items-center justify-center p-2 border-2 border-black bg-white hover:bg-[#00f0ff] disabled:opacity-30 text-black transition-all cursor-pointer disabled:cursor-not-allowed min-w-[34px] min-h-[34px] neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
                  title="Next article (J or →)"
                  aria-label="Next article (J)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Speak / Audio Summary */}
              <button
                onClick={handleSpeak}
                className={`p-2 transition-all border-2 border-black cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5 ${
                  isSpeaking
                    ? 'bg-[#ff2a85] text-white animate-pulse'
                    : 'bg-white hover:bg-[#ccff00] text-black'
                }`}
                title={isSpeaking ? 'Stop audio' : 'Listen to audio recap'}
                aria-label={isSpeaking ? 'Stop audio' : 'Listen to audio recap'}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Bookmark */}
              <button
                onClick={() => onToggleBookmark(article)}
                className={`p-2 transition-all border-2 border-black cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5 ${
                  isBookmarked ? 'bg-[#ffe600] text-[#ff2a85]' : 'bg-white hover:bg-[#ffe600] text-black'
                }`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#ff2a85] text-[#ff2a85]' : ''}`} />
              </button>

              {/* Quick Share Toggle */}
              <button
                onClick={() => setShowShareMenu(prev => !prev)}
                className={`p-2 border-2 border-black transition-all cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5 ${
                  showShareMenu ? 'bg-[#00f0ff] text-black' : 'bg-white hover:bg-[#00f0ff] text-black'
                }`}
                title="Share article"
                aria-label="Share article"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Open in Separate Window (New Tab) */}
              <a
                href={getCleanArticleLink(article)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border-2 border-black bg-white text-black hover:bg-[#ccff00] transition-colors cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
                title="Open full page in separate window"
                aria-label="Open in separate window"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* Close */}
              <button
                onClick={onClose}
                className="p-2 border-2 border-black bg-black text-[#ccff00] hover:bg-zinc-800 transition-colors cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
                title="Close and return (Esc)"
                aria-label="Close article modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* Floating / Expandable Share Bar */}
        {showShareMenu && (
          <div className="bg-[#ffe600] border-b-2 border-black p-4 space-y-3 animate-fade-in z-20 shadow-sm text-black font-neo">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-black" />
                <h3 className="font-neo font-black text-xs uppercase tracking-wider text-black">
                  SOCIAL MEDIA SHARING
                </h3>
              </div>
              <button
                onClick={() => setShowShareMenu(false)}
                className="text-xs font-black text-black hover:text-[#ff2a85] cursor-pointer"
              >
                CLOSE ✕
              </button>
            </div>

            <SocialShare article={article} variant="card" className="bg-white border-black" />
          </div>
        )}

        {/* Scrollable Full-Window Article Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-8 touch-scrolling bg-[#faf7ee]">
          <div className="max-w-3xl mx-auto space-y-6 bg-white p-6 sm:p-10 border-2 border-black neo-shadow">
            
            {/* Article Banner & Title */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-zinc-600 font-mono font-semibold flex-wrap">
                <span className="flex items-center gap-1 text-black font-bold">
                  <Clock className="w-3.5 h-3.5 text-black" />
                  Published: {new Date(article.pubDate).toLocaleString()}
                </span>
                <span>•</span>
                <span className="text-black font-bold">
                  {formatReadingTime(article)}
                </span>
              </div>

              <h1 className="font-neo text-2xl sm:text-3xl md:text-4xl font-black text-black leading-tight tracking-tight">
                {article.title}
              </h1>
            </div>

            {/* Feature Image */}
            <div className="relative h-64 sm:h-96 md:h-[400px] border-2 border-black bg-zinc-100 overflow-hidden neo-shadow-sm">
              <img
                src={getArticleImageUrl(article.imageUrl, article.category, article.title)}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getArticleImageUrl(undefined, article.category, article.title);
                }}
              />
            </div>

            {/* AI Rephrased Report & Journalistic Rewrite Section */}
            <div className="bg-[#fff9e6] border-2 border-black p-6 space-y-5 neo-shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-3">
                <div className="flex items-center gap-2 text-black font-neo font-black text-sm sm:text-base">
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>AI EDITORIAL REWRITE &amp; ANALYSIS</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {loadingSummary ? (
                    <span className="text-xs text-black font-black font-mono animate-pulse flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 animate-ping text-[#ff2a85]" /> REPHRASING WITH GEMINI...
                    </span>
                  ) : (
                    <button
                      onClick={() => loadSummary(true)}
                      className="px-3 py-1 text-xs font-black bg-[#ccff00] hover:bg-[#b8e600] text-black border-2 border-black neo-shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <Sparkles className="w-3 h-3 text-black" />
                      <span>REPHRASE WITH AI</span>
                    </button>
                  )}
                </div>
              </div>

              {loadingSummary ? (
                <div className="space-y-3 animate-pulse py-2">
                  <div className="h-4 bg-zinc-300 rounded-none w-3/4" />
                  <div className="h-4 bg-zinc-300 rounded-none w-full" />
                  <div className="h-4 bg-zinc-300 rounded-none w-5/6" />
                </div>
              ) : summaryData ? (
                <div className="space-y-5 text-sm">
                  {/* Rephrased Headline & Lead Callout */}
                  {(summaryData.rephrasedTitle || summaryData.rephrasedLead || summaryData.oneLineSummary) && (
                    <div className="bg-white p-4 border-2 border-black text-black leading-relaxed text-sm sm:text-base space-y-1.5 neo-shadow-sm">
                      <span className="font-black uppercase text-[11px] tracking-wider text-[#ff2a85] block font-mono">
                        LEAD OVERVIEW:
                      </span>
                      {summaryData.rephrasedTitle && summaryData.rephrasedTitle !== article.title && (
                        <h4 className="font-neo font-black text-base sm:text-lg text-black">
                          {summaryData.rephrasedTitle}
                        </h4>
                      )}
                      <p className="text-zinc-800 leading-relaxed font-body font-medium">
                        {summaryData.rephrasedLead || summaryData.oneLineSummary}
                      </p>
                    </div>
                  )}

                  {/* Comprehensive Full Rephrased Article Story */}
                  {displayStory && (
                    <div className="bg-white p-5 border-2 border-black space-y-3 neo-shadow-sm">
                      <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                        <h4 className="text-xs font-black text-black uppercase tracking-wider font-neo flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#ff2a85]" />
                          <span>AUTHORITATIVE JOURNALISTIC DISPATCH</span>
                        </h4>
                        {summaryData?.wordCount && (
                          <span className="text-[11px] font-mono font-bold text-zinc-500">
                            {summaryData.wordCount} words
                          </span>
                        )}
                      </div>
                      <div className="text-zinc-900 text-base leading-relaxed font-body space-y-4 pt-1">
                        {displayStory.split(/\n\n+/).map((paragraph, pIdx) => (
                          <p key={pIdx} className="leading-relaxed">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Context & Background Deep Dive */}
                  {(summaryData?.backgroundContext || article.hindi?.backgroundContext) && (
                    <div className="bg-[#f0fdf4] border-2 border-black p-4 space-y-2 neo-shadow-sm">
                      <h4 className="text-xs font-black text-black uppercase tracking-wider font-neo flex items-center gap-1.5">
                        <History className="w-4 h-4 text-emerald-700" />
                        <span>HISTORICAL &amp; SECTOR CONTEXT</span>
                      </h4>
                      <p className="text-zinc-800 text-sm leading-relaxed font-body">
                        {isHindi ? (article.hindi?.backgroundContext || summaryData?.backgroundContext) : summaryData?.backgroundContext}
                      </p>
                    </div>
                  )}

                  {/* Stakeholder & Sector Impact */}
                  {(summaryData?.stakeholderImpact || article.hindi?.stakeholderImpact) && (
                    <div className="bg-[#eff6ff] border-2 border-black p-4 space-y-2 neo-shadow-sm">
                      <h4 className="text-xs font-black text-black uppercase tracking-wider font-neo flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-blue-700" />
                        <span>STAKEHOLDER &amp; MARKET IMPACT</span>
                      </h4>
                      <p className="text-zinc-800 text-sm leading-relaxed font-body">
                        {isHindi ? (article.hindi?.stakeholderImpact || summaryData?.stakeholderImpact) : summaryData?.stakeholderImpact}
                      </p>
                    </div>
                  )}

                  {/* Strategic Forward Outlook */}
                  {(summaryData?.futureOutlook || article.hindi?.futureOutlook) && (
                    <div className="bg-[#faf5ff] border-2 border-black p-4 space-y-2 neo-shadow-sm">
                      <h4 className="text-xs font-black text-black uppercase tracking-wider font-neo flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-purple-700" />
                        <span>STRATEGIC FORWARD OUTLOOK</span>
                      </h4>
                      <p className="text-zinc-800 text-sm leading-relaxed font-body">
                        {isHindi ? (article.hindi?.futureOutlook || summaryData?.futureOutlook) : summaryData?.futureOutlook}
                      </p>
                    </div>
                  )}

                  {/* Bullet Points / Key Developments */}
                  {displayBulletPoints && displayBulletPoints.length > 0 && (
                    <div className="bg-white p-4 border-2 border-black space-y-2 neo-shadow-sm">
                      <h4 className="text-xs font-black text-black uppercase tracking-wider font-neo flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-black" />
                        <span>KEY DEVELOPMENTS &amp; FACTS</span>
                      </h4>
                      <ul className="space-y-2 pt-1">
                        {displayBulletPoints.map((pt, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-zinc-800 text-sm leading-relaxed font-body">
                            <span className="w-2 h-2 bg-[#ff2a85] border border-black mt-1.5 shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Strategic Key Takeaways */}
                  {summaryData?.keyTakeaways && summaryData.keyTakeaways.length > 0 && (
                    <div className="bg-white p-4 border-2 border-black space-y-2 neo-shadow-sm">
                      <h4 className="text-xs font-black text-black uppercase tracking-wider font-neo flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-[#ff2a85]" />
                        <span>STRATEGIC TAKEAWAYS</span>
                      </h4>
                      <ul className="space-y-1.5 pt-1">
                        {summaryData.keyTakeaways.map((takeaway, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-2 text-zinc-800 text-sm leading-relaxed font-body">
                            <span className="text-[#ff2a85] font-black shrink-0">◆</span>
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Timeline / Milestones */}
                  {summaryData?.timeline && summaryData.timeline.length > 0 && (
                    <div className="bg-white p-4 border-2 border-black space-y-3 neo-shadow-sm">
                      <h4 className="text-xs font-black text-black uppercase tracking-wider font-neo flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-black" />
                        <span>KEY PHASES &amp; TIMELINE</span>
                      </h4>
                      <div className="space-y-2.5 pt-1">
                        {summaryData.timeline.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-sm font-body">
                            <span className="px-2 py-0.5 bg-black text-[#ccff00] text-[11px] font-mono font-black shrink-0 border border-black">
                              {item.timeOrPhase}
                            </span>
                            <p className="text-zinc-800 leading-relaxed">{item.event}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Why It Matters Callout */}
                  {displayWhyItMatters && (
                    <div className="bg-[#00f0ff]/20 border-2 border-black p-4 neo-shadow-sm">
                      <h5 className="text-xs font-black text-black uppercase tracking-wide font-neo">STRATEGIC IMPORTANCE</h5>
                      <p className="text-zinc-900 text-sm mt-1 leading-relaxed font-body">{displayWhyItMatters}</p>
                    </div>
                  )}

                  {/* Tags */}
                  {displayTags && displayTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 font-mono font-bold">
                      {displayTags.map((tag, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 text-xs bg-white text-black border border-black neo-shadow-sm">
                          #{tag.replace(/^#/, '')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-600 font-bold">Click to generate instant rephrased journalistic report.</p>
              )}
            </div>

            {/* Original Scraped Snippet */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-zinc-600 uppercase tracking-wider font-neo">RAW SCRAPED WIRE EXCERPT</h4>
              <p className="text-zinc-700 text-sm leading-relaxed bg-zinc-100 p-4 border-2 border-black font-body">
                {article.description}
              </p>
            </div>

            {/* In-Article Social Media Sharing Component */}
            <div className="pt-2">
              <SocialShare article={article} variant="card" />
            </div>

          </div>
        </div>

        {/* Full-Window Footer Bar */}
        <div className="p-4 sm:px-8 border-t-2 border-black bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 safe-bottom shrink-0 shadow-sm font-neo">
          <div className="flex items-center gap-2 max-w-3xl mx-auto sm:mx-0 w-full sm:w-auto justify-between sm:justify-start">
            {/* Share Menu Toggle */}
            <button
              onClick={() => setShowShareMenu(prev => !prev)}
              className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-black bg-white hover:bg-[#00f0ff] text-black text-xs font-black neo-shadow-sm transition-all cursor-pointer min-h-[38px] active:translate-x-0.5 active:translate-y-0.5"
              title="Share article options"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>{showShareMenu ? 'CLOSE SHARE' : 'SHARE STORY'}</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={copyToClipboard}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black border-2 border-black transition-all cursor-pointer min-h-[38px] neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5 ${
                copied ? 'bg-[#00f5a0] text-black' : 'bg-[#ffe600] text-black hover:bg-[#edd400]'
              }`}
              title="Copy article link"
            >
              {copied ? <Check className="w-4 h-4 shrink-0 stroke-[3]" /> : <Copy className="w-4 h-4 shrink-0" />}
              <span>{copied ? 'COPIED!' : 'COPY LINK'}</span>
            </button>
          </div>

          <a
            href={getCleanArticleLink(article)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-2 bg-[#ccff00] hover:bg-[#b8e600] text-black text-xs sm:text-sm font-black border-2 border-black neo-shadow transition-all min-h-[38px] text-center active:translate-x-0.5 active:translate-y-0.5"
          >
            <span>READ ORIGINAL ON {article.source}</span>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </a>
        </div>
      </div>
    )}
  </div>
  );
};


