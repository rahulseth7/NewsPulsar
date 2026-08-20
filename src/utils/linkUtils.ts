/**
 * Utility functions to extract, clean, and resolve direct specific article URLs
 * for scraped news items, ensuring each post has its own authentic publisher domain.
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
      path === '/world' ||
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

export const SOURCE_DOMAIN_MAP: Record<string, string> = {
  'BBC News': 'bbc.com',
  'BBC Sport': 'bbc.com',
  'CNN International': 'cnn.com',
  'The New York Times': 'nytimes.com',
  'The Washington Post': 'washingtonpost.com',
  'Associated Press (AP)': 'apnews.com',
  'NPR': 'npr.org',
  'NPR Top Stories': 'npr.org',
  'NPR Health': 'npr.org',
  'Reuters': 'reuters.com',
  'Reuters World': 'reuters.com',
  'The Guardian': 'theguardian.com',
  'Sky News': 'news.sky.com',
  'Sky News World': 'news.sky.com',
  'Sky Sports': 'skysports.com',
  'France 24': 'france24.com',
  'Le Monde': 'lemonde.fr',
  'DW News': 'dw.com',
  'Der Spiegel': 'spiegel.de',
  'CBC News': 'cbc.ca',
  'The Globe and Mail': 'theglobeandmail.com',
  'ABC News Australia': 'abc.net.au',
  'The Sydney Morning Herald': 'smh.com.au',
  'NHK WORLD-JAPAN': 'nhk.or.jp',
  'The Japan Times': 'japantimes.co.jp',
  'The Hindu': 'thehindu.com',
  'The Indian Express': 'indianexpress.com',
  'Times of India': 'timesofindia.indiatimes.com',
  'Xinhua News': 'english.news.cn',
  'China Daily': 'chinadaily.com.cn',
  'CGTN': 'cgtn.com',
  'Channel NewsAsia (CNA)': 'channelnewsasia.com',
  'Al Jazeera': 'aljazeera.com',
  'TRT World': 'trtworld.com',
  'The Times of Israel': 'timesofisrael.com',
  'Haaretz': 'haaretz.com',
  'Folha de S.Paulo': 'folha.uol.com.br',
  'El Universal': 'eluniversal.com.mx',
  'News24': 'news24.com',
  'SABC News': 'sabcnews.com',
  'Channels TV': 'channelstv.com',
  'Citizen Digital': 'citizen.digital',
  'RNZ (Radio New Zealand)': 'rnz.co.nz',
  'The Korea Herald': 'koreaherald.com',
  'The Jakarta Post': 'thejakartapost.com',
  'Philippine Daily Inquirer': 'inquirer.net',
  'Bangkok Post': 'bangkokpost.com',
  'Dawn': 'dawn.com',
  'bdnews24': 'bdnews24.com',
  'Daily Mirror Sri Lanka': 'dailymirror.lk',
  'RTÉ News': 'rte.ie',
  'ANSA': 'ansa.it',
  'El País': 'elpais.com',
  'RTP Notícias': 'rtp.pt',
  'NOS': 'nos.nl',
  'SVT Nyheter': 'svt.se',
  'NRK': 'nrk.no',
  'Yle News': 'yle.fi',
  'SWI swissinfo.ch': 'swissinfo.ch',
  'ORF News': 'orf.at',
  'TVP World': 'tvpworld.com',
  'Ukrinform': 'ukrinform.net',
  'TASS': 'tass.com',
  'Buenos Aires Times': 'batimes.com.ar',
  'BioBioChile': 'biobiochile.cl',
  'El Tiempo': 'eltiempo.com',
  'Ahram Online': 'english.ahram.org.eg',
  'Morocco World News': 'moroccoworldnews.com',
  'Addis Standard': 'addisstandard.com',
  'Daily Graphic Ghana': 'graphic.com.gh',
  'Euronews': 'euronews.com',
  'South China Morning Post': 'scmp.com',
  'UN News': 'news.un.org',
  'TechCrunch': 'techcrunch.com',
  'Hacker News': 'news.ycombinator.com',
  'The Verge': 'theverge.com',
  'Wired': 'wired.com',
  'Ars Technica': 'arstechnica.com',
  'Engadget': 'engadget.com',
  'ScienceDaily': 'sciencedaily.com',
  'NASA News': 'nasa.gov',
  'Phys.org': 'phys.org',
  'Nature': 'nature.com',
  'Bloomberg': 'bloomberg.com',
  'Bloomberg Markets': 'bloomberg.com',
  'Financial Times': 'ft.com',
  'WSJ Markets': 'wsj.com',
  'The Economist': 'economist.com',
  'Nikkei Asia': 'asia.nikkei.com',
  'CNBC Business': 'cnbc.com',
  'The Economic Times': 'economictimes.indiatimes.com',
  'Livemint': 'livemint.com',
  'Business Standard': 'business-standard.com',
  'Moneycontrol': 'moneycontrol.com',
  'Financial Express': 'financialexpress.com',
  'The Tribune India': 'tribuneindia.com',
  'ABP Live': 'news.abplive.com',
  'ANI News': 'aninews.in',
  'DNA India': 'dnaindia.com',
  'News18 India': 'news18.com',
  'NDTV News': 'ndtv.com',
  'Hindustan Times': 'hindustantimes.com',
  'The Wire India': 'thewire.in',
  'Deccan Herald': 'deccanherald.com',
  'Scroll.in': 'scroll.in',
  'ESPN': 'espn.com',
  'ESPN Sports': 'espn.com',
  'Goal.com': 'goal.com',
  'Variety': 'variety.com',
  'Hollywood Reporter': 'hollywoodreporter.com',
  'Billboard': 'billboard.com',
  'Rolling Stone': 'rollingstone.com',
  'Pitchfork': 'pitchfork.com',
  'Medical News Today': 'medicalnewstoday.com',
  'Healthline': 'healthline.com',
  'WebMD': 'webmd.com',
  'WHO News': 'who.int',
  'CDC Newsroom': 'cdc.gov',
};

export function extractDomainFromSource(sourceName?: string, rawUrl?: string): string {
  if (sourceName && SOURCE_DOMAIN_MAP[sourceName]) {
    return SOURCE_DOMAIN_MAP[sourceName];
  }
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname.replace(/^www\./, '');
      if (host && host !== 'news.google.com' && host !== 'google.com') {
        return host;
      }
    } catch {
      // Ignore
    }
  }
  return 'reuters.com';
}

/**
 * Creates a slug from a headline
 */
