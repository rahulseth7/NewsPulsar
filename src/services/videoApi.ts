import { ViralVideo, ViralVideoResponse, VideoCategory, VideoPlatform, VideoTimeWindow } from '../types';
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
  timeWindow?: VideoTimeWindow;
  page?: number;
  pageSize?: number;
}

// Client-side emergency fallback seeds if both server & IndexedDB are empty
const CLIENT_EMERGENCY_SEEDS: ViralVideo[] = [
  {
    id: 'vid-gemini-robotics-2026',
    title: 'Next-Gen Humanoid Robots Running Multimodal Neural Networks in Real-Time',
    description: 'Breakthrough footage of autonomous humanoid bipedal robots navigating unstructured industrial terrain, manipulating fine tools, and solving complex physical tasks with zero human intervention.',
    videoUrl: 'https://www.youtube.com/watch?v=kmp38bZ4Wb4',
    embedUrl: 'https://www.youtube-nocookie.com/embed/kmp38bZ4Wb4?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
    source: 'TechPulse Media',
    author: 'Robotics Future Labs',
    platform: 'youtube',
    viewsCount: 4890200,
    likesCount: 234100,
    duration: '04:18',
    pubDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    category: 'Tech',
    tags: ['#Robotics', '#ArtificialIntelligence', '#HumanoidRobot', '#Tech2026', '#ViralTech'],
    seoKeywords: ['humanoid robot demonstration', 'autonomous robotics 2026', 'multimodal AI robot'],
    slug: 'humanoid-robots-multimodal-neural-networks-demo',
    metaDescription: 'Watch breakthrough footage of autonomous humanoid robots executing complex physical tasks in real time.',
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 99,
    aiTakeaway: 'Demonstrates the paradigm shift from scripted robotic motions to real-time spatial LLM reasoning.',
    hindiTitle: 'मानव सदृश रोबोट का रियल-टाइम प्रदर्शन - 2026 की बड़ी तकनीकी छलांग',
    hindiDescription: 'स्वायत्त ह्यूमनॉइड रोबोट्स का वास्तविक समय में जटिल कार्यों को करने का वायरल वीडियो।'
  },
  {
    id: 'vid-spacex-starship-catch',
    title: 'Starship Booster Precision Tower Catch in Ultra High Definition Slow Motion',
    description: 'Spectacular multi-angle aerial footage capturing the Super Heavy rocket booster decelerating smoothly and getting caught by mechanical launch tower chopstick arms.',
    videoUrl: 'https://www.youtube.com/watch?v=921VbEMAwwY',
    embedUrl: 'https://www.youtube-nocookie.com/embed/921VbEMAwwY?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517976487502-5f71bbd19330?auto=format&fit=crop&w=1200&q=80',
    source: 'Orbital Broadcast',
    author: 'Space Exploration Network',
    platform: 'youtube',
    viewsCount: 8940000,
    likesCount: 780000,
    duration: '03:15',
    pubDate: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    category: 'Science',
    tags: ['#SpaceX', '#Starship', '#RocketLaunch', '#EngineeringMarvel', '#SpaceFlight'],
    seoKeywords: ['spacex starship booster catch slow motion', 'super heavy chopstick catch footage'],
    slug: 'starship-booster-precision-tower-catch-slow-motion',
    metaDescription: 'Watch ultra-high-definition slow-motion footage of the historic Super Heavy rocket booster tower catch.',
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 98,
    aiTakeaway: 'Full rocket reusability enables a projected 90% reduction in orbital payload costs.',
    hindiTitle: 'स्टारशिप रॉकेट बूस्टर का ऐतिहासिक कैच - 4K स्लो मोशन वीडियो',
    hindiDescription: 'लॉन्च टॉवर द्वारा रॉकेट बूस्टर को सफलतापूर्वक पकड़े जाने का अद्भुत दृश्य।'
  },
  {
    id: 'vid-deepseek-open-source-ai',
    title: 'Inside the Open-Weights Reasoning AI Revolution: How Deep Models Outperform Giants',
    description: 'Deep-dive technical breakdown of mixture-of-experts (MoE) reasoning architectures and how open models are decentralizing frontier AI capabilities worldwide.',
    videoUrl: 'https://www.youtube.com/watch?v=z8XyD_kQZkY',
    embedUrl: 'https://www.youtube-nocookie.com/embed/z8XyD_kQZkY?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    source: 'AI Explained Wire',
    author: 'Frontier AI Research',
    platform: 'youtube',
    viewsCount: 3420000,
    likesCount: 245000,
    duration: '11:24',
    pubDate: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    category: 'Tech',
    tags: ['#OpenSourceAI', '#MachineLearning', '#ReasoningModels', '#DeepSeek', '#AIRevolution'],
    seoKeywords: ['open source reasoning models', 'mixture of experts architecture'],
    slug: 'open-weights-reasoning-ai-architecture-breakdown',
    metaDescription: 'Technical analysis of next-generation mixture-of-experts reasoning AI models.',
    sentiment: 'Analysis',
    isViralTrend: true,
    viralScore: 97,
    aiTakeaway: 'Open-weights reasoning models show compute efficiency gains exceeding 60%.',
    hindiTitle: 'ओपन-सोर्स एआई क्रांति: कैसे नए मॉडल बड़ी कंपनियों को पछाड़ रहे हैं',
    hindiDescription: 'आर्टिफिशियल इंटेलिजेंस और रीज़निंग मॉडल्स का विस्तृत विश्लेषण।'
  },
  {
    id: 'vid-wholesome-golden-retriever-baby',
    title: 'Golden Retriever Gently Teaches Toddler How to Walk Across Living Room',
    description: 'Heartwarming viral video of an ultra-patient golden retriever matching step-for-step alongside a 10-month-old baby learning to walk.',
    videoUrl: 'https://www.youtube.com/watch?v=7X8II6J-6mU',
    embedUrl: 'https://www.youtube-nocookie.com/embed/7X8II6J-6mU?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=80',
    source: 'Reddit /r/aww',
    author: 'HappyPaws Daily',
    platform: 'reddit',
    viewsCount: 6540000,
    likesCount: 520000,
    duration: '01:22',
    pubDate: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    category: 'Humor',
    tags: ['#Wholesome', '#GoldenRetriever', '#CuteAnimals', '#ViralPet', '#Heartwarming'],
    seoKeywords: ['golden retriever helps baby walk', 'wholesome viral dog video'],
    slug: 'golden-retriever-teaches-toddler-to-walk-wholesome',
    metaDescription: 'Heartwarming viral clip of a patient golden retriever gently supporting a toddler taking their first steps.',
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 96,
    aiTakeaway: 'Captures universal human-canine empathy, generating peak engagement.',
    hindiTitle: 'गोल्डन रिट्रीवर ने छोटे बच्चे को चलना सिखाया - दिल छू लेने वाला वीडियो',
    hindiDescription: 'सोशल मीडिया पर करोड़ों लोगों का दिल जीतने वाला प्यारा वीडियो।'
  },
  {
    id: 'vid-drone-volcano-eruption-iceland',
    title: 'Custom FPV Drone Flies Inside Active Volcanic Lava Fissure in Iceland',
    description: 'High-speed FPV racing drone dives directly into molten magma fountain spewing hundreds of feet into the night sky.',
    videoUrl: 'https://www.youtube.com/watch?v=AXqn_q_mKGE',
    embedUrl: 'https://www.youtube-nocookie.com/embed/AXqn_q_mKGE?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
    source: 'Vimeo Staff Picks',
    author: 'Nordic Cinema Collective',
    platform: 'vimeo',
    viewsCount: 3120000,
    likesCount: 280000,
    duration: '02:50',
    pubDate: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    category: 'Viral',
    tags: ['#Volcano', '#FPVDrone', '#Iceland', '#LavaFlow', '#Cinematography'],
    seoKeywords: ['fpv drone inside volcano eruption iceland', 'extreme lava drone 4k video'],
    slug: 'fpv-drone-flies-inside-active-volcano-iceland',
    metaDescription: 'Incredible FPV drone flight diving directly through active molten lava fountains in Iceland.',
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 94,
    aiTakeaway: 'FPV cinematographers utilized custom heat-resistant carbon-fiber framing.',
    hindiTitle: 'आइसलैंड में उबलते ज्वालामुखी के अंदर ड्रोन की उड़ान - 4K दृश्य',
    hindiDescription: 'धधकते लावे के ऊपर ड्रोन की हैरतअंगेज रिकॉर्डिंग।'
  },
  {
    id: 'vid-crazy-optical-illusion-sculpture',
    title: 'Mind-Bending 3D Ambiguous Kinetic Sculpture Changes Shape When Rotated',
    description: 'Viral optical illusion artwork where an impossible geometric wireframe morphs seamlessly between three completely different silhouettes.',
    videoUrl: 'https://www.youtube.com/watch?v=0k_22wK93_Y',
    embedUrl: 'https://www.youtube-nocookie.com/embed/0k_22wK93_Y?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    source: 'TikTok Viral Discover',
    author: 'IllusionistArt',
    platform: 'tiktok',
    viewsCount: 7890000,
    likesCount: 640000,
    duration: '00:48',
    pubDate: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    category: 'Viral',
    tags: ['#OpticalIllusion', '#KineticArt', '#MindBlown', '#TikTokViral'],
    seoKeywords: ['impossible optical illusion sculpture', 'mind blowing 3d perspective art'],
    slug: 'mind-bending-3d-optical-illusion-kinetic-sculpture',
    metaDescription: 'Watch this mind-bending kinetic sculpture change shape entirely depending on perspective.',
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 96,
    aiTakeaway: 'Exploits visual perspective ambiguities in human depth perception.',
    hindiTitle: 'दिमाग को घुमा देने वाला ऑप्टिकल इल्यूजन - 3D कलाकृति',
    hindiDescription: 'घूमने पर अपना रूप बदल देने वाली अनोखी 3डी कला का वायरल वीडियो।'
  }
];

