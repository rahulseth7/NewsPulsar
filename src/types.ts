export type NewsCategory = 'All' | 'World' | 'Technology' | 'Science' | 'Business' | 'Sports' | 'Entertainment' | 'Health';

export type SentimentType = 'Urgent' | 'Positive' | 'Neutral' | 'Analysis' | 'Warning';

export type Language = 'en' | 'hi';

export interface TimelineEvent {
  timeOrPhase: string;
  event: string;
}

export interface QuoteHighlight {
  speaker: string;
  quote: string;
  role?: string;
}

export interface DetailedArticleStory {
  rephrasedTitle?: string;
  rephrasedLead?: string;
  rephrasedStory?: string;
  backgroundContext?: string;
  stakeholderImpact?: string;
  futureOutlook?: string;
  oneLineSummary?: string;
  executiveSummary?: string;
  bulletPoints: string[];
  keyTakeaways: string[];
  whyItMatters: string;
  sentiment: SentimentType;
  tags: string[];
  timeline?: TimelineEvent[];
  keyQuotes?: QuoteHighlight[];
  wordCount?: number;
}

export interface HindiArticleContent {
  title: string;
  description: string;
  contentSnippet?: string;
  rephrasedLead?: string;
  rephrasedStory?: string;
  backgroundContext?: string;
  stakeholderImpact?: string;
  futureOutlook?: string;
  oneLineSummary?: string;
  executiveSummary?: string;
  bulletPoints?: string[];
  keyTakeaways?: string[];
  whyItMatters?: string;
  tags?: string[];
  sentiment?: SentimentType;
  translatedAt?: string;
  isAiGenerated?: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  contentSnippet?: string;
  link: string;
  source: string;
  category: NewsCategory;
  pubDate: string; // ISO string
  imageUrl?: string;
  readTimeMinutes: number;
  sentiment: SentimentType;
  tags: string[];
  seoKeywords: string[];
  slug: string;
  metaDescription: string;
  hindi?: HindiArticleContent;
  aiSummary?: DetailedArticleStory;
}

export interface NewsSourceInfo {
  id: string;
  name: string;
  url: string;
  feedUrl: string;
  category: NewsCategory;
  active: boolean;
  lastScrapedAt?: string;
  articleCount?: number;
}

export interface NewsResponse {
  articles: NewsArticle[];
  lastRefreshedAt: string;
  nextRefreshAt: string;
  refreshIntervalSeconds: number;
  totalArticles: number;
  refreshCount: number;
  isRefreshing: boolean;
  sources: NewsSourceInfo[];
  stats: {
    categoryCounts: Record<string, number>;
    sourceCounts: Record<string, number>;
    sentimentCounts: Record<string, number>;
  };
  breakingNews?: NewsArticle[];
}

export interface AISummaryRequest {
  articleId: string;
  title: string;
  description: string;
  link?: string;
  content?: string;
}

export interface AISummaryResponse {
  success: boolean;
  summary: DetailedArticleStory;
  error?: string;
}

export type AIRephraseRequest = AISummaryRequest;
export type AIRephraseResponse = AISummaryResponse;

export interface IpVisitRecord {
  id: string;
  ip: string;
  path: string;
  userAgent?: string;
  timestamp: string;
}

export interface IpTopInfo {
  ip: string;
  count: number;
  percentage: number;
  lastVisited: string;
  paths: string[];
  userAgent?: string;
}

export interface PeriodIpStats {
  totalVisits: number;
  uniqueIpCount: number;
  topIps: IpTopInfo[];
  recentVisits: IpVisitRecord[];
}

export interface IpAnalyticsData {
  day: PeriodIpStats;
  week: PeriodIpStats;
  month: PeriodIpStats;
  year: PeriodIpStats;
  allRecentLogs: IpVisitRecord[];
}

export interface DatabaseStorageInfo {
  success: boolean;
  storageFile: string;
  backupFile: string;
  excelFile: string;
  fileSizeKb: number;
  totalArticlesStored: number;
  lastModified: string;
  isAutoSaveEnabled: boolean;
  storageType: string;
  categoryBreakdown?: Record<string, number>;
  sourceBreakdown?: Record<string, number>;
}

