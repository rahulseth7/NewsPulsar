import React, { useState, useMemo, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  ArrowLeft, 
  ShieldCheck, 
  HardDrive, 
  FileSpreadsheet, 
  FileCode, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Layers, 
  Eye, 
  Sparkles, 
  Share2, 
  Bookmark, 
  BookmarkCheck, 
  Tag, 
  TrendingUp, 
  Server,
  Activity,
  AlertCircle,
  Globe,
  Copy,
  Check
} from 'lucide-react';
import { NewsArticle, NewsCategory, Language, PageView, SitemapStatusInfo } from '../types';
import { fetchDatabaseInfo, syncDatabaseStorage, createDatabaseBackup, fetchAllDatabaseArticles, fetchSitemapStatus, regenerateSitemapNow } from '../services/newsApi';
import { CATEGORY_HINDI_MAP, UI_STRINGS_HINDI } from '../utils/hindiTranslator';

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

interface DatabasePageProps {
  articles: NewsArticle[];
  onNavigateHome?: () => void;
  onBackToNews?: () => void;
  onSelectArticle?: (article: NewsArticle) => void;
  onOpenArticle?: (article: NewsArticle) => void;
  onBookmarkToggle?: (id: string) => void;
  isBookmarked?: (id: string) => boolean;
  language?: Language;
  onRefreshData?: () => void;
  onNavigatePage?: (page: PageView) => void;
  onArticlesUpdated?: (articles: NewsArticle[]) => void;
}

