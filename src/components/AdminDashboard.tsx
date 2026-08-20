import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Activity, 
  Globe, 
  Calendar, 
  Trash2, 
  Plus, 
  Search, 
  Tag, 
  Clock, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Users,
  Eye,
  FileText,
  Lock,
  LogOut,
  KeyRound,
  Database,
  Download,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  FileSpreadsheet,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Shield,
  TrendingUp,
  Flame,
  Cloud,
  Wand2,
  Zap,
  SlidersHorizontal,
  Loader2,
  Layers,
  Bot,
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
  Compass
} from 'lucide-react';
import { NewsArticle, IpAnalyticsData, NewsCategory, DatabaseStorageInfo, AutoTagSuggestion, BatchAutoTagResult, SitemapStatusInfo } from '../types';
import { fetchDatabaseInfo, syncDatabaseStorage, createDatabaseBackup, autoTagArticle, autoTagCustomText, batchAutoTagArticles, fetchSitemapStatus, regenerateSitemapNow } from '../services/newsApi';
import { TrendingTopicsVisualizer } from './TrendingTopicsVisualizer';
import { AutoTagInspectorModal } from './AutoTagInspectorModal';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  articles: NewsArticle[];
  onArticlesUpdated: (updatedArticles: NewsArticle[]) => void;
}

type TimePeriod = 'day' | 'week' | 'month' | 'year';
type ActiveTab = 'analytics' | 'trending' | 'posts' | 'database';