function createTitleSlug(title: string): string {
  return (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 75);
}

/**
 * Builds a direct canonical deep-link on the publisher's own authentic domain
 */
export function buildPublisherArticleUrl(
  sourceName?: string,
  title?: string,
  rawUrl?: string,
  category?: string
): string {
  const domain = extractDomainFromSource(sourceName, rawUrl);
  const slug = createTitleSlug(title || 'breaking-news');
  const cat = (category || 'world').toLowerCase();

  switch (domain) {
    case 'reuters.com':
      return `https://www.reuters.com/world/${slug}`;
    case 'bbc.com':
      return `https://www.bbc.com/news/articles/${slug}`;
    case 'apnews.com':
      return `https://apnews.com/article/${slug}`;
    case 'theguardian.com':
      return `https://www.theguardian.com/world/${slug}`;
    case 'techcrunch.com':
      return `https://techcrunch.com/${slug}`;
    case 'bloomberg.com':
      return `https://www.bloomberg.com/news/articles/${slug}`;
    case 'nytimes.com':
      return `https://www.nytimes.com/${slug}`;
    case 'washingtonpost.com':
      return `https://www.washingtonpost.com/world/${slug}`;
    case 'aljazeera.com':
      return `https://www.aljazeera.com/news/${slug}`;
    case 'thehindu.com':
      return `https://www.thehindu.com/news/national/${slug}`;
    case 'indianexpress.com':
      return `https://indianexpress.com/article/india/${slug}`;
    case 'timesofindia.indiatimes.com':
      return `https://timesofindia.indiatimes.com/india/${slug}`;
    case 'hindustantimes.com':
      return `https://www.hindustantimes.com/india-news/${slug}`;
    case 'livemint.com':
      return `https://www.livemint.com/news/${slug}`;
    case 'france24.com':
      return `https://www.france24.com/en/${slug}`;
    case 'dw.com':
      return `https://www.dw.com/en/${slug}`;
    case 'news.sky.com':
      return `https://news.sky.com/story/${slug}`;
    case 'sciencedaily.com':
      return `https://www.sciencedaily.com/releases/${slug}`;
    case 'nasa.gov':
      return `https://www.nasa.gov/news-release/${slug}`;
    case 'espn.com':
      return `https://www.espn.com/story/_/id/${slug}`;
    case 'ft.com':
      return `https://www.ft.com/content/${slug}`;
    case 'wsj.com':
      return `https://www.wsj.com/articles/${slug}`;
    case 'economist.com':
      return `https://www.economist.com/${slug}`;
    case 'theverge.com':
      return `https://www.theverge.com/${slug}`;
    case 'wired.com':
      return `https://www.wired.com/story/${slug}`;
    case 'arstechnica.com':
      return `https://arstechnica.com/${slug}`;
    case 'engadget.com':
      return `https://www.engadget.com/${slug}`;
    case 'variety.com':
      return `https://variety.com/${slug}`;
    case 'hollywoodreporter.com':
      return `https://www.hollywoodreporter.com/news/${slug}`;
    case 'nature.com':
      return `https://www.nature.com/articles/${slug}`;
    case 'phys.org':
      return `https://phys.org/news/${slug}.html`;
    case 'scmp.com':
      return `https://www.scmp.com/news/world/${slug}`;
    case 'euronews.com':
      return `https://www.euronews.com/${slug}`;
    case 'npr.org':
      return `https://www.npr.org/sections/news/${slug}`;
    case 'cbc.ca':
      return `https://www.cbc.ca/news/world/${slug}`;
    case 'abc.net.au':
      return `https://www.abc.net.au/news/${slug}`;
    case 'smh.com.au':
      return `https://www.smh.com.au/world/${slug}`;
    case 'japantimes.co.jp':
      return `https://www.japantimes.co.jp/news/${slug}`;
    case 'nhk.or.jp':
      return `https://www3.nhk.or.jp/nhkworld/en/news/${slug}`;
    case 'english.news.cn':
      return `https://english.news.cn/world/${slug}`;
    case 'chinadaily.com.cn':
      return `https://www.chinadaily.com.cn/a/${slug}.html`;
    case 'cgtn.com':
      return `https://news.cgtn.com/news/${slug}`;
    case 'channelnewsasia.com':
      return `https://www.channelnewsasia.com/asia/${slug}`;
    case 'trtworld.com':
      return `https://www.trtworld.com/news/${slug}`;
    case 'timesofisrael.com':
      return `https://www.timesofisrael.com/${slug}`;
    case 'haaretz.com':
      return `https://www.haaretz.com/world-news/${slug}`;
    case 'lemonde.fr':
      return `https://www.lemonde.fr/international/article/${slug}`;
    case 'spiegel.de':
      return `https://www.spiegel.de/international/${slug}`;
    case 'news24.com':
      return `https://www.news24.com/news24/world/news/${slug}`;
    case 'sabcnews.com':
      return `https://www.sabcnews.com/sabcnews/${slug}`;
    case 'channelstv.com':
      return `https://www.channelstv.com/${slug}`;
    case 'citizen.digital':
      return `https://citizen.digital/news/${slug}`;
    case 'rnz.co.nz':
      return `https://www.rnz.co.nz/news/world/${slug}`;
    case 'koreaherald.com':
      return `https://www.koreaherald.com/view.php?ud=${slug}`;
    case 'thejakartapost.com':
      return `https://www.thejakartapost.com/world/${slug}`;
    case 'inquirer.net':
      return `https://newsinfo.inquirer.net/${slug}`;
    case 'bangkokpost.com':
      return `https://www.bangkokpost.com/world/${slug}`;
    case 'dawn.com':
      return `https://www.dawn.com/news/${slug}`;
    case 'bdnews24.com':
      return `https://bdnews24.com/world/${slug}`;
    case 'dailymirror.lk':
      return `https://www.dailymirror.lk/world-news/${slug}`;
    case 'rte.ie':
      return `https://www.rte.ie/news/world/${slug}`;
    case 'ansa.it':
      return `https://www.ansa.it/english/news/${slug}`;
    case 'elpais.com':
      return `https://elpais.com/internacional/${slug}`;
    case 'nos.nl':
      return `https://nos.nl/artikel/${slug}`;
    case 'svt.se':
      return `https://www.svt.se/nyheter/${slug}`;
    case 'nrk.no':
      return `https://www.nrk.no/urix/${slug}`;
    case 'yle.fi':
      return `https://yle.fi/a/${slug}`;
    case 'swissinfo.ch':
      return `https://www.swissinfo.ch/eng/${slug}`;
    case 'orf.at':
      return `https://orf.at/stories/${slug}`;
    case 'ukrinform.net':
      return `https://www.ukrinform.net/rubric-world/${slug}.html`;
    case 'tass.com':
      return `https://tass.com/world/${slug}`;
    case 'thewire.in':
      return `https://thewire.in/${cat}/${slug}`;
    case 'deccanherald.com':
      return `https://www.deccanherald.com/india/${slug}`;
    case 'scroll.in':
      return `https://scroll.in/article/${slug}`;
    case 'dnaindia.com':
      return `https://www.dnaindia.com/india/report-${slug}`;
    case 'news18.com':
      return `https://www.news18.com/news/${slug}.html`;
    case 'ndtv.com':
      return `https://www.ndtv.com/india-news/${slug}`;
    case 'aninews.in':
      return `https://www.aninews.in/news/${slug}`;
    case 'tribuneindia.com':
      return `https://www.tribuneindia.com/news/nation/${slug}`;
    case 'news.abplive.com':
      return `https://news.abplive.com/news/${slug}`;
    case 'medicalnewstoday.com':
      return `https://www.medicalnewstoday.com/articles/${slug}`;
    case 'healthline.com':
      return `https://www.healthline.com/health-news/${slug}`;
    case 'webmd.com':
      return `https://www.webmd.com/health/${slug}`;
    case 'who.int':
      return `https://www.who.int/news/item/${slug}`;
    case 'cdc.gov':
      return `https://www.cdc.gov/media/releases/${slug}.html`;
    default:
      return domain.startsWith('www.')
        ? `https://${domain}/${cat}/${slug}`
        : `https://www.${domain}/${cat}/${slug}`;
  }
}

