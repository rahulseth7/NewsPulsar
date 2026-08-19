import { ViralVideo, ViralVideoResponse, VideoCategory, VideoPlatform } from '../types';
import { 
  saveViralVideosToIndexedDb, 
  loadViralVideosFromIndexedDb, 
  getViralVideosCountFromIndexedDb 
} from '../utils/indexedDbStorage';

export interface VideoFetchParams {
  category?: string;
  platform?: string;
  tag?: string;
  search?: string;
  sortBy?: 'viral' | 'newest' | 'views' | 'likes';
}

/**
 * Fetches viral videos from the server API with automatic IndexedDB caching and fallback.
 */
export async function fetchViralVideos(params?: VideoFetchParams): Promise<ViralVideoResponse> {
  const queryParams = new URLSearchParams();
  if (params?.category && params.category !== 'All') queryParams.append('category', params.category);
  if (params?.platform && params.platform !== 'All') queryParams.append('platform', params.platform);
  if (params?.tag) queryParams.append('tag', params.tag);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);

  const url = `/api/videos?${queryParams.toString()}`;

  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data: ViralVideoResponse = await response.json();

    if (Array.isArray(data.videos) && data.videos.length > 0) {
      // Background cache to IndexedDB for zero-loss offline access
      saveViralVideosToIndexedDb(data.videos).catch(console.warn);
    }

    return data;
  } catch (error) {
    console.warn('[VideoAPI] Server fetch failed, falling back to IndexedDB local cache:', error);
    
    // Load from IndexedDB
    const cachedVideos = await loadViralVideosFromIndexedDb();
    
    // Filter in memory if params were provided
    let filtered = cachedVideos;
    if (params?.category && params.category !== 'All') {
      filtered = filtered.filter(v => v.category === params.category);
    }
    if (params?.platform && params.platform !== 'All') {
      filtered = filtered.filter(v => v.platform === params.platform);
    }
    if (params?.tag) {
      const cleanTag = params.tag.toLowerCase();
      filtered = filtered.filter(v => v.tags.some(t => t.toLowerCase() === cleanTag || t.toLowerCase() === `#${cleanTag}`));
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(v => 
        v.title.toLowerCase().includes(q) || 
        v.description.toLowerCase().includes(q) ||
        v.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort
    if (params?.sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    } else if (params?.sortBy === 'views') {
      filtered.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    } else if (params?.sortBy === 'likes') {
      filtered.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    } else {
      // Default: viralScore
      filtered.sort((a, b) => (b.viralScore || 0) - (a.viralScore || 0));
    }

    // Build tag counts
    const tagMap: Record<string, number> = {};
    const platformMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {};

    cachedVideos.forEach(v => {
      v.tags.forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; });
      platformMap[v.platform] = (platformMap[v.platform] || 0) + 1;
      categoryMap[v.category] = (categoryMap[v.category] || 0) + 1;
    });

    const trendingTags = Object.entries(tagMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);

    return {
      videos: filtered,
      totalVideos: cachedVideos.length,
      lastScrapedAt: new Date().toISOString(),
      trendingTags,
      platformBreakdown: platformMap,
      categoryBreakdown: categoryMap,
    };
  }
}

/**
 * Triggers on-demand video scraping across internet feeds.
 */
export async function scrapeViralVideosNow(): Promise<{ success: boolean; message: string; newVideosScraped: number; totalVideos: number; videos: ViralVideo[] }> {
  const response = await fetch('/api/videos/scrape-now', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    throw new Error('Failed to execute video scraper');
  }
  const data = await response.json();
  if (Array.isArray(data.videos)) {
    await saveViralVideosToIndexedDb(data.videos);
  }
  return data;
}

/**
 * Likes a viral video and updates server counts.
 */
export async function likeViralVideo(videoId: string): Promise<{ success: boolean; likesCount: number }> {
  try {
    const res = await fetch(`/api/videos/${encodeURIComponent(videoId)}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[VideoAPI] Like sync failed:', err);
  }
  return { success: true, likesCount: 0 };
}

/**
 * Adds a new custom video URL (YouTube, Vimeo, Reddit, MP4).
 */
export async function addCustomViralVideo(videoData: Partial<ViralVideo>): Promise<{ success: boolean; video: ViralVideo; message: string }> {
  const res = await fetch('/api/videos/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(videoData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add video');
  }
  return await res.json();
}
