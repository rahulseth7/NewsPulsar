import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Flame, 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowLeft, 
  Share2, 
  Tag, 
  ThumbsUp, 
  Eye, 
  Clock, 
  Plus, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Tv, 
  Radio, 
  Layers, 
  Grid, 
  List, 
  CheckCircle2, 
  Check, 
  X,
  Globe,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  Video
} from 'lucide-react';
import { ViralVideo, VideoPlatform, VideoCategory, Language, PageView } from '../types';
import { fetchViralVideos, scrapeViralVideosNow, addCustomViralVideo, likeViralVideo } from '../services/videoApi';
import { VideoModal } from '../components/VideoModal';

interface ViralVideosPageProps {
  onNavigateHome?: () => void;
  onBackToNews?: () => void;
  onNavigatePage?: (page: PageView) => void;
  language?: Language;
  initialVideoId?: string | null;
  initialTag?: string | null;
}

export const ViralVideosPage: React.FC<ViralVideosPageProps> = ({
  onNavigateHome,
  onBackToNews,
  onNavigatePage,
  language = 'en',
  initialVideoId = null,
  initialTag = null,
}) => {
  const [videos, setVideos] = useState<ViralVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'viral' | 'newest' | 'views' | 'likes'>('viral');
  const [viewMode, setViewMode] = useState<'grid' | 'cinema' | 'compact'>('grid');
  const [activeModalVideo, setActiveModalVideo] = useState<ViralVideo | null>(null);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [trendingTagsList, setTrendingTagsList] = useState<{ tag: string; count: number }[]>([]);

  // New Video Form State
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoCategory, setNewVideoCategory] = useState<VideoCategory>('Viral');
  const [newVideoDesc, setNewVideoDesc] = useState('');
  const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);

  const isHindi = language === 'hi';

  const handleBack = () => {
    if (onBackToNews) onBackToNews();
    else if (onNavigateHome) onNavigateHome();
    else if (onNavigatePage) onNavigatePage('home');
  };

  // Load Videos from API / IndexedDB
  const loadVideos = async () => {
    setLoading(true);
    try {
      const data = await fetchViralVideos({
        category: selectedCategory,
        platform: selectedPlatform,
        tag: selectedTag || undefined,
        search: searchQuery,
        sortBy,
      });

      setVideos(data.videos || []);
      if (data.trendingTags) {
        setTrendingTagsList(data.trendingTags);
      }

      // Check if deep link initialVideoId was requested
      if (initialVideoId && !activeModalVideo) {
        const found = (data.videos || []).find(v => v.id === initialVideoId || v.slug === initialVideoId);
        if (found) setActiveModalVideo(found);
      }
    } catch (err) {
      console.error('Failed to load viral videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, [selectedCategory, selectedPlatform, selectedTag, sortBy]);

  // Handle on-demand Scraping
  const handleScrapeNow = async () => {
    setIsScraping(true);
    setStatusMessage(null);
    try {
      const res = await scrapeViralVideosNow();
      setStatusMessage(res.message || 'Scraped latest viral internet videos.');
      await loadVideos();
    } catch (err: any) {
      setStatusMessage('Scrape failed: ' + (err.message || 'Network error'));
    } finally {
      setIsScraping(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Handle Custom Video Submission
  const handleAddVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl.trim()) return;

    setIsSubmittingVideo(true);
    try {
      const res = await addCustomViralVideo({
        videoUrl: newVideoUrl.trim(),
        title: newVideoTitle.trim() || undefined,
        category: newVideoCategory,
        description: newVideoDesc.trim() || undefined,
      });

      setStatusMessage('Video successfully added to viral database!');
      setShowAddModal(false);
      setNewVideoUrl('');
      setNewVideoTitle('');
      setNewVideoDesc('');
      await loadVideos();
    } catch (err: any) {
      alert('Error adding video: ' + err.message);
    } finally {
      setIsSubmittingVideo(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Filter in memory for immediate instant search
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      if (selectedTag) {
        const clean = selectedTag.toLowerCase();
        const hasTag = v.tags.some(t => t.toLowerCase() === clean || t.toLowerCase() === `#${clean}`);
        if (!hasTag) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = v.title.toLowerCase().includes(q);
        const matchDesc = v.description.toLowerCase().includes(q);
        const matchTag = v.tags.some(t => t.toLowerCase().includes(q));
        const matchAuthor = v.author?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTag && !matchAuthor) return false;
      }
      return true;
    });
  }, [videos, selectedTag, searchQuery]);

  // Featured Top Viral Video (Top Score)
  const featuredVideo = useMemo(() => {
    return filteredVideos.length > 0 ? filteredVideos[0] : null;
  }, [filteredVideos]);

  // Other Videos (excluding featured if in cinema view)
  const remainingVideos = useMemo(() => {
    if (viewMode === 'cinema' && featuredVideo) {
      return filteredVideos.slice(1);
    }
    return filteredVideos;
  }, [filteredVideos, viewMode, featuredVideo]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // SEO Structured Data (ItemList of VideoObjects)
  const seoStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Trending Viral Videos & Internet Clips | NewsPulse",
    "description": "Live aggregated feed of viral videos, internet breakthroughs, science phenomena, and trending tech clips with AI summaries and multi-platform tags.",
    "numberOfItems": filteredVideos.length,
    "itemListElement": filteredVideos.slice(0, 15).map((v, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "VideoObject",
        "name": v.title,
        "description": v.metaDescription || v.description,
        "thumbnailUrl": [v.thumbnailUrl],
        "uploadDate": v.pubDate,
        "duration": `PT${v.duration.replace(':', 'M')}S`,
        "contentUrl": v.videoUrl,
        "embedUrl": v.embedUrl,
        "interactionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": { "@type": "WatchAction" },
          "userInteractionCount": v.viewsCount
        },
        "keywords": v.tags.join(', ')
      }
    }))
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 font-neo space-y-6">
      {/* Invisible SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seoStructuredData) }}
      />

      {/* 1. Header & Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="px-3 py-1.5 bg-white hover:bg-black hover:text-[#ccff00] text-black font-mono font-black text-xs border-2 border-black neo-shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isHindi ? '← मुख्य वायर' : '← LIVE WIRE'}</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 bg-[#ff2a85] text-white border border-black animate-pulse">
                <Flame className="w-4 h-4" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-none">
                {isHindi ? 'वायरल वीडियो और ट्रेंडिंग क्लिप्स' : 'VIRAL VIDEOS & CLIPS'}
              </h1>
            </div>
            <p className="text-xs text-zinc-700 font-bold mt-1">
              {isHindi
                ? 'इंटरनेट पर सबसे तेजी से वायरल हो रहे वीडियो - वास्तविक समय में स्क्रैप और टैग किए गए'
                : 'Real-Time Scraped Internet Video Feed — AI-Tagged, High-Velocity Social Trends'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleScrapeNow}
            disabled={isScraping}
            className="px-3 py-1.5 bg-[#ccff00] hover:bg-[#b8e600] text-black font-neo font-black text-xs border-2 border-black neo-shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Scrape video feeds across YouTube, Reddit, Vimeo & TikTok"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
            <span>{isHindi ? 'ताज़ा वीडियो स्क्रैप' : 'SCRAPE VIDEOS NOW'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-[#00f0ff] hover:bg-[#00d0e0] text-black font-neo font-black text-xs border-2 border-black neo-shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isHindi ? '+ वीडियो जोड़ें' : '+ SUBMIT VIDEO'}</span>
          </button>

          <a
            href="/api/videos/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-white hover:bg-black hover:text-white text-black font-neo font-black text-xs border-2 border-black neo-shadow-sm flex items-center gap-1.5 transition-all"
            title="Open Google Video XML Sitemap"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>VIDEO SITEMAP</span>
          </a>

          <a
            href="/api/videos/export/json"
            className="px-3 py-1.5 bg-white hover:bg-black hover:text-white text-black font-neo font-black text-xs border-2 border-black neo-shadow-sm flex items-center gap-1.5 transition-all"
            title="Download Full JSON Video Database"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT JSON</span>
          </a>
        </div>
      </div>

      {/* Status Notification Toast */}
      {statusMessage && (
        <div className="p-3 bg-[#ccff00] border-2 border-black neo-shadow flex items-center gap-2 text-black font-neo font-bold text-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 2. Platform & Category Pill Bar */}
      <div className="space-y-3 bg-[#faf7ee] border-2 border-black p-4 neo-shadow">
        
        {/* Platform Selection Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-mono font-black uppercase text-zinc-500 shrink-0">
            PLATFORM:
          </span>
          {['All', 'youtube', 'tiktok', 'reddit', 'vimeo', 'web'].map((plat) => (
            <button
              key={plat}
              onClick={() => setSelectedPlatform(plat)}
              className={`px-2.5 py-1 text-xs font-mono font-bold uppercase border border-black transition-all cursor-pointer shrink-0 ${
                selectedPlatform === plat
                  ? 'bg-black text-white neo-shadow-sm font-black'
                  : 'bg-white text-black hover:bg-zinc-100'
              }`}
            >
              {plat === 'All' ? '⚡ ALL SOURCES' : plat}
            </button>
          ))}
        </div>

        {/* Category Selection Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-mono font-black uppercase text-zinc-500 shrink-0">
            CATEGORY:
          </span>
          {['All', 'Viral', 'Tech', 'Science', 'Entertainment', 'Humor', 'Sports', 'Gaming'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs font-mono font-bold uppercase border border-black transition-all cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#ccff00] text-black border-2 neo-shadow-sm font-black'
                  : 'bg-white text-black hover:bg-zinc-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search, Sort & View Mode Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-black/20">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHindi ? 'वीडियो, टैग, या चैनल खोजें...' : 'Search viral videos, tags, channels...'}
              className="w-full pl-9 pr-8 py-1.5 bg-white border-2 border-black text-xs font-neo font-bold focus:outline-none focus:bg-[#fffde6]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-black cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort & Layout Toggles */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1.5 bg-white border-2 border-black text-xs font-mono font-bold cursor-pointer"
            >
              <option value="viral">🔥 Highest Viral Score</option>
              <option value="views">👀 Most Viewed</option>
              <option value="newest">⏱️ Newest First</option>
              <option value="likes">👍 Most Liked</option>
            </select>

            <div className="flex items-center border-2 border-black bg-white">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-black text-white' : 'hover:bg-zinc-100 text-black'}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cinema')}
                className={`p-1.5 transition-colors ${viewMode === 'cinema' ? 'bg-black text-white' : 'hover:bg-zinc-100 text-black'}`}
                title="Cinema Theater View"
              >
                <Tv className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-1.5 transition-colors ${viewMode === 'compact' ? 'bg-black text-white' : 'hover:bg-zinc-100 text-black'}`}
                title="Compact List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Clickable Trending Tags Cloud */}
        {trendingTagsList && trendingTagsList.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-black/10">
            <span className="text-[11px] font-mono font-black uppercase text-zinc-500 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {isHindi ? 'ट्रेंडिंग टैग्स:' : 'TRENDING TAGS:'}
            </span>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="px-2 py-0.5 bg-[#ff2a85] text-white text-[11px] font-mono font-bold flex items-center gap-1 border border-black cursor-pointer"
              >
                <span>{selectedTag}</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {trendingTagsList.slice(0, 14).map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-0.5 text-[11px] font-mono font-bold border border-black transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-black text-white font-black'
                    : 'bg-white hover:bg-[#ccff00] text-zinc-800'
                }`}
              >
                {tag} <span className="opacity-60 text-[9px]">({count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Cinema Theater Hero (If Cinema Mode Enabled & Featured Video Present) */}
      {viewMode === 'cinema' && featuredVideo && (
        <section className="bg-black text-white border-4 border-black p-4 sm:p-6 neo-shadow space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#ff2a85] text-white text-xs font-mono font-black uppercase">
                FEATURED VIRAL STREAM
              </span>
              <span className="text-xs font-mono text-[#ccff00]">
                VIRAL VELOCITY: {featuredVideo.viralScore}/100 🔥
              </span>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {featuredVideo.viewsCount.toLocaleString()} {isHindi ? 'दृश्य' : 'views'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Embedded Player or Hero Thumbnail */}
            <div className="lg:col-span-2 aspect-video bg-zinc-900 border-2 border-white/20 overflow-hidden relative group">
              {featuredVideo.embedUrl && featuredVideo.embedUrl.includes('youtube') ? (
                <iframe
                  src={featuredVideo.embedUrl}
                  title={featuredVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div 
                  onClick={() => setActiveModalVideo(featuredVideo)}
                  className="w-full h-full cursor-pointer relative"
                >
                  <img
                    src={featuredVideo.thumbnailUrl}
                    alt={featuredVideo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                    <div className="p-4 bg-[#ccff00] text-black border-2 border-black flex items-center gap-2 font-black text-sm">
                      <Play className="w-5 h-5 fill-black" />
                      <span>PLAY VIRAL CLIP</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Hero Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#ccff00] text-black text-[10px] font-black uppercase">
                  {featuredVideo.category}
                </span>
                <span className="text-xs font-mono text-zinc-300">
                  {featuredVideo.author || featuredVideo.source}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {featuredVideo.title}
              </h2>

              <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                {featuredVideo.description}
              </p>

              {featuredVideo.aiTakeaway && (
                <div className="p-2.5 bg-zinc-900 border border-zinc-700 text-xs text-[#00f5a0]">
                  <span className="font-bold uppercase text-[10px] block text-zinc-400">AI TAKEAWAY:</span>
                  {featuredVideo.aiTakeaway}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setActiveModalVideo(featuredVideo)}
                  className="px-4 py-2 bg-[#ccff00] hover:bg-[#b8e600] text-black font-neo font-black text-xs border-2 border-white flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>WATCH IN THEATER</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. Video Grid / Feed */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-black" />
          <p className="font-mono text-sm font-bold text-zinc-600">
            {isHindi ? 'इंटरनेट से वायरल वीडियो लोड हो रहे हैं...' : 'Scraping and indexing viral video feeds...'}
          </p>
        </div>
      ) : remainingVideos.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-black bg-white p-8 space-y-3">
          <Tv className="w-10 h-10 mx-auto text-zinc-400" />
          <h3 className="text-lg font-black text-black">
            {isHindi ? 'कोई वीडियो नहीं मिला' : 'No Viral Videos Found'}
          </h3>
          <p className="text-xs text-zinc-600 max-w-md mx-auto">
            {isHindi
              ? 'वर्तमान फ़िल्टर के लिए कोई वीडियो उपलब्ध नहीं है। फ़िल्टर रीसेट करें या नया वीडियो स्क्रैप करें।'
              : 'Try clearing your search filters or click "Scrape Videos Now" to harvest fresh clips.'}
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedPlatform('All');
              setSelectedTag(null);
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-[#ccff00] text-black font-bold text-xs border-2 border-black cursor-pointer neo-shadow-sm"
          >
            RESET ALL FILTERS
          </button>
        </div>
      ) : viewMode === 'compact' ? (

        /* Compact List View */
        <div className="bg-white border-2 border-black divide-y-2 divide-black neo-shadow">
          {remainingVideos.map((video) => {
            const isBookmarked = bookmarkedIds.has(video.id);
            return (
              <article
                key={video.id}
                onClick={() => setActiveModalVideo(video)}
                className="p-3 sm:p-4 hover:bg-[#faf7ee] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative w-28 sm:w-36 aspect-video bg-black shrink-0 overflow-hidden border border-black">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-1 right-1 px-1 bg-black/80 text-white font-mono text-[9px] font-bold">
                      {video.duration}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.2 bg-black text-white text-[9px] font-mono font-bold uppercase">
                        {video.platform}
                      </span>
                      <span className="px-1.5 py-0.2 bg-[#ccff00] text-black text-[9px] font-bold uppercase border border-black">
                        {video.category}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {video.author || video.source}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs sm:text-sm text-black leading-snug truncate group-hover:text-[#0055ff]">
                      {video.title}
                    </h3>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600">
                      <span>{video.viewsCount.toLocaleString()} views</span>
                      <span>•</span>
                      <span>Score: {video.viralScore}/100</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(video.id);
                    }}
                    className={`p-1.5 border border-black transition-colors cursor-pointer ${
                      isBookmarked ? 'bg-[#ff2a85] text-white' : 'bg-white hover:bg-zinc-100 text-black'
                    }`}
                    title="Bookmark"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveModalVideo(video);
                    }}
                    className="px-3 py-1 bg-black text-white hover:bg-[#ccff00] hover:text-black font-mono text-xs font-bold border border-black flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>WATCH</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

      ) : (

        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {remainingVideos.map((video) => {
            const isBookmarked = bookmarkedIds.has(video.id);
            return (
              <article
                key={video.id}
                onClick={() => setActiveModalVideo(video)}
                className="bg-white border-2 border-black neo-shadow hover:translate-x-1 hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between group overflow-hidden"
              >
                <div>
                  {/* Video Thumbnail with Badges */}
                  <div className="relative aspect-video bg-black overflow-hidden border-b-2 border-black">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />

                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 bg-[#ccff00] text-black border-2 border-black flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </div>
                    </div>

                    {/* Platform Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase border border-black shadow-sm ${
                        video.platform === 'youtube' ? 'bg-[#ff0000] text-white' :
                        video.platform === 'tiktok' ? 'bg-black text-[#00f0ff]' :
                        video.platform === 'reddit' ? 'bg-[#ff4500] text-white' :
                        video.platform === 'vimeo' ? 'bg-[#1ab7ea] text-white' :
                        'bg-white text-black'
                      }`}>
                        {video.platform.toUpperCase()}
                      </span>

                      <span className="px-1.5 py-0.5 bg-[#faf7ee] text-black text-[10px] font-bold uppercase border border-black">
                        {video.category}
                      </span>
                    </div>

                    {/* Viral Velocity Score & Duration */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
                      <span className="px-1.5 py-0.5 bg-black/85 text-[#ccff00] font-mono text-[10px] font-black border border-black">
                        {video.viralScore} 🔥
                      </span>
                      <span className="px-1.5 py-0.5 bg-black/85 text-white font-mono text-[10px] font-bold border border-black">
                        {video.duration}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 font-bold">
                      <span>{video.author || video.source}</span>
                      <span>
                        {new Date(video.pubDate).toLocaleDateString(isHindi ? 'hi-IN' : 'en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <h3 className="font-black text-sm text-black leading-snug group-hover:text-[#0055ff] line-clamp-2">
                      {video.title}
                    </h3>

                    <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                      {video.description}
                    </p>

                    {/* AI Takeaway */}
                    {video.aiTakeaway && (
                      <div className="p-2 bg-[#f0fff4] border border-[#008000]/30 text-[11px] text-[#008000] font-medium line-clamp-2 flex items-start gap-1">
                        <Sparkles className="w-3 h-3 shrink-0 mt-0.5 text-[#008000]" />
                        <span>{video.aiTakeaway}</span>
                      </div>
                    )}

                    {/* Tags */}
                    {video.tags && video.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        {video.tags.slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTag(t);
                            }}
                            className="text-[10px] font-mono font-bold text-zinc-700 bg-zinc-100 hover:bg-[#ccff00] px-1.5 py-0.5 border border-zinc-300 transition-colors"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-[#faf7ee] border-t-2 border-black flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-700">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {video.viewsCount.toLocaleString()}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {video.likesCount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleBookmark(video.id)}
                      className={`p-1 border border-black transition-colors cursor-pointer ${
                        isBookmarked ? 'bg-[#ff2a85] text-white' : 'bg-white hover:bg-zinc-100 text-black'
                      }`}
                      title={isBookmarked ? 'Saved' : 'Save'}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setActiveModalVideo(video)}
                      className="px-2.5 py-1 bg-black hover:bg-[#ccff00] text-white hover:text-black font-mono font-bold text-xs border border-black flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>PLAY</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 6. Active Video Interactive Player Modal */}
      {activeModalVideo && (
        <VideoModal
          video={activeModalVideo}
          onClose={() => setActiveModalVideo(null)}
          onSelectVideo={(v) => setActiveModalVideo(v)}
          relatedVideos={videos.filter(v => v.id !== activeModalVideo.id).slice(0, 3)}
          language={language}
          onSelectTag={(t) => setSelectedTag(t)}
        />
      )}

      {/* 7. Submit Custom Video Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border-4 border-black neo-shadow-lg w-full max-w-lg p-6 space-y-4 font-neo">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-black" />
                <h3 className="text-lg font-black text-black">
                  {isHindi ? 'नया वायरल वीडियो जोड़ें' : 'SUBMIT VIRAL VIDEO'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-black hover:text-white border border-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddVideoSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-black uppercase text-black mb-1">
                  VIDEO URL (YouTube, Vimeo, Reddit, etc.) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="w-full p-2 bg-zinc-50 border-2 border-black text-xs font-mono font-bold focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-black uppercase text-black mb-1">
                  TITLE (Optional - Auto extracted if blank)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Breakthrough Humanoid Robotics Demo"
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                  className="w-full p-2 bg-zinc-50 border-2 border-black text-xs font-neo font-bold focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-black uppercase text-black mb-1">
                    CATEGORY
                  </label>
                  <select
                    value={newVideoCategory}
                    onChange={(e) => setNewVideoCategory(e.target.value as any)}
                    className="w-full p-2 bg-zinc-50 border-2 border-black text-xs font-mono font-bold cursor-pointer"
                  >
                    <option value="Viral">Viral</option>
                    <option value="Tech">Tech</option>
                    <option value="Science">Science</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Humor">Humor</option>
                    <option value="Sports">Sports</option>
                    <option value="Gaming">Gaming</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-black uppercase text-black mb-1">
                    AUTOSAVE TO DB
                  </label>
                  <div className="p-2 bg-[#e6ffe6] border-2 border-[#008000] text-[#008000] text-xs font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PERMANENT</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-black uppercase text-black mb-1">
                  DESCRIPTION / CONTEXT
                </label>
                <textarea
                  rows={3}
                  placeholder="Why is this clip trending on social feeds?"
                  value={newVideoDesc}
                  onChange={(e) => setNewVideoDesc(e.target.value)}
                  className="w-full p-2 bg-zinc-50 border-2 border-black text-xs font-neo font-medium focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-white border-2 border-black text-xs font-mono font-bold cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVideo}
                  className="px-4 py-1.5 bg-[#ccff00] hover:bg-[#b8e600] text-black font-mono font-black text-xs border-2 border-black neo-shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingVideo && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>SUBMIT & INDEX VIDEO</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
