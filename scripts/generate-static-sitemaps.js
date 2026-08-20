#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const baseUrl = process.env.SITE_URL || 'https://newspulsar.site';
const todayIso = new Date().toISOString();
const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 1. Load Stored Articles
let articles = [];
const articlesDbPath = path.join(rootDir, 'scraped_articles_db.json');
try {
  if (fs.existsSync(articlesDbPath)) {
    const raw = fs.readFileSync(articlesDbPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      articles = parsed;
    }
  }
} catch (e) {
  console.warn('Could not read scraped_articles_db.json:', e.message);
}

// Fallback seed articles if empty
if (articles.length === 0) {
  articles = [
    {
      id: 'breaking-global-ai-summit-2026',
      title: 'Global AI Summit 2026: Groundbreaking Breakthroughs in Autonomous Intelligence',
      category: 'Technology',
      pubDate: todayIso,
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      description: 'World leaders and tech visionaries convene to establish next-generation AI alignment and computing frameworks.',
      tags: ['AI', 'Tech', 'Innovation'],
      seoKeywords: ['AI Summit', 'Artificial Intelligence', 'Tech News']
    },
    {
      id: 'world-renewable-energy-milestone',
      title: 'Global Clean Energy Transition Reaches Historic Capacity Record',
      category: 'Science',
      pubDate: todayIso,
      imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
      description: 'Renewable solar and wind generation exceeds fossil baseline in unprecedented global shift.',
      tags: ['Energy', 'Climate', 'Science'],
      seoKeywords: ['Clean Energy', 'Solar', 'Wind Power']
    }
  ];
}

// 2. Load Stored Viral Videos
let videos = [];
const videosDbPath = path.join(rootDir, 'scraped_viral_videos_db.json');
try {
  if (fs.existsSync(videosDbPath)) {
    const raw = fs.readFileSync(videosDbPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      videos = parsed;
    }
  }
} catch (e) {
  console.warn('Could not read scraped_viral_videos_db.json:', e.message);
}

if (videos.length === 0) {
  videos = [
    {
      id: 'viral-ai-breakthrough-demo',
      title: 'Next-Gen Autonomous Robotics & Reasoning Demo',
      description: 'Witness state-of-the-art vision reasoning and real-time physical task completion.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
      embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      pubDate: todayIso,
      category: 'Tech',
      viewsCount: 1542000,
      tags: ['Robotics', 'AI', 'Future']
    }
  ];
}

// --- GENERATE SITEMAP.XML ---
const corePages = [
  { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'always' },
  { loc: `${baseUrl}/#videos`, priority: '0.9', changefreq: 'hourly' },
  { loc: `${baseUrl}/#breaking`, priority: '0.9', changefreq: 'always' },
  { loc: `${baseUrl}/#categories`, priority: '0.8', changefreq: 'hourly' }
];

const categorySlugs = ['World', 'Business', 'Technology', 'Science', 'Health', 'Entertainment', 'Sports'];
categorySlugs.forEach(cat => {
  corePages.push({
    loc: `${baseUrl}/?category=${encodeURIComponent(cat)}`,
    priority: '0.85',
    changefreq: 'hourly'
  });
});

const corePagesXml = corePages.map(p => `  <url>
    <loc>${escapeXml(p.loc)}</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');

const articleUrlsXml = articles.map(art => {
  let pubFormatted = todayIso;
  try {
    pubFormatted = art.pubDate ? new Date(art.pubDate).toISOString() : todayIso;
  } catch {}

  const isRecent = art.pubDate ? new Date(art.pubDate).getTime() >= twoDaysAgo : false;
  const articleUrl = `${baseUrl}/?article=${encodeURIComponent(art.id)}`;

  let newsBlock = '';
  if (isRecent) {
    const keywords = [art.category, ...(art.tags || []), ...(art.seoKeywords || [])].filter(Boolean).slice(0, 5).join(', ');
    newsBlock = `
    <news:news>
      <news:publication>
        <news:name>NewsPulsar</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubFormatted}</news:publication_date>
      <news:title>${escapeXml(art.title)}</news:title>${keywords ? `
      <news:keywords>${escapeXml(keywords)}</news:keywords>` : ''}
    </news:news>`;
  }

  let imageBlock = '';
  if (art.imageUrl) {
    imageBlock = `
    <image:image>
      <image:loc>${escapeXml(art.imageUrl)}</image:loc>
      <image:title>${escapeXml(art.title)}</image:title>
    </image:image>`;
  }

  return `  <url>
    <loc>${escapeXml(articleUrl)}</loc>
    <lastmod>${pubFormatted}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.80</priority>${newsBlock}${imageBlock}
  </url>`;
}).join('\n');

const mainSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${corePagesXml}
${articleUrlsXml}
</urlset>`.trim();

// --- GENERATE NEWS-SITEMAP.XML ---
let eligibleNewsArticles = articles.filter(a => a.pubDate && new Date(a.pubDate).getTime() >= twoDaysAgo);
if (eligibleNewsArticles.length === 0) {
  eligibleNewsArticles = articles.slice(0, 100);
}

const newsSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${eligibleNewsArticles.map(art => {
  let pubFormatted = todayIso;
  try {
    pubFormatted = art.pubDate ? new Date(art.pubDate).toISOString() : todayIso;
  } catch {}
  const articleUrl = `${baseUrl}/?article=${encodeURIComponent(art.id)}`;
  const keywords = [art.category, ...(art.tags || []), ...(art.seoKeywords || [])].filter(Boolean).slice(0, 5).join(', ');
  let img = art.imageUrl ? `
    <image:image>
      <image:loc>${escapeXml(art.imageUrl)}</image:loc>
      <image:title>${escapeXml(art.title)}</image:title>
    </image:image>` : '';

  return `  <url>
    <loc>${escapeXml(articleUrl)}</loc>
    <lastmod>${pubFormatted}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.95</priority>
    <news:news>
      <news:publication>
        <news:name>NewsPulsar</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubFormatted}</news:publication_date>
      <news:title>${escapeXml(art.title)}</news:title>${keywords ? `
      <news:keywords>${escapeXml(keywords)}</news:keywords>` : ''}
    </news:news>${img}
  </url>`;
}).join('\n')}
</urlset>`.trim();

// --- GENERATE VIDEO-SITEMAP.XML ---
const videoSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${videos.map(v => {
  const safeTitle = (v.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const safeDesc = (v.metaDescription || v.description || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const tagsXml = (v.tags || []).slice(0, 8).map(t => `<video:tag><![CDATA[${t.replace('#', '')}]]></video:tag>`).join('\n        ');

  return `  <url>
    <loc>${baseUrl}/#videos?video=${encodeURIComponent(v.id)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(v.thumbnailUrl)}</video:thumbnail_loc>
      <video:title>${safeTitle}</video:title>
      <video:description>${safeDesc}</video:description>
      <video:player_loc allow_embed="yes" autoplay="ap=1">${escapeXml(v.embedUrl)}</video:player_loc>
      <video:publication_date>${new Date(v.pubDate || todayIso).toISOString()}</video:publication_date>
      <video:category>${escapeXml(v.category || 'Viral')}</video:category>
      <video:view_count>${v.viewsCount || 10000}</video:view_count>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
      ${tagsXml}
    </video:video>
  </url>`;
}).join('\n')}
</urlset>`.trim();

// --- GENERATE SITEMAP_INDEX.XML ---
const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${todayIso}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/news-sitemap.xml</loc>
    <lastmod>${todayIso}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/video-sitemap.xml</loc>
    <lastmod>${todayIso}</lastmod>
  </sitemap>
</sitemapindex>`.trim();

// --- GENERATE ROBOTS.TXT ---
const robotsTxt = `User-agent: *
Allow: /

User-agent: Mediapartners-Google
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Google-Display-Ads-Bot
Allow: /

User-agent: Googlebot-News
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Googlebot-Video
Allow: /

Sitemap: ${baseUrl}/sitemap_index.xml
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/news-sitemap.xml
Sitemap: ${baseUrl}/video-sitemap.xml
`;

// --- GENERATE FEED.XML ---
const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NewsPulsar - Global News &amp; AI Analysis</title>
    <link>${baseUrl}</link>
    <description>Live automated news aggregator, Google News feed and Gemini AI summarizer</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${articles.slice(0, 50).map(art => `
    <item>
      <title><![CDATA[${art.title}]]></title>
      <link>${art.link || `${baseUrl}/?article=${encodeURIComponent(art.id)}`}</link>
      <guid isPermaLink="false">${art.id}</guid>
      <pubDate>${new Date(art.pubDate || todayIso).toUTCString()}</pubDate>
      <description><![CDATA[${art.aiSummary?.whyItMatters || art.description}]]></description>
      <category>${art.category || 'General'}</category>
    </item>`).join('')}
  </channel>
</rss>`;

const adsTxt = 'google.com, pub-6411773855584982, DIRECT, f08c47fec0942fa0\n';
const googleVerifyHtml = 'google-site-verification: googled43dd531c722dedd.html\n';

// Write to public/ and dist/
const targetDirs = [path.join(rootDir, 'public'), path.join(rootDir, 'dist')];

targetDirs.forEach(dir => {
  if (dir.endsWith('public') || fs.existsSync(dir)) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'sitemap.xml'), mainSitemapXml, 'utf-8');
    fs.writeFileSync(path.join(dir, 'news-sitemap.xml'), newsSitemapXml, 'utf-8');
    fs.writeFileSync(path.join(dir, 'video-sitemap.xml'), videoSitemapXml, 'utf-8');
    fs.writeFileSync(path.join(dir, 'sitemap_index.xml'), sitemapIndexXml, 'utf-8');
    fs.writeFileSync(path.join(dir, 'robots.txt'), robotsTxt, 'utf-8');
    fs.writeFileSync(path.join(dir, 'feed.xml'), rssXml, 'utf-8');
    fs.writeFileSync(path.join(dir, 'ads.txt'), adsTxt, 'utf-8');
    fs.writeFileSync(path.join(dir, 'googled43dd531c722dedd.html'), googleVerifyHtml, 'utf-8');
    console.log(`[Static SEO Generator] ✅ Wrote all sitemaps, feeds & robots.txt to ${dir}`);
  }
});

console.log(`[Static SEO Generator] Successfully processed ${articles.length} articles, ${videos.length} videos for base URL: ${baseUrl}`);
