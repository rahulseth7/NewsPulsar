import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  Tag, 
  BarChart3, 
  Cloud, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ExternalLink, 
  Sparkles, 
  Flame, 
  Layers, 
  Download, 
  RefreshCw, 
  X, 
  ChevronRight,
  PieChart,
  Hash,
  FileText,
  Calendar,
  Zap
} from 'lucide-react';
import { NewsArticle, TrendingTopicsData, TrendingTopicItem, NewsCategory } from '../types';
import { fetchTrendingTopics, calculateTrendingTopicsFromArticles } from '../services/newsApi';

interface TrendingTopicsVisualizerProps {
  articles: NewsArticle[];
  onSelectArticleTag?: (tag: string) => void;
}

type ViewMode = 'split' | 'cloud' | 'bars';
type SortOption = 'frequency' | 'alphabetical' | 'rising';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  World: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-700', bar: 'bg-amber-600' },
  Technology: { bg: 'bg-cyan-100', text: 'text-cyan-900', border: 'border-cyan-700', bar: 'bg-cyan-600' },
  Business: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-700', bar: 'bg-emerald-600' },
  Science: { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-700', bar: 'bg-purple-600' },
  Health: { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-700', bar: 'bg-rose-600' },
  Sports: { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-700', bar: 'bg-orange-600' },
  Entertainment: { bg: 'bg-pink-100', text: 'text-pink-900', border: 'border-pink-700', bar: 'bg-pink-600' },
  All: { bg: 'bg-stone-200', text: 'text-stone-900', border: 'border-stone-800', bar: 'bg-stone-800' },
};

export const TrendingTopicsVisualizer: React.FC<TrendingTopicsVisualizerProps> = ({
  articles,
  onSelectArticleTag
}) => {
  const [data, setData] = useState<TrendingTopicsData>(() => calculateTrendingTopicsFromArticles(articles));
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [sortBy, setSortBy] = useState<SortOption>('frequency');
  const [limitCount, setLimitCount] = useState<number>(40);
  const [activeTopic, setActiveTopic] = useState<TrendingTopicItem | null>(null);

  // Load from API or sync with articles
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchTrendingTopics(articles);
      setData(result);
    } catch (e) {
      setData(calculateTrendingTopicsFromArticles(articles));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [articles.length]);

  // Filtered & Sorted Topics
  const processedTopics = useMemo(() => {
    let list = [...data.topics];

    // Filter by Category
    if (selectedCategory !== 'All') {
      list = list.filter(t => t.primaryCategory === selectedCategory || (t.categories && t.categories[selectedCategory] > 0));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(t => t.tag.toLowerCase().includes(q));
    }

    // Sort
    if (sortBy === 'alphabetical') {
      list.sort((a, b) => a.tag.localeCompare(b.tag));
    } else if (sortBy === 'rising') {
      // Prioritize tags present in recent articles
      list.sort((a, b) => {
        const aRecent = a.recentArticles.length;
        const bRecent = b.recentArticles.length;
        return (bRecent * 2 + b.count) - (aRecent * 2 + a.count);
      });
    } else {
      list.sort((a, b) => b.count - a.count);
    }

    return list.slice(0, limitCount);
  }, [data.topics, selectedCategory, searchQuery, sortBy, limitCount]);

  const maxCount = useMemo(() => {
    return data.topics.length > 0 ? Math.max(...data.topics.map(t => t.count), 1) : 1;
  }, [data.topics]);

  // Handle Export CSV
  const handleExportCsv = () => {
    const rows = [
      ['Keyword / Tag', 'Frequency Count', 'Share Percentage (%)', 'Primary Category', 'Sample Articles Count'],
      ...data.topics.map(t => [
        `"${t.tag.replace(/"/g, '""')}"`,
        t.count,
        `${t.percentage}%`,
        t.primaryCategory,
        t.recentArticles.length
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trending_topics_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-serif text-stone-900">
      
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#faf6ed] p-4 border-2 border-stone-900 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-stone-600">Total Unique Tags</span>
            <Tag className="w-4 h-4 text-stone-800" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono mt-1 text-stone-950">
            {data.totalUniqueTags}
          </div>
          <p className="text-[11px] text-stone-600 mt-0.5 italic">
            Across {articles.length} stored news posts
          </p>
        </div>

        <div className="bg-[#faf6ed] p-4 border-2 border-stone-900 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-stone-600">#1 Top Keyword</span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-serif mt-1 text-stone-950 truncate" title={data.topKeyword}>
            #{data.topKeyword}
          </div>
          <p className="text-[11px] text-stone-600 mt-0.5">
            {data.topics[0]?.count || 0} occurrences ({data.topics[0]?.percentage || 0}%)
          </p>
        </div>

        <div className="bg-[#faf6ed] p-4 border-2 border-stone-900 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-stone-600">Fastest Rising Topic</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-serif mt-1 text-stone-950 truncate" title={data.fastestRising}>
            #{data.fastestRising}
          </div>
          <p className="text-[11px] text-stone-600 mt-0.5 italic">
            High 48-hour wire momentum
          </p>
        </div>

        <div className="bg-[#faf6ed] p-4 border-2 border-stone-900 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-stone-600">Density Ratio</span>
            <Sparkles className="w-4 h-4 text-cyan-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono mt-1 text-stone-950">
            {data.averageTagsPerArticle} <span className="text-sm font-sans font-normal text-stone-600">tags/post</span>
          </div>
          <p className="text-[11px] text-stone-600 mt-0.5">
            {data.totalTagOccurrences} total mentions indexed
          </p>
        </div>
      </div>

      {/* Control Bar: Filters, Search, View Mode, Sort */}
      <div className="bg-[#f0eae0] p-4 border-2 border-stone-900 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keyword or topic tag..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#faf6ed] border-2 border-stone-900 text-xs sm:text-sm font-sans text-stone-950 focus:outline-none focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-[#faf6ed] p-1 border border-stone-900">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 text-xs font-sans font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'split' ? 'bg-stone-900 text-stone-100 shadow-xs' : 'text-stone-700 hover:bg-stone-300'
              }`}
              title="Split View: Word Cloud + Frequency Bar Chart"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split View</span>
            </button>
            <button
              onClick={() => setViewMode('cloud')}
              className={`px-2.5 py-1 text-xs font-sans font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'cloud' ? 'bg-stone-900 text-stone-100 shadow-xs' : 'text-stone-700 hover:bg-stone-300'
              }`}
              title="Word Cloud View Only"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Word Cloud</span>
            </button>
            <button
              onClick={() => setViewMode('bars')}
              className={`px-2.5 py-1 text-xs font-sans font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'bars' ? 'bg-stone-900 text-stone-100 shadow-xs' : 'text-stone-700 hover:bg-stone-300'
              }`}
              title="Ranked Bar Chart View Only"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bar Chart</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans font-bold uppercase text-stone-700 hidden md:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort topics by"
              className="px-2.5 py-1.5 bg-[#faf6ed] border-2 border-stone-900 text-xs font-sans font-bold uppercase text-stone-900 cursor-pointer focus:outline-none"
            >
              <option value="frequency">Most Frequent (Count)</option>
              <option value="rising">Trending Velocity (Recent)</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
            </select>
          </div>

          {/* Limit Count Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans font-bold uppercase text-stone-700 hidden lg:inline">Limit:</span>
            <select
              value={limitCount}
              onChange={(e) => setLimitCount(Number(e.target.value))}
              aria-label="Limit number of topics displayed"
              className="px-2.5 py-1.5 bg-[#faf6ed] border-2 border-stone-900 text-xs font-sans font-bold uppercase text-stone-900 cursor-pointer focus:outline-none"
            >
              <option value={20}>Top 20</option>
              <option value={40}>Top 40</option>
              <option value={80}>Top 80</option>
              <option value={200}>All Topics</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-2.5 py-1.5 bg-[#faf6ed] hover:bg-stone-300 text-stone-900 border border-stone-900 text-xs font-sans font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Refresh Topic Analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-sans font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer border border-stone-900"
              title="Export Keyword Frequencies CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-stone-300">
          <span className="text-[11px] font-sans font-bold uppercase text-stone-600 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          {(['All', 'World', 'Technology', 'Business', 'Science', 'Health', 'Sports', 'Entertainment'] as (NewsCategory | 'All')[]).map((cat) => {
            const count = cat === 'All' 
              ? data.totalUniqueTags 
              : data.topics.filter(t => t.primaryCategory === cat || (t.categories && t.categories[cat] > 0)).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-0.5 text-xs font-sans font-bold uppercase transition-all border cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-stone-900 text-stone-100 border-stone-900 shadow-xs'
                    : 'bg-[#faf6ed] text-stone-800 border-stone-400 hover:bg-stone-300'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] font-mono px-1 rounded-xs ${isSelected ? 'bg-stone-800 text-stone-200' : 'bg-stone-200 text-stone-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN VISUALIZATION PANELS */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        
        {/* PANEL 1: INTERACTIVE WORD CLOUD */}
        {(viewMode === 'split' || viewMode === 'cloud') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-7' : 'w-full'} bg-[#faf6ed] border-2 border-stone-900 p-5 shadow-xs flex flex-col`}>
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-900 mb-4">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-stone-900" />
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-stone-950">
                  Topic Word Cloud
                </h3>
              </div>
              <span className="text-xs font-sans text-stone-600">
                Click any tag to inspect stories ({processedTopics.length} visible)
              </span>
            </div>

            {/* Word Cloud Surface */}
            <div className="flex-1 min-h-[360px] max-h-[580px] overflow-y-auto p-4 bg-[#fbf9f4] border border-stone-300 flex flex-wrap items-center justify-center gap-2.5 content-center">
              {processedTopics.length === 0 ? (
                <div className="text-center py-12 text-stone-500 italic text-sm">
                  No keywords match the current filter criteria.
                </div>
              ) : (
                processedTopics.map((topic, idx) => {
                  const catStyle = CATEGORY_COLORS[topic.primaryCategory] || CATEGORY_COLORS.All;
                  const ratio = topic.count / maxCount;
                  
                  // Calculate dynamic font-size between 13px and 38px
                  const fontSizePx = Math.round(13 + ratio * 24);
                  // Calculate weight
                  const isHeavy = ratio > 0.4 || idx < 5;
                  const isSelected = activeTopic?.tag === topic.tag;

                  return (
                    <button
                      key={topic.tag}
                      onClick={() => setActiveTopic(isSelected ? null : topic)}
                      style={{ fontSize: `${fontSizePx}px` }}
                      className={`group inline-flex items-center gap-1.5 px-2.5 py-1 border transition-all cursor-pointer select-none rounded-xs ${
                        isSelected
                          ? 'bg-stone-900 text-stone-100 border-stone-950 scale-110 shadow-md z-10'
                          : `${catStyle.bg} ${catStyle.text} ${catStyle.border} hover:border-stone-950 hover:shadow-xs hover:scale-105`
                      } ${isHeavy ? 'font-black tracking-tight' : 'font-bold'}`}
                      title={`#${topic.tag}: ${topic.count} mentions (${topic.percentage}% of all tags) in ${topic.primaryCategory}`}
                    >
                      <span className="opacity-70 font-sans text-xs">#</span>
                      <span className="capitalize">{topic.tag}</span>
                      <span className={`text-[10px] font-mono px-1 py-0.2 border ${
                        isSelected 
                          ? 'bg-stone-800 text-stone-200 border-stone-700' 
                          : 'bg-white/80 text-stone-900 border-stone-800/40'
                      }`}>
                        {topic.count}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Cloud Legend */}
            <div className="mt-3 pt-3 border-t border-stone-300 flex items-center justify-between text-[11px] text-stone-600 font-sans">
              <span className="italic">Font size indicates occurrence volume relative to total stories.</span>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-stone-900"></span> Active
                <span className="inline-block w-2.5 h-2.5 bg-amber-200 border border-amber-600"></span> World
                <span className="inline-block w-2.5 h-2.5 bg-cyan-200 border border-cyan-600"></span> Tech
                <span className="inline-block w-2.5 h-2.5 bg-emerald-200 border border-emerald-600"></span> Business
              </div>
            </div>
          </div>
        )}

        {/* PANEL 2: FREQUENCY BAR CHART */}
        {(viewMode === 'split' || viewMode === 'bars') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-5' : 'w-full'} bg-[#faf6ed] border-2 border-stone-900 p-5 shadow-xs flex flex-col`}>
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-900 mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-stone-900" />
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-stone-950">
                  Keyword Frequency Chart
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-stone-700">
                Top {processedTopics.slice(0, viewMode === 'split' ? 15 : 30).length} Ranked
              </span>
            </div>

            {/* Bars List */}
            <div className="flex-1 max-h-[580px] overflow-y-auto space-y-2.5 pr-1">
              {processedTopics.slice(0, viewMode === 'split' ? 18 : 40).map((topic, index) => {
                const percentageOfMax = Math.round((topic.count / maxCount) * 100);
                const catStyle = CATEGORY_COLORS[topic.primaryCategory] || CATEGORY_COLORS.All;
                const isSelected = activeTopic?.tag === topic.tag;

                return (
                  <div
                    key={topic.tag}
                    onClick={() => setActiveTopic(isSelected ? null : topic)}
                    className={`p-2 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#e8e0d0] border-stone-950 shadow-xs'
                        : 'bg-[#fbf9f4] border-stone-300 hover:border-stone-800 hover:bg-[#f5eedc]'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-black text-stone-500 text-[11px] w-5 text-right">
                          #{index + 1}
                        </span>
                        <span className="font-bold text-stone-950 truncate font-serif">
                          {topic.tag}
                        </span>
                        <span className={`text-[10px] font-sans px-1 py-0.2 border uppercase ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                          {topic.primaryCategory}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0 font-bold">
                        <span className="text-stone-950">{topic.count} stories</span>
                        <span className="text-stone-500">({topic.percentage}%)</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-stone-200 border border-stone-400 overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-500 ${catStyle.bar}`}
                        style={{ width: `${Math.max(percentageOfMax, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* TOPIC DETAIL & ASSOCIATED STORIES INSPECTOR */}
      {activeTopic && (
        <div className="bg-[#faf6ed] border-2 border-stone-900 p-5 shadow-md animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b-2 border-stone-900 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-stone-900 text-stone-100 border border-stone-950">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-black uppercase text-stone-950 font-serif">
                    Topic: #{activeTopic.tag}
                  </h4>
                  <span className={`text-xs font-sans font-bold px-2 py-0.5 border ${
                    (CATEGORY_COLORS[activeTopic.primaryCategory] || CATEGORY_COLORS.All).bg
                  } ${(CATEGORY_COLORS[activeTopic.primaryCategory] || CATEGORY_COLORS.All).text} border-stone-800`}>
                    {activeTopic.primaryCategory}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  Appears in {activeTopic.count} stored news stories ({activeTopic.percentage}% of all mentions)
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTopic(null)}
              className="p-1.5 bg-stone-200 hover:bg-stone-300 text-stone-900 border border-stone-900 cursor-pointer"
              title="Close Topic Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Associated Stories Grid */}
          <div className="space-y-2">
            <div className="text-xs font-sans font-bold uppercase text-stone-700 tracking-wider">
              Matching Wire Stories:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeTopic.recentArticles.map((art) => (
                <div
                  key={art.id}
                  className="bg-[#fbf9f4] p-3.5 border-2 border-stone-800 hover:border-stone-950 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-sans text-stone-600 mb-1">
                      <span className="font-bold text-stone-900 uppercase">{art.source}</span>
                      <span>{new Date(art.pubDate).toLocaleDateString()}</span>
                    </div>
                    <h5 className="text-sm font-bold font-serif text-stone-950 line-clamp-2 leading-snug">
                      {art.title}
                    </h5>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-200 flex items-center justify-between">
                    <span className="text-[10px] font-mono bg-stone-200 text-stone-800 px-1.5 py-0.5 border border-stone-400">
                      {art.category}
                    </span>
                    {art.link && (
                      <a
                        href={art.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-sans font-bold text-stone-900 hover:text-stone-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Original Wire</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