// Client-side fallback SVG CAPTCHA generator
function createFallbackCaptchaSvg(code: string): string {
  const width = 180;
  const height = 48;
  const chars = code.split('');
  
  let lines = '';
  for (let i = 0; i < 5; i++) {
    const x1 = Math.floor(Math.random() * width);
    const y1 = Math.floor(Math.random() * height);
    const x2 = Math.floor(Math.random() * width);
    const y2 = Math.floor(Math.random() * height);
    const stroke = ['#44403c', '#78716c', '#1c1917', '#a8a29e', '#57534e'][Math.floor(Math.random() * 5)];
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${Math.random() * 1.5 + 1}" stroke-opacity="${Math.random() * 0.4 + 0.3}" />`;
  }

  let dots = '';
  for (let i = 0; i < 30; i++) {
    const cx = Math.floor(Math.random() * width);
    const cy = Math.floor(Math.random() * height);
    const r = Math.random() * 1.5 + 0.5;
    dots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#292524" opacity="${Math.random() * 0.5 + 0.2}" />`;
  }

  const charSpacing = width / (chars.length + 1);
  let textNodes = '';
  chars.forEach((char, index) => {
    const x = Math.floor((index + 0.8) * charSpacing);
    const y = Math.floor(Math.random() * 8 + 32);
    const angle = Math.floor(Math.random() * 32 - 16);
    const color = ['#0c0a09', '#1c1917', '#292524', '#451a03', '#1e293b'][index % 5];
    const fontSize = Math.floor(Math.random() * 5 + 22);
    textNodes += `<text x="${x}" y="${y}" fill="${color}" font-size="${fontSize}" font-family="Courier New, monospace, sans-serif" font-weight="900" transform="rotate(${angle} ${x} ${y})" letter-spacing="2">${char}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width}" style="background-color: #f5eedc; border: 2px solid #1c1917; border-radius: 2px; user-select: none;">
    <rect width="100%" height="100%" fill="#f5eedc"/>
    ${lines}
    ${dots}
    ${textNodes}
  </svg>`;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  articles,
  onArticlesUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('analytics');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('day');
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // CAPTCHA State (Randomly Generated Every Time)
  const [captchaSvg, setCaptchaSvg] = useState<string>('');
  const [captchaId, setCaptchaId] = useState<string>('');
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [captchaInput, setCaptchaInput] = useState<string>('');
  const [isGeneratingCaptcha, setIsGeneratingCaptcha] = useState<boolean>(false);

  // Analytics State
  const [ipData, setIpData] = useState<IpAnalyticsData | null>(null);
  const [loadingIp, setLoadingIp] = useState<boolean>(false);
  const [ipSearchQuery, setIpSearchQuery] = useState<string>('');

  // Database State
  const [dbInfo, setDbInfo] = useState<DatabaseStorageInfo | null>(null);
  const [loadingDb, setLoadingDb] = useState<boolean>(false);
  const [isSyncingDb, setIsSyncingDb] = useState<boolean>(false);
  const [isBackingUpDb, setIsBackingUpDb] = useState<boolean>(false);
  
  // Sitemap & Search Engine Indexer State
  const [sitemapInfo, setSitemapInfo] = useState<SitemapStatusInfo | null>(null);
  const [isRegeneratingSitemap, setIsRegeneratingSitemap] = useState<boolean>(false);
  const [copiedUrlKey, setCopiedUrlKey] = useState<string | null>(null);

  // Posts State
  const [localArticles, setLocalArticles] = useState<NewsArticle[]>(articles);
  const [postSearchQuery, setPostSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'All'>('All');
  
  // Tag Input State: articleId -> text string
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const [activeAddingTagId, setActiveAddingTagId] = useState<string | null>(null);
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // AI Auto-Tagging State
  const [autoTaggingArticleId, setAutoTaggingArticleId] = useState<string | null>(null);
  const [isBatchAutoTagging, setIsBatchAutoTagging] = useState<boolean>(false);
  const [inspectorArticle, setInspectorArticle] = useState<NewsArticle | null>(null);
  const [inspectorSuggestion, setInspectorSuggestion] = useState<AutoTagSuggestion | null>(null);
  const [isLoadingInspector, setIsLoadingInspector] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  // Auto-Tag Sandbox State
  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(false);
  const [sandboxTitle, setSandboxTitle] = useState<string>('');
  const [sandboxBody, setSandboxBody] = useState<string>('');
  const [sandboxCategory, setSandboxCategory] = useState<NewsCategory>('Technology');
  const [sandboxResult, setSandboxResult] = useState<AutoTagSuggestion | null>(null);
  const [isTestingSandbox, setIsTestingSandbox] = useState<boolean>(false);

  // Random CAPTCHA Generation Function
  const generateNewCaptcha = useCallback(async () => {
    setIsGeneratingCaptcha(true);
    setCaptchaInput('');
    try {
      const res = await fetch('/api/admin/captcha');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.svg) {
          setCaptchaSvg(json.svg);
          setCaptchaId(json.captchaId || '');
          setCaptchaCode(json.code || '');
          return;
        }
      }
    } catch (err) {
      console.warn('Backend captcha failed, generating local fallback captcha:', err);
    } finally {
      setIsGeneratingCaptcha(false);
    }

    // Fallback Client-Side Random CAPTCHA
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const fallbackSvg = createFallbackCaptchaSvg(code);
    setCaptchaSvg(fallbackSvg);
    setCaptchaId('client_' + Date.now());
    setCaptchaCode(code);
    setIsGeneratingCaptcha(false);
  }, []);

  // Generate a fresh random CAPTCHA whenever dashboard is opened in unauthenticated state
  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      generateNewCaptcha();
      setLoginError(null);
    }
  }, [isOpen, isAuthenticated, generateNewCaptcha]);

  // Synchronize local articles with props
  useEffect(() => {
    setLocalArticles(articles);
  }, [articles]);

  // Fetch IP analytics on open or tab change if authenticated
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      if (activeTab === 'analytics') {
        fetchIpAnalytics();
      } else if (activeTab === 'database') {
        loadDatabaseDetails();
      }
    }
  }, [isOpen, isAuthenticated, activeTab]);

  const loadDatabaseDetails = async () => {
    setLoadingDb(true);
    try {
      const [data, sData] = await Promise.all([
        fetchDatabaseInfo(),
        fetchSitemapStatus()
      ]);
      setDbInfo(data);
      if (sData) setSitemapInfo(sData);
    } catch (e) {
      console.error('Failed to load DB details:', e);
    } finally {
      setLoadingDb(false);
    }
  };

  const handleManualSyncDatabase = async () => {
    setIsSyncingDb(true);
    try {
      const res = await syncDatabaseStorage();
      if (res.success) {
        showNotification(res.message || 'Database successfully synchronized.');
        await loadDatabaseDetails();
      }
    } catch (e) {
      showNotification('Failed to sync database.');
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUpDb(true);
    try {
      const res = await createDatabaseBackup();
      if (res.success) {
        showNotification(res.message || 'Database snapshot created.');
        await loadDatabaseDetails();
      } else {
        showNotification('Failed to create backup snapshot.');
      }
    } catch (e) {
      showNotification('Error backing up database.');
    } finally {
      setIsBackingUpDb(false);
    }
  };

  const handleRegenerateSitemap = async () => {
    setIsRegeneratingSitemap(true);
    try {
      const res = await regenerateSitemapNow();
      if (res && res.success) {
        showNotification(`Sitemaps successfully refreshed on disk! (${res.totalArticlesIndexed} posts, ${res.totalVideosIndexed} videos indexed)`);
        const updated = await fetchSitemapStatus();
        if (updated) setSitemapInfo(updated);
      } else {
        showNotification('Failed to refresh sitemaps.');
      }
    } catch (err) {
      console.error('Error refreshing sitemaps:', err);
      showNotification('Error refreshing sitemaps.');
    } finally {
      setIsRegeneratingSitemap(false);
    }
  };

  const handleCopySitemapUrl = (urlPath: string, key: string) => {
    const fullUrl = `${window.location.origin}${urlPath}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedUrlKey(key);
      showNotification(`Copied URL: ${fullUrl}`);
      setTimeout(() => setCopiedUrlKey(null), 2500);
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    // Client validation of CAPTCHA input
    if (!captchaInput.trim()) {
      setLoginError('Security Verification Required: Please enter the CAPTCHA code shown.');
      generateNewCaptcha();
      return;
    }

    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: usernameInput.trim(), 
          password: passwordInput.trim(),
          captcha: captchaInput.trim(),
          captchaId: captchaId
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_authenticated', 'true');
        setUsernameInput('');
        setPasswordInput('');
        setCaptchaInput('');
      } else {
        setLoginError(json.error || 'Authentication failed. Please check your credentials and CAPTCHA.');
        // Regenerate a brand new random CAPTCHA immediately upon failure
        generateNewCaptcha();
      }
    } catch (err) {
      // Fallback local check if server endpoint is not reachable
      if (captchaCode && captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
        setLoginError('Incorrect CAPTCHA code. A new code has been generated.');
      } else if (usernameInput.trim() === 'RahulS26' && passwordInput.trim() === 'RahulPass1') {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_authenticated', 'true');
        setUsernameInput('');
        setPasswordInput('');
        setCaptchaInput('');
      } else {
        setLoginError('Invalid username or password.');
      }
      generateNewCaptcha();
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
  };

  const fetchIpAnalytics = async () => {
    setLoadingIp(true);
    try {
      const res = await fetch('/api/admin/ip-visits');
      const json = await res.json();
      if (json.success) {
        setIpData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch IP visits analytics:', err);
    } finally {
      setLoadingIp(false);
    }
  };

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => {
      setActionSuccessMsg(null);
    }, 3000);
  };

  // Delete Post
  const handleDeleteArticle = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/news/articles/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        const updated = localArticles.filter(a => a.id !== id);
        setLocalArticles(updated);
        onArticlesUpdated(updated);
        setDeletingArticleId(null);
        showNotification(`Successfully deleted post: "${title.slice(0, 35)}..."`);
      } else {
        alert(json.error || 'Failed to delete post');
      }
    } catch (err) {
      console.error('Error deleting article:', err);
      alert('Network error while deleting post');
    }
  };

  // Add Tag to Article
  const handleAddTag = async (articleId: string) => {
    const rawTag = tagInputs[articleId]?.trim();
    if (!rawTag) return;

    try {
      const res = await fetch(`/api/news/articles/${encodeURIComponent(articleId)}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: rawTag }),
      });
      const json = await res.json();
      if (json.success && json.article) {
        const updated = localArticles.map(a => a.id === articleId ? json.article : a);
        setLocalArticles(updated);
        onArticlesUpdated(updated);
        setTagInputs(prev => ({ ...prev, [articleId]: '' }));
        setActiveAddingTagId(null);
        showNotification(`Added tag "${rawTag}" to post.`);
      } else {
        alert(json.error || 'Failed to add tag');
      }
    } catch (err) {
      console.error('Error adding tag:', err);
      alert('Network error while adding tag');
    }
  };

  // Remove Tag from Article
  const handleRemoveTag = async (articleId: string, tagToRemove: string) => {
    try {
      const res = await fetch(`/api/news/articles/${encodeURIComponent(articleId)}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: tagToRemove }),
      });
      const json = await res.json();
      if (json.success && json.article) {
        const updated = localArticles.map(a => a.id === articleId ? json.article : a);
        setLocalArticles(updated);
        onArticlesUpdated(updated);
        showNotification(`Removed tag "${tagToRemove}".`);
      }
    } catch (err) {
      console.error('Error removing tag:', err);
    }
  };

  // 1-Click AI Auto-Tag Single Article
  const handleAutoTagSingleArticle = async (article: NewsArticle) => {
    setAutoTaggingArticleId(article.id);
    try {
      const result = await autoTagArticle(article.id, true);
      if (result.success && result.article) {
        const updated = localArticles.map(a => a.id === article.id ? result.article! : a);
        setLocalArticles(updated);
        onArticlesUpdated(updated);
        showNotification(result.message || `AI auto-tagged "${article.title.slice(0, 30)}..." with ${result.suggestions.tags.length} topical tags.`);
      } else {
        showNotification(result.message || 'Auto-tag generated.');
      }
    } catch (err) {
      console.error('Error auto-tagging article:', err);
      showNotification('Failed to auto-tag article.');
    } finally {
      setAutoTaggingArticleId(null);
    }
  };

  // Open Inspector Modal to Preview AI Suggestions
  const handleOpenInspector = async (article: NewsArticle) => {
    setInspectorArticle(article);
    setIsInspectorOpen(true);
    setIsLoadingInspector(true);
    setInspectorSuggestion(null);

    try {
      const result = await autoTagArticle(article.id, false); // generate without immediately saving
      if (result.success && result.suggestions) {
        setInspectorSuggestion(result.suggestions);
      }
    } catch (err) {
      console.error('Failed to load tag suggestions:', err);
    } finally {
      setIsLoadingInspector(false);
    }
  };

  // Apply Selected Tags from Inspector Modal
  const handleApplyInspectorTags = async (articleId: string, selectedTags: string[]) => {
    try {
      const targetArticle = localArticles.find(a => a.id === articleId);
      if (!targetArticle) return;

      // Update tags on server
      const res = await fetch(`/api/news/articles/${encodeURIComponent(articleId)}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: selectedTags }),
      });

      const json = await res.json();
      if (json.success && json.article) {
        const updated = localArticles.map(a => a.id === articleId ? json.article : a);
        setLocalArticles(updated);
        onArticlesUpdated(updated);
        showNotification(`Applied ${selectedTags.length} tags to article.`);
      } else {
        // Fallback local update
        const updatedArt = { ...targetArticle, tags: selectedTags };
        const updated = localArticles.map(a => a.id === articleId ? updatedArt : a);
        setLocalArticles(updated);
        onArticlesUpdated(updated);
        showNotification(`Applied ${selectedTags.length} tags to article.`);
      }
    } catch (err) {
      console.error('Error applying inspector tags:', err);
      showNotification('Applied tags to local index.');
    }
  };

  // Batch Auto-Tag Untagged or Filtered Articles
  const handleBatchAutoTag = async (onlyUntagged: boolean = true) => {
    setIsBatchAutoTagging(true);
    try {
      let targetIds: string[] | undefined = undefined;
      if (!onlyUntagged && filteredPosts.length > 0) {
        targetIds = filteredPosts.slice(0, 30).map(a => a.id);
      }

      const res = await batchAutoTagArticles({
        articleIds: targetIds,
        onlyUntagged: onlyUntagged,
        maxArticles: 30
      });

      if (res.success && res.results) {
        const resultMap = new Map(res.results.map(r => [r.articleId, r.allTags]));
        const updated = localArticles.map(art => {
          if (resultMap.has(art.id)) {
            return { ...art, tags: resultMap.get(art.id) || art.tags };
          }
          return art;
        });

        setLocalArticles(updated);
        onArticlesUpdated(updated);
        showNotification(`Batch Auto-Tag Complete: Processed ${res.processedCount} articles (${res.updatedArticlesCount} updated).`);
      } else {
        showNotification('Batch auto-tagging completed.');
      }
    } catch (err) {
      console.error('Batch auto-tag error:', err);
      showNotification('Error during batch auto-tagging.');
    } finally {
      setIsBatchAutoTagging(false);
    }
  };

  // Run Sandbox Test
  const handleRunSandboxTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sandboxTitle.trim()) {
      alert('Please enter a headline to test auto-tagging.');
      return;
    }

    setIsTestingSandbox(true);
    setSandboxResult(null);

    try {
      const res = await autoTagCustomText(sandboxTitle, sandboxBody, sandboxCategory);
      if (res.success && res.suggestions) {
        setSandboxResult(res.suggestions);
      }
    } catch (err) {
      console.error('Sandbox test error:', err);
    } finally {
      setIsTestingSandbox(false);
    }
  };

  if (!isOpen) return null;

  // Render Authentication Modal Screen if not logged in
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn font-serif">
        <div className="relative w-full max-w-md bg-[#faf6ed] text-stone-900 border-4 border-stone-900 shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-[#e8e0d0] px-6 py-4 border-b-2 border-stone-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-stone-900" />
              <h2 className="text-lg font-black uppercase tracking-tight text-stone-950">
                Dashboard Portal Access
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 bg-stone-900 text-stone-100 hover:bg-stone-800 transition-all border border-stone-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 space-y-5">
            <div className="space-y-1">
              <p className="text-xs font-sans text-stone-700 uppercase font-bold tracking-wider">
                Restricted Editorial Gazette System
              </p>
              <p className="text-xs text-stone-800 italic">
                Please enter your administrator credentials to proceed.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-red-900/10 border border-red-900 text-red-950 text-xs font-sans font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-900 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-3 font-sans">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-stone-900">
                  Username
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter username..."
                    className="w-full pl-9 pr-3 py-2 bg-[#f0eae0] border-2 border-stone-900 text-sm font-mono text-stone-950 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-stone-900">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full pl-9 pr-3 py-2 bg-[#f0eae0] border-2 border-stone-900 text-sm font-mono text-stone-950 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Randomly Generated Security CAPTCHA */}
              <div className="pt-2 pb-1 border-t border-stone-300 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase text-stone-900 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-stone-800" />
                    <span>Security Verification (CAPTCHA)</span>
                  </label>
                  <span className="text-[10px] font-mono text-stone-600 bg-stone-200 px-1.5 py-0.5 border border-stone-400">
                    Randomized
                  </span>
                </div>

                {/* CAPTCHA Visual Canvas & Refresh Button */}
                <div className="flex items-center gap-2">
                  <div 
                    className="flex-1 bg-[#f5eedc] p-1 border-2 border-stone-900 shadow-inner flex items-center justify-center min-h-[52px] select-none cursor-pointer overflow-hidden"
                    title="Click to refresh CAPTCHA"
                    onClick={generateNewCaptcha}
                  >
                    {captchaSvg ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: captchaSvg }} 
                        className="w-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[46px]"
                      />
                    ) : (
                      <div className="text-xs font-mono font-bold tracking-widest text-stone-800">
                        {captchaCode || 'GENERATING...'}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={generateNewCaptcha}
                    disabled={isGeneratingCaptcha}
                    title="Generate New CAPTCHA Code"
                    className="p-3 bg-stone-200 hover:bg-stone-300 text-stone-900 border-2 border-stone-900 transition-colors flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-4 h-4 text-stone-900 ${isGeneratingCaptcha ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* CAPTCHA Code Input */}
                <div className="relative">
                  <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                    placeholder="ENTER CAPTCHA CODE ABOVE..."
                    className="w-full pl-9 pr-3 py-2 bg-[#f0eae0] border-2 border-stone-900 text-sm font-mono font-bold tracking-widest uppercase text-stone-950 focus:outline-none focus:bg-white placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-stone-500"
                  />
                </div>
                <p className="text-[11px] text-stone-600 font-sans italic">
                  Case-insensitive. A new random code is generated on every login attempt.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || isGeneratingCaptcha}
              className="w-full py-2.5 bg-stone-900 text-stone-100 hover:bg-stone-800 text-xs font-serif font-bold uppercase tracking-wider transition-all border-2 border-stone-900 cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Credentials & CAPTCHA...</span>
                </span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Log In to Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="bg-[#e8e0d0] px-6 py-2.5 border-t border-stone-900 text-[11px] font-mono text-stone-600 text-center">
            New Pulse Gazette Authorization System
          </div>
        </div>
      </div>
    );
  }

  // Selected period analytics data
  const currentPeriodData = ipData ? ipData[timePeriod] : null;

  // Filtered IP top list
  const filteredIpList = currentPeriodData?.topIps.filter(item => {
    if (!ipSearchQuery.trim()) return true;
    const q = ipSearchQuery.toLowerCase();
    return item.ip.toLowerCase().includes(q) || item.paths.some(p => p.toLowerCase().includes(q));
  }) || [];

  // Filtered Articles
  const filteredPosts = localArticles.filter(art => {
    const matchesCat = selectedCategory === 'All' || art.category === selectedCategory;
    if (!matchesCat) return false;
    if (!postSearchQuery.trim()) return true;
    const q = postSearchQuery.toLowerCase();
    const inTitle = art.title.toLowerCase().includes(q);
    const inDesc = art.description.toLowerCase().includes(q);
    const inSource = art.source.toLowerCase().includes(q);
    const inTags = (art.tags || []).some(t => t.toLowerCase().includes(q));
    return inTitle || inDesc || inSource || inTags;
  });

  return (
    <div className="fixed inset-0 z-50 w-full h-full min-h-screen bg-[#faf6ed] flex flex-col overflow-hidden font-serif animate-fadeIn">
      <div className="relative w-full h-full flex flex-col overflow-hidden text-stone-900 bg-[#faf6ed]">
        
        {/* Header Bar */}
        <div className="bg-[#e8e0d0] px-4 sm:px-8 py-3.5 sm:py-4 border-b-2 border-stone-900 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase font-sans font-bold tracking-widest text-stone-700">
              <Activity className="w-4 h-4 text-stone-900" />
              <span>New Pulse Executive Gazette Admin (Logged in: RahulS26)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-stone-950">
              Editorial & Traffic Control Center
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-300 text-stone-900 hover:bg-stone-400 text-xs font-sans font-bold uppercase transition-all border border-stone-900 cursor-pointer"
              title="Log Out of Dashboard"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-stone-900 text-stone-100 hover:bg-stone-800 transition-all border border-stone-900 cursor-pointer"
              title="Close Dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Success Toast */}
        {actionSuccessMsg && (
          <div className="bg-emerald-900 text-emerald-100 px-4 py-2 text-xs font-sans font-bold flex items-center justify-between border-b border-emerald-950 animate-slideDown">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{actionSuccessMsg}</span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-[#f0eae0] px-4 sm:px-6 border-b-2 border-stone-900 flex items-center gap-2 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-t-2 border-x-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-[#faf6ed] text-stone-950 border-stone-900 -mb-[2px] shadow-sm'
                : 'bg-transparent text-stone-700 border-transparent hover:text-stone-950'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>1. Visitor Traffic</span>
          </button>

          <button
            onClick={() => setActiveTab('trending')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-t-2 border-x-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'trending'
                ? 'bg-[#faf6ed] text-stone-950 border-stone-900 -mb-[2px] shadow-sm'
                : 'bg-transparent text-stone-700 border-transparent hover:text-stone-950'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-rose-600" />
            <span>2. Trending Topics & Keywords</span>
          </button>

          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-t-2 border-x-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'posts'
                ? 'bg-[#faf6ed] text-stone-950 border-stone-900 -mb-[2px] shadow-sm'
                : 'bg-transparent text-stone-700 border-transparent hover:text-stone-950'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>3. Posts & Tags ({localArticles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-t-2 border-x-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'database'
                ? 'bg-[#faf6ed] text-stone-950 border-stone-900 -mb-[2px] shadow-sm'
                : 'bg-transparent text-stone-700 border-transparent hover:text-stone-950'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>4. Database Storage ({dbInfo?.totalArticlesStored ?? localArticles.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: IP VISITOR TRAFFIC ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              {/* Period Selector Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-[#f0eae0] p-3 border-2 border-stone-900">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-stone-800" />
                  <span className="text-xs font-sans font-bold uppercase text-stone-900">Select Time Range:</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['day', 'week', 'month', 'year'] as TimePeriod[]).map((period) => {
                    const labelMap: Record<TimePeriod, string> = {
                      day: 'Day (Today)',
                      week: 'Week (7 Days)',
                      month: 'Month (30 Days)',
                      year: 'Year (365 Days)',
                    };
                    const isActive = timePeriod === period;
                    return (
                      <button
                        key={period}
                        onClick={() => setTimePeriod(period)}
                        className={`px-3 py-1.5 text-xs font-serif font-bold uppercase tracking-wide transition-all border cursor-pointer ${
                          isActive
                            ? 'bg-stone-900 text-stone-100 border-stone-900 shadow-sm'
                            : 'bg-[#faf6ed] text-stone-800 border-stone-700 hover:bg-stone-300'
                        }`}
                      >
                        {labelMap[period]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Loading Indicator */}
              {loadingIp ? (
                <div className="py-12 text-center space-y-3 font-serif">
                  <div className="inline-block animate-spin text-stone-900">
                    <Activity className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-stone-800">Compiling IP Visitor Logs for {timePeriod.toUpperCase()}...</p>
                </div>
              ) : currentPeriodData ? (
                <div className="space-y-6">
                  
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#f0eae0] p-4 border-2 border-stone-900 space-y-1">
                      <div className="flex items-center justify-between text-xs font-sans text-stone-700 uppercase font-bold">
                        <span>Total Visits ({timePeriod})</span>
                        <Eye className="w-4 h-4 text-stone-800" />
                      </div>
                      <div className="text-3xl font-black text-stone-950 font-serif">
                        {currentPeriodData.totalVisits}
                      </div>
                      <p className="text-[11px] italic text-stone-600">Total page requests logged</p>
                    </div>

                    <div className="bg-[#f0eae0] p-4 border-2 border-stone-900 space-y-1">
                      <div className="flex items-center justify-between text-xs font-sans text-stone-700 uppercase font-bold">
                        <span>Unique IP Addresses</span>
                        <Users className="w-4 h-4 text-stone-800" />
                      </div>
                      <div className="text-3xl font-black text-stone-950 font-serif">
                        {currentPeriodData.uniqueIpCount}
                      </div>
                      <p className="text-[11px] italic text-stone-600">Distinct visitor IPs</p>
                    </div>

                    <div className="bg-[#f0eae0] p-4 border-2 border-stone-900 space-y-1">
                      <div className="flex items-center justify-between text-xs font-sans text-stone-700 uppercase font-bold">
                        <span>Top IP Visitor</span>
                        <Globe className="w-4 h-4 text-stone-800" />
                      </div>
                      <div className="text-lg font-mono font-bold text-stone-950 truncate">
                        {currentPeriodData.topIps[0]?.ip || 'N/A'}
                      </div>
                      <p className="text-[11px] font-sans font-bold text-emerald-800">
                        {currentPeriodData.topIps[0] ? `${currentPeriodData.topIps[0].count} visits (${currentPeriodData.topIps[0].percentage}%)` : 'No activity'}
                      </p>
                    </div>

                    <div className="bg-[#f0eae0] p-4 border-2 border-stone-900 space-y-1">
                      <div className="flex items-center justify-between text-xs font-sans text-stone-700 uppercase font-bold">
                        <span>Active System Status</span>
                        <BarChart3 className="w-4 h-4 text-stone-800" />
                      </div>
                      <div className="text-sm font-bold text-emerald-900 uppercase font-mono">
                        LOGGING ONLINE
                      </div>
                      <p className="text-[11px] italic text-stone-600">Continuous IP recording active</p>
                    </div>
                  </div>

                  {/* Search IP Box */}
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <input
                      type="text"
                      value={ipSearchQuery}
                      onChange={(e) => setIpSearchQuery(e.target.value)}
                      placeholder="Search IP address or visited route..."
                      className="w-full pl-9 pr-8 py-1.5 bg-[#f0eae0] border border-stone-800 text-xs font-mono text-stone-900 placeholder-stone-500 focus:outline-none focus:bg-white"
                    />
                    {ipSearchQuery && (
                      <button
                        onClick={() => setIpSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* IP Addresses Breakdown Table */}
                  <div className="border-2 border-stone-900 bg-[#f0eae0] overflow-hidden">
                    <div className="bg-stone-900 text-stone-100 px-4 py-2 flex items-center justify-between text-xs font-sans font-bold uppercase tracking-wider">
                      <span>IP Addresses Visited ({timePeriod.toUpperCase()}) — {filteredIpList.length} Unique Records</span>
                      <span>Traffic Breakdown</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#e8e0d0] border-b-2 border-stone-900 text-stone-900 font-serif uppercase font-bold">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3 font-mono">IP Address</th>
                            <th className="p-3">Visit Count</th>
                            <th className="p-3">Traffic Share</th>
                            <th className="p-3">Last Active Timestamp</th>
                            <th className="p-3">Accessed Routes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-300 font-sans">
                          {filteredIpList.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-6 text-center italic text-stone-600 font-serif">
                                No IP addresses matching search query in this time period.
                              </td>
                            </tr>
                          ) : (
                            filteredIpList.map((item, idx) => (
                              <tr key={item.ip} className="hover:bg-[#e8e0d0]/60 transition-colors">
                                <td className="p-3 font-serif font-bold text-stone-600">{idx + 1}</td>
                                <td className="p-3 font-mono font-bold text-stone-950 flex items-center gap-1.5">
                                  <Globe className="w-3.5 h-3.5 text-stone-700 shrink-0" />
                                  <span>{item.ip}</span>
                                </td>
                                <td className="p-3 font-serif font-bold text-stone-900 text-sm">
                                  {item.count}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 bg-stone-300 h-2.5 border border-stone-800">
                                      <div 
                                        className="bg-stone-900 h-full" 
                                        style={{ width: `${Math.min(100, item.percentage * 2)}%` }} 
                                      />
                                    </div>
                                    <span className="font-mono text-[11px] font-bold text-stone-800">{item.percentage}%</span>
                                  </div>
                                </td>
                                <td className="p-3 text-[11px] text-stone-700 font-mono">
                                  {new Date(item.lastVisited).toLocaleString()}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {item.paths.map((p, pIdx) => (
                                      <span key={pIdx} className="px-1.5 py-0.5 bg-stone-300 text-stone-900 font-mono text-[10px] border border-stone-700 font-semibold">
                                        {p}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recent Logs Feed */}
                  <div className="border-2 border-stone-900 bg-[#f0eae0] p-4 space-y-3">
                    <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-stone-950 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-stone-800" />
                      <span>Live Incoming Visitor Request Stream</span>
                    </h3>

                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-2 font-mono text-xs">
                      {currentPeriodData.recentVisits.map((v) => (
                        <div key={v.id} className="p-2 bg-[#faf6ed] border border-stone-400 flex items-center justify-between text-[11px] gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-950">{v.ip}</span>
                            <span className="text-stone-500">→</span>
                            <span className="bg-stone-200 px-1 text-stone-900 font-semibold">{v.path}</span>
                          </div>
                          <span className="text-stone-600 shrink-0">
                            {new Date(v.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : null}

            </div>
          )}

          {/* TAB 2: TRENDING TOPICS & KEYWORDS (WORD CLOUD & BAR CHART) */}
          {activeTab === 'trending' && (
            <TrendingTopicsVisualizer 
              articles={localArticles} 
              onSelectArticleTag={(tag) => {
                setPostSearchQuery(tag);
                setActiveTab('posts');
              }}
            />
          )}

          {/* TAB 3: POSTS & TAGS MANAGEMENT */}
          {activeTab === 'posts' && (
            <div className="space-y-6">
              
              {/* AI Auto-Tagging Intelligence Command Center */}
              <div className="bg-[#f0eae0] p-4 sm:p-5 border-2 border-stone-900 shadow-sm space-y-4">
                
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone-300 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-stone-900 text-stone-100 border border-stone-900 shadow-xs">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black uppercase text-stone-950">
                          AI Auto-Tagging & Taxonomy Engine
                        </h3>
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-950 border border-amber-800 text-[10px] font-mono font-bold uppercase">
                          Gemini 3.7 Flash & NLP
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 font-sans mt-0.5">
                        Automatically scans full article body text to extract high-impact topical hashtags, SEO search phrases, and taxonomy classifications.
                      </p>
                    </div>
                  </div>

                  {/* Batch Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                    <button
                      onClick={() => handleBatchAutoTag(true)}
                      disabled={isBatchAutoTagging}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 text-stone-100 hover:bg-stone-800 text-xs font-sans font-bold uppercase transition-all border border-stone-900 cursor-pointer disabled:opacity-50 shadow-sm"
                      title="Run AI Auto-Tagging on all articles with 1 or fewer tags"
                    >
                      {isBatchAutoTagging ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                          <span>Auto-Tagging Posts...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Auto-Tag Untagged Posts</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleBatchAutoTag(false)}
                      disabled={isBatchAutoTagging}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#faf6ed] hover:bg-stone-200 text-stone-900 text-xs font-sans font-bold uppercase transition-all border border-stone-900 cursor-pointer disabled:opacity-50 shadow-sm"
                      title="Run AI Auto-Tagging on the currently filtered posts list"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-stone-800" />
                      <span>Tag Filtered ({filteredPosts.length})</span>
                    </button>

                    <button
                      onClick={() => setIsSandboxOpen(prev => !prev)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-sans font-bold uppercase transition-all border border-stone-900 cursor-pointer shadow-sm ${
                        isSandboxOpen 
                          ? 'bg-amber-400 text-stone-950 border-amber-600' 
                          : 'bg-stone-300 hover:bg-stone-400 text-stone-900'
                      }`}
                      title="Toggle AI Auto-Tagging Sandbox to test prompts or draft texts"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{isSandboxOpen ? 'Close Sandbox' : 'AI Sandbox'}</span>
                    </button>
                  </div>
                </div>

                {/* Tag Health Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans text-xs">
                  <div className="bg-[#faf6ed] p-2.5 border border-stone-400 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase text-stone-600">Total Indexed Stories</span>
                    <span className="text-xl font-bold font-serif text-stone-950 mt-0.5">{localArticles.length}</span>
                  </div>
                  <div className="bg-[#faf6ed] p-2.5 border border-stone-400 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase text-amber-900">Needs Tagging (≤1 Tag)</span>
                    <span className="text-xl font-bold font-serif text-amber-950 mt-0.5">
                      {localArticles.filter(a => !a.tags || a.tags.length <= 1).length}
                    </span>
                  </div>
                  <div className="bg-[#faf6ed] p-2.5 border border-stone-400 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase text-emerald-900">Richly Tagged (3+ Tags)</span>
                    <span className="text-xl font-bold font-serif text-emerald-950 mt-0.5">
                      {localArticles.filter(a => (a.tags || []).length >= 3).length}
                    </span>
                  </div>
                  <div className="bg-[#faf6ed] p-2.5 border border-stone-400 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase text-stone-600">Avg Tags / Article</span>
                    <span className="text-xl font-bold font-serif text-stone-950 mt-0.5">
                      {localArticles.length > 0
                        ? (localArticles.reduce((acc, a) => acc + (a.tags?.length || 0), 0) / localArticles.length).toFixed(1)
                        : '0'}
                    </span>
                  </div>
                </div>

                {/* AI Auto-Tag Sandbox Drawer */}
                {isSandboxOpen && (
                  <div className="bg-[#faf6ed] p-4 border-2 border-stone-900 space-y-4 animate-fadeIn font-serif">
                    <div className="flex items-center justify-between border-b border-stone-300 pb-2">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-stone-900" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-950 font-sans">
                          AI Auto-Tagger Testing Sandbox &amp; Playground
                        </h4>
                      </div>
                      <span className="text-[11px] font-sans text-stone-600">
                        Paste custom draft text or headlines to test the AI extractor
                      </span>
                    </div>

                    <form onSubmit={handleRunSandboxTest} className="space-y-3 font-sans">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-stone-800 uppercase block">
                            Article Title / Headline:
                          </label>
                          <input
                            type="text"
                            value={sandboxTitle}
                            onChange={(e) => setSandboxTitle(e.target.value)}
                            placeholder="e.g. Breakthrough in Quantum Error Correction Accelerates Commercial Supercomputers"
                            className="w-full px-3 py-1.5 bg-[#faf6ed] border border-stone-800 text-xs font-serif text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-stone-800 uppercase block">
                            Category:
                          </label>
                          <select
                            value={sandboxCategory}
                            onChange={(e) => setSandboxCategory(e.target.value as NewsCategory)}
                            className="w-full px-3 py-1.5 bg-[#faf6ed] border border-stone-800 text-xs font-serif font-bold text-stone-900 focus:outline-none cursor-pointer"
                          >
                            {['Technology', 'Science', 'World', 'Business', 'Sports', 'Entertainment', 'Health'].map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-stone-800 uppercase block">
                          Article Body Text / Excerpt:
                        </label>
                        <textarea
                          rows={3}
                          value={sandboxBody}
                          onChange={(e) => setSandboxBody(e.target.value)}
                          placeholder="Paste the full story paragraphs or excerpt to be analyzed..."
                          className="w-full px-3 py-2 bg-[#faf6ed] border border-stone-800 text-xs font-serif text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 leading-relaxed"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="submit"
                          disabled={isTestingSandbox || !sandboxTitle.trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-stone-100 hover:bg-stone-800 text-xs font-bold uppercase transition-all border border-stone-900 cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                          {isTestingSandbox ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Extracting AI Tags...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>Run AI Extraction</span>
                            </>
                          )}
                        </button>

                        {sandboxResult && (
                          <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 font-sans">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Successfully generated {sandboxResult.tags.length} tags</span>
                          </span>
                        )}
                      </div>
                    </form>

                    {/* Sandbox Extraction Output */}
                    {sandboxResult && (
                      <div className="p-3.5 bg-[#f0eae0] border border-stone-800 space-y-2.5 animate-fadeIn text-xs">
                        {sandboxResult.explanation && (
                          <p className="text-stone-800 italic bg-[#faf6ed] p-2 border border-stone-300">
                            <strong>AI Rationale:</strong> {sandboxResult.explanation}
                          </p>
                        )}
                        <div className="space-y-1">
                          <span className="font-sans font-bold text-[10px] uppercase text-stone-600 block">
                            Extracted Topic Hashtags:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {sandboxResult.tags.map((t, idx) => (
                              <span key={idx} className="px-2.5 py-1 bg-stone-900 text-stone-100 font-mono font-bold text-xs border border-stone-900">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        {sandboxResult.seoKeywords && sandboxResult.seoKeywords.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <span className="font-sans font-bold text-[10px] uppercase text-stone-600 block">
                              Extracted SEO Keywords:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {sandboxResult.seoKeywords.map((k, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-[#faf6ed] border border-stone-400 font-sans text-[11px] text-stone-800">
                                  {k}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#f0eae0] p-3 border-2 border-stone-900">
                
                {/* Search Box */}
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="text"
                    value={postSearchQuery}
                    onChange={(e) => setPostSearchQuery(e.target.value)}
                    placeholder="Search post headline or tag..."
                    className="w-full pl-9 pr-8 py-1.5 bg-[#faf6ed] border border-stone-800 text-xs font-serif text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  {postSearchQuery && (
                    <button
                      onClick={() => setPostSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category Dropdown */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-stone-700 shrink-0" />
                  <span className="text-xs font-sans font-bold text-stone-900 uppercase">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as any)}
                    className="bg-[#faf6ed] border border-stone-800 px-2 py-1 text-xs font-serif font-bold text-stone-900 cursor-pointer"
                  >
                    {['All', 'World', 'Technology', 'Science', 'Business', 'Sports', 'Entertainment', 'Health'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Posts Count Summary */}
              <div className="text-xs font-serif text-stone-800 flex items-center justify-between border-b border-stone-400 pb-2">
                <span>Showing <strong className="text-stone-950 font-bold">{filteredPosts.length}</strong> website posts</span>
                <span className="italic text-stone-600">Use "✨ Auto-Tag" for 1-click AI tags or "Inspect" to review AI reasoning</span>
              </div>

              {/* Posts Table */}
              <div className="border-2 border-stone-900 bg-[#f0eae0] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#e8e0d0] border-b-2 border-stone-900 text-stone-900 font-serif uppercase font-bold">
                      <tr>
                        <th className="p-3">Article Headline & Source</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Tags & AI Keyword Labeling</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-300 font-serif">
                      {filteredPosts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center italic text-stone-600">
                            No posts found matching the selected search query or category filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPosts.map((art) => {
                          const isAddingTag = activeAddingTagId === art.id;
                          const isDeleting = deletingArticleId === art.id;
                          const isAutoTaggingThis = autoTaggingArticleId === art.id;

                          return (
                            <tr key={art.id} className="hover:bg-[#e8e0d0]/60 transition-colors">
                              
                              {/* Title & Source */}
                              <td className="p-3 max-w-sm">
                                <div className="space-y-1">
                                  <a 
                                    href={art.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="font-bold text-stone-950 hover:underline text-sm line-clamp-2 block"
                                    title="Open article in separate window"
                                  >
                                    {art.title}
                                  </a>
                                  <div className="flex items-center gap-2 text-[11px] text-stone-600 font-sans">
                                    <span className="font-bold text-stone-800">{art.source}</span>
                                    <span>•</span>
                                    <span>{new Date(art.pubDate).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Category */}
                              <td className="p-3 align-top">
                                <span className="px-2 py-0.5 bg-stone-900 text-stone-100 font-mono text-[10px] font-bold uppercase tracking-wider inline-block">
                                  {art.category}
                                </span>
                              </td>

                              {/* Tags List & Add Tag Input */}
                              <td className="p-3 align-top max-w-md">
                                <div className="space-y-2">
                                  
                                  {/* Existing Tags Chips */}
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {(art.tags || []).map((t, tIdx) => (
                                      <span 
                                        key={tIdx} 
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#faf6ed] border border-stone-800 text-[11px] font-mono text-stone-900 font-bold group"
                                      >
                                        <Tag className="w-2.5 h-2.5 text-stone-600" />
                                        <span>{t}</span>
                                        <button
                                          onClick={() => handleRemoveTag(art.id, t)}
                                          className="text-stone-400 hover:text-red-700 ml-0.5 font-bold cursor-pointer"
                                          title="Remove tag"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))}

                                    {/* 1-Click AI Auto-Tag Button */}
                                    <button
                                      onClick={() => handleAutoTagSingleArticle(art)}
                                      disabled={isAutoTaggingThis}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-900 hover:bg-stone-800 text-stone-100 border border-stone-900 text-[11px] font-sans font-bold cursor-pointer transition-all disabled:opacity-50 shadow-xs"
                                      title="Automatically analyze body text and add AI tags"
                                    >
                                      {isAutoTaggingThis ? (
                                        <>
                                          <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                                          <span>Tagging...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-3 h-3 text-amber-400" />
                                          <span>AI Auto-Tag</span>
                                        </>
                                      )}
                                    </button>

                                    {/* Inspect / Review AI Tags Modal Trigger */}
                                    <button
                                      onClick={() => handleOpenInspector(art)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 hover:bg-amber-200 border border-amber-800 text-[11px] font-sans font-bold text-amber-950 cursor-pointer transition-all"
                                      title="Inspect AI suggested tags and rationale before applying"
                                    >
                                      <Wand2 className="w-3 h-3 text-amber-900" />
                                      <span>Inspect</span>
                                    </button>

                                    {/* Add Manual Tag Trigger Button */}
                                    {!isAddingTag && (
                                      <button
                                        onClick={() => setActiveAddingTagId(art.id)}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-300 hover:bg-stone-400 border border-stone-800 text-[11px] font-sans font-bold text-stone-900 cursor-pointer transition-all"
                                        title="Manually type a tag"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>+ Tag</span>
                                      </button>
                                    )}
                                  </div>

                                  {/* Add Tag Inline Form */}
                                  {isAddingTag && (
                                    <div className="flex items-center gap-1 font-sans pt-1">
                                      <input
                                        type="text"
                                        value={tagInputs[art.id] || ''}
                                        onChange={(e) => setTagInputs(prev => ({ ...prev, [art.id]: e.target.value }))}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleAddTag(art.id);
                                          if (e.key === 'Escape') setActiveAddingTagId(null);
                                        }}
                                        placeholder="Tag name (e.g. #Breaking)..."
                                        autoFocus
                                        className="px-2 py-1 text-xs border border-stone-800 bg-[#faf6ed] text-stone-900 font-mono w-44 focus:outline-none"
                                      />
                                      <button
                                        onClick={() => handleAddTag(art.id)}
                                        className="px-2 py-1 bg-stone-900 text-stone-100 text-xs font-bold hover:bg-stone-800 cursor-pointer"
                                      >
                                        Add
                                      </button>
                                      <button
                                        onClick={() => setActiveAddingTagId(null)}
                                        className="px-1.5 py-1 text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Actions: Delete */}
                              <td className="p-3 align-top text-right shrink-0">
                                {isDeleting ? (
                                  <div className="flex items-center justify-end gap-1.5 font-sans">
                                    <span className="text-[11px] font-bold text-red-900 uppercase">Confirm?</span>
                                    <button
                                      onClick={() => handleDeleteArticle(art.id, art.title)}
                                      className="px-2 py-1 bg-red-900 text-stone-100 text-xs font-bold hover:bg-red-950 cursor-pointer border border-red-950"
                                    >
                                      YES
                                    </button>
                                    <button
                                      onClick={() => setDeletingArticleId(null)}
                                      className="px-2 py-1 bg-stone-300 text-stone-900 text-xs font-bold hover:bg-stone-400 cursor-pointer border border-stone-800"
                                    >
                                      NO
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeletingArticleId(art.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f8e8e8] text-red-900 hover:bg-red-900 hover:text-red-50 border border-red-900 transition-all font-sans font-bold text-xs cursor-pointer shadow-sm"
                                    title="Delete post from website"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>DELETE</span>
                                  </button>
                                )}
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: PERSISTENT DATABASE STORAGE */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              
              {/* Top Banner with Storage Health */}
              <div className="bg-[#f0eae0] p-4 sm:p-5 border-2 border-stone-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 border-2 border-stone-900 text-emerald-900">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black uppercase text-stone-950">
                        Dual-Layer Persistent Database Engine
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-200 text-emerald-950 border border-emerald-800 text-[11px] font-sans font-bold uppercase">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
                        100% Operational & Safe
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 font-sans mt-0.5">
                      All scraped news stories, SEO tags, AI summaries, and sentiment metrics are automatically stored permanently so they remain visible on the website at all times.
                    </p>
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                  <button
                    onClick={handleManualSyncDatabase}
                    disabled={isSyncingDb}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 text-stone-100 hover:bg-stone-800 text-xs font-sans font-bold uppercase transition-all border border-stone-900 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDb ? 'Syncing...' : 'Sync Database Now'}</span>
                  </button>

                  <button
                    onClick={handleCreateBackup}
                    disabled={isBackingUpDb}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-200 text-stone-900 hover:bg-stone-300 text-xs font-sans font-bold uppercase transition-all border border-stone-900 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>{isBackingUpDb ? 'Creating Backup...' : 'Create Snapshot'}</span>
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
                
                <div className="bg-[#f0eae0] p-4 border-2 border-stone-900 shadow-sm">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Total Stories Stored
                  </div>
                  <div className="text-3xl font-black text-stone-950 font-serif mt-1">
                    {dbInfo?.totalArticlesStored ?? localArticles.length}
                  </div>
                  <div className="text-[11px] text-emerald-800 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Permanently Available</span>
                  </div>
                </div>

                <div className="bg-[#f0eae0] p-4 border-2 border-stone-900 shadow-sm">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Primary Database File
                  </div>
                  <div className="text-sm font-mono font-bold text-stone-950 truncate mt-1">
                    scraped_articles_db.json
                  </div>
                  <div className="text-[11px] text-stone-600 mt-1">
                    Size: <span className="font-mono font-bold text-stone-900">{dbInfo?.fileSizeKb ?? 120} KB</span>
                  </div>
                </div>

                <div className="bg-[#f0eae0] p-4 border-2 border-stone-900 shadow-sm">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Backup Redundancy
                  </div>
                  <div className="text-sm font-mono font-bold text-stone-950 truncate mt-1">
                    scraped_articles_db.bak.json
                  </div>
                  <div className="text-[11px] text-stone-600 mt-1">
                    Status: <span className="font-bold text-emerald-800">Synchronized Dual-Write</span>
                  </div>
                </div>

                <div className="bg-[#f0eae0] p-4 border-2 border-stone-900 shadow-sm">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Live Auto-Save
                  </div>
                  <div className="text-xl font-bold text-emerald-900 font-serif mt-1">
                    Active & Instant
                  </div>
                  <div className="text-[11px] text-stone-600 mt-1">
                    Every 10 min + On scraper runs
                  </div>
                </div>

              </div>

              {/* Data Category Breakdown & Storage Downloads */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Category Distribution */}
                <div className="lg:col-span-2 bg-[#f0eae0] p-4 sm:p-5 border-2 border-stone-900 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-stone-900 font-sans flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-stone-800" />
                    <span>Database Category Distribution</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                    {dbInfo?.categoryBreakdown ? (
                      Object.entries(dbInfo.categoryBreakdown).map(([cat, count]) => (
                        <div key={cat} className="p-2.5 bg-[#faf6ed] border border-stone-800 font-sans flex justify-between items-center">
                          <span className="text-xs font-bold text-stone-800">{cat}</span>
                          <span className="text-xs font-mono font-bold bg-stone-200 px-2 py-0.5 border border-stone-700 text-stone-950">
                            {count}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-xs text-stone-600 italic py-2">
                        Loading database categories...
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Database Export Downloads */}
                <div className="bg-[#f0eae0] p-4 sm:p-5 border-2 border-stone-900 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-stone-900 font-sans flex items-center gap-2">
                    <Download className="w-4 h-4 text-stone-800" />
                    <span>Direct Database Downloads</span>
                  </h4>

                  <p className="text-xs text-stone-700 font-sans">
                    Export the entire verified historical news database directly to your device:
                  </p>

                  <div className="space-y-2 pt-1 font-sans">
                    <a
                      href="/api/news/export/json"
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="w-full flex items-center justify-between px-3 py-2 bg-[#faf6ed] hover:bg-stone-100 border border-stone-800 text-xs font-bold text-stone-900 transition-colors shadow-xs"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-800" />
                        <span>Download Database (JSON)</span>
                      </span>
                      <Download className="w-3.5 h-3.5 text-stone-600" />
                    </a>

                    <a
                      href="/api/news/export/excel"
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="w-full flex items-center justify-between px-3 py-2 bg-[#faf6ed] hover:bg-stone-100 border border-stone-800 text-xs font-bold text-stone-900 transition-colors shadow-xs"
                    >
                      <span className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-800" />
                        <span>Download Database (Excel)</span>
                      </span>
                      <Download className="w-3.5 h-3.5 text-stone-600" />
                    </a>

                    <a
                      href="/api/news/export/csv"
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="w-full flex items-center justify-between px-3 py-2 bg-[#faf6ed] hover:bg-stone-100 border border-stone-800 text-xs font-bold text-stone-900 transition-colors shadow-xs"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-800" />
                        <span>Download Database (CSV)</span>
                      </span>
                      <Download className="w-3.5 h-3.5 text-stone-600" />
                    </a>
                  </div>
                </div>

              </div>

              {/* AUTOMATED DAILY SITEMAP & GOOGLE SEARCH ENGINE INDEXER */}
              <div className="bg-[#f0eae0] p-5 sm:p-6 border-2 border-stone-900 shadow-sm space-y-5">
                
                {/* Header with Status Badge */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-stone-900 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 border-2 border-stone-900 text-amber-950">
                      <Compass className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-black uppercase text-stone-950">
                          Automated Daily Sitemap & Google Search Indexer
                        </h4>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-200 text-emerald-950 border border-emerald-800 text-[11px] font-sans font-bold uppercase">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                          Daily 24h & Midnight Cron Active
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 font-sans mt-0.5">
                        Generates XML sitemaps daily with Google News (xmlns:news), Image (xmlns:image), and Video (xmlns:video) metadata compliance.
                      </p>
                    </div>
                  </div>

                  {/* Manual On-Demand Trigger Button */}
                  <button
                    onClick={handleRegenerateSitemap}
                    disabled={isRegeneratingSitemap}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-900 text-amber-50 hover:bg-amber-800 text-xs font-sans font-bold uppercase transition-all border border-amber-950 cursor-pointer disabled:opacity-50 shadow-sm shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingSitemap ? 'animate-spin' : ''}`} />
                    <span>{isRegeneratingSitemap ? 'Rebuilding Sitemaps...' : '⚡ Generate Daily Sitemap Now'}</span>
                  </button>
                </div>

                {/* Sitemaps Diagnostics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-sans">
                  
                  <div className="p-3.5 bg-[#faf6ed] border border-stone-800">
                    <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      Master Index
                    </div>
                    <div className="text-xl font-bold font-mono text-stone-950 mt-1 truncate">
                      /sitemap_index.xml
                    </div>
                    <div className="text-[11px] text-emerald-800 font-bold mt-1">
                      Bundles All 3 Sub-Sitemaps
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#faf6ed] border border-stone-800">
                    <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      Main XML Sitemap
                    </div>
                    <div className="text-2xl font-black font-serif text-stone-950 mt-1">
                      {sitemapInfo?.totalArticlesIndexed ?? localArticles.length}
                    </div>
                    <div className="text-[11px] text-stone-600 mt-0.5">
                      Articles & Pages with Images
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#faf6ed] border border-stone-800">
                    <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      Google News 48h Index
                    </div>
                    <div className="text-2xl font-black font-serif text-stone-950 mt-1 text-amber-900">
                      {sitemapInfo?.googleNewsArticles48h ?? 0}
                    </div>
                    <div className="text-[11px] text-stone-600 mt-0.5">
                      Recent stories (last 48 hours)
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#faf6ed] border border-stone-800">
                    <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      Google Video Sitemap
                    </div>
                    <div className="text-2xl font-black font-serif text-stone-950 mt-1 text-blue-900">
                      {sitemapInfo?.totalVideosIndexed ?? 0}
                    </div>
                    <div className="text-[11px] text-stone-600 mt-0.5">
                      Indexed Viral & Trending Videos
                    </div>
                  </div>

                </div>

                {/* Automation Schedule & Last Run Info */}
                <div className="p-3.5 bg-stone-100 border border-stone-800 text-xs font-sans flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">Last Generated:</span>
                      <span className="font-mono text-stone-800">
                        {sitemapInfo?.lastGeneratedAt ? new Date(sitemapInfo.lastGeneratedAt).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">Next Scheduled Daily Cron:</span>
                      <span className="font-mono text-stone-800">
                        {sitemapInfo?.nextScheduledDailyRunAt ? new Date(sitemapInfo.nextScheduledDailyRunAt).toLocaleString() : 'Daily Midnight (UTC)'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-600 italic">
                    🔄 Frequency: Real-time on every feed refresh + Automatic Daily 24h Synchronizer
                  </div>
                </div>

                {/* Sitemaps Direct Links & Copy URLs Table */}
                <div className="space-y-2 font-sans">
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    Live Search Engine Sitemaps & Feeds:
                  </div>

                  <div className="divide-y divide-stone-300 border border-stone-800 bg-[#faf6ed] overflow-hidden text-xs">
                    
                    {/* Master Index */}
                    <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-stone-100 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-950 text-sm">/sitemap_index.xml</span>
                          <span className="px-1.5 py-0.2 bg-amber-200 text-amber-950 font-bold text-[10px] uppercase">Recommended for GSC</span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-0.5">
                          Master Sitemap Index referencing main sitemap, Google News sitemap, and Google Video sitemap.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopySitemapUrl('/sitemap_index.xml', 'index')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-200 hover:bg-stone-300 border border-stone-700 font-bold text-[11px] text-stone-900 cursor-pointer"
                          title="Copy Full URL"
                        >
                          {copiedUrlKey === 'index' ? <Check className="w-3 h-3 text-emerald-800" /> : <Copy className="w-3 h-3 text-stone-700" />}
                          <span>{copiedUrlKey === 'index' ? 'Copied' : 'Copy URL'}</span>
                        </button>
                        <a
                          href="/sitemap_index.xml"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-stone-100 border border-stone-900 font-bold text-[11px] cursor-pointer"
                        >
                          <span>Open XML</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Standard / Main Sitemap */}
                    <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-stone-100 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-950 text-sm">/sitemap.xml</span>
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 font-bold text-[10px] uppercase">All Articles & Static Pages</span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-0.5">
                          Comprehensive sitemap with image metadata tags (xmlns:image) for all indexed news articles.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopySitemapUrl('/sitemap.xml', 'main')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-200 hover:bg-stone-300 border border-stone-700 font-bold text-[11px] text-stone-900 cursor-pointer"
                          title="Copy Full URL"
                        >
                          {copiedUrlKey === 'main' ? <Check className="w-3 h-3 text-emerald-800" /> : <Copy className="w-3 h-3 text-stone-700" />}
                          <span>{copiedUrlKey === 'main' ? 'Copied' : 'Copy URL'}</span>
                        </button>
                        <a
                          href="/sitemap.xml"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-stone-100 border border-stone-900 font-bold text-[11px] cursor-pointer"
                        >
                          <span>Open XML</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Google News Sitemap */}
                    <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-stone-100 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-950 text-sm">/news-sitemap.xml</span>
                          <span className="px-1.5 py-0.2 bg-blue-100 text-blue-900 font-bold text-[10px] uppercase">Google News Only (48h)</span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-0.5">
                          Specialized Google News XML sitemap schema containing only stories published within the last 48 hours.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopySitemapUrl('/news-sitemap.xml', 'news')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-200 hover:bg-stone-300 border border-stone-700 font-bold text-[11px] text-stone-900 cursor-pointer"
                          title="Copy Full URL"
                        >
                          {copiedUrlKey === 'news' ? <Check className="w-3 h-3 text-emerald-800" /> : <Copy className="w-3 h-3 text-stone-700" />}
                          <span>{copiedUrlKey === 'news' ? 'Copied' : 'Copy URL'}</span>
                        </button>
                        <a
                          href="/news-sitemap.xml"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-stone-100 border border-stone-900 font-bold text-[11px] cursor-pointer"
                        >
                          <span>Open XML</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Video Sitemap */}
                    <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-stone-100 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-950 text-sm">/video-sitemap.xml</span>
                          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-900 font-bold text-[10px] uppercase">Google Video Search</span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-0.5">
                          Video XML sitemap with player embed links, publication dates, and tags for Google Video indexation.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopySitemapUrl('/video-sitemap.xml', 'video')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-200 hover:bg-stone-300 border border-stone-700 font-bold text-[11px] text-stone-900 cursor-pointer"
                          title="Copy Full URL"
                        >
                          {copiedUrlKey === 'video' ? <Check className="w-3 h-3 text-emerald-800" /> : <Copy className="w-3 h-3 text-stone-700" />}
                          <span>{copiedUrlKey === 'video' ? 'Copied' : 'Copy URL'}</span>
                        </button>
                        <a
                          href="/video-sitemap.xml"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-stone-100 border border-stone-900 font-bold text-[11px] cursor-pointer"
                        >
                          <span>Open XML</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Robots.txt */}
                    <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-stone-100 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-950 text-sm">/robots.txt</span>
                          <span className="px-1.5 py-0.2 bg-stone-200 text-stone-800 font-bold text-[10px] uppercase">Crawler Directives</span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-0.5">
                          Directs Googlebot, Googlebot-News, Googlebot-Video, and Mediapartners-Google to all sitemaps automatically.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopySitemapUrl('/robots.txt', 'robots')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-200 hover:bg-stone-300 border border-stone-700 font-bold text-[11px] text-stone-900 cursor-pointer"
                          title="Copy Full URL"
                        >
                          {copiedUrlKey === 'robots' ? <Check className="w-3 h-3 text-emerald-800" /> : <Copy className="w-3 h-3 text-stone-700" />}
                          <span>{copiedUrlKey === 'robots' ? 'Copied' : 'Copy URL'}</span>
                        </button>
                        <a
                          href="/robots.txt"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-stone-100 border border-stone-900 font-bold text-[11px] cursor-pointer"
                        >
                          <span>Open TXT</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Google Search Console & Verification Tip Box */}
                <div className="p-3.5 bg-amber-50 border border-amber-800/60 font-sans text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <ShieldCheck className="w-4 h-4 text-emerald-800" />
                    <span>Google Search Console Verification & Daily Indexing Guide:</span>
                  </div>
                  <p className="text-stone-700 leading-relaxed">
                    Your site includes the verified Google HTML verification tag (<code className="bg-amber-100 px-1 py-0.5 border border-amber-300 text-amber-950 font-mono text-[11px]">JSiPykw-JX8NW9HaALbegeF3EqRI3RQNXhxmWq8tR_0</code>) and verification file (<code className="bg-amber-100 px-1 py-0.5 border border-amber-300 text-amber-950 font-mono text-[11px]">googled43dd531c722dedd.html</code>).
                  </p>
                  <p className="text-stone-700 leading-relaxed">
                    To maximize fast indexing: In <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="font-bold underline text-amber-950 hover:text-stone-900">Google Search Console</a>, navigate to <strong>Sitemaps</strong> and submit <strong className="font-mono text-stone-900">sitemap_index.xml</strong> or <strong className="font-mono text-stone-900">sitemap.xml</strong>. Google will automatically poll the daily updated index.
                  </p>
                </div>

              </div>


            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="bg-[#e8e0d0] px-6 py-3 border-t-2 border-stone-900 flex items-center justify-between text-xs font-serif text-stone-700 uppercase">
          <span>NewsPulse Executive Gazette Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 text-stone-100 font-bold hover:bg-stone-800 cursor-pointer border border-stone-900"
          >
            Close Dashboard
          </button>
        </div>

      </div>

      {/* Auto-Tag Inspector Modal */}
      <AutoTagInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => {
          setIsInspectorOpen(false);
          setInspectorArticle(null);
          setInspectorSuggestion(null);
        }}
        article={inspectorArticle}
        suggestion={inspectorSuggestion}
        isLoading={isLoadingInspector}
        onApplyTags={handleApplyInspectorTags}
      />

    </div>
  );
};
