import React, { useState } from 'react';
import { RefreshCw, Search, Bookmark, LayoutDashboard, BarChart3, Database, Rss, Twitter, Linkedin, Youtube, Video, Share2, Globe } from 'lucide-react';
import { NewsCategory, Language, PageView } from '../types';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CATEGORY_HINDI_MAP, UI_STRINGS_HINDI } from '../utils/hindiTranslator';

export type { PageView };

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  showBookmarksOnly: boolean;
  setShowBookmarksOnly: (val: boolean) => void;
  bookmarkCount: number;
  onOpenAnalytics: () => void;
  onOpenAddSource: () => void;
  onOpenDashboard?: () => void;
  onOpenPolicy?: (tab: 'privacy' | 'terms' | 'adsense' | 'about' | 'contact') => void;
  onOpenShortcuts?: () => void;
  lastRefreshedAt: string;
  nextRefreshFormatted: string;
  selectedCategory?: NewsCategory;
  onSelectCategory?: (category: NewsCategory) => void;
  activePage?: PageView;
  onNavigatePage?: (page: PageView) => void;
  language?: Language;
  onToggleLanguage?: (lang: Language) => void;
  isTranslating?: boolean;
  totalArticles?: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  isRefreshing,
  onRefresh,
  showBookmarksOnly,
  setShowBookmarksOnly,
  bookmarkCount,
  onOpenDashboard,
  onOpenPolicy,
  onOpenShortcuts,
  nextRefreshFormatted,
  selectedCategory = 'All',
  onSelectCategory,
  activePage = 'home',
  onNavigatePage,
  language = 'en',
  onToggleLanguage = () => {},
  isTranslating = false,
  totalArticles = 0,
}) => {
  const [showSearchInput, setShowSearchInput] = useState(false);

  const navCategories: { name: NewsCategory; labelEn: string; labelHi: string }[] = [
    { name: 'All', labelEn: '⚡ ALL NEWS', labelHi: '⚡ मुख्य समाचार' },
    { name: 'World', labelEn: '🌍 WORLD', labelHi: '🌍 विश्व' },
    { name: 'Technology', labelEn: '💻 TECH', labelHi: '💻 तकनीक' },
    { name: 'Business', labelEn: '📈 BIZ', labelHi: '📈 व्यापार' },
    { name: 'Science', labelEn: '🔬 SCIENCE', labelHi: '🔬 विज्ञान' },
    { name: 'Entertainment', labelEn: '🎬 ENTERTAINMENT', labelHi: '🎬 मनोरंजन' },
    { name: 'Health', labelEn: '🏥 HEALTH', labelHi: '🏥 स्वास्थ्य' },
    { name: 'Sports', labelEn: '⚽ SPORTS', labelHi: '⚽ खेल' },
  ];

  const handleNavCategoryClick = (category: NewsCategory) => {
    if (onNavigatePage && activePage !== 'home') {
      onNavigatePage('home');
    }
    onSelectCategory?.(category);
  };

  return (
    <header className="w-full bg-[#faf7ee] text-black border-b-[2.5px] border-black shadow-[0_4px_0_0_#000] safe-top font-neo">
      
      {/* 1. Top Neo-Brutalist Yellow Utility & Marquee Bar */}
      <div className="bg-[#ffe600] text-black text-xs font-bold py-1.5 px-3 sm:px-6 border-b-2 border-black">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left Menu Links */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none font-neo text-[11px] sm:text-xs">
            <button
              onClick={() => onNavigatePage ? onNavigatePage('home') : null}
              className={`px-2 py-0.5 font-mono font-black text-[10px] uppercase border border-black shrink-0 transition-all cursor-pointer ${
                activePage === 'home' ? 'bg-black text-[#ccff00]' : 'bg-white text-black hover:bg-black hover:text-white'
              }`}
            >
              {language === 'hi' ? '⚡ लाइव 24/7 वायर' : 'LIVE 24/7 WIRE'}
            </button>
            <button
              onClick={() => onNavigatePage ? onNavigatePage('about') : onOpenPolicy?.('about')}
              className={`font-black transition-all cursor-pointer whitespace-nowrap px-1.5 py-0.5 border ${
                activePage === 'about' ? 'bg-black text-[#ccff00] border-black neo-shadow-sm' : 'text-black border-transparent hover:border-black hover:bg-white'
              }`}
            >
              {language === 'hi' ? 'हमारे बारे में' : 'ABOUT'}
            </button>
            <button
              onClick={() => onNavigatePage ? onNavigatePage('advertise') : onOpenPolicy?.('adsense')}
              className={`font-black transition-all cursor-pointer whitespace-nowrap px-1.5 py-0.5 border ${
                activePage === 'advertise' ? 'bg-black text-[#ccff00] border-black neo-shadow-sm' : 'text-black border-transparent hover:border-black hover:bg-white'
              }`}
            >
              {language === 'hi' ? 'विज्ञापन' : 'ADVERTISE'}
            </button>
            <button
              onClick={() => onNavigatePage ? onNavigatePage('contact') : onOpenPolicy?.('contact')}
              className={`font-black transition-all cursor-pointer whitespace-nowrap px-1.5 py-0.5 border ${
                activePage === 'contact' ? 'bg-black text-[#ccff00] border-black neo-shadow-sm' : 'text-black border-transparent hover:border-black hover:bg-white'
              }`}
            >
              {language === 'hi' ? 'संपर्क' : 'CONTACT'}
            </button>
            <button
              onClick={() => onNavigatePage ? onNavigatePage('privacy') : onOpenPolicy?.('privacy')}
              className={`font-black transition-all cursor-pointer whitespace-nowrap hidden sm:inline px-1.5 py-0.5 border ${
                activePage === 'privacy' ? 'bg-black text-[#ccff00] border-black neo-shadow-sm' : 'text-black border-transparent hover:border-black hover:bg-white'
              }`}
            >
              {language === 'hi' ? 'गोपनीयता नीति' : 'PRIVACY POLICY'}
            </button>
            <button
              onClick={() => onNavigatePage ? onNavigatePage('videos') : null}
              className={`text-black font-black px-2.5 py-0.5 border border-black neo-shadow-sm transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activePage === 'videos' ? 'bg-[#ff2a85] text-white' : 'bg-[#ff2a85] text-white hover:bg-[#e01e74]'
              }`}
              title="Access Scraped Viral Internet Videos & Clips"
            >
              <Video className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? '🎬 वायरल वीडियो' : '🎬 VIRAL VIDEOS'}</span>
              <span className="bg-black text-[#ccff00] font-mono text-[9px] px-1 py-0.2">
                HOT
              </span>
            </button>
            <button
              onClick={() => onNavigatePage ? onNavigatePage('database') : null}
              className={`text-black font-black px-2.5 py-0.5 border border-black neo-shadow-sm transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activePage === 'database' ? 'bg-[#ccff00]' : 'bg-[#ffe600] hover:bg-[#ccff00]'
              }`}
              title="Access Scraped News Database & Archive"
            >
              <Database className="w-3.5 h-3.5 text-black" />
              <span>{language === 'hi' ? '🗄️ डेटाबेस' : '🗄️ DATABASE'}</span>
              {totalArticles !== undefined && totalArticles > 0 && (
                <span className="bg-black text-[#ccff00] font-mono text-[9px] px-1 py-0.2">
                  {totalArticles}
                </span>
              )}
            </button>
            <button
              onClick={() => onNavigatePage ? onNavigatePage('dashboard') : onOpenDashboard?.()}
              className={`text-black font-black px-2.5 py-0.5 border border-black neo-shadow-sm transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activePage === 'dashboard' ? 'bg-[#00f0ff]' : 'bg-white hover:bg-[#00f0ff]'
              }`}
              title="Access Website Traffic & Visitor Analytics Dashboard"
            >
              <BarChart3 className="w-3.5 h-3.5 text-black" />
              <span>{language === 'hi' ? '📊 डैशबोर्ड' : '📊 DASHBOARD'}</span>
            </button>
          </div>

          {/* Right: Language Switcher, Socials & Live Refresh */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Top Bar Language Switcher */}
            <LanguageSwitcher
              language={language}
              onToggleLanguage={onToggleLanguage}
              isTranslating={isTranslating}
              variant="compact"
            />

            <div className="hidden lg:flex items-center gap-1.5 text-black">
              <a href="/feed.xml" target="_blank" rel="noopener noreferrer" title="RSS Feed" className="p-1 bg-white border border-black hover:bg-[#ccff00] transition-colors">
                <Rss className="w-3 h-3" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" title="Twitter" className="p-1 bg-white border border-black hover:bg-[#00f0ff] transition-colors">
                <Twitter className="w-3 h-3" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" title="LinkedIn" className="p-1 bg-white border border-black hover:bg-[#ff2a85] hover:text-white transition-colors">
                <Linkedin className="w-3 h-3" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" title="YouTube" className="p-1 bg-white border border-black hover:bg-[#ff0000] hover:text-white transition-colors">
                <Youtube className="w-3 h-3" />
              </a>
            </div>

            <span className="hidden sm:inline text-black/30">|</span>

            {/* Quick Live Refresh Indicator */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 text-[11px] bg-black text-[#ccff00] font-mono font-black px-2.5 py-0.5 border border-black neo-shadow-sm hover:bg-zinc-800 transition-all cursor-pointer"
              title="Refresh Feeds"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[#ccff00]' : ''}`} />
              <span>{nextRefreshFormatted}</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. Main Brand Header with Neo-Brutalist AD / Banner Area */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Tagline */}
          <div 
            onClick={() => onNavigatePage?.('home')}
            className="flex items-center gap-3 sm:gap-4 shrink-0 text-center md:text-left cursor-pointer group"
          >
            <div className="w-13 h-13 sm:w-14 sm:h-14 bg-[#ccff00] border-2 border-black neo-shadow flex items-center justify-center shrink-0 group-hover:bg-[#ffe600] transition-colors">
              <span className="font-neo font-black text-2xl sm:text-3xl text-black tracking-tighter">
                NP
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h1 className="font-neo font-black text-3xl sm:text-4xl text-black tracking-tighter leading-none group-hover:underline">
                  {language === 'hi' ? 'न्यूज़ पल्सर' : 'NEWS PULSAR'}
                </h1>
                <span className="bg-[#ff2a85] text-white text-[10px] font-black font-mono px-1.5 py-0.5 border border-black rotate-3">
                  v2.5
                </span>
                {language === 'hi' && (
                  <span className="bg-[#ccff00] text-black text-[9px] font-black font-mono px-1.5 py-0.5 border border-black -rotate-2">
                    हिन्दी
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-800 font-neo font-bold mt-1 tracking-tight">
                {language === 'hi'
                  ? '⚡ रीयल-टाइम AI समाचार एग्रीगेटर एवं लाइव फ़ीड अनुवाद'
                  : '⚡ REAL-TIME AI NEWS AGGREGATOR & LIVE FEED SCRAPER'}
              </p>
            </div>
          </div>

          {/* Header Billboard Banner */}
          <div className="w-full md:w-auto flex-1 max-w-[620px] bg-gradient-to-r from-[#ff2a85] via-[#ff6b4a] to-[#ffe600] border-2 border-black neo-shadow p-2.5 sm:p-3 flex items-center justify-between gap-3 text-black">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="bg-black text-[#ccff00] font-mono text-[9px] font-black px-1.5 py-0.5 border border-black uppercase">
                  {language === 'hi' ? 'प्रायोजित विज्ञापन' : 'AD BANNER'}
                </span>
                <span className="font-neo font-black text-xs sm:text-sm uppercase tracking-tight text-black truncate">
                  GOOGLE ADSENSE PARTNER
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-black/90 truncate mt-0.5">
                {language === 'hi'
                  ? 'उच्च प्रभाव वाला स्वचालित समाचार विज्ञापन स्थान'
                  : 'High-impact automated news advertising space'}
              </p>
            </div>
            <button
              onClick={() => onNavigatePage ? onNavigatePage('advertise') : onOpenPolicy?.('adsense')}
              className="px-3 py-1 bg-white hover:bg-black hover:text-[#ccff00] text-black font-neo font-black text-xs border-2 border-black neo-shadow-sm transition-all whitespace-nowrap cursor-pointer shrink-0"
            >
              {language === 'hi' ? 'विज्ञापन दें ↗' : 'SPONSOR ↗'}
            </button>
          </div>

        </div>
      </div>

      {/* 3. High-Contrast Black Navigation Bar */}
      <div className="bg-black text-white border-t-2 border-black">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between">
          
          {/* Main Navigation Items */}
          <nav className="flex items-center overflow-x-auto scrollbar-none py-1">
            {navCategories.map((item, idx) => {
              const isActive = activePage === 'home' && ((item.name === 'All' && selectedCategory === 'All') || (selectedCategory === item.name));
              const label = language === 'hi' ? item.labelHi : item.labelEn;
              return (
                <button
                  key={idx}
                  onClick={() => handleNavCategoryClick(item.name)}
                  className={`px-3.5 sm:px-4 py-2 text-xs font-neo font-black tracking-wide whitespace-nowrap transition-all cursor-pointer border border-transparent ${
                    isActive
                      ? 'bg-[#ccff00] text-black border-black neo-shadow-sm font-black'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons, Language Switcher & Search */}
          <div className="flex items-center gap-2 pl-3 shrink-0 py-1">
            {/* Primary Language Switcher */}
            <LanguageSwitcher
              language={language}
              onToggleLanguage={onToggleLanguage}
              isTranslating={isTranslating}
              variant="default"
            />

            {/* Viral Videos Button */}
            <button
              onClick={() => onNavigatePage ? onNavigatePage('videos') : null}
              className={`px-2.5 py-1.5 border border-black neo-shadow-sm text-xs font-neo font-black transition-all cursor-pointer hidden sm:flex items-center gap-1.5 whitespace-nowrap ${
                activePage === 'videos' ? 'bg-[#ff2a85] text-white' : 'bg-[#ff2a85] text-white hover:bg-[#e01e74]'
              }`}
              title="Access Scraped Viral Internet Videos & Clips"
            >
              <Video className="w-3.5 h-3.5 text-white shrink-0" />
              <span>{language === 'hi' ? 'वायरल' : 'VIRAL'}</span>
            </button>

            {/* Database Button */}
            <button
              onClick={() => onNavigatePage ? onNavigatePage('database') : null}
              className={`px-2.5 py-1.5 border border-black neo-shadow-sm text-xs font-neo font-black transition-all cursor-pointer hidden sm:flex items-center gap-1.5 whitespace-nowrap ${
                activePage === 'database' ? 'bg-[#ccff00] text-black' : 'bg-[#ffe600] hover:bg-[#ccff00] text-black'
              }`}
              title="Access Scraped News Database & Archive"
            >
              <Database className="w-3.5 h-3.5 text-black shrink-0" />
              <span>{language === 'hi' ? 'डेटाबेस' : 'DATABASE'}</span>
            </button>

            {/* Dashboard Button */}
            <button
              onClick={() => onNavigatePage ? onNavigatePage('dashboard') : onOpenDashboard?.()}
              className={`px-2.5 py-1.5 border border-black neo-shadow-sm text-xs font-neo font-black transition-all cursor-pointer hidden md:flex items-center gap-1.5 whitespace-nowrap ${
                activePage === 'dashboard' ? 'bg-[#ccff00] text-black' : 'bg-[#00f0ff] hover:bg-[#00d0e0] text-black'
              }`}
              title="Website Dashboard (Daily, Weekly, Monthly Visitors & Traffic)"
            >
              <BarChart3 className="w-3.5 h-3.5 text-black shrink-0" />
              <span>{language === 'hi' ? 'डैशबोर्ड' : 'DASHBOARD'}</span>
            </button>

            {/* Bookmarks Toggle */}
            <button
              onClick={() => {
                if (onNavigatePage && activePage !== 'home') onNavigatePage('home');
                setShowBookmarksOnly(!showBookmarksOnly);
              }}
              className={`px-2.5 py-1.5 border text-xs font-neo font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                showBookmarksOnly
                  ? 'bg-[#ff2a85] text-white border-black neo-shadow-sm'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-white'
              }`}
              title="Saved Articles"
            >
              <Bookmark className={`w-3.5 h-3.5 ${showBookmarksOnly ? 'fill-white' : ''}`} />
              <span className="hidden sm:inline">{language === 'hi' ? 'सुरक्षित' : 'SAVED'}</span>
              {bookmarkCount > 0 && (
                <span className="text-[10px] font-mono bg-white text-black px-1.5 py-0.2 font-black border border-black">
                  {bookmarkCount}
                </span>
              )}
            </button>

            {/* Quick Search Toggle */}
            <button
              onClick={() => setShowSearchInput(!showSearchInput)}
              className="p-1.5 bg-zinc-900 hover:bg-[#00f0ff] hover:text-black text-zinc-300 border border-zinc-700 transition-all cursor-pointer"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Expandable Search Input Row */}
        {showSearchInput && (
          <div className="bg-[#ffe600] border-t-2 border-black px-3 sm:px-6 py-2 text-black">
            <div className="max-w-7xl mx-auto flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    if (onNavigatePage && activePage !== 'home') onNavigatePage('home');
                    setSearchQuery(e.target.value);
                  }}
                  placeholder={language === 'hi' ? 'ताज़ा सुर्खियाँ, स्रोत, या विषय खोजें...' : 'SEARCH LIVE HEADLINES, SOURCES, TOPICS...'}
                  className="w-full pl-9 pr-8 py-1.5 bg-white text-black font-neo font-bold placeholder-zinc-500 text-xs sm:text-sm border-2 border-black neo-shadow-sm focus:outline-none"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-black hover:text-[#ff2a85]"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowSearchInput(false)}
                className="px-3 py-1.5 bg-black text-[#ccff00] hover:bg-zinc-800 text-xs font-neo font-black border-2 border-black neo-shadow-sm cursor-pointer"
              >
                {language === 'hi' ? 'बंद करें' : 'CLOSE'}
              </button>
            </div>
          </div>
        )}

      </div>

    </header>
  );
};