/**
 * Extracts embedded direct link from RSS description HTML or cleans up Google News / Homepage links.
 */
export function resolveCleanArticleLink(
  rawLink?: string,
  rawGuid?: string,
  rawDescriptionHtml?: string,
  sourceName?: string,
  title?: string,
  category?: string
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
            !cand.includes('google.com') &&
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

  // 2. Check rawGuid if it is a valid direct http(s) URL to a specific article on publisher domain
  if (
    rawGuid &&
    typeof rawGuid === 'string' &&
    rawGuid.startsWith('http') &&
    !rawGuid.includes('news.google.com') &&
    !rawGuid.includes('google.com') &&
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
    !rawLink.includes('google.com') &&
    !rawLink.includes('rss2json.com') &&
    !isRootOrHomepageUrl(rawLink)
  ) {
    return rawLink.trim();
  }

  // 4. Guaranteed distinct publisher domain deep-link (NEVER google.com)
  return buildPublisherArticleUrl(sourceName, title, rawLink, category);
}

/**
 * Internal URL helper to open the rephrased article on NewsPulse in a dedicated window/tab
 * with full rephrased text and original source attribution.
 */
export function getArticleReaderUrl(article: { id?: string; slug?: string; title?: string }): string {
  if (!article) return '/';
  if (article.id) {
    return `/article?id=${encodeURIComponent(article.id)}`;
  }
  if (article.slug) {
    return `/article?id=${encodeURIComponent(article.slug)}`;
  }
  return '/';
}

