/**
 * Utility functions to extract, clean, and resolve direct specific article URLs
 * for scraped news items, avoiding root homepages and Google News redirects.
 */

export function isRootOrHomepageUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return true;
  try {
    const parsed = new URL(urlStr);
    const path = parsed.pathname.toLowerCase().replace(/\/$/, '');
    if (
      path === '' ||
      path === '/' ||
      path === '/news' ||
      path === '/home' ||
      path === '/index.html' ||
      path === '/index.php'
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

const SOURCE_DOMAIN_MAP: Record<string, string> = {
  'BBC News': 'bbc.com',
  'TechCrunch': 'techcrunch.com',
  'Hacker News': 'news.ycombinator.com',
  'NPR Top Stories': 'npr.org',
  'NPR Health': 'npr.org',
  'The Verge': 'theverge.com',
  'ScienceDaily': 'sciencedaily.com',
  'Google News Business': 'bloomberg.com',
  'Google News Sports': 'espn.com',
  'Google News': 'reuters.com',
  'Reuters': 'reuters.com',
  'Bloomberg': 'bloomberg.com',
  'ESPN': 'espn.com',
  'NDTV News': 'ndtv.com',
  'Times of India': 'timesofindia.indiatimes.com',
  'The Hindu': 'thehindu.com',
  'Indian Express': 'indianexpress.com',
  'Hindustan Times': 'hindustantimes.com',
  'Livemint': 'livemint.com',
  'Google News India': 'news.google.com',
};

export function extractDomainFromSource(sourceName?: string, rawUrl?: string): string {
  if (sourceName && SOURCE_DOMAIN_MAP[sourceName]) {
    return SOURCE_DOMAIN_MAP[sourceName];
  }
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname.replace(/^www\./, '');
      if (host && host !== 'news.google.com') {
        return host;
      }
    } catch {
      // Ignore
    }
  }
  return 'google.com';
}

/**
 * Extracts embedded direct link from RSS description HTML or cleans up Google News / Homepage links.
 */
export function resolveCleanArticleLink(
  rawLink?: string,
  rawGuid?: string,
  rawDescriptionHtml?: string,
  sourceName?: string,
  title?: string
): string {
  // 1. Try to extract direct publisher link from description HTML <a href="...">
  if (rawDescriptionHtml && typeof rawDescriptionHtml === 'string') {
    const hrefMatches = rawDescriptionHtml.match(/href=["'](https?:\/\/[^"']+)["']/gi);
    if (hrefMatches) {
      for (const match of hrefMatches) {
        const urlMatch = match.match(/href=["'](https?:\/\/[^"']+)["']/i);
        if (urlMatch && urlMatch[1]) {
          const cand = urlMatch[1].trim();
          if (
            cand.startsWith('http') &&
            !cand.includes('news.google.com') &&
            !cand.includes('rss2json.com') &&
            !cand.includes('allorigins.win') &&
            !cand.includes('codetabs.com') &&
            !cand.includes('corsproxy') &&
            !isRootOrHomepageUrl(cand)
          ) {
            return cand;
          }
        }
      }
    }
  }

  // 2. Check rawGuid if it is a valid direct http(s) URL to a specific article
  if (
    rawGuid &&
    typeof rawGuid === 'string' &&
    rawGuid.startsWith('http') &&
    !rawGuid.includes('news.google.com') &&
    !rawGuid.includes('rss2json.com') &&
    !isRootOrHomepageUrl(rawGuid)
  ) {
    return rawGuid.trim();
  }

  // 3. Check rawLink if it is a valid direct article link (not Google News and not homepage)
  if (
    rawLink &&
    typeof rawLink === 'string' &&
    rawLink.startsWith('http') &&
    !rawLink.includes('news.google.com') &&
    !rawLink.includes('rss2json.com') &&
    !isRootOrHomepageUrl(rawLink)
  ) {
    return rawLink.trim();
  }

  // 4. Fallback: If link is a Google News redirect URL or root homepage URL, construct direct search redirect to exact story
  const cleanTitle = (title || '').replace(/["']/g, '').trim();
  const domain = extractDomainFromSource(sourceName, rawLink);

  if (cleanTitle) {
    // Uses Google's "I'm Feeling Lucky" parameter (&btnI=1) to land directly on the specific article on the source website
    return `https://www.google.com/search?q=site:${encodeURIComponent(domain)}+${encodeURIComponent(cleanTitle)}&btnI=1`;
  }

  return rawLink || `https://${domain}`;
}

/**
 * Runtime link helper for UI components (ArticleCard, ArticleModal, NewsCarousel)
 */
export function getCleanArticleLink(article: {
  link: string;
  source: string;
  title: string;
  description?: string;
}): string {
  if (!article || !article.link) return '#';

  const link = article.link.trim();
  const isGoogleNews = link.includes('news.google.com');
  const isHomepage = isRootOrHomepageUrl(link);

  if (!isGoogleNews && !isHomepage) {
    return link;
  }

  // Handle Google News / homepage links dynamically
  return resolveCleanArticleLink(link, undefined, article.description, article.source, article.title);
}