export const DatabasePage: React.FC<DatabasePageProps> = ({
  articles,
  onNavigateHome,
  onBackToNews,
  onSelectArticle,
  onOpenArticle,
  onBookmarkToggle,
  isBookmarked = (_id: string) => false,
  language = 'en',
  onRefreshData,
  onNavigatePage,
  onArticlesUpdated,
}) => {
  const handleBack = () => {
    if (onBackToNews) onBackToNews();
    else if (onNavigateHome) onNavigateHome();
    else if (onNavigatePage) onNavigatePage('home');
  };

  const handleSelectArticle = (art: NewsArticle) => {
    if (onOpenArticle) onOpenArticle(art);
    else if (onSelectArticle) onSelectArticle(art);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [sitemapInfo, setSitemapInfo] = useState<SitemapStatusInfo | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isScrapingNow, setIsScrapingNow] = useState(false);
  const [isReindexingSitemap, setIsReindexingSitemap] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load live database telemetry and sitemap status on mount
  const loadDbInfo = async () => {
    const [info, sitemap] = await Promise.all([
      fetchDatabaseInfo(),
      fetchSitemapStatus()
    ]);
    setDbStatus(info);
    if (sitemap) setSitemapInfo(sitemap);
  };

  const handleReindexSitemap = async () => {
    setIsReindexingSitemap(true);
    try {
      const res = await regenerateSitemapNow();
      if (res && res.success) {
        setStatusMessage(`⚡ Sitemap Re-indexed! ${res.totalArticlesIndexed} posts and ${res.totalVideosIndexed} videos refreshed across all sitemap protocols.`);
        const sitemap = await fetchSitemapStatus();
        if (sitemap) setSitemapInfo(sitemap);
      }
    } catch (err: any) {
      setStatusMessage('Sitemap regeneration failed: ' + err.message);
    } finally {
      setIsReindexingSitemap(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleCopyUrl = (url: string) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  useEffect(() => {
    loadDbInfo();
  }, [articles.length]);

  // Unique sources list
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    articles.forEach((a) => {
      if (a.source) sources.add(a.source);
    });
    return ['All', ...Array.from(sources).sort()];
  }, [articles]);

  // Categories list
  const categories: NewsCategory[] = [
    'All',
    'World',
    'Technology',
    'Business',
    'Science',
    'Entertainment',
    'Health',
    'Sports',
  ];

  // Filtering & Sorting
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      // Category filter
      if (selectedCategory !== 'All' && art.category !== selectedCategory) {
        return false;
      }
      // Source filter
      if (selectedSource !== 'All' && art.source !== selectedSource) {
        return false;
      }
      // Sentiment filter
      if (selectedSentiment !== 'All' && art.sentiment !== selectedSentiment) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = art.title?.toLowerCase().includes(query);
        const descMatch = art.description?.toLowerCase().includes(query);
        const sourceMatch = art.source?.toLowerCase().includes(query);
        const tagMatch = art.tags?.some((t) => t.toLowerCase().includes(query));
        const seoMatch = art.seoKeywords?.some((k) => k.toLowerCase().includes(query));
        const whyMatch = art.aiSummary?.whyItMatters?.toLowerCase().includes(query);

        if (!titleMatch && !descMatch && !sourceMatch && !tagMatch && !seoMatch && !whyMatch) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [articles, selectedCategory, selectedSource, selectedSentiment, searchQuery, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage) || 1;
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredArticles.slice(start, start + itemsPerPage);
  }, [filteredArticles, currentPage, itemsPerPage]);

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const res = await syncDatabaseStorage(articles);
      setStatusMessage(res.message || 'Database synchronized to server disk & IndexedDB.');
      await loadDbInfo();
    } catch (err: any) {
      setStatusMessage('Sync failed: ' + err.message);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleBackupDatabase = async () => {
    setIsBackingUp(true);
    setStatusMessage(null);
    try {
      const res = await createDatabaseBackup();
      setStatusMessage(res.message || 'Backup snapshot created successfully.');
      await loadDbInfo();
    } catch (err: any) {
      setStatusMessage('Backup failed: ' + err.message);
    } finally {
      setIsBackingUp(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleScrapeNow = async () => {
    setIsScrapingNow(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/database/scrape-now', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatusMessage(data.message || 'Scraping complete and persisted.');
        if (onRefreshData) onRefreshData();
        await loadDbInfo();
      }
    } catch (err: any) {
      setStatusMessage('Scrape failed: ' + err.message);
    } finally {
      setIsScrapingNow(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Client-side JSON database download fallback
  const handleExportClientJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(articles, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `scraped_news_database_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 font-neo space-y-6">
      
      {/* 1. Breadcrumb & Header Nav */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="px-3 py-1.5 bg-white hover:bg-black hover:text-[#ccff00] text-black font-mono font-black text-xs border-2 border-black neo-shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'hi' ? '← मुख्य वायर' : '← LIVE WIRE'}</span>
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-none">
              {language === 'hi' ? '🗄️ स्क्रैप किया गया समाचार डेटाबेस' : '🗄️ SCRAPED NEWS DATABASE'}
            </h1>
            <p className="text-xs text-zinc-700 font-bold mt-1">
              {language === 'hi'
                ? 'स्थायी डिस्क और इंडेक्स्ड डीबी रिपॉजिटरी - कभी डेटा नहीं खोता'
                : 'Permanent Disk & IndexedDB Archive — Zero Data Loss Guarantee'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleScrapeNow}
            disabled={isScrapingNow}
            className="px-3 py-1.5 bg-[#ccff00] hover:bg-[#b8e600] text-black font-neo font-black text-xs border-2 border-black neo-shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Scrape all news feeds now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScrapingNow ? 'animate-spin' : ''}`} />
            <span>{language === 'hi' ? 'ताज़ा स्क्रैप करें' : 'SCRAPE FEEDS NOW'}</span>
          </button>

          <button
            onClick={handleSyncDatabase}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-[#00f0ff] hover:bg-[#00d0e0] text-black font-neo font-black text-xs border-2 border-black neo-shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Sync all articles between server and client"
          >
            <Server className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{language === 'hi' ? 'डेटाबेस सिंक' : 'SYNC DATABASE'}</span>
          </button>

          <button
            onClick={handleBackupDatabase}
            disabled={isBackingUp}
            className="px-3 py-1.5 bg-white hover:bg-black hover:text-white text-black font-neo font-black text-xs border-2 border-black neo-shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Create server timestamped backup"
          >
            <HardDrive className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
            <span>{language === 'hi' ? 'बैकअप लें' : 'BACKUP SNAPSHOT'}</span>
          </button>
        </div>
      </div>

      {/* Status Notification Toast */}
      {statusMessage && (
        <div className="p-3 bg-[#ccff00] border-2 border-black neo-shadow flex items-center gap-2 text-black font-neo font-bold text-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 2. Database Telemetry Metrics Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Stored */}
        <div className="bg-white border-2 border-black p-4 neo-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-zinc-600 uppercase">TOTAL PERSISTED ARTICLES</span>
            <div className="p-1.5 bg-[#ccff00] border border-black text-black">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-neo text-black mt-2">
            {articles.length}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-700 font-bold mt-1">
            <span className="w-2 h-2 rounded-full bg-[#00a86b]" />
            <span>All records retained & indexed</span>
          </div>
        </div>

        {/* Metric 2: Zero Loss Protection */}
        <div className="bg-[#ffe600] border-2 border-black p-4 neo-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-black uppercase">DATA LOSS GUARANTEE</span>
            <div className="p-1.5 bg-black border border-black text-[#ffe600]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-neo text-black mt-2">
            100% PROTECTED
          </div>
          <div className="text-[11px] text-black font-bold mt-1">
            Dual Disk JSON + Client IndexedDB
          </div>
        </div>

        {/* Metric 3: Active Sources */}
        <div className="bg-white border-2 border-black p-4 neo-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-zinc-600 uppercase">CONNECTED SOURCES</span>
            <div className="p-1.5 bg-[#00f0ff] border border-black text-black">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-neo text-black mt-2">
            {uniqueSources.length - 1}
          </div>
          <div className="text-[11px] text-zinc-700 font-bold mt-1">
            Global wires & verified publishers
          </div>
        </div>

        {/* Metric 4: Storage File & Size */}
        <div className="bg-white border-2 border-black p-4 neo-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-zinc-600 uppercase">STORAGE ENGINE</span>
            <div className="p-1.5 bg-[#ff2a85] border border-black text-white">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-mono font-bold text-black mt-2 truncate">
            {dbStatus?.storageFile || 'scraped_articles_db.json'}
          </div>
          <div className="text-[11px] text-zinc-700 font-bold mt-1">
            Size: {dbStatus?.fileSizeKb ? `${dbStatus.fileSizeKb} KB` : 'Dynamic Auto-Saved'}
          </div>
        </div>

      </div>

      {/* 3. Export Center Bar */}
      <div className="bg-zinc-900 text-white border-2 border-black neo-shadow p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-mono font-bold text-[#ccff00] uppercase tracking-wider block">
            DATA EXPORT & PORTABILITY
          </span>
          <p className="text-xs text-zinc-300 font-medium mt-0.5">
            Download the complete persistent scraped news database in standard open formats anytime:
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <a
            href="/api/news/export/excel"
            download="scraped_news_export.xlsx"
            className="px-3 py-1.5 bg-[#00f5a0] hover:bg-[#00d085] text-black font-neo font-black text-xs border border-black flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </a>

          <a
            href="/api/news/export/csv"
            download="scraped_news_export.csv"
            className="px-3 py-1.5 bg-[#ffe600] hover:bg-[#ffd700] text-black font-neo font-black text-xs border border-black flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CSV File</span>
          </a>

          <button
            onClick={handleExportClientJson}
            className="px-3 py-1.5 bg-[#00f0ff] hover:bg-[#00d0e0] text-black font-neo font-black text-xs border border-black flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>JSON Database</span>
          </button>
        </div>
      </div>

      {/* 3.5. Automated Daily Sitemap & Search Console Indexing Center */}
      <div className="bg-[#faf7ee] border-2 border-black neo-shadow p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b-2 border-black pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#ccff00] border-2 border-black neo-shadow-sm text-black">
                <Globe className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-black font-neo text-black tracking-tight uppercase">
                DAILY AUTOMATED SITEMAP &amp; SEARCH ENGINE INDEXER
              </h2>
              <span className="px-2 py-0.5 bg-emerald-300 text-emerald-950 border border-black font-mono font-black text-[10px] uppercase">
                ● 24h Cron Active
              </span>
            </div>
            <p className="text-xs text-zinc-700 font-bold">
              Automatically updates daily listing all scraped articles &amp; video feeds so Google, Bing, and RSS crawlers index every story.
            </p>
          </div>

          <button
            onClick={handleReindexSitemap}
            disabled={isReindexingSitemap}
            className="px-3 py-1.5 bg-[#ccff00] hover:bg-[#b8e600] text-black font-neo font-black text-xs border-2 border-black neo-shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title="Force immediate sitemap regeneration"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReindexingSitemap ? 'animate-spin' : ''}`} />
            <span>{isReindexingSitemap ? 'RE-INDEXING...' : '⚡ RE-INDEX SITEMAP NOW'}</span>
          </button>
        </div>

        {/* Schedule & Telemetry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-white border-2 border-black">
            <div className="text-[10px] font-mono font-bold text-zinc-600 uppercase">Total Articles In Sitemap</div>
            <div className="text-2xl font-black font-neo text-black mt-1">
              {sitemapInfo?.totalArticlesIndexed ?? articles.length}
            </div>
            <div className="text-[10px] text-zinc-600 font-bold mt-0.5">
              100% of database indexed
            </div>
          </div>

          <div className="p-3 bg-white border-2 border-black">
            <div className="text-[10px] font-mono font-bold text-zinc-600 uppercase">Google News 48h Index</div>
            <div className="text-2xl font-black font-neo text-[#ff2a85] mt-1">
              {sitemapInfo?.googleNewsArticles48h ?? 0}
            </div>
            <div className="text-[10px] text-zinc-600 font-bold mt-0.5">
              Eligible breaking stories
            </div>
          </div>

          <div className="p-3 bg-white border-2 border-black">
            <div className="text-[10px] font-mono font-bold text-zinc-600 uppercase">Last Generated</div>
            <div className="text-xs font-mono font-black text-black mt-1 truncate">
              {sitemapInfo?.lastGeneratedAt ? new Date(sitemapInfo.lastGeneratedAt).toLocaleTimeString() : 'Active'}
            </div>
            <div className="text-[10px] text-zinc-600 font-bold mt-0.5">
              Disk files synchronized
            </div>
          </div>

          <div className="p-3 bg-white border-2 border-black">
            <div className="text-[10px] font-mono font-bold text-zinc-600 uppercase">Next Daily Cron Run</div>
            <div className="text-xs font-mono font-black text-emerald-800 mt-1 truncate">
              {sitemapInfo?.nextScheduledDailyRunAt ? new Date(sitemapInfo.nextScheduledDailyRunAt).toLocaleTimeString() : 'Midnight UTC'}
            </div>
            <div className="text-[10px] text-zinc-600 font-bold mt-0.5">
              24h recurring automated sync
            </div>
          </div>
        </div>

        {/* Sitemaps Direct Links */}
        <div className="space-y-2">
          <div className="text-xs font-mono font-black text-black uppercase tracking-wider">
            Active Sitemap URLs (Ready for Google Search Console &amp; Bing Webmaster):
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            
            {/* Master Index */}
            <div className="p-2.5 bg-white border-2 border-black flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-mono font-black text-black truncate">/sitemap_index.xml</div>
                <div className="text-[10px] text-zinc-600 font-bold">Master Sitemap Index</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCopyUrl('/sitemap_index.xml')}
                  className="p-1 bg-[#eee] hover:bg-[#ddd] border border-black text-black cursor-pointer"
                  title="Copy URL"
                >
                  {copiedUrl === '/sitemap_index.xml' ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                </button>
                <a
                  href="/sitemap_index.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-black text-white font-mono font-bold text-[10px] border border-black hover:bg-zinc-800 flex items-center gap-1"
                >
                  <span>Open</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            {/* Posts Sitemap */}
            <div className="p-2.5 bg-white border-2 border-black flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-mono font-black text-black truncate">/sitemap.xml</div>
                <div className="text-[10px] text-zinc-600 font-bold">All Posts &amp; Images</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCopyUrl('/sitemap.xml')}
                  className="p-1 bg-[#eee] hover:bg-[#ddd] border border-black text-black cursor-pointer"
                  title="Copy URL"
                >
                  {copiedUrl === '/sitemap.xml' ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                </button>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-black text-white font-mono font-bold text-[10px] border border-black hover:bg-zinc-800 flex items-center gap-1"
                >
                  <span>Open</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            {/* Google News Sitemap */}
            <div className="p-2.5 bg-white border-2 border-black flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-mono font-black text-black truncate">/news-sitemap.xml</div>
                <div className="text-[10px] text-zinc-600 font-bold">Google News (48 Hours)</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCopyUrl('/news-sitemap.xml')}
                  className="p-1 bg-[#eee] hover:bg-[#ddd] border border-black text-black cursor-pointer"
                  title="Copy URL"
                >
                  {copiedUrl === '/news-sitemap.xml' ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                </button>
                <a
                  href="/news-sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-black text-white font-mono font-bold text-[10px] border border-black hover:bg-zinc-800 flex items-center gap-1"
                >
                  <span>Open</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            {/* Video Sitemap */}
            <div className="p-2.5 bg-white border-2 border-black flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-mono font-black text-black truncate">/video-sitemap.xml</div>
                <div className="text-[10px] text-zinc-600 font-bold">Google Video Search</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCopyUrl('/video-sitemap.xml')}
                  className="p-1 bg-[#eee] hover:bg-[#ddd] border border-black text-black cursor-pointer"
                  title="Copy URL"
                >
                  {copiedUrl === '/video-sitemap.xml' ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                </button>
                <a
                  href="/video-sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-black text-white font-mono font-bold text-[10px] border border-black hover:bg-zinc-800 flex items-center gap-1"
                >
                  <span>Open</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            {/* Category Sitemap */}
            <div className="p-2.5 bg-white border-2 border-black flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-mono font-black text-black truncate">/category-sitemap.xml</div>
                <div className="text-[10px] text-zinc-600 font-bold">Categories &amp; Topic Tags</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCopyUrl('/category-sitemap.xml')}
                  className="p-1 bg-[#eee] hover:bg-[#ddd] border border-black text-black cursor-pointer"
                  title="Copy URL"
                >
                  {copiedUrl === '/category-sitemap.xml' ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                </button>
                <a
                  href="/category-sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-black text-white font-mono font-bold text-[10px] border border-black hover:bg-zinc-800 flex items-center gap-1"
                >
                  <span>Open</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            {/* HTML Sitemap */}
            <div className="p-2.5 bg-white border-2 border-black flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-mono font-black text-black truncate">/sitemap.html</div>
                <div className="text-[10px] text-zinc-600 font-bold">Searchable HTML Index</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCopyUrl('/sitemap.html')}
                  className="p-1 bg-[#eee] hover:bg-[#ddd] border border-black text-black cursor-pointer"
                  title="Copy URL"
                >
                  {copiedUrl === '/sitemap.html' ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                </button>
                <a
                  href="/sitemap.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-black text-white font-mono font-bold text-[10px] border border-black hover:bg-zinc-800 flex items-center gap-1"
                >
                  <span>Open</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 4. Interactive Filters, Search & View Controls */}
      <div className="bg-white border-2 border-black p-4 neo-shadow space-y-4">
        
        {/* Search & Mode Toggles */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={language === 'hi' ? 'डेटाबेस में शीर्षक, स्रोत, टैग या सारांश खोजें...' : 'Search database records by title, summary, source, tags, keywords...'}
              className="w-full pl-9 pr-8 py-2 bg-[#faf7ee] text-black font-neo font-bold text-xs sm:text-sm border-2 border-black neo-shadow-sm focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 hover:text-black"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode & Sort Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center border-2 border-black neo-shadow-sm bg-white">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-neo font-black transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-black text-[#ccff00]' : 'text-black hover:bg-zinc-100'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-xs font-neo font-black transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-black text-[#ccff00]' : 'text-black hover:bg-zinc-100'
                }`}
              >
                Cards View
              </button>
            </div>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white text-black font-neo font-black text-xs border-2 border-black neo-shadow-sm cursor-pointer focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title (A-Z)</option>
            </select>

            {/* Items Per Page */}
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1.5 bg-white text-black font-mono font-bold text-xs border-2 border-black neo-shadow-sm cursor-pointer focus:outline-none"
            >
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>

        </div>

        {/* Filter Chips Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200">
          <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase shrink-0">
            CATEGORIES:
          </span>
          {categories.map((cat) => {
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-neo font-black border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-[#ccff00] text-black border-black neo-shadow-sm'
                    : 'bg-[#faf7ee] text-zinc-700 border-zinc-300 hover:border-black hover:text-black'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Source & Sentiment Selectors */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Source dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold text-zinc-600">SOURCE:</span>
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white text-black font-neo font-bold text-xs border border-black focus:outline-none"
            >
              {uniqueSources.map((src) => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>

          {/* Sentiment dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold text-zinc-600">SENTIMENT:</span>
            <select
              value={selectedSentiment}
              onChange={(e) => {
                setSelectedSentiment(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white text-black font-neo font-bold text-xs border border-black focus:outline-none"
            >
              <option value="All">All Sentiments</option>
              <option value="Urgent">Urgent</option>
              <option value="Positive">Positive</option>
              <option value="Neutral">Neutral</option>
              <option value="Analysis">Analysis</option>
              <option value="Warning">Warning</option>
            </select>
          </div>

          {/* Matches Counter */}
          <div className="ml-auto text-xs font-mono font-bold text-black bg-[#faf7ee] px-2.5 py-1 border border-black">
            SHOWING {filteredArticles.length} OF {articles.length} DATABASE RECORDS
          </div>
        </div>

      </div>

      {/* 5. Main Records View: Table or Cards */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white border-2 border-black p-12 text-center neo-shadow space-y-3">
          <Database className="w-12 h-12 text-zinc-400 mx-auto" />
          <h3 className="text-lg font-black font-neo text-black">NO MATCHING DATABASE RECORDS FOUND</h3>
          <p className="text-xs text-zinc-600 font-medium max-w-md mx-auto">
            Try adjusting your search keywords, category filter, or sentiment selector.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedSource('All');
              setSelectedSentiment('All');
            }}
            className="px-4 py-1.5 bg-black text-[#ccff00] font-neo font-black text-xs border border-black neo-shadow-sm cursor-pointer"
          >
            RESET ALL FILTERS
          </button>
        </div>
      ) : viewMode === 'table' ? (
        
        /* Table View */
        <div className="bg-white border-2 border-black neo-shadow overflow-x-auto">
          <table className="w-full text-left border-collapse font-neo text-xs">
            <thead>
              <tr className="bg-black text-white border-b-2 border-black font-mono text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 border-r border-zinc-700 w-12 text-center">#</th>
                <th className="py-2.5 px-3 border-r border-zinc-700 min-w-[280px]">TITLE / HEADLINE</th>
                <th className="py-2.5 px-3 border-r border-zinc-700 w-32">SOURCE</th>
                <th className="py-2.5 px-3 border-r border-zinc-700 w-28">CATEGORY</th>
                <th className="py-2.5 px-3 border-r border-zinc-700 w-32">PUBLISHED</th>
                <th className="py-2.5 px-3 border-r border-zinc-700 w-24">SENTIMENT</th>
                <th className="py-2.5 px-3 border-r border-zinc-700 w-20 text-center">AI SUMMARY</th>
                <th className="py-2.5 px-3 w-28 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {paginatedArticles.map((art, idx) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                const bookmarked = isBookmarked(art.id);
                return (
                  <tr 
                    key={art.id || idx}
                    className="hover:bg-[#faf7ee] transition-colors group cursor-pointer"
                    onClick={() => handleSelectArticle(art)}
                  >
                    <td className="py-2 px-3 border-r border-zinc-200 text-center font-mono text-[11px] text-zinc-500 font-bold">
                      {globalIndex}
                    </td>

                    <td className="py-2 px-3 border-r border-zinc-200">
                      <div className="font-bold text-black text-xs leading-snug group-hover:text-[#0055ff] line-clamp-2">
                        {art.title}
                      </div>
                      {art.tags && art.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {art.tags.slice(0, 3).map((t, i) => (
                            <span key={i} className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-1 border border-zinc-300">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-2 px-3 border-r border-zinc-200 font-bold text-zinc-800 whitespace-nowrap">
                      {art.source}
                    </td>

                    <td className="py-2 px-3 border-r border-zinc-200 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-[#faf7ee] border border-black text-[10px] font-bold text-black uppercase">
                        {art.category}
                      </span>
                    </td>

                    <td className="py-2 px-3 border-r border-zinc-200 font-mono text-[11px] text-zinc-600 whitespace-nowrap">
                      {formatDate(art.pubDate, language)}
                    </td>

                    <td className="py-2 px-3 border-r border-zinc-200 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase border border-black ${
                        art.sentiment === 'Urgent' ? 'bg-[#ff2a85] text-white' :
                        art.sentiment === 'Positive' ? 'bg-[#00f5a0] text-black' :
                        art.sentiment === 'Warning' ? 'bg-[#ffe600] text-black' :
                        'bg-zinc-100 text-black'
                      }`}>
                        {art.sentiment || 'Neutral'}
                      </span>
                    </td>

                    <td className="py-2 px-3 border-r border-zinc-200 text-center whitespace-nowrap">
                      {art.aiSummary ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#008000] bg-[#e6ffe6] px-1.5 py-0.5 border border-[#008000]">
                          <Sparkles className="w-3 h-3 text-[#008000]" />
                          <span>YES</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-400">AUTO</span>
                      )}
                    </td>

                    <td 
                      className="py-2 px-3 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSelectArticle(art)}
                          className="p-1 bg-white hover:bg-black hover:text-[#ccff00] text-black border border-black transition-colors cursor-pointer"
                          title="Inspect Database Record & AI Summary"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {onBookmarkToggle && (
                          <button
                            onClick={() => onBookmarkToggle(art.id)}
                            className={`p-1 border border-black transition-colors cursor-pointer ${
                              bookmarked ? 'bg-[#ff2a85] text-white' : 'bg-white hover:bg-zinc-100 text-black'
                            }`}
                            title={bookmarked ? 'Saved' : 'Bookmark'}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-white' : ''}`} />
                          </button>
                        )}

                        <a
                          href={art.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 bg-white hover:bg-[#00f0ff] text-black border border-black transition-colors"
                          title="Open Original Source"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      ) : (

        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedArticles.map((art) => {
            const bookmarked = isBookmarked(art.id);
            return (
              <div
                key={art.id}
                onClick={() => handleSelectArticle(art)}
                className="bg-white border-2 border-black p-4 neo-shadow hover:translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-[#ccff00] text-black text-[10px] font-black uppercase border border-black">
                      {art.category}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-600 font-bold">
                      {art.source}
                    </span>
                  </div>

                  <h3 className="font-neo font-black text-sm text-black leading-snug hover:underline line-clamp-2 mb-2">
                    {art.title}
                  </h3>

                  <p className="text-xs text-zinc-700 line-clamp-3 font-medium mb-3 leading-relaxed">
                    {art.aiSummary?.whyItMatters || art.description}
                  </p>

                  {art.tags && art.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {art.tags.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="text-[10px] font-mono bg-[#faf7ee] text-zinc-700 px-1.5 py-0.5 border border-zinc-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-600 text-[11px]">
                    {formatDate(art.pubDate, language)}
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {onBookmarkToggle && (
                      <button
                        onClick={() => onBookmarkToggle(art.id)}
                        className={`p-1 border border-black ${
                          bookmarked ? 'bg-[#ff2a85] text-white' : 'bg-white hover:bg-zinc-100 text-black'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-white' : ''}`} />
                      </button>
                    )}
                    <a
                      href={art.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 bg-white hover:bg-[#00f0ff] text-black border border-black"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      )}

      {/* 6. Pagination Bar */}
      {totalPages > 1 && (
        <div className="bg-white border-2 border-black p-3 neo-shadow flex flex-col sm:flex-row items-center justify-between gap-3 font-neo">
          <div className="text-xs font-bold text-zinc-700 font-mono">
            PAGE {currentPage} OF {totalPages} ({filteredArticles.length} TOTAL FILTERED)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white hover:bg-black hover:text-[#ccff00] text-black font-neo font-black text-xs border border-black disabled:opacity-30 cursor-pointer"
            >
              PREVIOUS
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = Math.min(totalPages - 4 + i, Math.max(1, currentPage - 2 + i));
                }
                const isActive = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 text-xs font-mono font-black border border-black cursor-pointer ${
                      isActive ? 'bg-black text-[#ccff00]' : 'bg-white hover:bg-zinc-100 text-black'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white hover:bg-black hover:text-[#ccff00] text-black font-neo font-black text-xs border border-black disabled:opacity-30 cursor-pointer"
            >
              NEXT
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
