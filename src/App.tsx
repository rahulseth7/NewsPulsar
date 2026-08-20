import React, { useState, useEffect, useMemo } from 'react';
import { NewsArticle, NewsCategory, NewsResponse, NewsSourceInfo, Language } from './types';
import { fetchNews, triggerRefresh, toggleSource, getCachedDatabaseNews } from './services/newsApi';
import { Header, PageView } from './components/Header';
import { RefreshTimerBar } from './components/RefreshTimerBar';
import { Ticker } from './components/Ticker';
import { CategoryFilter } from './components/CategoryFilter';
import { SourceFilter } from './components/SourceFilter';
import { ArticleCard } from './components/ArticleCard';
import { ArticleModal } from './components/ArticleModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { AddSourceModal } from './components/AddSourceModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Pagination } from './components/Pagination';
import { AdSenseUnit } from './components/AdSenseUnit';
import { NewsCarousel } from './components/NewsCarousel';
import { Footer } from './components/Footer';
import { NewsletterSignup } from './components/NewsletterSignup';
import { PolicyModal, PolicyTab } from './components/PolicyModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { ShortcutsModal } from './components/ShortcutsModal';
import { AboutPage } from './pages/AboutPage';
import { AdvertisePage } from './pages/AdvertisePage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { DashboardPage } from './pages/DashboardPage';
import { DatabasePage } from './pages/DatabasePage';
import { ViralVideosPage } from './pages/ViralVideosPage';
import { ensureUniqueDomainPerPost } from './utils/linkUtils';
import { RefreshCw, LayoutGrid, List, SlidersHorizontal, BookmarkCheck, AlertCircle, Sparkles, Command, Keyboard } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<NewsResponse | null>(() => getCachedDatabaseNews());
  const [loading, setLoading] = useState(() => !getCachedDatabaseNews());
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  // Active Top-Level Page View
  const [activePage, setActivePage] = useState<PageView>(() => {
    try {
      const hash = window.location.hash.replace('#', '').split('?')[0].toLowerCase();
      if (['about', 'advertise', 'contact', 'privacy', 'dashboard', 'database', 'videos'].includes(hash)) {
        return hash as PageView;
      }
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page')?.toLowerCase();
      if (pageParam && ['about', 'advertise', 'contact', 'privacy', 'dashboard', 'database', 'videos'].includes(pageParam)) {
        return pageParam as PageView;
      }
    } catch {
      // fallback
    }
    return 'home';
  });

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'compact'>('grid');

  // Pagination State - 14 Posts Per Page Default
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(14);

  // Bookmarks state (persistent in localStorage)
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('newspulse_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Session Read / Seen Article Tracking
  const [readArticleIds, setReadArticleIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('newspulse_session_read_articles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal states
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const handleOpenArticle = (article: NewsArticle) => {
    setSelectedArticle(article);
    setReadArticleIds((prev) => {
      if (prev.includes(article.id)) return prev;
      const updated = [...prev, article.id];
      try {
        sessionStorage.setItem('newspulse_session_read_articles', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  // Category Read Count Aggregator for CategoryFilter
  const readCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: 0,
      World: 0,
      Technology: 0,
      Science: 0,
      Business: 0,
      Sports: 0,
      Entertainment: 0,
      Health: 0,
    };
    if (!data?.articles) return counts;
    const readSet = new Set(readArticleIds);
    data.articles.forEach((art) => {
      if (readSet.has(art.id)) {
        counts.All = (counts.All || 0) + 1;
        if (art.category && counts[art.category] !== undefined) {
          counts[art.category] = (counts[art.category] || 0) + 1;
        }
      }
    });
    return counts;
  }, [data?.articles, readArticleIds]);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyTab, setPolicyTab] = useState<PolicyTab>('privacy');
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Shortcut Toast indicator
  const [shortcutToast, setShortcutToast] = useState<{ message: string; key: string } | null>(null);

  const showShortcutToast = (message: string, key: string = '') => {
    setShortcutToast({ message, key });
    setTimeout(() => {
      setShortcutToast((current) => (current?.message === message ? null : current));
    }, 2200);
  };

  const handleNavigatePage = (page: PageView) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (page === 'home') {
      window.history.pushState(null, '', window.location.pathname);
    } else {
      window.history.pushState(null, '', `#${page}`);
    }
  };

  const handleOpenPolicy = (tab: PolicyTab) => {
    if (tab === 'about') {
      handleNavigatePage('about');
    } else if (tab === 'adsense') {
      handleNavigatePage('advertise');
    } else if (tab === 'contact') {
      handleNavigatePage('contact');
    } else if (tab === 'privacy' || tab === 'terms') {
      handleNavigatePage('privacy');
    } else {
      setPolicyTab(tab);
      setPolicyOpen(true);
    }
  };

  // Sync with browser hash changes / back-forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').split('?')[0].toLowerCase();
      if (['about', 'advertise', 'contact', 'privacy', 'dashboard', 'database', 'videos'].includes(hash)) {
        setActivePage(hash as PageView);
      } else {
        setActivePage('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Read URL query parameters for initial SEO deep-linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get('category');
    const searchParam = params.get('search');
    
    if (catParam) {
      setSelectedCategory(catParam as NewsCategory);
    }
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, []);

  // Dynamic SEO Document Title & Meta Updates
  useEffect(() => {
    let title = 'New Pulse - Live News Aggregator & Web Scraper';
    if (activePage === 'about') {
      title = 'About New Pulse - Editorial Mission, Architecture & Standards';
    } else if (activePage === 'advertise') {
      title = 'Advertise on New Pulse - Sponsorship & Display Specs';
    } else if (activePage === 'contact') {
      title = 'Contact Editorial Desk & Newsroom - New Pulse';
    } else if (activePage === 'privacy') {
      title = 'Privacy Policy, GDPR/CCPA & Cookie Preferences - New Pulse';
    } else if (activePage === 'dashboard') {
      title = 'Newsroom Command & Traffic Analytics Dashboard - New Pulse';
    } else if (activePage === 'database') {
      title = 'Scraped News Database & Zero-Loss Storage Explorer - New Pulse';
    } else if (activePage === 'videos') {
      title = 'Trending Viral Videos & Internet Clips Feed - New Pulse';
    } else if (selectedArticle) {
      title = `${selectedArticle.title} | New Pulse`;
    } else if (searchQuery.trim()) {
      title = `Search: "${searchQuery}" | New Pulse News`;
    } else if (selectedCategory !== 'All') {
      title = `${selectedCategory} News & Latest Headlines | New Pulse`;
    } else if (currentPage > 1) {
      title = `Page ${currentPage} - Latest News | New Pulse`;
    }
    document.title = title;
  }, [activePage, selectedArticle, searchQuery, selectedCategory, currentPage]);

  // Open article if article URL param matches after data loads
  useEffect(() => {
    if (data && data.articles) {
      const params = new URLSearchParams(window.location.search);
      const articleIdParam = params.get('article');
      if (articleIdParam) {
        const found = data.articles.find(a => a.id === articleIdParam);
        if (found) setSelectedArticle(found);
      }
    }
  }, [data]);

  // Initial Load
  const loadNewsData = async () => {
    try {
      setError(null);
      const res = await fetchNews();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load news:', err);
      setError(err.message || 'Failed to fetch live news feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNewsData();
  }, []);

  // Save Bookmarks
  useEffect(() => {
    try {
      localStorage.setItem('newspulse_bookmarks', JSON.stringify(bookmarkedIds));
    } catch (e) {
      console.error('Failed to save bookmarks:', e);
    }
  }, [bookmarkedIds]);

  const handleToggleBookmark = (article: NewsArticle) => {
    setBookmarkedIds((prev) =>
      prev.includes(article.id)
        ? prev.filter((id) => id !== article.id)
        : [...prev, article.id]
    );
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await triggerRefresh();
      if (res && res.articles && res.articles.length > 0) {
        setData(res);
      } else {
        const fallbackRes = await fetchNews();
        setData(fallbackRes);
      }
    } catch (err: any) {
      console.warn('Refresh error, fetching client fallback:', err);
      try {
        const fallbackRes = await fetchNews();
        setData(fallbackRes);
      } catch (e: any) {
        setError('Unable to refresh news. Showing cached stories.');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleSourceActive = async (sourceId: string, active: boolean) => {
    await toggleSource(sourceId, active);
    loadNewsData();
  };

  // Filtered Articles Logic
  const filteredArticles = useMemo(() => {
    if (!data || !data.articles) return [];

    const matched = data.articles.filter((article) => {
      // Bookmarks filter
      if (showBookmarksOnly && !bookmarkedIds.includes(article.id)) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && article.category !== selectedCategory) {
        return false;
      }

      // Source filter
      if (selectedSource !== 'All' && article.source !== selectedSource) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const terms = q.split(/\s+/).filter(Boolean);

        const textToSearch = [
          article.title,
          article.description,
          article.source,
          article.category,
          ...(article.tags || []),
          ...(article.seoKeywords || []),
          ...(article.aiSummary?.bulletPoints || []),
          article.aiSummary?.whyItMatters || ''
        ].join(' ').toLowerCase();

        // Match if all search terms appear anywhere in the article text
        const matchesAllTerms = terms.every(term => textToSearch.includes(term));
        if (!matchesAllTerms) {
          return false;
        }
      }

      return true;
    });

    // Ensure every single post has a unique distinct domain (URL)
    return ensureUniqueDomainPerPost(matched);
  }, [data, searchQuery, selectedCategory, selectedSource, showBookmarksOnly, bookmarkedIds]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedSource, showBookmarksOnly]);

  // Paginated Articles Logic
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / itemsPerPage));
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredArticles.slice(start, start + itemsPerPage);
  }, [filteredArticles, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Formatted timer text for header
  const nextRefreshFormatted = useMemo(() => {
    if (!data?.nextRefreshAt) return '10:00';
    try {
      const diffSecs = Math.max(0, Math.floor((new Date(data.nextRefreshAt).getTime() - Date.now()) / 1000));
      const mins = Math.floor(diffSecs / 60);
      const secs = diffSecs % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } catch {
      return '10:00';
    }
  }, [data?.nextRefreshAt]);

  // Article Navigation Helpers for Hotkeys & Modal Controls
  const currentArticleIndex = useMemo(() => {
    if (!selectedArticle) return -1;
    return filteredArticles.findIndex((a) => a.id === selectedArticle.id);
  }, [selectedArticle, filteredArticles]);

  const hasNextArticle = currentArticleIndex >= 0 && currentArticleIndex < filteredArticles.length - 1;
  const hasPrevArticle = currentArticleIndex > 0;

  const navigateToNextArticle = () => {
    if (hasNextArticle) {
      handleOpenArticle(filteredArticles[currentArticleIndex + 1]);
    }
  };

  const navigateToPrevArticle = () => {
    if (hasPrevArticle) {
      handleOpenArticle(filteredArticles[currentArticleIndex - 1]);
    }
  };

  // Global Keyboard Shortcuts (R to refresh, Esc to close modals, / to search, ? for help, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // 1. ESCAPE: Closes open modal or blurs search (works even when input is focused)
      if (e.key === 'Escape') {
        if (isInputFocused && target) {
          target.blur();
        }
        if (shortcutsOpen) {
          setShortcutsOpen(false);
          return;
        }
        if (selectedArticle) {
          setSelectedArticle(null);
          return;
        }
        if (policyOpen) {
          setPolicyOpen(false);
          return;
        }
        if (analyticsOpen) {
          setAnalyticsOpen(false);
          return;
        }
        if (addSourceOpen) {
          setAddSourceOpen(false);
          return;
        }
        if (dashboardOpen) {
          setDashboardOpen(false);
          return;
        }
        return;
      }

      // If user is actively typing in a form or search field, do not trigger single-character shortcuts
      if (isInputFocused) {
        return;
      }

      // 2. SEARCH FOCUS: '/'
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('header-search-input') as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // 3. SHORTCUTS CHEATSHEET MODAL: '?' or 'Shift + /'
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      // 4. REFRESH FEED: 'R' or 'r'
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRefresh();
        showShortcutToast('Refreshing live news feeds...', 'R');
        return;
      }

      // 5. If Article Modal is active:
      if (selectedArticle) {
        if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowRight') {
          e.preventDefault();
          navigateToNextArticle();
          return;
        }
        if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowLeft') {
          e.preventDefault();
          navigateToPrevArticle();
          return;
        }
        if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          handleToggleBookmark(selectedArticle);
          showShortcutToast(
            bookmarkedIds.includes(selectedArticle.id) ? 'Bookmark removed' : 'Article bookmarked',
            'M'
          );
          return;
        }
        return;
      }

      // 6. Main Feed Navigation (No modal open)
      // TOGGLE BOOKMARKS: 'B' or 'b'
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setShowBookmarksOnly((prev) => {
          const nextVal = !prev;
          showShortcutToast(nextVal ? 'Filter: Saved Stories Only' : 'Filter: All Live Drops', 'B');
          return nextVal;
        });
        return;
      }

      // TOGGLE GRID / COMPACT VIEW: 'G' or 'g' or 'V' or 'v'
      if (e.key === 'g' || e.key === 'G' || e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setLayoutMode((prev) => {
          const next = prev === 'grid' ? 'compact' : 'grid';
          showShortcutToast(`Layout: ${next.toUpperCase()}`, e.key.toUpperCase());
          return next;
        });
        return;
      }

      // QUICK CATEGORY SELECTION: Keys 1 - 8
      const categories: NewsCategory[] = [
        'All',
        'Technology',
        'World',
        'Science',
        'Business',
        'Sports',
        'Entertainment',
        'Health',
      ];
      if (e.key >= '1' && e.key <= '8') {
        const catIndex = parseInt(e.key, 10) - 1;
        if (categories[catIndex]) {
          e.preventDefault();
          setSelectedCategory(categories[catIndex]);
          showShortcutToast(`Category: ${categories[catIndex]}`, e.key);
          return;
        }
      }

      // PAGINATION: 'N' (Next page) / 'P' (Prev page)
      if (e.key === 'n' || e.key === 'N') {
        if (currentPage < totalPages) {
          e.preventDefault();
          handlePageChange(currentPage + 1);
          showShortcutToast(`Page ${currentPage + 1} of ${totalPages}`, 'N');
        }
      } else if (e.key === 'p' || e.key === 'P') {
        if (currentPage > 1) {
          e.preventDefault();
          handlePageChange(currentPage - 1);
          showShortcutToast(`Page ${currentPage - 1} of ${totalPages}`, 'P');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedArticle,
    policyOpen,
    analyticsOpen,
    addSourceOpen,
    dashboardOpen,
    shortcutsOpen,
    showBookmarksOnly,
    bookmarkedIds,
    currentPage,
    totalPages,
    filteredArticles,
    currentArticleIndex,
    hasNextArticle,
    hasPrevArticle,
    handleRefresh,
  ]);

  return (
    <div className="min-h-screen bg-[#faf7ee] text-black flex flex-col font-neo selection:bg-[#ffe600] selection:text-black">
      
      {/* 1. Navigation Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        showBookmarksOnly={showBookmarksOnly}
        setShowBookmarksOnly={setShowBookmarksOnly}
        bookmarkCount={bookmarkedIds.length}
        onOpenAnalytics={() => setAnalyticsOpen(true)}
        onOpenAddSource={() => setAddSourceOpen(true)}
        onOpenDashboard={() => handleNavigatePage('dashboard')}
        onOpenPolicy={handleOpenPolicy}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        lastRefreshedAt={data?.lastRefreshedAt || ''}
        nextRefreshFormatted={nextRefreshFormatted}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setCurrentPage(1);
        }}
        activePage={activePage}
        onNavigatePage={handleNavigatePage}
        totalArticles={data?.articles?.length || 0}
        language={language}
        onToggleLanguage={setLanguage}
      />

      {/* 2. Page Router Rendering */}
      {activePage === 'about' && (
        <AboutPage
          onBackToNews={() => handleNavigatePage('home')}
          onNavigatePage={handleNavigatePage}
        />
      )}

      {activePage === 'advertise' && (
        <AdvertisePage
          onBackToNews={() => handleNavigatePage('home')}
          onNavigatePage={handleNavigatePage}
        />
      )}

      {activePage === 'contact' && (
        <ContactPage
          onBackToNews={() => handleNavigatePage('home')}
          onNavigatePage={handleNavigatePage}
        />
      )}

      {activePage === 'privacy' && (
        <PrivacyPolicyPage
          onBackToNews={() => handleNavigatePage('home')}
          onNavigatePage={handleNavigatePage}
        />
      )}

      {activePage === 'dashboard' && (
        <DashboardPage
          onBackToNews={() => handleNavigatePage('home')}
          onNavigatePage={handleNavigatePage}
          articles={data?.articles || []}
          onArticlesUpdated={(updatedArticles) => {
            if (data) {
              setData({
                ...data,
                articles: updatedArticles,
                totalArticles: updatedArticles.length,
              });
            }
          }}
        />
      )}

      {activePage === 'database' && (
        <DatabasePage
          onBackToNews={() => handleNavigatePage('home')}
          onNavigatePage={handleNavigatePage}
          onOpenArticle={handleOpenArticle}
          articles={data?.articles || []}
          onArticlesUpdated={(updatedArticles) => {
            if (data) {
              setData({
                ...data,
                articles: updatedArticles,
                totalArticles: updatedArticles.length,
              });
            }
          }}
        />
      )}

      {activePage === 'videos' && (
        <ViralVideosPage
          onBackToNews={() => handleNavigatePage('home')}
          onNavigatePage={handleNavigatePage}
          language={language}
        />
      )}

      {/* 3. Default Home View: Live News Feed */}
      {activePage === 'home' && (
        <>
          {/* Live 10-Minute Countdown & Stats Bar */}
          {data && (
            <RefreshTimerBar
              lastRefreshedAt={data.lastRefreshedAt}
              nextRefreshAt={data.nextRefreshAt}
              refreshIntervalSeconds={data.refreshIntervalSeconds}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              totalArticles={data.totalArticles}
            />
          )}

          {/* Breaking News Ticker */}
          {data && data.breakingNews && data.breakingNews.length > 0 && (
            <Ticker
              breakingArticles={data.breakingNews}
              onSelectArticle={handleOpenArticle}
            />
          )}

          {/* Main Layout Container with Side AdSense Skyscraper Towers */}
          <div className="flex-1 w-full max-w-[1780px] mx-auto px-2 sm:px-4 lg:px-6 py-6 flex gap-4 lg:gap-6 justify-center items-start">

            {/* Left Side Skyscraper AdSense Column */}
            <aside className="hidden xl:block w-[180px] 2xl:w-[210px] shrink-0 sticky top-20 self-start space-y-4">
              <AdSenseUnit
                type="skyscraper"
                slot="1234567891"
                label="SPONSORED"
              />
            </aside>

            {/* Center Main Content Area */}
            <main className="flex-1 min-w-0 max-w-7xl w-full mx-auto space-y-6">

              {/* Featured News Hero Carousel */}
              {data?.articles && data.articles.length > 0 && (selectedCategory === 'All' || !selectedCategory) ? (
                <NewsCarousel
                  articles={data.articles}
                  onOpenArticle={handleOpenArticle}
                  language={language}
                />
              ) : null}

              {/* Google AdSense Top Leaderboard Banner */}
              <AdSenseUnit type="banner" format="horizontal" />

              {/* Controls Section: Categories with Session Read Progress Bar, Layout Switcher */}
              <div className="space-y-4">
                
                {/* Top Control Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
                  
                  {/* Category Filter with Read/Seen Bubble & Progress Bar */}
                  <CategoryFilter
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    categoryCounts={data?.stats?.categoryCounts || {}}
                    readCounts={readCategoryCounts}
                    language={language}
                  />

                  {/* Layout Mode Switcher */}
                  <div className="flex items-center gap-1 bg-white p-1 border-2 border-black neo-shadow-sm shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => setLayoutMode('grid')}
                      className={`p-1.5 transition-all cursor-pointer border ${
                        layoutMode === 'grid' ? 'bg-[#ffe600] text-black border-black font-black neo-shadow-sm' : 'bg-transparent text-zinc-600 border-transparent hover:text-black hover:bg-zinc-100'
                      }`}
                      title="Grid Layout View"
                      aria-label="Grid layout"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setLayoutMode('compact')}
                      className={`p-1.5 transition-all cursor-pointer border ${
                        layoutMode === 'compact' ? 'bg-[#ffe600] text-black border-black font-black neo-shadow-sm' : 'bg-transparent text-zinc-600 border-transparent hover:text-black hover:bg-zinc-100'
                      }`}
                      title="Compact List View"
                      aria-label="Compact layout"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </div>

              {/* Results Counter & Active Filter Tags */}
              <div className="flex items-center justify-between text-xs text-zinc-800 font-neo font-bold">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Showing <strong className="text-black font-mono font-black bg-[#ffe600] border border-black px-2 py-0.5">{filteredArticles.length}</strong> verified stories</span>
                  {showBookmarksOnly && (
                    <span className="px-2 py-0.5 bg-[#ff2a85] text-white border border-black font-black">
                      Saved Only
                    </span>
                  )}
                  {selectedCategory !== 'All' && (
                    <span className="px-2 py-0.5 bg-[#ccff00] text-black border border-black font-black">
                      Category: {selectedCategory}
                    </span>
                  )}
                  {selectedSource !== 'All' && (
                    <span className="px-2 py-0.5 bg-black text-white border border-black font-black">
                      Source: {selectedSource}
                    </span>
                  )}
                </div>

                {(searchQuery || selectedCategory !== 'All' || selectedSource !== 'All' || showBookmarksOnly) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setSelectedSource('All');
                      setShowBookmarksOnly(false);
                    }}
                    className="text-[#ff2a85] font-black hover:underline text-xs shrink-0 cursor-pointer bg-white px-2 py-0.5 border border-black"
                  >
                    Reset Filters ✕
                  </button>
                )}
              </div>

              {/* Loading State */}
              {loading && (
                <div className="py-20 text-center space-y-4 font-neo bg-white border-2 border-black neo-shadow p-8 max-w-lg mx-auto">
                  <div className="inline-flex items-center justify-center p-3 bg-[#ffe600] text-black border-2 border-black neo-shadow-sm">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                  <h3 className="text-base font-black text-black">Gathering Latest News Feeds...</h3>
                  <p className="text-xs text-zinc-700 font-medium">Fetching real-time verified stories from BBC, Reuters, TechCrunch, NPR, NASA & 20+ feeds.</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="p-6 bg-rose-50 border-2 border-black neo-shadow text-center space-y-3 max-w-lg mx-auto font-neo">
                  <AlertCircle className="w-7 h-7 text-[#ff2a85] mx-auto" />
                  <h3 className="text-sm font-black text-black">News Feed Update Notice</h3>
                  <p className="text-xs text-zinc-700">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-black hover:bg-zinc-800 text-[#ccff00] text-xs font-black border-2 border-black neo-shadow-sm transition-colors cursor-pointer"
                  >
                    Retry Updates ↻
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && filteredArticles.length === 0 && (
                <div className="py-16 text-center space-y-4 bg-white border-2 border-black neo-shadow p-8 max-w-md mx-auto font-neo">
                  <div className="w-12 h-12 mx-auto bg-[#ffe600] border-2 border-black flex items-center justify-center text-black">
                    <BookmarkCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-black">No Stories Found</h3>
                  <p className="text-xs text-zinc-600">
                    {searchQuery ? `No articles matching "${searchQuery}". Try different keywords or switch categories.` : 'Try adjusting your category filters or source selection.'}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setSelectedSource('All');
                      setShowBookmarksOnly(false);
                    }}
                    className="px-4 py-2 bg-black hover:bg-zinc-800 text-[#ccff00] text-xs font-black border-2 border-black neo-shadow-sm cursor-pointer transition-colors"
                  >
                    Clear Filters & Search
                  </button>
                </div>
              )}

              {/* Articles List / Grid & Pagination */}
              {!loading && !error && filteredArticles.length > 0 && (
                <div className="space-y-6">
                  
                  {/* Top Pagination Bar */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredArticles.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />

                  {/* Grid or Compact Card List */}
                  <div
                    className={
                      layoutMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'space-y-4'
                    }
                  >
                    {paginatedArticles.map((article, index) => {
                      const showInFeedAd = index > 0 && index % 6 === 0;
                      return (
                        <React.Fragment key={article.id}>
                          {showInFeedAd && (
                            <AdSenseUnit
                              type="in-feed"
                              format="fluid"
                              className="col-span-1"
                            />
                          )}
                          <ArticleCard
                            article={article}
                            isBookmarked={bookmarkedIds.includes(article.id)}
                            onToggleBookmark={handleToggleBookmark}
                            onOpenArticle={handleOpenArticle}
                          />
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Google AdSense Bottom Banner */}
                  <AdSenseUnit type="banner" format="horizontal" />

                  {/* Bottom Pagination Bar */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredArticles.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />

                </div>
              )}

            </main>

            {/* Right Side Skyscraper Column with Persistent Daily Top 5 Widget & Ad */}
            <aside className="hidden xl:block w-[200px] 2xl:w-[230px] shrink-0 sticky top-20 self-start space-y-4">
              <NewsletterSignup
                variant="sidebar"
                onOpenArticle={handleOpenArticle}
              />
              <AdSenseUnit
                type="skyscraper"
                slot="1234567892"
                label="RIGHT AD TOWER"
              />
            </aside>

          </div>
        </>
      )}

      {/* Official Broadsheet Footer & AdSense Compliance Bar */}
      <Footer
        onOpenPolicy={handleOpenPolicy}
        onOpenDashboard={() => handleNavigatePage('dashboard')}
        onNavigatePage={handleNavigatePage}
        onOpenArticle={handleOpenArticle}
        totalArticles={data?.totalArticles || 0}
        lastRefreshedAt={data?.lastRefreshedAt}
      />

      {/* GDPR / CCPA & Google AdSense Cookie Consent Notice */}
      <CookieConsentBanner
        onOpenPolicy={handleOpenPolicy}
        onNavigatePage={handleNavigatePage}
      />

      {/* Keyboard Shortcut Toast Notification */}
      {shortcutToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-black text-[#ccff00] px-4 py-2.5 border-2 border-black neo-shadow font-neo font-black animate-fade-in text-xs">
          <div className="w-2 h-2 bg-[#ff2a85] rounded-full animate-ping" />
          <span className="tracking-wide">
            {shortcutToast.message}
          </span>
          {shortcutToast.key && (
            <kbd className="px-2 py-0.5 text-[10px] font-mono font-black bg-zinc-800 text-[#00f0ff] border border-black">
              {shortcutToast.key}
            </kbd>
          )}
        </div>
      )}

      {/* Modals */}
      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        isBookmarked={selectedArticle ? bookmarkedIds.includes(selectedArticle.id) : false}
        onToggleBookmark={handleToggleBookmark}
        onNextArticle={navigateToNextArticle}
        onPrevArticle={navigateToPrevArticle}
        hasNextArticle={hasNextArticle}
        hasPrevArticle={hasPrevArticle}
      />

      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <PolicyModal
        isOpen={policyOpen}
        initialTab={policyTab}
        onClose={() => setPolicyOpen(false)}
      />

      <AnalyticsModal
        isOpen={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        sources={data?.sources || []}
        stats={data?.stats || { categoryCounts: {}, sourceCounts: {}, sentimentCounts: {} }}
        totalArticles={data?.totalArticles || 0}
        refreshCount={data?.refreshCount || 0}
        lastRefreshedAt={data?.lastRefreshedAt || ''}
        onToggleSourceActive={handleToggleSourceActive}
      />

      <AddSourceModal
        isOpen={addSourceOpen}
        onClose={() => setAddSourceOpen(false)}
        onSourceAdded={loadNewsData}
      />

      <AdminDashboard
        isOpen={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
        articles={data?.articles || []}
        onArticlesUpdated={(updatedArticles) => {
          if (data) {
            setData({
              ...data,
              articles: updatedArticles,
              totalArticles: updatedArticles.length,
            });
          }
        }}
      />

    </div>
  );
}