/**
 * Fetches viral videos from the server API with 24-hour decay pagination and automatic IndexedDB caching.
 */
export async function fetchViralVideos(params?: VideoFetchParams): Promise<ViralVideoResponse> {
  const queryParams = new URLSearchParams();
  if (params?.category && params.category !== 'All') queryParams.append('category', params.category);
  if (params?.platform && params.platform !== 'All') queryParams.append('platform', params.platform);
  if (params?.tag) queryParams.append('tag', params.tag);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.timeWindow && params.timeWindow !== 'all') queryParams.append('timeWindow', params.timeWindow);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));

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
      return data;
    }
  } catch (error) {
    console.warn('[VideoAPI] Server fetch failed, attempting IndexedDB / seed fallback:', error);
  }

  // Fallback to IndexedDB
  const cachedVideos = await loadViralVideosFromIndexedDb();
  let baseList = (cachedVideos && cachedVideos.length > 0) ? cachedVideos : CLIENT_EMERGENCY_SEEDS;

  const now = Date.now();
  let last24hCount = 0;
  let past48hCount = 0;
  let pastWeekCount = 0;
  let archiveCount = 0;

  baseList.forEach(v => {
    const ageMs = now - new Date(v.pubDate).getTime();
    if (ageMs <= 24 * 3600 * 1000) last24hCount++;
    else if (ageMs <= 48 * 3600 * 1000) past48hCount++;
    else if (ageMs <= 7 * 24 * 3600 * 1000) pastWeekCount++;
    else archiveCount++;
  });

  // Filter in memory
  let filtered = [...baseList];

  if (params?.timeWindow === '24h') {
    filtered = filtered.filter(v => (now - new Date(v.pubDate).getTime()) <= 24 * 3600 * 1000);
  } else if (params?.timeWindow === '48h') {
    filtered = filtered.filter(v => {
      const ageMs = now - new Date(v.pubDate).getTime();
      return ageMs > 24 * 3600 * 1000 && ageMs <= 48 * 3600 * 1000;
    });
  } else if (params?.timeWindow === 'week') {
    filtered = filtered.filter(v => {
      const ageMs = now - new Date(v.pubDate).getTime();
      return ageMs > 48 * 3600 * 1000 && ageMs <= 7 * 24 * 3600 * 1000;
    });
  } else if (params?.timeWindow === 'archive') {
    filtered = filtered.filter(v => (now - new Date(v.pubDate).getTime()) > 7 * 24 * 3600 * 1000);
  }

  if (params?.category && params.category !== 'All') {
    filtered = filtered.filter(v => v.category.toLowerCase() === params.category!.toLowerCase());
  }
  if (params?.platform && params.platform !== 'All') {
    filtered = filtered.filter(v => v.platform.toLowerCase() === params.platform!.toLowerCase());
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
    // Default 24h prioritized sort
    filtered.sort((a, b) => {
      const ageA = now - new Date(a.pubDate).getTime();
      const ageB = now - new Date(b.pubDate).getTime();
      const tierA = ageA <= 24 * 3600 * 1000 ? 1 : ageA <= 48 * 3600 * 1000 ? 2 : ageA <= 7 * 24 * 3600 * 1000 ? 3 : 4;
      const tierB = ageB <= 24 * 3600 * 1000 ? 1 : ageB <= 48 * 3600 * 1000 ? 2 : ageB <= 7 * 24 * 3600 * 1000 ? 3 : 4;

      if (tierA !== tierB) return tierA - tierB;
      return (b.viralScore || 0) - (a.viralScore || 0);
    });
  }

  // Build tag counts
  const tagMap: Record<string, number> = {};
  const platformMap: Record<string, number> = {};
  const categoryMap: Record<string, number> = {};

  baseList.forEach(v => {
    v.tags.forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; });
    platformMap[v.platform] = (platformMap[v.platform] || 0) + 1;
    categoryMap[v.category] = (categoryMap[v.category] || 0) + 1;
  });

  const trendingTags = Object.entries(tagMap)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  return {
    videos: filtered,
    totalVideos: filtered.length,
    lastScrapedAt: new Date().toISOString(),
    trendingTags,
    platformBreakdown: platformMap,
    categoryBreakdown: categoryMap,
    timeWindowBreakdown: {
      last24h: last24hCount,
      past48h: past48hCount,
      pastWeek: pastWeekCount,
      archive: archiveCount,
    }
  };
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