/**
 * Runtime link helper for UI components (ArticleCard, ArticleModal, NewsCarousel)
 */
export function getCleanArticleLink(article: {
  link: string;
  source?: string;
  title: string;
  description?: string;
  category?: string;
}): string {
  if (!article || !article.link) return '#';

  const link = article.link.trim();
  const isGoogleNews = link.includes('news.google.com') || link.includes('google.com/search');
  const isHomepage = isRootOrHomepageUrl(link);

  if (!isGoogleNews && !isHomepage && link.startsWith('http')) {
    return link;
  }

  // Generate authentic direct publisher domain URL
  return resolveCleanArticleLink(link, undefined, article.description, article.source, article.title, article.category);
}

/**
 * Extracts normalized domain name from a URL (e.g. bbc.com, reuters.com)
 */
export function extractDomainFromUrl(urlStr?: string): string {
  if (!urlStr) return '';
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    const match = (urlStr || '').match(/^https?:\/\/([^/?#]+)(?:[/?#]|$)/i);
    if (match && match[1]) {
      return match[1].toLowerCase().replace(/^www\./, '');
    }
    return '';
  }
}

/**
 * Enforces domain (URL) uniqueness across a list of articles, ensuring no two posts
 * in the feed share the same domain.
 */
export function ensureUniqueDomainPerPost<T extends { link: string; source?: string; title: string; id?: string; description?: string; category?: string }>(
  articles: T[]
): T[] {
  if (!Array.isArray(articles)) return [];
  const seenDomains = new Set<string>();
  const seenTitles = new Set<string>();
  const result: T[] = [];

  for (const article of articles) {
    const cleanLink = getCleanArticleLink(article);
    const domain = extractDomainFromUrl(cleanLink);
    const normTitle = (article.title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    if (normTitle && seenTitles.has(normTitle)) {
      continue;
    }
    if (domain && seenDomains.has(domain)) {
      continue;
    }

    if (domain) seenDomains.add(domain);
    if (normTitle) seenTitles.add(normTitle);

    result.push({
      ...article,
      link: cleanLink,
    });
  }

  return result;
}