export interface TrendingTopicItem {
  tag: string;
  count: number;
  percentage: number;
  categories: Record<string, number>;
  primaryCategory: NewsCategory;
  sentimentBreakdown: Record<string, number>;
  recentArticles: {
    id: string;
    title: string;
    source: string;
    category: NewsCategory;
    pubDate: string;
    link?: string;
  }[];
}

export interface TrendingTopicsData {
  totalUniqueTags: number;
  totalTagOccurrences: number;
  topKeyword: string;
  fastestRising: string;
  averageTagsPerArticle: number;
  topics: TrendingTopicItem[];
  categoryDistribution: Record<string, number>;
}

export interface AutoTagSuggestion {
  articleId?: string;
  tags: string[];
  seoKeywords: string[];
  suggestedCategory?: NewsCategory;
  sentiment?: 'Urgent' | 'Positive' | 'Neutral' | 'Analysis' | 'Warning';
  explanation?: string;
  isAiGenerated: boolean;
}

export interface BatchAutoTagResult {
  success: boolean;
  processedCount: number;
  updatedArticlesCount: number;
  results: {
    articleId: string;
    title: string;
    addedTags: string[];
    allTags: string[];
  }[];
}

export interface TranslateHindiResponse {
  success: boolean;
  articleId?: string;
  hindi: HindiArticleContent;
  error?: string;
}

export interface TranslateBatchResponse {
  success: boolean;
  translations: Record<string, HindiArticleContent>;
  translatedCount: number;
  error?: string;
}

export type VideoPlatform = 'youtube' | 'tiktok' | 'reddit' | 'vimeo' | 'twitter' | 'web';

export type VideoCategory = 'Viral' | 'Tech' | 'Science' | 'Entertainment' | 'Humor' | 'Gaming' | 'News' | 'Sports';

export interface ViralVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
  source: string;
  author?: string;
  platform: VideoPlatform;
  viewsCount: number;
  likesCount: number;
  duration: string; // e.g. "03:45"
  pubDate: string; // ISO string
  category: VideoCategory;
  tags: string[]; // e.g. ["#Viral", "#AI", "#Tech"]
  seoKeywords: string[];
  slug: string;
  metaDescription: string;
  sentiment?: SentimentType;
  isViralTrend: boolean;
  viralScore: number; // 1 to 100
  aiTakeaway?: string;
  hindiTitle?: string;
  hindiDescription?: string;
}

export type VideoTimeWindow = '24h' | '48h' | 'week' | 'archive' | 'all';

export interface ViralVideoResponse {
  videos: ViralVideo[];
  totalVideos: number;
  lastScrapedAt: string;
  trendingTags: { tag: string; count: number }[];
  platformBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  timeWindowBreakdown?: {
    last24h: number;   // Page 1: 0-24h
    past48h: number;   // Page 2: 24-48h
    pastWeek: number;  // Page 3: 48h-7d
    archive: number;   // Page 4+: 7d+
  };
  currentPage?: number;
  totalPages?: number;
}

export type PageView = 'home' | 'about' | 'advertise' | 'contact' | 'privacy' | 'dashboard' | 'database' | 'videos' | 'article';

export interface SitemapGenerationLog {
  timestamp: string;
  trigger: 'daily_scheduled_cron' | 'scrape_auto' | 'manual_admin' | 'server_init';
  articlesCount: number;
  videosCount: number;
  googleNewsCount: number;
}

export interface SitemapStatusInfo {
  success: boolean;
  sitemapUrl: string;
  newsSitemapUrl: string;
  videoSitemapUrl: string;
  sitemapIndexUrl: string;
  totalArticlesIndexed: number;
  totalVideosIndexed: number;
  googleNewsArticles48h: number;
  lastGeneratedAt: string;
  nextScheduledDailyRunAt: string;
  dailyAutomationActive: boolean;
  diskFileLastModified: string;
  diskFileSizeBytes: number;
  updateFrequency: string;
  supportedProtocols: string[];
  recentGenerationLogs?: SitemapGenerationLog[];
}



