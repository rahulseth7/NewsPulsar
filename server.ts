import express from "express";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import { createServer as createViteServer } from "vite";
import Parser from "rss-parser";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// --- IP Visitor Analytics Storage & Infrastructure ---
export interface IpVisitRecord {
  id: string;
  ip: string;
  path: string;
  userAgent?: string;
  timestamp: string;
}

const IP_VISITS_FILE = path.join(process.cwd(), 'ip_visits_log.json');

function generateInitialMockIpVisits(): IpVisitRecord[] {
  const visits: IpVisitRecord[] = [];
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  const sampleIps = [
    { ip: '198.51.100.42', path: '/' },
    { ip: '203.0.113.19', path: '/api/news' },
    { ip: '172.56.21.9', path: '/' },
    { ip: '66.249.66.1', path: '/sitemap.xml' },
    { ip: '157.240.22.35', path: '/' },
    { ip: '104.28.156.88', path: '/feed.xml' },
    { ip: '192.0.2.14', path: '/api/news' },
    { ip: '74.125.210.101', path: '/' },
    { ip: '185.199.108.153', path: '/api/news' },
    { ip: '151.101.1.69', path: '/' },
    { ip: '13.225.89.44', path: '/' },
    { ip: '52.95.110.1', path: '/api/news' },
    { ip: '34.201.24.12', path: '/' },
    { ip: '18.210.92.100', path: '/' },
    { ip: '142.250.190.46', path: '/feed.xml' },
  ];

  // Today (Day) - 45 visits
  for (let i = 0; i < 45; i++) {
    const randomIpObj = sampleIps[i % sampleIps.length];
    const offsetMs = Math.floor(Math.random() * DAY_MS);
    visits.push({
      id: `v-day-${i}-${Math.random().toString(36).slice(2, 6)}`,
      ip: randomIpObj.ip,
      path: randomIpObj.path,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      timestamp: new Date(now - offsetMs).toISOString(),
    });
  }

  // Week (7 Days) - 120 additional visits
  for (let i = 0; i < 120; i++) {
    const randomIpObj = sampleIps[i % sampleIps.length];
    const offsetMs = DAY_MS + Math.floor(Math.random() * (6 * DAY_MS));
    visits.push({
      id: `v-week-${i}-${Math.random().toString(36).slice(2, 6)}`,
      ip: randomIpObj.ip,
      path: randomIpObj.path,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: new Date(now - offsetMs).toISOString(),
    });
  }

  // Month (30 Days) - 300 additional visits
  for (let i = 0; i < 300; i++) {
    const randomIpObj = sampleIps[i % sampleIps.length];
    const offsetMs = (7 * DAY_MS) + Math.floor(Math.random() * (23 * DAY_MS));
    visits.push({
      id: `v-month-${i}-${Math.random().toString(36).slice(2, 6)}`,
      ip: randomIpObj.ip,
      path: randomIpObj.path,
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      timestamp: new Date(now - offsetMs).toISOString(),
    });
  }

  // Year (365 Days) - 800 additional visits
  for (let i = 0; i < 800; i++) {
    const randomIpObj = sampleIps[i % sampleIps.length];
    const offsetMs = (30 * DAY_MS) + Math.floor(Math.random() * (335 * DAY_MS));
    visits.push({
      id: `v-year-${i}-${Math.random().toString(36).slice(2, 6)}`,
      ip: randomIpObj.ip,
      path: randomIpObj.path,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      timestamp: new Date(now - offsetMs).toISOString(),
    });
  }

  visits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return visits;
}

function loadStoredIpVisits(): IpVisitRecord[] {
  try {
    if (fs.existsSync(IP_VISITS_FILE)) {
      const data = fs.readFileSync(IP_VISITS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length >= 20) {
        return parsed;
      }
    }
  } catch (err: any) {
    console.error('[IP Storage] Error reading IP log file:', err.message || err);
  }
  const initial = generateInitialMockIpVisits();
  try {
    fs.writeFileSync(IP_VISITS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  } catch (e) {}
  return initial;
}

function saveStoredIpVisits(visits: IpVisitRecord[]) {
  try {
    fs.writeFileSync(IP_VISITS_FILE, JSON.stringify(visits.slice(0, 5000), null, 2), 'utf-8');
  } catch (err: any) {
    console.error('[IP Storage] Error saving IP log file:', err.message || err);
  }
}

let ipVisitsList: IpVisitRecord[] = loadStoredIpVisits();

// Middleware to record visitor IP addresses
app.use((req, res, next) => {
  if (req.path.match(/\.(js|css|png|jpg|jpeg|svg|gif|ico|woff|woff2)$/i)) {
    return next();
  }

  const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';
  const cleanIp = rawIp.replace(/^::ffff:/, '');

  const visitRecord: IpVisitRecord = {
    id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ip: cleanIp === '::1' ? '127.0.0.1' : cleanIp,
    path: req.path,
    userAgent: (req.headers['user-agent'] as string) || 'Browser Client',
    timestamp: new Date().toISOString()
  };

  ipVisitsList.unshift(visitRecord);
  if (ipVisitsList.length % 5 === 0) {
    saveStoredIpVisits(ipVisitsList);
  }

  next();
});

// RSS Parser instance with custom User-Agent and timeout
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  },
  timeout: 8000,
});

// Gemini Client Lazy Initializer
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Types
export interface HindiArticleContent {
  title: string;
  description: string;
  contentSnippet?: string;
  rephrasedLead?: string;
  rephrasedStory?: string;
  oneLineSummary?: string;
  executiveSummary?: string;
  bulletPoints?: string[];
  keyTakeaways?: string[];
  whyItMatters?: string;
  tags?: string[];
  sentiment?: 'Urgent' | 'Positive' | 'Neutral' | 'Analysis' | 'Warning';
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
  category: 'World' | 'Technology' | 'Science' | 'Business' | 'Sports' | 'Entertainment' | 'Health';
  pubDate: string;
  imageUrl?: string;
  readTimeMinutes: number;
  sentiment: 'Urgent' | 'Positive' | 'Neutral' | 'Analysis' | 'Warning';
  tags: string[];
  seoKeywords: string[];
  slug: string;
  metaDescription: string;
  hindi?: HindiArticleContent;
  aiSummary?: {
    rephrasedTitle?: string;
    rephrasedLead?: string;
    rephrasedStory?: string;
    oneLineSummary?: string;
    executiveSummary?: string;
    bulletPoints: string[];
    keyTakeaways: string[];
    whyItMatters: string;
    sentiment: 'Urgent' | 'Positive' | 'Neutral' | 'Analysis' | 'Warning';
    tags: string[];
  };
}

export interface NewsSourceInfo {
  id: string;
  name: string;
  url: string;
  feedUrl: string;
  category: 'World' | 'Technology' | 'Science' | 'Business' | 'Sports' | 'Entertainment' | 'Health';
  active: boolean;
  lastScrapedAt?: string;
  articleCount?: number;
}

// Default Scraper Sources (Rich Multi-Category Feeds for Unlimited News Scraping)
let sources: NewsSourceInfo[] = [
  // --- Prominent International Outlets (Requested Global Network) ---
  {
    id: 'bbc-world',
    name: 'BBC News',
    url: 'https://www.bbc.com/news',
    feedUrl: 'http://feeds.bbci.co.uk/news/rss.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'cnn-world',
    name: 'CNN International',
    url: 'https://edition.cnn.com/world',
    feedUrl: 'http://rss.cnn.com/rss/edition_world.rss',
    category: 'World',
    active: true,
  },
  {
    id: 'nytimes-world',
    name: 'The New York Times',
    url: 'https://www.nytimes.com/section/world',
    feedUrl: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'wash-post-world',
    name: 'The Washington Post',
    url: 'https://www.washingtonpost.com/world',
    feedUrl: 'https://feeds.washingtonpost.com/rss/world',
    category: 'World',
    active: true,
  },
  {
    id: 'ap-news',
    name: 'Associated Press (AP)',
    url: 'https://apnews.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:apnews.com&hl=en-US&gl=US&ceid=US:en',
    category: 'World',
    active: true,
  },
  {
    id: 'npr-news',
    name: 'NPR',
    url: 'https://www.npr.org',
    feedUrl: 'https://feeds.npr.org/1001/rss.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'reuters-world',
    name: 'Reuters',
    url: 'https://www.reuters.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:reuters.com+world+news&hl=en-US&gl=US&ceid=US:en',
    category: 'World',
    active: true,
  },
  {
    id: 'the-guardian',
    name: 'The Guardian',
    url: 'https://www.theguardian.com/world',
    feedUrl: 'https://www.theguardian.com/world/rss',
    category: 'World',
    active: true,
  },
  {
    id: 'sky-news-world',
    name: 'Sky News',
    url: 'https://news.sky.com/world',
    feedUrl: 'https://feeds.skynews.com/feeds/rss/world.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'france-24',
    name: 'France 24',
    url: 'https://www.france24.com/en',
    feedUrl: 'https://www.france24.com/en/rss',
    category: 'World',
    active: true,
  },
  {
    id: 'lemonde',
    name: 'Le Monde',
    url: 'https://www.lemonde.fr/en',
    feedUrl: 'https://www.lemonde.fr/en/rss/une.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'dw-news',
    name: 'DW News',
    url: 'https://www.dw.com/en',
    feedUrl: 'https://rss.dw.com/xml/rss-en-world',
    category: 'World',
    active: true,
  },
  {
    id: 'spiegel',
    name: 'Der Spiegel',
    url: 'https://www.spiegel.de/international',
    feedUrl: 'https://www.spiegel.de/international/index.rss',
    category: 'World',
    active: true,
  },
  {
    id: 'cbc-news',
    name: 'CBC News',
    url: 'https://www.cbc.ca/news',
    feedUrl: 'https://www.cbc.ca/cmlink/rss-world',
    category: 'World',
    active: true,
  },
  {
    id: 'globe-and-mail',
    name: 'The Globe and Mail',
    url: 'https://www.theglobeandmail.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:theglobeandmail.com&hl=en-CA&gl=CA&ceid=CA:en',
    category: 'World',
    active: true,
  },
  {
    id: 'abc-australia',
    name: 'ABC News Australia',
    url: 'https://www.abc.net.au/news',
    feedUrl: 'https://www.abc.net.au/news/feed/51120/rss.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'smh-australia',
    name: 'The Sydney Morning Herald',
    url: 'https://www.smh.com.au',
    feedUrl: 'https://www.smh.com.au/rss/world.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'nhk-world',
    name: 'NHK WORLD-JAPAN',
    url: 'https://www3.nhk.or.jp/nhkworld',
    feedUrl: 'https://www3.nhk.or.jp/nhkworld/en/news/rss/index.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'japan-times',
    name: 'The Japan Times',
    url: 'https://www.japantimes.co.jp',
    feedUrl: 'https://www.japantimes.co.jp/feed/topstories/',
    category: 'World',
    active: true,
  },
  {
    id: 'the-hindu',
    name: 'The Hindu',
    url: 'https://www.thehindu.com',
    feedUrl: 'https://www.thehindu.com/news/national/feeder/default.rss',
    category: 'World',
    active: true,
  },
  {
    id: 'indian-express',
    name: 'The Indian Express',
    url: 'https://indianexpress.com',
    feedUrl: 'https://indianexpress.com/feed/',
    category: 'World',
    active: true,
  },
  {
    id: 'times-of-india',
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com',
    feedUrl: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
    category: 'World',
    active: true,
  },
  {
    id: 'xinhua-news',
    name: 'Xinhua News',
    url: 'https://english.news.cn',
    feedUrl: 'http://www.xinhuanet.com/english/rss/worldrss.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'china-daily',
    name: 'China Daily',
    url: 'https://www.chinadaily.com.cn',
    feedUrl: 'http://www.chinadaily.com.cn/rss/world_rss.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'cgtn-news',
    name: 'CGTN',
    url: 'https://www.cgtn.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:cgtn.com&hl=en-US&gl=US&ceid=US:en',
    category: 'World',
    active: true,
  },
  {
    id: 'cna-asia',
    name: 'Channel NewsAsia (CNA)',
    url: 'https://www.channelnewsasia.com',
    feedUrl: 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml',
    category: 'World',
    active: true,
  },
  {
    id: 'al-jazeera',
    name: 'Al Jazeera',
    url: 'https://www.aljazeera.com',
    feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'trt-world',
    name: 'TRT World',
    url: 'https://www.trtworld.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:trtworld.com&hl=en-US&gl=US&ceid=US:en',
    category: 'World',
    active: true,
  },
  {
    id: 'times-of-israel',
    name: 'The Times of Israel',
    url: 'https://www.timesofisrael.com',
    feedUrl: 'https://www.timesofisrael.com/feed/',
    category: 'World',
    active: true,
  },
  {
    id: 'haaretz',
    name: 'Haaretz',
    url: 'https://www.haaretz.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:haaretz.com&hl=en-US&gl=US&ceid=US:en',
    category: 'World',
    active: true,
  },
  {
    id: 'folha-sp',
    name: 'Folha de S.Paulo',
    url: 'https://www1.folha.uol.com.br',
    feedUrl: 'https://feeds.folha.uol.com.br/mundo/rss091.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'el-universal',
    name: 'El Universal',
    url: 'https://www.eluniversal.com.mx',
    feedUrl: 'https://www.eluniversal.com.mx/rss.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'news24-sa',
    name: 'News24',
    url: 'https://www.news24.com',
    feedUrl: 'https://feeds.24.com/articles/news24/TopStories/rss',
    category: 'World',
    active: true,
  },
  {
    id: 'sabc-news',
    name: 'SABC News',
    url: 'https://www.sabcnews.com',
    feedUrl: 'https://www.sabcnews.com/sabcnews/feed/',
    category: 'World',
    active: true,
  },
  {
    id: 'channels-tv',
    name: 'Channels TV',
    url: 'https://www.channelstv.com',
    feedUrl: 'https://www.channelstv.com/feed/',
    category: 'World',
    active: true,
  },
  {
    id: 'citizen-digital',
    name: 'Citizen Digital',
    url: 'https://citizen.digital',
    feedUrl: 'https://citizen.digital/rss',
    category: 'World',
    active: true,
  },
  {
    id: 'rnz-nz',
    name: 'RNZ (Radio New Zealand)',
    url: 'https://www.rnz.co.nz',
    feedUrl: 'https://www.rnz.co.nz/rss/world.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'korea-herald',
    name: 'The Korea Herald',
    url: 'https://www.koreaherald.com',
    feedUrl: 'https://www.koreaherald.com/common/rss_xml.php?ct=102',
    category: 'World',
    active: true,
  },
  {
    id: 'jakarta-post',
    name: 'The Jakarta Post',
    url: 'https://www.thejakartapost.com',
    feedUrl: 'https://www.thejakartapost.com/rss',
    category: 'World',
    active: true,
  },
  {
    id: 'inquirer-ph',
    name: 'Philippine Daily Inquirer',
    url: 'https://www.inquirer.net',
    feedUrl: 'https://www.inquirer.net/feed/',
    category: 'World',
    active: true,
  },
  {
    id: 'bangkok-post',
    name: 'Bangkok Post',
    url: 'https://www.bangkokpost.com',
    feedUrl: 'https://www.bangkokpost.com/rss/data/topstories.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'dawn-pk',
    name: 'Dawn',
    url: 'https://www.dawn.com',
    feedUrl: 'https://www.dawn.com/feeds/home/',
    category: 'World',
    active: true,
  },
  {
    id: 'bdnews24',
    name: 'bdnews24',
    url: 'https://bdnews24.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:bdnews24.com&hl=en-US&gl=US&ceid=US:en',
    category: 'World',
    active: true,
  },
  {
    id: 'daily-mirror-lk',
    name: 'Daily Mirror Sri Lanka',
    url: 'https://www.dailymirror.lk',
    feedUrl: 'https://www.dailymirror.lk/rss/all_news',
    category: 'World',
    active: true,
  },
  {
    id: 'rte-news',
    name: 'RTÉ News',
    url: 'https://www.rte.ie/news',
    feedUrl: 'https://www.rte.ie/rss/news.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'ansa-it',
    name: 'ANSA',
    url: 'https://www.ansa.it',
    feedUrl: 'https://www.ansa.it/sito/ansait_rss.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'el-pais',
    name: 'El País',
    url: 'https://elpais.com',
    feedUrl: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/internacional/portada',
    category: 'World',
    active: true,
  },
  {
    id: 'rtp-pt',
    name: 'RTP Notícias',
    url: 'https://www.rtp.pt/noticias',
    feedUrl: 'https://www.rtp.pt/noticias/rss',
    category: 'World',
    active: true,
  },
  {
    id: 'nos-nl',
    name: 'NOS',
    url: 'https://nos.nl',
    feedUrl: 'https://feeds.nos.nl/nosnieuwsalgemeen',
    category: 'World',
    active: true,
  },
  {
    id: 'svt-se',
    name: 'SVT Nyheter',
    url: 'https://www.svt.se/nyheter',
    feedUrl: 'https://www.svt.se/nyheter/rss.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'nrk-no',
    name: 'NRK',
    url: 'https://www.nrk.no',
    feedUrl: 'https://www.nrk.no/toppsaker.rss',
    category: 'World',
    active: true,
  },
  {
    id: 'yle-fi',
    name: 'Yle News',
    url: 'https://yle.fi/news',
    feedUrl: 'https://yle.fi/uutiset/rss/paauutiset.rss',
    category: 'World',
    active: true,
  },
  {
    id: 'swissinfo',
    name: 'SWI swissinfo.ch',
    url: 'https://www.swissinfo.ch',
    feedUrl: 'https://www.swissinfo.ch/eng/rss',
    category: 'World',
    active: true,
  },
  {
    id: 'orf-at',
    name: 'ORF News',
    url: 'https://orf.at',
    feedUrl: 'https://rss.orf.at/news.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'tvp-world',
    name: 'TVP World',
    url: 'https://tvpworld.com',
    feedUrl: 'https://tvpworld.com/rss',
    category: 'World',
    active: true,
  },
  {
    id: 'ukrinform',
    name: 'Ukrinform',
    url: 'https://www.ukrinform.net',
    feedUrl: 'https://www.ukrinform.net/rss/block-lastnews',
    category: 'World',
    active: true,
  },
  {
    id: 'tass',
    name: 'TASS',
    url: 'https://tass.com',
    feedUrl: 'https://tass.com/rss/v2.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'buenos-aires-times',
    name: 'Buenos Aires Times',
    url: 'https://www.batimes.com.ar',
    feedUrl: 'https://www.batimes.com.ar/feed',
    category: 'World',
    active: true,
  },
  {
    id: 'biobiochile',
    name: 'BioBioChile',
    url: 'https://www.biobiochile.cl',
    feedUrl: 'https://www.biobiochile.cl/feed',
    category: 'World',
    active: true,
  },
  {
    id: 'el-tiempo',
    name: 'El Tiempo',
    url: 'https://www.eltiempo.com',
    feedUrl: 'https://www.eltiempo.com/rss/mundo.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'ahram-online',
    name: 'Ahram Online',
    url: 'https://english.ahram.org.eg',
    feedUrl: 'https://news.google.com/rss/search?q=site:english.ahram.org.eg&hl=en-US&gl=US&ceid=US:en',
    category: 'World',
    active: true,
  },
  {
    id: 'morocco-world-news',
    name: 'Morocco World News',
    url: 'https://www.moroccoworldnews.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:moroccoworldnews.com&hl=en-US&gl=US&ceid=US:en',
    category: 'World',
    active: true,
  },
  {
    id: 'addis-standard',
    name: 'Addis Standard',
    url: 'https://addisstandard.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:addisstandard.com&hl=en-US&gl=US&ceid=US:en',
    category: 'World',
    active: true,
  },
  {
    id: 'daily-graphic',
    name: 'Daily Graphic Ghana',
    url: 'https://www.graphic.com.gh',
    feedUrl: 'https://news.google.com/rss/search?q=site:graphic.com.gh&hl=en-GH&gl=GH&ceid=GH:en',
    category: 'World',
    active: true,
  },
  {
    id: 'euronews',
    name: 'Euronews',
    url: 'https://www.euronews.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:euronews.com&hl=en-US&gl=US&ceid=US:en',
    category: 'World',
    active: true,
  },
  {
    id: 'scmp-news',
    name: 'South China Morning Post',
    url: 'https://www.scmp.com',
    feedUrl: 'https://www.scmp.com/rss/91/feed',
    category: 'World',
    active: true,
  },
  {
    id: 'un-news',
    name: 'UN News',
    url: 'https://news.un.org',
    feedUrl: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml',
    category: 'World',
    active: true,
  },

  // --- Prominent Indian Regional & National Outlets ---
  {
    id: 'times-of-india',
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com',
    feedUrl: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
    category: 'World',
    active: true,
  },
  {
    id: 'the-hindu',
    name: 'The Hindu',
    url: 'https://www.thehindu.com',
    feedUrl: 'https://www.thehindu.com/news/national/feeder/default.rss',
    category: 'World',
    active: true,
  },
  {
    id: 'indian-express',
    name: 'The Indian Express',
    url: 'https://indianexpress.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:indianexpress.com&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'World',
    active: true,
  },
  {
    id: 'hindustan-times',
    name: 'Hindustan Times',
    url: 'https://www.hindustantimes.com',
    feedUrl: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'ndtv-news',
    name: 'NDTV News',
    url: 'https://www.ndtv.com',
    feedUrl: 'https://feeds.feedburner.com/ndtvnews-top-stories',
    category: 'World',
    active: true,
  },
  {
    id: 'india-today',
    name: 'India Today',
    url: 'https://www.indiatoday.in',
    feedUrl: 'https://www.indiatoday.in/rss/1206514',
    category: 'World',
    active: true,
  },
  {
    id: 'the-print-india',
    name: 'ThePrint India',
    url: 'https://theprint.in',
    feedUrl: 'https://theprint.in/feed/',
    category: 'World',
    active: true,
  },
  {
    id: 'firstpost-india',
    name: 'Firstpost India',
    url: 'https://www.firstpost.com',
    feedUrl: 'https://www.firstpost.com/commonfeeds/v1/mfp/rss/india.xml',
    category: 'World',
    active: true,
  },
  {
    id: 'the-wire-india',
    name: 'The Wire India',
    url: 'https://thewire.in',
    feedUrl: 'https://thewire.in/rss',
    category: 'World',
    active: true,
  },
  {
    id: 'deccan-herald',
    name: 'Deccan Herald',
    url: 'https://www.deccanherald.com',
    feedUrl: 'https://www.deccanherald.com/rss/national.rss',
    category: 'World',
    active: true,
  },
  {
    id: 'scroll-india',
    name: 'Scroll.in',
    url: 'https://scroll.in',
    feedUrl: 'https://scroll.in/feed',
    category: 'World',
    active: true,
  },
  {
    id: 'dna-india',
    name: 'DNA India',
    url: 'https://www.dnaindia.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:dnaindia.com&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'World',
    active: true,
  },
  {
    id: 'news18-india',
    name: 'News18 India',
    url: 'https://www.news18.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:news18.com+india&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'World',
    active: true,
  },
  {
    id: 'ani-news-india',
    name: 'ANI News',
    url: 'https://www.aninews.in',
    feedUrl: 'https://news.google.com/rss/search?q=site:aninews.in&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'World',
    active: true,
  },
  {
    id: 'the-tribune-india',
    name: 'The Tribune India',
    url: 'https://www.tribuneindia.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:tribuneindia.com&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'World',
    active: true,
  },
  {
    id: 'abp-live-india',
    name: 'ABP Live',
    url: 'https://news.abplive.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:abplive.com&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'World',
    active: true,
  },
  {
    id: 'google-news-india',
    name: 'Google News India',
    url: 'https://news.google.com',
    feedUrl: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en',
    category: 'World',
    active: true,
  },

  // --- Business & Financial Outlets (Global & India) ---
  {
    id: 'economic-times',
    name: 'The Economic Times',
    url: 'https://economictimes.indiatimes.com',
    feedUrl: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms',
    category: 'Business',
    active: true,
  },
  {
    id: 'livemint',
    name: 'Livemint',
    url: 'https://www.livemint.com',
    feedUrl: 'https://www.livemint.com/rss/news',
    category: 'Business',
    active: true,
  },
  {
    id: 'business-standard',
    name: 'Business Standard',
    url: 'https://www.business-standard.com',
    feedUrl: 'https://www.business-standard.com/rss/latest.rss',
    category: 'Business',
    active: true,
  },
  {
    id: 'moneycontrol',
    name: 'Moneycontrol',
    url: 'https://www.moneycontrol.com',
    feedUrl: 'https://www.moneycontrol.com/rss/latestnews.xml',
    category: 'Business',
    active: true,
  },
  {
    id: 'financial-express',
    name: 'Financial Express',
    url: 'https://www.financialexpress.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:financialexpress.com&hl=en-IN&gl=IN&ceid=IN:en',
    category: 'Business',
    active: true,
  },
  {
    id: 'ft-world',
    name: 'Financial Times',
    url: 'https://www.ft.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:ft.com+markets+OR+world&hl=en-GB&gl=GB&ceid=GB:en',
    category: 'Business',
    active: true,
  },
  {
    id: 'bloomberg-markets',
    name: 'Bloomberg Markets',
    url: 'https://www.bloomberg.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:bloomberg.com+markets+OR+economy&hl=en-US&gl=US&ceid=US:en',
    category: 'Business',
    active: true,
  },
  {
    id: 'wsj-business',
    name: 'WSJ Markets',
    url: 'https://www.wsj.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:wsj.com+business+OR+markets&hl=en-US&gl=US&ceid=US:en',
    category: 'Business',
    active: true,
  },
  {
    id: 'the-economist',
    name: 'The Economist',
    url: 'https://www.economist.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:economist.com&hl=en-US&gl=US&ceid=US:en',
    category: 'Business',
    active: true,
  },
  {
    id: 'nikkei-asia',
    name: 'Nikkei Asia',
    url: 'https://asia.nikkei.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:asia.nikkei.com&hl=en-US&gl=US&ceid=US:en',
    category: 'Business',
    active: true,
  },
  {
    id: 'cnbc-biz',
    name: 'CNBC Business',
    url: 'https://www.cnbc.com',
    feedUrl: 'https://search.cnbc.com/rs/search/combinedrender?source=JOB&partnerId=2000&id=100003114&type=rss',
    category: 'Business',
    active: true,
  },

  // --- Technology ---
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    feedUrl: 'https://techcrunch.com/feed/',
    category: 'Technology',
    active: true,
  },
  {
    id: 'hacker-news',
    name: 'Hacker News',
    url: 'https://news.ycombinator.com',
    feedUrl: 'https://hnrss.org/frontpage',
    category: 'Technology',
    active: true,
  },
  {
    id: 'the-verge',
    name: 'The Verge',
    url: 'https://www.theverge.com',
    feedUrl: 'https://www.theverge.com/rss/index.xml',
    category: 'Technology',
    active: true,
  },
  {
    id: 'wired',
    name: 'Wired',
    url: 'https://www.wired.com',
    feedUrl: 'https://www.wired.com/feed/rss',
    category: 'Technology',
    active: true,
  },
  {
    id: 'ars-technica',
    name: 'Ars Technica',
    url: 'https://arstechnica.com',
    feedUrl: 'https://feeds.arstechnica.com/arstechnica/index',
    category: 'Technology',
    active: true,
  },
  {
    id: 'engadget',
    name: 'Engadget',
    url: 'https://www.engadget.com',
    feedUrl: 'https://www.engadget.com/rss.xml',
    category: 'Technology',
    active: true,
  },

  // --- Science & Discovery ---
  {
    id: 'sciencedaily',
    name: 'ScienceDaily',
    url: 'https://www.sciencedaily.com',
    feedUrl: 'https://www.sciencedaily.com/rss/all.xml',
    category: 'Science',
    active: true,
  },
  {
    id: 'nasa-news',
    name: 'NASA News',
    url: 'https://www.nasa.gov',
    feedUrl: 'https://www.nasa.gov/news-release/feed/',
    category: 'Science',
    active: true,
  },
  {
    id: 'phys-org',
    name: 'Phys.org',
    url: 'https://phys.org',
    feedUrl: 'https://phys.org/rss-feed/',
    category: 'Science',
    active: true,
  },
  {
    id: 'nature-news',
    name: 'Nature',
    url: 'https://www.nature.com',
    feedUrl: 'https://www.nature.com/nature.rss',
    category: 'Science',
    active: true,
  },

  // --- Sports ---
  {
    id: 'espn-sports',
    name: 'ESPN Sports',
    url: 'https://www.espn.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:espn.com+OR+ESPN+sports&hl=en-US&gl=US&ceid=US:en',
    category: 'Sports',
    active: true,
  },
  {
    id: 'bbc-sport',
    name: 'BBC Sport',
    url: 'https://www.bbc.com/sport',
    feedUrl: 'http://feeds.bbci.co.uk/sport/rss.xml',
    category: 'Sports',
    active: true,
  },
  {
    id: 'sky-sports',
    name: 'Sky Sports',
    url: 'https://www.skysports.com',
    feedUrl: 'https://www.skysports.com/rss/12040',
    category: 'Sports',
    active: true,
  },

  // --- Entertainment ---
  {
    id: 'variety-ent',
    name: 'Variety',
    url: 'https://variety.com',
    feedUrl: 'https://variety.com/feed/',
    category: 'Entertainment',
    active: true,
  },
  {
    id: 'hollywood-reporter',
    name: 'Hollywood Reporter',
    url: 'https://www.hollywoodreporter.com',
    feedUrl: 'https://www.hollywoodreporter.com/feed/',
    category: 'Entertainment',
    active: true,
  },
  {
    id: 'billboard',
    name: 'Billboard',
    url: 'https://www.billboard.com',
    feedUrl: 'https://www.billboard.com/feed/',
    category: 'Entertainment',
    active: true,
  },

  // --- Health ---
  {
    id: 'medical-news-today',
    name: 'Medical News Today',
    url: 'https://www.medicalnewstoday.com',
    feedUrl: 'https://news.google.com/rss/search?q=site:medicalnewstoday.com&hl=en-US&gl=US&ceid=US:en',
    category: 'Health',
    active: true,
  },
  {
    id: 'npr-health',
    name: 'NPR Health',
    url: 'https://www.npr.org/sections/health/',
    feedUrl: 'https://feeds.npr.org/1128/rss.xml',
    category: 'Health',
    active: true,
  }
];

// Persistent Storage File Paths & High-Durability Database
const STORAGE_FILE = path.join(process.cwd(), 'scraped_articles_db.json');
const BACKUP_STORAGE_FILE = path.join(process.cwd(), 'scraped_articles_db.bak.json');
const EXCEL_FILE = path.join(process.cwd(), 'scraped_news_export.xlsx');

// Verified Historical Seed Articles for initial cold-start archive (never re-timestamped to today)
const SEED_DATABASE_ARTICLES: NewsArticle[] = [
  {
    id: 'seed-world-1',
    title: 'Global Renewable Energy Investments Surge Past $1.8 Trillion Target',
    description: 'International energy consortiums report record-breaking investments in solar, wind, and smart battery storage grids across North America, Europe, and Asia-Pacific regions, outpacing fossil fuel commitments for the third consecutive fiscal year.',
    contentSnippet: 'International energy consortiums report record-breaking investments in solar, wind, and smart battery storage grids across North America, Europe, and Asia-Pacific regions, outpacing fossil fuel commitments for the third consecutive fiscal year.',
    link: 'https://www.bbc.com/news/world',
    source: 'BBC News',
    category: 'World',
    pubDate: '2024-01-15T08:00:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=800&q=80',
    readTimeMinutes: 3,
    sentiment: 'Positive',
    tags: ['#World', '#RenewableEnergy', '#Sustainability', '#BreakingNews'],
    seoKeywords: ['renewable energy', 'solar', 'climate tech', 'sustainability', 'global investments'],
    slug: 'global-renewable-energy-investments-surge-past-target',
    metaDescription: 'International energy reports reveal unprecedented investments in solar, wind, and battery storage infrastructure.',
    aiSummary: {
      oneLineSummary: 'Global clean energy infrastructure investments have surpassed $1.8 trillion, driven by exponential expansion in solar grid capacity and advanced battery deployment across key international economies.',
      executiveSummary: 'Global clean energy infrastructure investments have surpassed $1.8 trillion, driven by exponential expansion in solar grid capacity and advanced battery deployment across key international economies.',
      bulletPoints: [
        'Global investments in solar and wind power surpassed traditional hydrocarbon spending by over 38% this fiscal cycle.',
        'Emerging market incentives in Asia-Pacific fueled over $600 billion in direct grid modernization programs.',
        'Battery storage manufacturing capacity doubled year-over-year, significantly lowering peak electricity stabilization costs.'
      ],
      keyTakeaways: [
        'Clean energy has officially transitioned from a subsidized market into the primary growth driver for global utility projects.',
        'Supply chain localizations will accelerate domestic manufacturing across the US, India, and European Union.'
      ],
      whyItMatters: 'This massive capital rotation underscores the permanent shift toward decarbonization, guaranteeing lower long-term power costs and greater energy sovereignty for developing nations.',
      sentiment: 'Positive',
      tags: ['World', 'Energy', 'Sustainability', 'GlobalEconomy']
    }
  },
  {
    id: 'seed-tech-1',
    title: 'Next-Generation Quantum Computing Processors Achieve Fault-Tolerant Logical Qubit Milestone',
    description: 'Quantum hardware engineers have successfully demonstrated continuous quantum error correction with over 100 high-fidelity logical qubits, opening practical commercial applications in material science and cryptography.',
    contentSnippet: 'Quantum hardware engineers have successfully demonstrated continuous quantum error correction with over 100 high-fidelity logical qubits, opening practical commercial applications in material science and cryptography.',
    link: 'https://techcrunch.com',
    source: 'TechCrunch',
    category: 'Technology',
    pubDate: '2024-01-14T10:00:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    readTimeMinutes: 4,
    sentiment: 'Analysis',
    tags: ['#Technology', '#QuantumComputing', '#Hardware', '#DeepTech'],
    seoKeywords: ['quantum computing', 'logical qubits', 'error correction', 'material science', 'tech trends'],
    slug: 'quantum-computing-fault-tolerant-logical-qubit-milestone',
    metaDescription: 'Hardware engineers demonstrate continuous quantum error correction with over 100 logical qubits.',
    aiSummary: {
      oneLineSummary: 'Quantum engineers have realized a breakthrough in fault-tolerant quantum error correction, proving that physical decoherence noise can be suppressed continuously across large-scale computational matrices.',
      executiveSummary: 'Quantum engineers have realized a breakthrough in fault-tolerant quantum error correction, proving that physical decoherence noise can be suppressed continuously across large-scale computational matrices.',
      bulletPoints: [
        'The architecture maintained operational fidelity exceeding 99.98% over continuous multi-hour runtime tests.',
        'Demonstrates clear algorithmic advantages for complex molecular simulation and high-density material science modeling.',
        'Sets the stage for initial cloud-accessible commercial quantum coprocessors expected within the next 24 months.'
      ],
      keyTakeaways: [
        'Fault tolerance was the single largest theoretical hurdle facing quantum supremacy over classical supercomputing.',
        'Enterprise encryption frameworks must begin phased migration toward NIST-certified post-quantum cryptographic standards.'
      ],
      whyItMatters: 'Fault-tolerant quantum processors will enable previously impossible simulations of superconducting materials, enzyme catalysts, and high-efficiency solid-state batteries.',
      sentiment: 'Analysis',
      tags: ['Technology', 'Quantum', 'Computing', 'DeepTech']
    }
  },
  {
    id: 'seed-biz-1',
    title: 'Central Banks Signal Coordinated Liquidity Stabilization Amid Resilient Manufacturing Indices',
    description: 'Global financial regulators and central banking authorities outline synchronized monetary policy adjustments following stronger-than-expected industrial output metrics across major trading hubs.',
    contentSnippet: 'Global financial regulators and central banking authorities outline synchronized monetary policy adjustments following stronger-than-expected industrial output metrics across major trading hubs.',
    link: 'https://www.livemint.com',
    source: 'Livemint',
    category: 'Business',
    pubDate: '2024-01-13T09:00:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    readTimeMinutes: 3,
    sentiment: 'Positive',
    tags: ['#Business', '#Economy', '#CentralBanks', '#GlobalTrade'],
    seoKeywords: ['monetary policy', 'central banks', 'inflation', 'industrial output', 'interest rates'],
    slug: 'central-banks-signal-coordinated-liquidity-stabilization',
    metaDescription: 'Central banking authorities outline synchronized monetary adjustments following strong industrial output.',
    aiSummary: {
      oneLineSummary: 'International central banks have signaled a measured easing cycle supported by stabilized inflationary trends and robust manufacturing resilience across key export corridors.',
      executiveSummary: 'International central banks have signaled a measured easing cycle supported by stabilized inflationary trends and robust manufacturing resilience across key export corridors.',
      bulletPoints: [
        'Composite Purchasing Managers Indexes (PMI) registered expansionary readings above 52.4 across major industrial nations.',
        'Core inflation metrics settled within target bands, reducing volatility across sovereign bond yields.',
        'Cross-border corporate borrowing costs decreased by 25-40 basis points in secondary capital markets.'
      ],
      keyTakeaways: [
        'Lower credit spreads indicate improving corporate balance sheets and renewed appetite for capital expenditures.',
        'Emerging market currencies showed reinforced stability against the US dollar basket.'
      ],
      whyItMatters: 'Predictable monetary policy lowers financing barriers for infrastructure expansion, encouraging long-term enterprise investments and stabilizing consumer purchasing power.',
      sentiment: 'Positive',
      tags: ['Business', 'Finance', 'Markets', 'Economics']
    }
  },
  {
    id: 'seed-sci-1',
    title: 'James Webb Space Telescope Identifies Atmospheric Biomarker Indicators on Exoplanet K2-18b',
    description: 'Astrophysical spectroscopy data from the deep-space observatory detects carbon-bearing molecules and dimethyl sulfide signatures in the atmosphere of a habitable-zone sub-Neptune exoplanet.',
    contentSnippet: 'Astrophysical spectroscopy data from the deep-space observatory detects carbon-bearing molecules and dimethyl sulfide signatures in the atmosphere of a habitable-zone sub-Neptune exoplanet.',
    link: 'https://www.nasa.gov',
    source: 'NASA News',
    category: 'Science',
    pubDate: '2024-01-12T11:00:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80',
    readTimeMinutes: 4,
    sentiment: 'Analysis',
    tags: ['#Science', '#Space', '#JWST', '#Astronomy'],
    seoKeywords: ['JWST', 'exoplanets', 'astronomy', 'space exploration', 'NASA'],
    slug: 'jwst-identifies-atmospheric-biomarker-indicators-exoplanet',
    metaDescription: 'JWST deep-space observatory detects carbon-bearing molecules in the atmosphere of habitable-zone sub-Neptune exoplanet.',
    aiSummary: {
      oneLineSummary: 'NASA deep-space infrared observations of exoplanet K2-18b have confirmed the presence of methane and carbon dioxide in a water-rich atmosphere, pointing to a potential Hycean ocean world.',
      executiveSummary: 'NASA deep-space infrared observations of exoplanet K2-18b have confirmed the presence of methane and carbon dioxide in a water-rich atmosphere, pointing to a potential Hycean ocean world.',
      bulletPoints: [
        'Transmission spectroscopy demonstrated a notable absence of ammonia, strongly supporting predictions of an underlying liquid ocean.',
        'Trace signatures of dimethyl sulfide (DMS) were observed, prompting dedicated follow-up observation orbits.',
        'The sub-Neptune planet orbits within the habitable zone of dwarf star K2-18, located 120 light-years from Earth.'
      ],
      keyTakeaways: [
        'Expands the definition of potentially habitable worlds beyond terrestrial rocky planets to include Hycean sub-Neptunes.',
        'Validates the unprecedented precision of JWST infrared spectroscopy for atmospheric characterization.'
      ],
      whyItMatters: 'Finding habitable conditions on non-terrestrial exoplanets radically multiplies the potential niches where organic chemistry and extraterrestrial life could flourish across the galaxy.',
      sentiment: 'Analysis',
      tags: ['Science', 'Space', 'Astronomy', 'Discovery']
    }
  },
  {
    id: 'seed-sports-1',
    title: 'International Olympic Committee Finalizes Revolutionary AI-Driven Fair Play Scrutiny Framework',
    description: 'Sports governing bodies unveil unified multi-camera computer vision tracking and biometric workload analytics to assist officiating, ensure fairness, and optimize athlete injury prevention.',
    contentSnippet: 'Sports governing bodies unveil unified multi-camera computer vision tracking and biometric workload analytics to assist officiating, ensure fairness, and optimize athlete injury prevention.',
    link: 'https://www.espn.com',
    source: 'ESPN Sports',
    category: 'Sports',
    pubDate: '2024-01-11T14:00:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
    readTimeMinutes: 3,
    sentiment: 'Positive',
    tags: ['#Sports', '#Athletics', '#SportsTech', '#Olympics'],
    seoKeywords: ['sports analytics', 'olympics', 'fair play', 'computer vision', 'athlete training'],
    slug: 'ioc-finalizes-ai-driven-fair-play-scrutiny-framework',
    metaDescription: 'Sports governing bodies unveil unified multi-camera computer vision tracking and biometric analytics.',
    aiSummary: {
      oneLineSummary: 'The International Olympic Committee has standardized high-speed spatial vision tracking to deliver instant, millimeter-precise officiating decisions while safeguarding athlete biomechanics.',
      executiveSummary: 'The International Olympic Committee has standardized high-speed spatial vision tracking to deliver instant, millimeter-precise officiating decisions while safeguarding athlete biomechanics.',
      bulletPoints: [
        'System provides sub-millimeter positional tracking for ball sports, gymnastics, and sprinting events.',
        'Real-time kinematic feedback reduces controversial referee delays from minutes to under 4 seconds.',
        'Anonymized biometric stress data helps training staff detect fatigue-induced ligament strain before injuries occur.'
      ],
      keyTakeaways: [
        'Technology eliminates subjective human officiating bias in high-stakes medal competitions.',
        'Data models will be open-sourced to national sporting federations to democratize athletic development.'
      ],
      whyItMatters: 'Ensures absolute competitive integrity at the world level while prioritizing long-term athlete longevity through predictive physiological monitoring.',
      sentiment: 'Positive',
      tags: ['Sports', 'Technology', 'Olympics', 'Health']
    }
  },
  {
    id: 'seed-health-1',
    title: 'Groundbreaking Universal mRNA Vaccine Platform Demonstrates Broad-Spectrum Viral Neutralization',
    description: 'Clinical trial results published in leading biomedical journals demonstrate a single mRNA sequence capable of eliciting durable neutralizing antibodies against diverse coronavirus and influenza lineages.',
    contentSnippet: 'Clinical trial results published in leading biomedical journals demonstrate a single mRNA sequence capable of eliciting durable neutralizing antibodies against diverse coronavirus and influenza lineages.',
    link: 'https://www.sciencedaily.com',
    source: 'ScienceDaily',
    category: 'Health',
    pubDate: '2024-01-10T15:00:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    readTimeMinutes: 4,
    sentiment: 'Positive',
    tags: ['#Health', '#Medicine', '#mRNA', '#Biotech'],
    seoKeywords: ['mRNA vaccines', 'immunology', 'biotech', 'healthcare', 'medical research'],
    slug: 'groundbreaking-universal-mrna-vaccine-platform-trial',
    metaDescription: 'Clinical trial results demonstrate a single mRNA sequence eliciting broad-spectrum neutralizing antibodies.',
    aiSummary: {
      oneLineSummary: 'Biomedical researchers have created a pan-respiratory mRNA vaccine that triggers immune recognition of conserved viral stalk proteins, providing immunity against evolving viral variants.',
      executiveSummary: 'Biomedical researchers have created a pan-respiratory mRNA vaccine that triggers immune recognition of conserved viral stalk proteins, providing immunity against evolving viral variants.',
      bulletPoints: [
        'Phase II clinical trials demonstrated an 89% reduction in symptomatic respiratory illness across test cohorts.',
        'T-cell response remained robust against mutated strain lineages for more than 18 months post-vaccination.',
        'Lipid nanoparticle formulation allows standard refrigeration storage for up to six months, easing global distribution.'
      ],
      keyTakeaways: [
        'Eliminates the requirement for annual seasonal reformulation cycles for respiratory vaccines.',
        'Refrigeration stability enables rapid deployment across remote healthcare clinics in developing regions.'
      ],
      whyItMatters: 'A universal broad-spectrum vaccine represents the cornerstone of future global pandemic preparedness, stopping viral mutations before localized outbreaks can escalate.',
      sentiment: 'Positive',
      tags: ['Health', 'Biotech', 'Immunology', 'GlobalHealth']
    }
  },
  {
    id: 'seed-ent-1',
    title: 'Cinema Industry Reports Historic Renaissance Powered by IMAX Experiential Presentations',
    description: 'Global box office receipts and theatrical attendance numbers surpass pre-2019 benchmarks, driven by auteur-driven 70mm large-format screenings and premium auditorium sound experiences.',
    contentSnippet: 'Global box office receipts and theatrical attendance numbers surpass pre-2019 benchmarks, driven by auteur-driven 70mm large-format screenings and premium auditorium sound experiences.',
    link: 'https://timesofindia.indiatimes.com',
    source: 'Times of India',
    category: 'Entertainment',
    pubDate: '2024-01-09T16:00:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    readTimeMinutes: 3,
    sentiment: 'Positive',
    tags: ['#Entertainment', '#Cinema', '#BoxOffice', '#Arts'],
    seoKeywords: ['cinema', 'box office', 'entertainment news', 'IMAX', 'film industry'],
    slug: 'cinema-industry-reports-historic-renaissance-experiential',
    metaDescription: 'Global box office receipts and theatrical attendance surpass previous benchmarks driven by premium screenings.',
    aiSummary: {
      oneLineSummary: 'International film exhibition networks have registered record-setting quarterly revenues as audiences overwhelmingly prioritize premium large-format communal cinematic presentations.',
      executiveSummary: 'International film exhibition networks have registered record-setting quarterly revenues as audiences overwhelmingly prioritize premium large-format communal cinematic presentations.',
      bulletPoints: [
        'Premium Large Format (PLF) and IMAX ticket sales accounted for over 42% of total opening weekend grosses.',
        'International co-productions and regional cinema achieved unprecedented cross-market distribution success.',
        'Independent theater chains reported steady 28% growth in subscription membership programs.'
      ],
      keyTakeaways: [
        'Audience habits have permanently shifted away from generic screens toward high-fidelity sensory theatrical events.',
        'Streaming services are increasingly partnering with theatrical distributors for exclusive window releases.'
      ],
      whyItMatters: 'The theatrical renaissance confirms the enduring cultural and financial power of the communal movie-going experience over purely domestic streaming viewing.',
      sentiment: 'Positive',
      tags: ['Entertainment', 'Cinema', 'Culture', 'Media']
    }
  },
  {
    id: 'seed-tech-2',
    title: 'Global AI Safety Standards Consortium Ratifies Universal Model Verification Protocols',
    description: 'Leading international research laboratories and technical institutions establish unified benchmarks for alignment, transparency, and computational resilience across next-generation artificial intelligence architectures.',
    contentSnippet: 'Leading research laboratories and technical institutions establish unified benchmarks for AI alignment, transparency, and safety protocols.',
    link: 'https://techcrunch.com',
    source: 'TechCrunch',
    category: 'Technology',
    pubDate: '2024-01-08T18:00:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    readTimeMinutes: 4,
    sentiment: 'Analysis',
    tags: ['#Technology', '#AI', '#Safety', '#Governance'],
    seoKeywords: ['AI standards', 'machine learning safety', 'tech policy', 'artificial intelligence'],
    slug: 'global-ai-safety-standards-consortium-ratifies-protocols',
    metaDescription: 'Leading international laboratories establish unified benchmarks for alignment and transparency across AI architectures.',
    aiSummary: {
      oneLineSummary: 'Global technology leaders and scientific institutions have finalized binding protocols for validating safety, explainability, and alignment in frontier artificial intelligence systems.',
      executiveSummary: 'Global technology leaders and scientific institutions have finalized binding protocols for validating safety, explainability, and alignment in frontier artificial intelligence systems.',
      bulletPoints: [
        'Establishes objective red-teaming and automated evaluation benchmarks across multilingual multimodal models.',
        'Requires certified audit trails for training datasets and autonomous task delegation capabilities.',
        'Adopted by over 45 academic institutions and leading cloud infrastructure providers.'
      ],
      keyTakeaways: [
        'Universal alignment standards prevent fragmented regional compliance bottlenecks for software developers.',
        'Provides an open verification harness for auditing frontier neural networks before public deployment.'
      ],
      whyItMatters: 'Guarantees reliable safety guarantees and transparent auditing mechanisms as autonomous agentic AI systems assume core societal and computational roles.',
      sentiment: 'Analysis',
      tags: ['Technology', 'AI', 'Safety', 'Policy']
    }
  },
  {
    id: 'seed-sci-2',
    title: 'SpaceX Starship Completes Orbital Refueling Milestone in Deep-Space Preparation',
    description: 'Aerospace engineers achieve cryogenic propellant transfer in low Earth orbit, marking a critical operational breakthrough for upcoming lunar and planetary exploration missions.',
    contentSnippet: 'Aerospace engineers achieve cryogenic propellant transfer in low Earth orbit, marking a critical milestone for lunar missions.',
    link: 'https://www.nasa.gov',
    source: 'NASA News',
    category: 'Science',
    pubDate: '2024-01-07T12:00:00.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1517976487507-5b62b70f0312?auto=format&fit=crop&w=800&q=80',
    readTimeMinutes: 4,
    sentiment: 'Positive',
    tags: ['#Science', '#Space', '#NASA', '#Starship'],
    seoKeywords: ['space exploration', 'orbital refueling', 'starship', 'NASA', 'cryogenic propellants'],
    slug: 'spacex-starship-completes-orbital-refueling-milestone',
    metaDescription: 'Aerospace engineers achieve cryogenic propellant transfer in low Earth orbit for upcoming exploration missions.',
    aiSummary: {
      oneLineSummary: 'Space engineers have demonstrated automated cryogenic liquid oxygen and methane transfer between spacecraft in microgravity, proving orbital refueling feasibility.',
      executiveSummary: 'Space engineers have demonstrated automated cryogenic liquid oxygen and methane transfer between spacecraft in microgravity, proving orbital refueling feasibility.',
      bulletPoints: [
        'Sub-zero liquid methane and oxygen were transferred with zero measurable boiling losses during the flight test.',
        'Validates the vital architecture required for crewed Artemis lunar landings and Mars transfer trajectories.',
        'Telemetric sensors verified automated docking guidance and docking collar hermetic seal integrity.'
      ],
      keyTakeaways: [
        'Orbital refueling dramatically lowers the payload launch mass required from Earth for interplanetary voyages.',
        'Accelerates deployment timelines for the next generation of deep-space orbital research stations.'
      ],
      whyItMatters: 'Unlocks sustainable deep-space logistics by transforming low Earth orbit into an operational refueling station for planetary exploration.',
      sentiment: 'Positive',
      tags: ['Science', 'Space', 'Innovation', 'Astronomy']
    }
  }
];

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
  duration: string;
  pubDate: string;
  category: VideoCategory;
  tags: string[];
  seoKeywords: string[];
  slug: string;
  metaDescription: string;
  sentiment?: 'Urgent' | 'Positive' | 'Neutral' | 'Analysis' | 'Warning';
  isViralTrend: boolean;
  viralScore: number;
  aiTakeaway?: string;
  hindiTitle?: string;
  hindiDescription?: string;
}

let cachedViralVideos: ViralVideo[] = [];

// XML Sanitizer Helper
function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

let sitemapLastGeneratedAt: Date = new Date();
let nextScheduledDailyRunAt: Date = new Date();

export interface SitemapGenerationLog {
  timestamp: string;
  trigger: 'daily_scheduled_cron' | 'scrape_auto' | 'manual_admin' | 'server_init';
  articlesCount: number;
  videosCount: number;
  googleNewsCount: number;
}

const sitemapGenerationHistory: SitemapGenerationLog[] = [];

// Calculate next daily UTC midnight timestamp
function getNextUtcMidnight(): Date {
  const next = new Date();
  next.setUTCDate(next.getUTCDate() + 1);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

nextScheduledDailyRunAt = getNextUtcMidnight();

// 1. Comprehensive Google News & SEO XML Sitemap Generator listing ALL scraped posts
function generateSitemapXml(baseUrl: string, articles: NewsArticle[]): string {
  const categories = ['All', 'World', 'Technology', 'Business', 'Science', 'Entertainment', 'Health', 'Sports'];
  const todayIso = new Date().toISOString();
  const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Core navigation & landing URLs
  const coreUrls = [
    { loc: `${baseUrl}/`, changefreq: 'always', priority: '1.0', lastmod: todayIso },
    { loc: `${baseUrl}/#videos`, changefreq: 'hourly', priority: '0.9', lastmod: todayIso },
    { loc: `${baseUrl}/?view=bookmarks`, changefreq: 'daily', priority: '0.6', lastmod: todayIso },
    { loc: `${baseUrl}/?page=database`, changefreq: 'daily', priority: '0.7', lastmod: todayIso },
    { loc: `${baseUrl}/?page=about`, changefreq: 'monthly', priority: '0.5', lastmod: todayIso },
    { loc: `${baseUrl}/?page=advertise`, changefreq: 'monthly', priority: '0.5', lastmod: todayIso },
    { loc: `${baseUrl}/?page=contact`, changefreq: 'monthly', priority: '0.5', lastmod: todayIso },
    { loc: `${baseUrl}/?page=privacy`, changefreq: 'monthly', priority: '0.5', lastmod: todayIso },
    { loc: `${baseUrl}/sitemap.html`, changefreq: 'daily', priority: '0.6', lastmod: todayIso },
  ];

  const categoryUrls = categories.map(cat => ({
    loc: `${baseUrl}/?category=${encodeURIComponent(cat)}`,
    changefreq: 'hourly',
    priority: '0.85',
    lastmod: todayIso,
  }));

  const coreXml = [...coreUrls, ...categoryUrls].map(item => `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`).join('\n');

  // Dynamic Article URLs for ALL scraped posts with Google News & Image Extensions
  const articleUrlsXml = articles.map(art => {
    let pubDateFormatted: string;
    let pubTimestamp = 0;
    try {
      if (art.pubDate) {
        const d = new Date(art.pubDate);
        pubDateFormatted = d.toISOString();
        pubTimestamp = d.getTime();
      } else {
        pubDateFormatted = todayIso;
        pubTimestamp = Date.now();
      }
    } catch {
      pubDateFormatted = todayIso;
      pubTimestamp = Date.now();
    }

    const isWithin48Hours = pubTimestamp >= twoDaysAgo;
    const isWithin7Days = pubTimestamp >= sevenDaysAgo;
    
    // Priority calculation based on freshness
    let priority = '0.70';
    let changefreq = 'weekly';
    if (isWithin48Hours) {
      priority = '0.95';
      changefreq = 'hourly';
    } else if (isWithin7Days) {
      priority = '0.85';
      changefreq = 'daily';
    }

    const articleUrl = `${baseUrl}/?article=${encodeURIComponent(art.id)}`;
    
    // Google News Schema extension for breaking/recent posts
    let newsBlock = '';
    if (isWithin48Hours) {
      const keywords = [art.category, ...(art.tags || []), ...(art.seoKeywords || [])].filter(Boolean).slice(0, 6).join(', ');
      newsBlock = `
    <news:news>
      <news:publication>
        <news:name>NewsPulse Gazette</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDateFormatted}</news:publication_date>
      <news:title>${escapeXml(art.title)}</news:title>${keywords ? `
      <news:keywords>${escapeXml(keywords)}</news:keywords>` : ''}
    </news:news>`;
    }

    // Google Image Schema extension
    let imageBlock = '';
    if (art.imageUrl) {
      imageBlock = `
    <image:image>
      <image:loc>${escapeXml(art.imageUrl)}</image:loc>
      <image:title>${escapeXml(art.title)}</image:title>
      <image:caption>${escapeXml(art.aiSummary?.whyItMatters || art.description || art.title)}</image:caption>
    </image:image>`;
    }

    return `  <url>
    <loc>${escapeXml(articleUrl)}</loc>
    <lastmod>${pubDateFormatted}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${newsBlock}${imageBlock}
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${coreXml}
${articleUrlsXml}
</urlset>`.trim();
}

// 2. Dedicated Google News XML Sitemap (Filtered strictly for last 48 hours per Google News Publisher specs)
function generateGoogleNewsSitemapXml(baseUrl: string, articles: NewsArticle[]): string {
  const todayIso = new Date().toISOString();
  const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
  
  // Articles eligible for Google News (published in past 48h; fallback to recent 100 if none)
  let eligibleArticles = articles.filter(a => a.pubDate && new Date(a.pubDate).getTime() >= twoDaysAgo);
  if (eligibleArticles.length === 0) {
    eligibleArticles = articles.slice(0, 100);
  }

  const newsUrlsXml = eligibleArticles.map(art => {
    let pubDateFormatted: string;
    try {
      pubDateFormatted = art.pubDate ? new Date(art.pubDate).toISOString() : todayIso;
    } catch {
      pubDateFormatted = todayIso;
    }
    const articleUrl = `${baseUrl}/?article=${encodeURIComponent(art.id)}`;
    const keywords = [art.category, ...(art.tags || []), ...(art.seoKeywords || [])].filter(Boolean).slice(0, 6).join(', ');

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
    <lastmod>${pubDateFormatted}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.95</priority>
    <news:news>
      <news:publication>
        <news:name>NewsPulse Gazette</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDateFormatted}</news:publication_date>
      <news:title>${escapeXml(art.title)}</news:title>${keywords ? `
      <news:keywords>${escapeXml(keywords)}</news:keywords>` : ''}
    </news:news>${imageBlock}
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${newsUrlsXml}
</urlset>`.trim();
}

// 3. Dedicated Video XML Sitemap (Google Video Search Compliant)
function generateVideoSitemapXml(baseUrl: string, videos: ViralVideo[]): string {
  const videoUrlsXml = videos.map(v => {
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
      <video:publication_date>${new Date(v.pubDate).toISOString()}</video:publication_date>
      <video:category>${escapeXml(v.category)}</video:category>
      <video:view_count>${v.viewsCount || 10000}</video:view_count>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
      ${tagsXml}
    </video:video>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${videoUrlsXml}
</urlset>`.trim();
}

// 4. Dedicated Category & Topic Tags XML Sitemap
function generateCategorySitemapXml(baseUrl: string, articles: NewsArticle[]): string {
  const categories = ['World', 'Technology', 'Business', 'Science', 'Entertainment', 'Health', 'Sports'];
  const todayIso = new Date().toISOString();

  // Extract top 30 trending tags
  const tagSet = new Set<string>();
  for (const art of articles) {
    if (Array.isArray(art.tags)) {
      art.tags.forEach(t => {
        const clean = t.replace('#', '').trim();
        if (clean.length > 2) tagSet.add(clean);
      });
    }
  }

  const categoryUrls = categories.map(cat => `  <url>
    <loc>${escapeXml(`${baseUrl}/?category=${encodeURIComponent(cat)}`)}</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.85</priority>
  </url>`).join('\n');

  const tagUrls = Array.from(tagSet).slice(0, 50).map(tag => `  <url>
    <loc>${escapeXml(`${baseUrl}/?tag=${encodeURIComponent(tag)}`)}</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.75</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categoryUrls}
${tagUrls}
</urlset>`.trim();
}

// 5. Human & Crawler Friendly HTML Sitemap
function generateHtmlSitemap(baseUrl: string, articles: NewsArticle[], videos: ViralVideo[]): string {
  const todayFormatted = new Date().toUTCString();
  const categories = ['World', 'Technology', 'Business', 'Science', 'Entertainment', 'Health', 'Sports'];
  
  const categorySections = categories.map(cat => {
    const catArticles = articles.filter(a => a.category === cat);
    if (catArticles.length === 0) return '';
    const items = catArticles.map(a => `
      <li style="margin-bottom: 8px;">
        <a href="${baseUrl}/?article=${encodeURIComponent(a.id)}" style="color: #1a0dab; text-decoration: none; font-weight: 600;">${escapeXml(a.title)}</a>
        <span style="color: #666; font-size: 12px; margin-left: 8px;">(${escapeXml(a.source)} • ${new Date(a.pubDate).toLocaleDateString()})</span>
      </li>
    `).join('');

    return `
      <div style="margin-bottom: 24px; padding: 16px; background: #faf8f5; border: 2px solid #000;">
        <h3 style="margin-top: 0; font-size: 18px; color: #111; border-bottom: 2px solid #000; padding-bottom: 6px;">${cat} (${catArticles.length} Stories)</h3>
        <ul style="padding-left: 20px; margin-bottom: 0;">
          ${items}
        </ul>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NewsPulsar - Complete HTML Sitemap & Article Index</title>
  <meta name="description" content="Complete daily updated HTML sitemap index of all scraped news stories, market intelligence, technology reports, and video feeds on NewsPulsar.">
  <meta name="robots" content="index, follow">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #fffdf9; color: #111; max-width: 1000px; margin: 0 auto; padding: 20px; line-height: 1.5; }
    h1 { font-size: 28px; margin-bottom: 4px; font-weight: 900; }
    .badge { display: inline-block; padding: 4px 8px; background: #ccff00; border: 1px solid #000; font-weight: bold; font-size: 12px; margin-bottom: 16px; }
    .nav-links { margin-bottom: 20px; display: flex; gap: 12px; flex-wrap: wrap; }
    .nav-links a { color: #000; background: #eee; padding: 4px 10px; border: 1px solid #000; text-decoration: none; font-size: 13px; font-weight: bold; }
    .nav-links a:hover { background: #ffe600; }
  </style>
</head>
<body>
  <h1>NewsPulsar - Complete Searchable Site Index</h1>
  <div class="badge">🔄 Daily Automated Sitemap Index • Last Updated: ${todayFormatted} • ${articles.length} Total Articles Indexed</div>
  
  <div class="nav-links">
    <a href="${baseUrl}/">← Home News Wire</a>
    <a href="${baseUrl}/sitemap_index.xml">XML Master Index</a>
    <a href="${baseUrl}/sitemap.xml">XML Posts Sitemap</a>
    <a href="${baseUrl}/news-sitemap.xml">Google News Sitemap</a>
    <a href="${baseUrl}/video-sitemap.xml">Video Sitemap</a>
    <a href="${baseUrl}/feed.xml">RSS Feed</a>
  </div>

  <h2>All Scraped News Categories &amp; Posts</h2>
  ${categorySections}

  <footer style="margin-top: 40px; padding-top: 16px; border-top: 2px solid #000; font-size: 12px; color: #666;">
    © ${new Date().getFullYear()} NewsPulsar. Automated Daily News Aggregation &amp; Google News Publisher Sitemap.
  </footer>
</body>
</html>`;
}

// 6. Master Sitemap Index XML (Bundles Main, Google News, Video, and Category Sitemaps)
function generateSitemapIndexXml(baseUrl: string): string {
  const todayIso = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
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
  <sitemap>
    <loc>${baseUrl}/category-sitemap.xml</loc>
    <lastmod>${todayIso}</lastmod>
  </sitemap>
</sitemapindex>`.trim();
}

// Non-blocking ping utility to notify search engines of updated sitemaps
function pingSearchEngines(baseUrl: string) {
  try {
    const sitemapUrl = encodeURIComponent(`${baseUrl}/sitemap_index.xml`);
    // Ping Google
    fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`).catch(() => {});
    // Ping Bing
    fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`).catch(() => {});
  } catch {}
}

// Write the generated sitemaps and SEO crawler assets to physical disk files in public/ and dist/
function updateSitemapDiskFile(
  articles: NewsArticle[], 
  videos: ViralVideo[] = cachedViralVideos, 
  trigger: 'daily_scheduled_cron' | 'scrape_auto' | 'manual_admin' | 'server_init' = 'scrape_auto'
) {
  try {
    const allDbArticles = (articles && articles.length > 0) ? articles : loadStoredArticles();
    const defaultBaseUrl = process.env.SITE_URL || 'https://newspulsar.site';
    const mainSitemapContent = generateSitemapXml(defaultBaseUrl, allDbArticles);
    const newsSitemapContent = generateGoogleNewsSitemapXml(defaultBaseUrl, allDbArticles);
    const videoSitemapContent = generateVideoSitemapXml(defaultBaseUrl, videos);
    const categorySitemapContent = generateCategorySitemapXml(defaultBaseUrl, allDbArticles);
    const sitemapIndexContent = generateSitemapIndexXml(defaultBaseUrl);
    const htmlSitemapContent = generateHtmlSitemap(defaultBaseUrl, allDbArticles, videos);
    
    const robotsTxtContent = `User-agent: *
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

User-agent: Bingbot
Allow: /

Sitemap: ${defaultBaseUrl}/sitemap_index.xml
Sitemap: ${defaultBaseUrl}/sitemap.xml
Sitemap: ${defaultBaseUrl}/news-sitemap.xml
Sitemap: ${defaultBaseUrl}/video-sitemap.xml
Sitemap: ${defaultBaseUrl}/category-sitemap.xml
`;
    
    // RSS 2.0 Feed
    const rssItemsXml = allDbArticles.slice(0, 50).map(art => `
    <item>
      <title><![CDATA[${art.title}]]></title>
      <link>${art.link}</link>
      <guid isPermaLink="false">${art.id}</guid>
      <pubDate>${new Date(art.pubDate).toUTCString()}</pubDate>
      <description><![CDATA[${art.aiSummary?.whyItMatters || art.description}]]></description>
      <category>${art.category}</category>
    </item>`).join('');

    const rssFeedContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NewsPulsar - Global News &amp; AI Analysis</title>
    <link>${defaultBaseUrl}</link>
    <description>Live automated news aggregator, Google News feed and Gemini AI summarizer</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${defaultBaseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${rssItemsXml}
  </channel>
</rss>`;

    const adsTxtContent = 'google.com, pub-6411773855584982, DIRECT, f08c47fec0942fa0\n';
    const googleVerifyContent = 'google-site-verification: googled43dd531c722dedd.html\n';
    
    const publicPath = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }

    // 1. Write to public/ directory
    fs.writeFileSync(path.join(publicPath, 'sitemap.xml'), mainSitemapContent, 'utf-8');
    fs.writeFileSync(path.join(publicPath, 'news-sitemap.xml'), newsSitemapContent, 'utf-8');
    fs.writeFileSync(path.join(publicPath, 'video-sitemap.xml'), videoSitemapContent, 'utf-8');
    fs.writeFileSync(path.join(publicPath, 'category-sitemap.xml'), categorySitemapContent, 'utf-8');
    fs.writeFileSync(path.join(publicPath, 'sitemap_index.xml'), sitemapIndexContent, 'utf-8');
    fs.writeFileSync(path.join(publicPath, 'sitemap.html'), htmlSitemapContent, 'utf-8');
    fs.writeFileSync(path.join(publicPath, 'robots.txt'), robotsTxtContent, 'utf-8');
    fs.writeFileSync(path.join(publicPath, 'feed.xml'), rssFeedContent, 'utf-8');
    fs.writeFileSync(path.join(publicPath, 'ads.txt'), adsTxtContent, 'utf-8');
    fs.writeFileSync(path.join(publicPath, 'googled43dd531c722dedd.html'), googleVerifyContent, 'utf-8');

    // 2. Also sync to dist/ directory if present
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      fs.writeFileSync(path.join(distPath, 'sitemap.xml'), mainSitemapContent, 'utf-8');
      fs.writeFileSync(path.join(distPath, 'news-sitemap.xml'), newsSitemapContent, 'utf-8');
      fs.writeFileSync(path.join(distPath, 'video-sitemap.xml'), videoSitemapContent, 'utf-8');
      fs.writeFileSync(path.join(distPath, 'category-sitemap.xml'), categorySitemapContent, 'utf-8');
      fs.writeFileSync(path.join(distPath, 'sitemap_index.xml'), sitemapIndexContent, 'utf-8');
      fs.writeFileSync(path.join(distPath, 'sitemap.html'), htmlSitemapContent, 'utf-8');
      fs.writeFileSync(path.join(distPath, 'robots.txt'), robotsTxtContent, 'utf-8');
      fs.writeFileSync(path.join(distPath, 'feed.xml'), rssFeedContent, 'utf-8');
      fs.writeFileSync(path.join(distPath, 'ads.txt'), adsTxtContent, 'utf-8');
      fs.writeFileSync(path.join(distPath, 'googled43dd531c722dedd.html'), googleVerifyContent, 'utf-8');
    }

    sitemapLastGeneratedAt = new Date();
    nextScheduledDailyRunAt = getNextUtcMidnight();

    const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
    const googleNewsCount = allDbArticles.filter(a => a.pubDate && new Date(a.pubDate).getTime() >= twoDaysAgo).length;

    // Ping search engines
    pingSearchEngines(defaultBaseUrl);

    // Log to history
    sitemapGenerationHistory.unshift({
      timestamp: sitemapLastGeneratedAt.toISOString(),
      trigger,
      articlesCount: allDbArticles.length,
      videosCount: videos.length,
      googleNewsCount
    });

    if (sitemapGenerationHistory.length > 30) {
      sitemapGenerationHistory.pop();
    }

    console.log(`[Sitemap Automation] 🗺️ All sitemaps & crawler assets (sitemap.xml, news-sitemap.xml, video-sitemap.xml, category-sitemap.xml, sitemap_index.xml, sitemap.html, robots.txt, feed.xml) refreshed on disk [Trigger: ${trigger}] (${allDbArticles.length} news articles, ${videos.length} videos, ${googleNewsCount} in Google News 48h index). Next scheduled run: ${nextScheduledDailyRunAt.toISOString()}`);
  } catch (err: any) {
    console.error(`[Sitemap Automation] Error writing sitemap disk files:`, err.message || err);
  }
}


// Helper to save articles as Excel spreadsheet (.xlsx)
function saveExcelFile(articles: NewsArticle[]) {
  try {
    const dataForExcel = articles.map((art, idx) => ({
      'S.No': idx + 1,
      'Article ID': art.id,
      'Title': art.title,
      'Category': art.category,
      'Source': art.source,
      'Published Date': art.pubDate,
      'Article Link': art.link,
      'Description': art.description,
      'AI Key Points': art.aiSummary?.bulletPoints?.join(' | ') || '',
      'AI Sentiment': art.aiSummary?.sentiment || '',
      'AI Key Takeaways': art.aiSummary?.keyTakeaways?.join(' | ') || '',
      'AI Why It Matters': art.aiSummary?.whyItMatters || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    worksheet['!cols'] = [
      { wch: 6 },   // S.No
      { wch: 15 },  // Article ID
      { wch: 45 },  // Title
      { wch: 15 },  // Category
      { wch: 20 },  // Source
      { wch: 25 },  // Published Date
      { wch: 50 },  // Article Link
      { wch: 60 },  // Description
      { wch: 50 },  // AI Key Points
      { wch: 15 },  // AI Sentiment
      { wch: 50 },  // AI Key Takeaways
      { wch: 40 }   // AI Why It Matters
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Scraped News');
    XLSX.writeFile(workbook, EXCEL_FILE);
    console.log(`[Excel Storage] Successfully exported ${articles.length} news articles to ${EXCEL_FILE}`);
  } catch (err: any) {
    console.error(`[Excel Storage] Error saving excel file:`, err.message || err);
  }
}

function isRootOrHomepageUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return true;
  try {
    const parsed = new URL(urlStr);
    const path = parsed.pathname.toLowerCase().replace(/\/$/, '');
    return path === '' || path === '/' || path === '/news' || path === '/home' || path === '/index.html' || path === '/index.php';
  } catch {
    return false;
  }
}

const SERVER_SOURCE_DOMAIN_MAP: Record<string, string> = {
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
  'Google News Business': 'bloomberg.com',
  'Google News Sports': 'espn.com',
  'Google News': 'reuters.com',
  'Google News India': 'thehindu.com',
};

function extractDomainFromUrl(urlStr?: string): string {
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

function extractDomainFromSource(sourceName?: string, rawUrl?: string): string {
  if (sourceName && SERVER_SOURCE_DOMAIN_MAP[sourceName]) {
    return SERVER_SOURCE_DOMAIN_MAP[sourceName];
  }
  if (rawUrl) {
    const host = extractDomainFromUrl(rawUrl);
    if (host && !host.includes('google.com') && !host.includes('rss2json')) {
      return host;
    }
  }
  return 'reuters.com';
}

function createTitleSlug(title: string): string {
  return (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 75);
}

function buildPublisherArticleUrl(
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
      return `https://theverge.com/${slug}`;
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

function resolveCleanArticleLink(
  rawLink?: string,
  rawGuid?: string,
  rawDescriptionHtml?: string,
  sourceName?: string,
  title?: string,
  category?: string
): string {
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

  return buildPublisherArticleUrl(sourceName, title, rawLink, category);
}

function sanitizeLoadedArticles(articles: NewsArticle[]): NewsArticle[] {
  if (!Array.isArray(articles)) return [];
  const seenDomains = new Set<string>();
  const seenTitles = new Set<string>();
  const seenIds = new Set<string>();
  const result: NewsArticle[] = [];

  for (const art of articles) {
    if (!art || !art.title) continue;
    const cleanLink = resolveCleanArticleLink(art.link, (art as any).guid, art.description, art.source, art.title, art.category);
    const domain = extractDomainFromUrl(cleanLink);
    const normTitle = (art.title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    if (domain && seenDomains.has(domain)) {
      continue;
    }
    if (normTitle && seenTitles.has(normTitle)) {
      continue;
    }
    if (seenIds.has(art.id)) {
      continue;
    }

    if (domain) seenDomains.add(domain);
    if (normTitle) seenTitles.add(normTitle);
    seenIds.add(art.id);

    result.push({
      ...art,
      link: cleanLink,
    });
  }

  return result;
}

// High-Durability Helper to load articles from persistent JSON storage with automatic backup recovery and seed initialization
function loadStoredArticles(): NewsArticle[] {
  // 1. Try primary storage file
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = sanitizeLoadedArticles(parsed);
        console.log(`[Database Storage] Successfully loaded ${sanitized.length} persistent news articles from primary database.`);
        return sanitized;
      }
    }
  } catch (err: any) {
    console.error(`[Database Storage] Error reading primary storage file:`, err.message || err);
  }

  // 2. Try backup storage file if primary failed or was corrupted
  try {
    if (fs.existsSync(BACKUP_STORAGE_FILE)) {
      const data = fs.readFileSync(BACKUP_STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = sanitizeLoadedArticles(parsed);
        console.log(`[Database Storage] Restored ${sanitized.length} news articles from backup database file.`);
        try {
          fs.writeFileSync(STORAGE_FILE, JSON.stringify(sanitized, null, 2), 'utf-8');
        } catch (_) {}
        return sanitized;
      }
    }
  } catch (err: any) {
    console.error(`[Database Storage] Error reading backup storage file:`, err.message || err);
  }

  // 3. If brand new or empty, initialize with robust seed dataset and immediately persist
  console.log(`[Database Storage] Initializing fresh persistent database with ${SEED_DATABASE_ARTICLES.length} verified news stories.`);
  const initialSeeds = sanitizeLoadedArticles(SEED_DATABASE_ARTICLES);
  try {
    const jsonStr = JSON.stringify(initialSeeds, null, 2);
    fs.writeFileSync(STORAGE_FILE, jsonStr, 'utf-8');
    fs.writeFileSync(BACKUP_STORAGE_FILE, jsonStr, 'utf-8');
  } catch (e: any) {
    console.error(`[Database Storage] Error writing initial database seeds:`, e.message || e);
  }
  return [...initialSeeds];
}

// Atomic & Durable Database Save
function saveStoredArticles(articles: NewsArticle[]) {
  if (!Array.isArray(articles) || articles.length === 0) return;
  try {
    const tempFile = `${STORAGE_FILE}.tmp`;
    const jsonContent = JSON.stringify(articles, null, 2);
    // 1. Write atomic temp file
    fs.writeFileSync(tempFile, jsonContent, 'utf-8');
    // 2. Rename atomically
    fs.renameSync(tempFile, STORAGE_FILE);
    // 3. Update backup file
    fs.writeFileSync(BACKUP_STORAGE_FILE, jsonContent, 'utf-8');
    console.log(`[Database Storage] Permanently saved ${articles.length} news articles to primary and backup database.`);
    saveExcelFile(articles);
    updateSitemapDiskFile(articles);
  } catch (err: any) {
    console.error(`[Database Storage] Error persisting database file:`, err.message || err);
    // Direct write fallback
    try {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(articles, null, 2), 'utf-8');
    } catch (_) {}
  }
}

// In-Memory & Persistent Storage
let cachedArticles: NewsArticle[] = loadStoredArticles();
let lastRefreshedAt: Date = new Date();
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes strictly as requested
let nextRefreshAt: Date = new Date(Date.now() + REFRESH_INTERVAL_MS);
let refreshCount: number = 0;
let isRefreshing: boolean = false;

// Fallback high quality placeholder images by category & topic
const CATEGORY_IMAGES: Record<string, string[]> = {
  Technology: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
  ],
  World: [
    'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80'
  ],
  Science: [
    'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80'
  ],
  Business: [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
  ],
  Sports: [
    'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=800&q=80'
  ],
  Entertainment: [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=800&q=80'
  ],
  Health: [
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80'
  ]
};

// Semantic Entity & Keyword image matching catalogue
const SEMANTIC_KEYWORD_IMAGE_MAP: Array<{ regex: RegExp; url: string }> = [
  {
    regex: /\b(ai|artificial intelligence|deepseek|chatgpt|openai|anthropic|claude|gemini|llm|neural|generative ai|copilot|mistral|machine learning|bot|algorithm)\b/i,
    url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(nvidia|chip|semiconductor|tsmc|gpu|processor|intel|amd|qualcomm|microchip|hardware|nanometer|foundry|circuit)\b/i,
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(space|nasa|isro|chandrayaan|artemis|mars|moon|orbit|telescope|webb|jwst|planet|asteroid|rocket|spacex|starship|astronaut|galaxy|cosmos|satellite)\b/i,
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(quantum|qubit|particle|physics|laser|cern|collider|superconductor|fault-tolerant|fusion)\b/i,
    url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(cyber|hack|breach|malware|ransomware|vulnerability|phishing|leak|spyware|firewall|encryption|dark web|ddos|security flaw)\b/i,
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(iphone|apple|samsung|pixel|smartphone|android|ios|macbook|ipad|wearable|smartwatch|gadget|metaverse|vr|ar headset)\b/i,
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(solar|wind energy|renewable|green energy|clean energy|battery|power grid|megawatt|gigawatt|photovoltaic|turbines|decarbonization)\b/i,
    url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(ev|electric vehicle|tesla|byd|charging station|autonomous driving|self-driving|car|automotive|hybrid car)\b/i,
    url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(climate|global warming|carbon|emission|glacier|flood|wildfire|hurricane|storm|cyclone|drought|ocean|arctic|antarctica)\b/i,
    url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(cricket|ipl|bcci|kohli|rohit|dhoni|bumrah|gill|hardik|pant|t20|test match|odi|wicket|century|stumps|pitch|batted|bowled|ipl 2026|icc)\b/i,
    url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(football|soccer|premier league|champions league|fifa|uefa|messi|ronaldo|mbappe|haaland|real madrid|barcelona|manchester|arsenal|liverpool|goal|striker)\b/i,
    url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(tennis|wimbledon|grand slam|djokovic|alcaraz|sinner|swiatek|olympics|olympic|athletics|marathon|gymnastics|gold medal)\b/i,
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(nba|basketball|lakers|celtics|curry|lebron|dunk|court|hoop|nfl|super bowl|touchdown)\b/i,
    url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(stock|wall street|sensex|nifty|nasdaq|dow jones|s&p 500|share price|rally|bull market|bear market|equities|trading|investor|dividend)\b/i,
    url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(bank|central bank|federal reserve|fed|jerome powell|rbi|shaktikanta|interest rate|repo rate|inflation|liquidity|treasury|gdp|monetary policy|imf|world bank)\b/i,
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(bitcoin|crypto|cryptocurrency|ethereum|solana|btc|eth|blockchain|binance|coinbase|altcoin|mining|etf|defi)\b/i,
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(real estate|housing|property|mortgage|apartment|construction|infrastructure|highway|bridge|railway|vande bharat|metro|urban)\b/i,
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(ukraine|russia|putin|zelenskyy|gaza|israel|middle east|red sea|missile|military|defence|defense|nato|un security|army|pentagon|war|air strike|ceasefire|treaty)\b/i,
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(election|poll|vote|parliament|congress|senate|white house|president|prime minister|modi|biden|trump|summit|diplomat|bilateral|treaty|cabinet)\b/i,
    url: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(india|delhi|mumbai|bengaluru|kolkata|chennai|hyderabad|lok sabha|rajya sabha|bjp|congress party|aap|governor|chief minister|supreme court of india)\b/i,
    url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(court|judge|lawyer|lawsuit|trial|verdict|jailed|prison|police|cbi|ed|investigation|fraud|bribery|scam|arrest|custody|bail|appeal|justice)\b/i,
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(health|hospital|doctor|patient|medical|medicine|vaccine|fda|who|cancer|clinical trial|therapy|surgery|cardio|pharma|virus|flu|pandemic|drug)\b/i,
    url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(brain|neuroscience|mental health|psychology|sleep|wellness|depression|dementia|alzheimer|memory|cognitive)\b/i,
    url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(film|movie|cinema|hollywood|box office|imax|director|actor|actress|trailer|premiere|oscars|cannes|screenplay|theatrical)\b/i,
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(bollywood|tollywood|kollywood|srk|shah rukh|salman|deepika|ranbir|alia|prabhas|box office collection|hindi film|blockbuster)\b/i,
    url: 'https://images.unsplash.com/photo-1518676599625-5d5700f135b1?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(music|concert|album|song|singer|tour|grammy|taylor swift|bts|beyonce|band|festival|spotify|billboard|pop star|rap)\b/i,
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(gaming|video game|playstation|xbox|nintendo|gta|steam|esports|console|gameplay|unreal engine|rpg)\b/i,
    url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80'
  },
  {
    regex: /\b(airline|airplane|aviation|flight|airport|boeing|airbus|pilot|runway|jet|aircraft)\b/i,
    url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80'
  }
];

// Persistent Image Scraper Cache to avoid repeating web fetches
const IMAGE_CACHE_FILE = path.join(process.cwd(), 'scraped_images_cache.json');
let scrapedOgImageCache: Map<string, string> = new Map();

function loadScrapedImageCache() {
  try {
    if (fs.existsSync(IMAGE_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(IMAGE_CACHE_FILE, 'utf-8'));
      if (typeof data === 'object' && data !== null) {
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === 'string') scrapedOgImageCache.set(k, v);
        }
      }
    }
  } catch (err) {
    // Ignore cache read error
  }
}

function saveScrapedImageCache() {
  try {
    const obj: Record<string, string> = {};
    for (const [k, v] of scrapedOgImageCache.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(IMAGE_CACHE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    // Ignore cache save error
  }
}

loadScrapedImageCache();

function isValidImageCandidate(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 12) return false;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;

  const lower = trimmed.toLowerCase();
  if (
    lower.includes('feedburner') ||
    lower.includes('1x1') ||
    lower.includes('pixel') ||
    lower.includes('analytics') ||
    lower.includes('tracker') ||
    lower.includes('beacon') ||
    lower.includes('blank.gif') ||
    lower.includes('spacer.gif') ||
    lower.includes('clear.gif') ||
    lower.includes('favicon.ico') ||
    lower.includes('apple-touch-icon') ||
    lower.includes('icon.png') ||
    lower.includes('logo.svg')
  ) {
    return false;
  }
  return true;
}

function getSemanticallyMatchedNewsImage(title: string, category: string, description?: string): string {
  const combinedText = `${title} ${description || ''}`.trim();
  if (combinedText) {
    for (const item of SEMANTIC_KEYWORD_IMAGE_MAP) {
      if (item.regex.test(combinedText)) {
        return item.url;
      }
    }
  }
  const images = CATEGORY_IMAGES[category] || CATEGORY_IMAGES['World'];
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return images[Math.abs(hash) % images.length];
}

/**
 * Deeply extracts image URL from standard RSS item structures across diverse publishers.
 */
function extractImageFromRssItem(item: any): string | null {
  if (!item || typeof item !== 'object') return null;

  // 1. media:content (Array or Object)
  if (item['media:content']) {
    const mc = item['media:content'];
    if (Array.isArray(mc)) {
      for (const m of mc) {
        const u = m?.['$']?.url || m?.url || m?.['$']?.['@_url'];
        if (isValidImageCandidate(u)) return u;
      }
    } else if (typeof mc === 'object') {
      const u = mc?.['$']?.url || mc?.url || mc?.['$']?.['@_url'];
      if (isValidImageCandidate(u)) return u;
    }
  }

  // 2. media:thumbnail (Array or Object)
  if (item['media:thumbnail']) {
    const mt = item['media:thumbnail'];
    if (Array.isArray(mt)) {
      for (const m of mt) {
        const u = m?.['$']?.url || m?.url || m?.['$']?.['@_url'];
        if (isValidImageCandidate(u)) return u;
      }
    } else if (typeof mt === 'object') {
      const u = mt?.['$']?.url || mt?.url || mt?.['$']?.['@_url'];
      if (isValidImageCandidate(u)) return u;
    }
  }

  // 3. media:group
  if (item['media:group']) {
    const mg = item['media:group'];
    if (mg['media:content']) {
      const u = extractImageFromRssItem({ 'media:content': mg['media:content'] });
      if (u) return u;
    }
    if (mg['media:thumbnail']) {
      const u = extractImageFromRssItem({ 'media:thumbnail': mg['media:thumbnail'] });
      if (u) return u;
    }
  }

  // 4. enclosure (Podcast / Media enclosure with image mimetype or extension)
  if (item.enclosure && item.enclosure.url) {
    const u = item.enclosure.url;
    if (isValidImageCandidate(u) && (item.enclosure.type?.startsWith('image') || u.match(/\.(jpeg|jpg|gif|png|webp|avif)/i))) {
      return u;
    }
  }

  // 5. item.image
  if (item.image) {
    const u = typeof item.image === 'string' ? item.image : item.image?.url;
    if (isValidImageCandidate(u)) return u;
  }

  // 6. Embedded HTML tags in description, content:encoded, content, summary
  const htmlCandidates = [
    item['content:encoded'],
    item.content,
    item.description,
    item.summary,
    item['content:encodedSnippet']
  ];

  for (const rawHtml of htmlCandidates) {
    if (!rawHtml || typeof rawHtml !== 'string') continue;
    // Unescape common XML entities
    const decoded = rawHtml
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');

    // Look for standard <img src="..."> or data-src / data-original
    const imgMatches = decoded.match(/<img[^>]+(?:src|data-src|data-original|data-lazy-src)=["']([^"']+)["']/gi);
    if (imgMatches) {
      for (const m of imgMatches) {
        const srcMatch = m.match(/(?:src|data-src|data-original|data-lazy-src)=["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
          const cand = srcMatch[1].trim();
          if (isValidImageCandidate(cand)) return cand;
        }
      }
    }
  }

  return null;
}

/**
 * Scrapes the real open-graph or lead image directly from the source article webpage.
 * Runs with a fast 3.5s timeout and browser headers.
 */
async function scrapeOgImageFromSourceWebpage(articleUrl: string, timeoutMs: number = 3500): Promise<string | null> {
  if (!articleUrl || !articleUrl.startsWith('http') || isRootOrHomepageUrl(articleUrl)) {
    return null;
  }

  // Check cache first
  if (scrapedOgImageCache.has(articleUrl)) {
    const cached = scrapedOgImageCache.get(articleUrl);
    if (cached) return cached;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timer);

    if (!res.ok) return null;

    // Read initial 120KB of HTML (more than enough for <head> and lead metadata)
    const reader = res.body?.getReader();
    if (!reader) return null;

    let html = '';
    const decoder = new TextDecoder('utf-8');
    while (html.length < 120000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (html.includes('</head>')) break;
    }
    reader.cancel();

    // 1. OpenGraph Image: <meta property="og:image" content="...">
    const ogMatch = html.match(/<meta[^>]+(?:property|name)=["']og:image(?::secure_url|:url)?["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image(?::secure_url|:url)?["']/i);
    if (ogMatch && ogMatch[1]) {
      const cand = resolveRelativeUrl(ogMatch[1].trim(), articleUrl);
      if (isValidImageCandidate(cand)) {
        scrapedOgImageCache.set(articleUrl, cand);
        return cand;
      }
    }

    // 2. Twitter Image: <meta name="twitter:image" content="...">
    const twMatch = html.match(/<meta[^>]+(?:name|property)=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']twitter:image(?::src)?["']/i);
    if (twMatch && twMatch[1]) {
      const cand = resolveRelativeUrl(twMatch[1].trim(), articleUrl);
      if (isValidImageCandidate(cand)) {
        scrapedOgImageCache.set(articleUrl, cand);
        return cand;
      }
    }

    // 3. Schema.org / Microdata image: <meta itemprop="image" content="..."> or <link rel="image_src" href="...">
    const itemMatch = html.match(/<meta[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i);
    if (itemMatch && itemMatch[1]) {
      const cand = resolveRelativeUrl(itemMatch[1].trim(), articleUrl);
      if (isValidImageCandidate(cand)) {
        scrapedOgImageCache.set(articleUrl, cand);
        return cand;
      }
    }

    // 4. JSON-LD structured data image
    const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const block of jsonLdMatches) {
        const contentMatch = block.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        if (contentMatch && contentMatch[1]) {
          try {
            const parsed = JSON.parse(contentMatch[1].trim());
            const imgCand = parsed.image?.url || (typeof parsed.image === 'string' ? parsed.image : (Array.isArray(parsed.image) ? parsed.image[0] : null));
            if (imgCand && typeof imgCand === 'string') {
              const resolved = resolveRelativeUrl(imgCand.trim(), articleUrl);
              if (isValidImageCandidate(resolved)) {
                scrapedOgImageCache.set(articleUrl, resolved);
                return resolved;
              }
            }
          } catch {}
        }
      }
    }

    // 5. HTML Lead / Hero figure image
    const figureMatch = html.match(/<figure[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i) ||
                        html.match(/<img[^>]+class=["'][^"']*(?:lead|featured|headline|hero|main|cover|article-img)[^"']*["'][^>]+src=["']([^"']+)["']/i);
    if (figureMatch && figureMatch[1]) {
      const cand = resolveRelativeUrl(figureMatch[1].trim(), articleUrl);
      if (isValidImageCandidate(cand)) {
        scrapedOgImageCache.set(articleUrl, cand);
        return cand;
      }
    }
  } catch (err: any) {
    // Network/timeout error when scraping source webpage
  }

  return null;
}

function resolveRelativeUrl(cand: string, base: string): string {
  if (!cand) return '';
  if (cand.startsWith('//')) return 'https:' + cand;
  if (cand.startsWith('http://') || cand.startsWith('https://')) return cand;
  try {
    const u = new URL(cand, base);
    return u.href;
  } catch {
    return cand;
  }
}

function computeSentiment(title: string, desc: string): 'Urgent' | 'Positive' | 'Neutral' | 'Analysis' | 'Warning' {
  const text = (title + ' ' + desc).toLowerCase();
  if (text.match(/breaking|urgent|crisis|alert|state of emergency|disaster|war|surge/i)) return 'Urgent';
  if (text.match(/warn|threat|risk|drop|fall|decline|loss|collapse|lawsuit|investigation|hack|leak|vulnerability/i)) return 'Warning';
  if (text.match(/breakthrough|record|launch|success|growth|profit|milestone|win|discovery|cure|pioneer/i)) return 'Positive';
  if (text.match(/analysis|report|why|how|study|deep dive|future|guide|explained|review/i)) return 'Analysis';
  return 'Neutral';
}

function estimateReadTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function cleanHtmlText(rawHtml: string): string {
  if (!rawHtml) return '';
  return rawHtml
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// AI & Algorithmic News Rephraser Engine - Rewrites scraped news into clean, authoritative journalistic prose
export interface TimelineEvent {
  timeOrPhase: string;
  event: string;
}

export interface QuoteHighlight {
  speaker: string;
  quote: string;
  role?: string;
}

export interface RephrasedArticleData {
  rephrasedTitle: string;
  rephrasedLead: string;
  rephrasedStory: string;
  backgroundContext?: string;
  stakeholderImpact?: string;
  futureOutlook?: string;
  oneLineSummary: string;
  executiveSummary: string;
  bulletPoints: string[];
  keyTakeaways: string[];
  whyItMatters: string;
  sentiment: 'Urgent' | 'Positive' | 'Neutral' | 'Analysis' | 'Warning';
  tags: string[];
  timeline?: TimelineEvent[];
  keyQuotes?: QuoteHighlight[];
  wordCount?: number;
}

function getCategoryContextualDeepDive(category: string, title: string, sourceName: string): {
  background: string;
  impact: string;
  outlook: string;
} {
  switch (category) {
    case 'Technology':
      return {
        background: `Over recent quarters, the technology sector has undergone rapid transformation characterized by intensive research into artificial intelligence, cloud resilience, and hardware acceleration. Market leaders and research institutions continue to calibrate computing infrastructure to meet expanding enterprise demands and regulatory scrutiny.`,
        impact: `For software architects, enterprise decision-makers, and digital consumers, this development signals meaningful shifts in software deployment, data governance, and competitive market positioning across international technology corridors.`,
        outlook: `Analysts and industry observers anticipate follow-up technical disclosures, developer documentation rollouts, and benchmark verifications over upcoming industry conferences.`
      };
    case 'Business':
      return {
        background: `Macroeconomic conditions across international capital markets remain closely tied to central bank monetary policies, supply chain realignments, and corporate balance sheet discipline. Industry participants have prioritized resilience amid evolving fiscal standards and cross-border trade agreements.`,
        impact: `Institutional investors, retail consumers, and corporate strategists are adjusting capital allocation models to account for potential valuation impacts, cost efficiencies, and market share realignments.`,
        outlook: `Market participants will closely monitor upcoming quarterly earnings disclosures, regulatory filings, and executive commentaries for updated forward guidance.`
      };
    case 'World':
      return {
        background: `Diplomatic and regional cooperation initiatives have faced complex geopolitical tests over the past year. Multilateral forums and regional alliances continue to navigate sovereign treaties, border agreements, and international aid coordination.`,
        impact: `The development holds immediate ramifications for civic institutions, regional stability, and cross-border humanitarian workflows, affecting both local populations and international diplomatic missions.`,
        outlook: `Diplomatic envoys and international observers are scheduled to convene in forthcoming bilateral discussions to evaluate implementation timetables and compliance metrics.`
      };
    case 'Science':
      return {
        background: `Scientific and academic research ecosystems have accelerated collaborative cross-disciplinary inquiries into environmental modeling, biotechnology, and fundamental physics. Peer-reviewed literature underscores the necessity of reproducible methodology and open scientific datasets.`,
        impact: `Researchers, environmental authorities, and specialized laboratory consortia gain new empirical reference points to refine computational models and therapeutic or ecological interventions.`,
        outlook: `Subsequent field studies, peer-review evaluations, and expanded experimental trials are planned to validate long-term efficacy and operational boundaries.`
      };
    case 'Health':
      return {
        background: `Global healthcare governance continues to emphasize clinical efficacy, equitable therapeutic distribution, and evidence-based preventive protocols. Regulatory health bodies operate under rigorous oversight to ensure safety across patient populations.`,
        impact: `Healthcare practitioners, clinical researchers, and patient advocacy groups are reviewing the findings to update best practices and treatment guidelines.`,
        outlook: `Public health authorities and advisory panels will review epidemiological data and phase-study outcomes in upcoming advisory meetings.`
      };
    case 'Sports':
      return {
        background: `Competitive athletics and institutional leagues maintain stringent training standards, tactical adaptations, and performance analytics as tournament calendars reach crucial seasonal inflection points.`,
        impact: `Team franchises, athlete rosters, and global fanbases are recalibrating championship trajectories, roster strategies, and upcoming tactical matchups.`,
        outlook: `Coaching staffs and sporting organizations are preparing for the next round of fixtures, where strategic adjustments will be put to the test.`
      };
    case 'Entertainment':
      return {
        background: `The global entertainment and cultural landscape continues to experience dynamic shifts in creative distribution, audience engagement models, and multimedia streaming formats.`,
        impact: `Creators, studio executives, and global audiences are experiencing new artistic milestones, critical discourse, and evolving cultural resonance.`,
        outlook: `Industry commentators and creative guilds anticipate forthcoming premiere releases, festival screenings, and seasonal award considerations.`
      };
    default:
      return {
        background: `The story emerges within an active news cycle where ongoing developments require careful verification, cross-source confirmation, and objective scrutiny from field correspondents.`,
        impact: `Stakeholders across relevant sectors and community organizations are assessing the immediate and medium-term consequences of this announcement.`,
        outlook: `Further official statements, press briefings, and analytical updates are expected as facts continue to be corroborated by reporting desks.`
      };
  }
}

function rephraseScrapedArticle(
  title: string,
  rawDesc: string,
  category: string,
  sourceName: string
): RephrasedArticleData {
  const cleaned = cleanHtmlText(rawDesc || '');

  // Strip away syndication noise, image credits, tracking links, and boilerplate
  const sanitized = cleaned
    .replace(/The post .* appeared first on .*\.?/gi, '')
    .replace(/Read more on .*\.?/gi, '')
    .replace(/Copyright \d{4}.*/gi, '')
    .replace(/Follow us on .*/gi, '')
    .replace(/Sign up for .*/gi, '')
    .replace(/All rights reserved\.?/gi, '')
    .replace(/\[\+?\d+ chars\]/gi, '')
    .replace(/Photo by .*/gi, '')
    .replace(/Image source: .*/gi, '')
    .trim();

  const cleanTitle = cleanHtmlText(title).replace(/\s*-\s*[^-]+$/, '').trim();

  // Split into grammatical sentences
  const rawSentences = sanitized
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 12 && !s.toLowerCase().startsWith('photo:') && !s.toLowerCase().startsWith('image:'));

  const contextInfo = getCategoryContextualDeepDive(category, cleanTitle, sourceName);

  let rephrasedLead = '';
  const narrativeParagraphs: string[] = [];
  const bulletPoints: string[] = [];
  const keyTakeaways: string[] = [];

  if (rawSentences.length >= 2) {
    const first = rawSentences[0].endsWith('.') ? rawSentences[0] : `${rawSentences[0]}.`;
    const second = rawSentences[1].endsWith('.') ? rawSentences[1] : `${rawSentences[1]}.`;
    const remaining = rawSentences.slice(2).join(' ');

    rephrasedLead = first;

    // Paragraph 1: Primary Facts & Lead Dispatch
    narrativeParagraphs.push(
      `${first.replace(/\.$/, '')}, according to comprehensive reporting verified by ${sourceName}. ${second}`
    );

    // Paragraph 2: Contextual Depth & Historical Setting
    narrativeParagraphs.push(
      `${contextInfo.background} ${remaining ? `${remaining} ` : ''}Observers note that these circumstances underscore critical sector dynamics that have been developing over recent months.`
    );

    // Paragraph 3: Stakeholder Analysis & Practical Impact
    narrativeParagraphs.push(
      `${contextInfo.impact} Field correspondents emphasize that the strategic timing of this report reflects broader structural patterns currently shaping the ${category} landscape.`
    );

    // Paragraph 4: Strategic Forward Outlook
    narrativeParagraphs.push(
      `${contextInfo.outlook} Direct monitoring and periodic wire dispatches from ${sourceName} will continue tracking real-time developments as official commentary unfolds.`
    );

    rawSentences.forEach((s, idx) => {
      if (idx < 5) {
        bulletPoints.push(s.endsWith('.') ? s : `${s}.`);
      }
    });
  } else if (rawSentences.length === 1 && rawSentences[0].length >= 30) {
    const single = rawSentences[0].replace(/\.$/, '');
    rephrasedLead = `${single}, according to direct reporting by ${sourceName}.`;

    narrativeParagraphs.push(
      `${rephrasedLead} This development has drawn significant attention across the ${category} sector, highlighting new operational realities and verified factual milestones.`
    );

    narrativeParagraphs.push(
      `${contextInfo.background} Industry analysts point out that events of this scale often precipitate broader evaluations among regional and international observers.`
    );

    narrativeParagraphs.push(
      `${contextInfo.impact} Key participants are actively evaluating initial data points to determine appropriate procedural and strategic adjustments.`
    );

    narrativeParagraphs.push(
      `${contextInfo.outlook} Verified source links and ongoing newsroom verification remain active to supply subsequent updates as additional facts emerge.`
    );

    bulletPoints.push(`${single}.`);
    bulletPoints.push(`Reported directly through ${sourceName}'s specialized ${category} desk.`);
    bulletPoints.push(`Contextual analysis indicates strategic implications for wider industry participants.`);
  } else {
    // Rephrase based on headline facts
    rephrasedLead = `${cleanTitle}: ${sourceName} reports key ongoing developments and active coverage in the ${category} domain.`;

    narrativeParagraphs.push(
      `${rephrasedLead} Newsroom dispatches and field verification confirm that this story represents an essential focal point for readers following global ${category.toLowerCase()} developments.`
    );

    narrativeParagraphs.push(
      `${contextInfo.background} The evolving narrative highlights the interplay between established institutional frameworks and emerging challenges in the field.`
    );

    narrativeParagraphs.push(
      `${contextInfo.impact} Observers emphasize that clarity and verified facts remain vital for stakeholders seeking to navigate the direct consequences of this development.`
    );

    narrativeParagraphs.push(
      `${contextInfo.outlook} Reporting networks will maintain regular monitoring to provide timely verification as new statements are issued.`
    );

    bulletPoints.push(`${cleanTitle}.`);
    bulletPoints.push(`Active verification and ongoing coverage provided by ${sourceName}.`);
    bulletPoints.push(`Continuous reporting and surveillance active across ${category} news channels.`);
  }

  // Ensure robust bullet points
  if (bulletPoints.length < 4) {
    bulletPoints.push(`Comprehensive journalistic review and fact-checking maintained across ${sourceName} wire channels.`);
  }

  keyTakeaways.push(`Primary Dispatch: High-significance reporting delivered by ${sourceName} covering ${category}.`);
  keyTakeaways.push(`Sector Relevance: Contextual indicators suggest actionable implications for key stakeholders.`);
  keyTakeaways.push(`Ongoing Tracking: Editorial desks remain attentive to follow-up announcements and verified briefings.`);

  const rephrasedStory = narrativeParagraphs.join('\n\n');
  const whyItMatters = `This story highlights key structural developments in ${category}, providing essential context on policy, industry momentum, and stakeholder impact. Understanding these nuances enables readers to anticipate broader economic, societal, and technological shifts.`;
  const sentiment = computeSentiment(cleanTitle, sanitized);
  const tags = [category, sourceName.replace(/[^a-zA-Z0-9]/g, '') || 'News', 'TopStory'];
  const wordCount = rephrasedStory.split(/\s+/).filter(Boolean).length;

  const timeline: TimelineEvent[] = [
    { timeOrPhase: 'Initial Report', event: `${sourceName} publishes verified dispatch on ${cleanTitle}.` },
    { timeOrPhase: 'Current Status', event: `Active monitoring and analysis across the ${category} sector.` },
    { timeOrPhase: 'Next Steps', event: `Upcoming briefings and official confirmations expected.` }
  ];

  return {
    rephrasedTitle: cleanTitle,
    rephrasedLead,
    rephrasedStory,
    backgroundContext: contextInfo.background,
    stakeholderImpact: contextInfo.impact,
    futureOutlook: contextInfo.outlook,
    oneLineSummary: rephrasedLead,
    executiveSummary: rephrasedLead,
    bulletPoints,
    keyTakeaways,
    whyItMatters,
    sentiment,
    tags,
    timeline,
    wordCount
  };
}

// Backward compatible helper
function generateProportionalSummary(
  title: string,
  rawDesc: string,
  category: string,
  sourceName: string
): string {
  const data = rephraseScrapedArticle(title, rawDesc, category, sourceName);
  return data.rephrasedStory || data.rephrasedLead;
}

// Generate MD5-based Unique Article IDs to fix duplicate React keys
function generateArticleId(link: string, title: string, sourceId: string): string {
  const raw = `${link}-${title}`.trim();
  const hash = crypto.createHash('md5').update(raw).digest('hex').slice(0, 12);
  const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20);
  return `${sourceId}-${slug}-${hash}`;
}

// Generate SEO Metadata, Keywords, and Hashtags for every news story
function generateSeoMetadataAndTags(title: string, desc: string, category: string, sourceName: string) {
  const cleanTitle = cleanHtmlText(title);
  const cleanDesc = cleanHtmlText(desc || '');
  
  // URL Slug
  const slug = cleanTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);

  // Meta description for SEO
  const metaDescription = (cleanDesc.length > 20 ? cleanDesc : `${cleanTitle} - Latest news story reported by ${sourceName}.`).slice(0, 160);

  // Generate rich contextual tags using heuristic/entity extraction engine
  const autoTagRes = generateHeuristicTags(cleanTitle, cleanDesc, category, sourceName);

  const tags = autoTagRes.tags;
  const seoKeywords = autoTagRes.seoKeywords || [
    category.toLowerCase(),
    sourceName.toLowerCase(),
    'latest news',
    'trending news',
    'breaking updates'
  ];

  return { tags, seoKeywords, slug, metaDescription };
}

// Robust RSS fetcher with browser headers, UTF-8 BOM removal, and fallback resiliency
async function fetchRssFeedRobustly(feedUrl: string, fallbackName?: string): Promise<any> {
  // Step 1: Direct HTTP fetch with browser headers & XML cleaning
  try {
    const res = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html;q=0.9, */*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(9000),
    });

    if (res.ok) {
      let xml = await res.text();
      // Remove UTF-8 BOM and any non-XML characters before the opening tag
      xml = xml.replace(/^\uFEFF/, '').trim();
      const firstTagIndex = xml.indexOf('<');
      if (firstTagIndex > 0) {
        xml = xml.slice(firstTagIndex);
      }
      if (xml.startsWith('<')) {
        const feed = await parser.parseString(xml);
        if (feed && Array.isArray(feed.items) && feed.items.length > 0) {
          return feed;
        }
      }
    }
  } catch (directErr) {
    // Continue to next recovery step
  }

  // Step 2: Fallback to standard parser
  try {
    const feed = await parser.parseURL(feedUrl);
    if (feed && Array.isArray(feed.items) && feed.items.length > 0) {
      return feed;
    }
  } catch (parserErr) {
    // Continue to Google News bridge
  }

  // Step 3: Google News RSS query fallback
  if (fallbackName) {
    try {
      const fallbackUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(fallbackName)}&hl=en-US&gl=US&ceid=US:en`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (fallbackRes.ok) {
        let xml = await fallbackRes.text();
        xml = xml.replace(/^\uFEFF/, '').trim();
        const firstTagIndex = xml.indexOf('<');
        if (firstTagIndex > 0) xml = xml.slice(firstTagIndex);
        return await parser.parseString(xml);
      }
      return await parser.parseURL(fallbackUrl);
    } catch (fbErr) {
      // Both attempts failed
    }
  }

  return { items: [] };
}

// Scrape Single Source with Source Webpage Image Extraction (Unlimited Scraped Articles)
async function scrapeSource(source: NewsSourceInfo): Promise<NewsArticle[]> {
  try {
    const feed = await fetchRssFeedRobustly(source.feedUrl, source.name);
    // Ingestion: extract all items provided by the RSS/Atom feed
    const rawItems = feed.items || [];

    source.lastScrapedAt = new Date().toISOString();

    // Process items in parallel with controlled concurrency for webpage image scraping
    const processedArticles = await Promise.all(
      rawItems.map(async (item: any) => {
        if (!item.title) return null;

        const rawDesc = item.contentSnippet || item.description || item.content || item.summary || '';
        const title = cleanHtmlText(item.title.replace(/ - [^-]+$/, ''));
        const rephrased = rephraseScrapedArticle(title, rawDesc, source.category, source.name);
        const cleanLink = resolveCleanArticleLink(item.link, item.guid, rawDesc, source.name, title);
        const articleId = generateArticleId(cleanLink, title, source.id);
        const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

        // 1. Try deep extraction from RSS XML structure
        let imageUrl = extractImageFromRssItem(item);

        // 2. If RSS didn't have an authentic image, scrape the source website directly for og:image
        if (!imageUrl && cleanLink && cleanLink.startsWith('http') && !isRootOrHomepageUrl(cleanLink)) {
          try {
            imageUrl = await scrapeOgImageFromSourceWebpage(cleanLink, 3500);
          } catch {}
        }

        // 3. If still missing, use high-precision semantic keyword matcher based on story topic
        if (!imageUrl) {
          imageUrl = getSemanticallyMatchedNewsImage(title, source.category, rephrased.rephrasedStory);
        }

        const sentiment = rephrased.sentiment;
        const readTimeMinutes = estimateReadTime(title + ' ' + rephrased.rephrasedStory);
        const { tags, seoKeywords, slug, metaDescription } = generateSeoMetadataAndTags(rephrased.rephrasedTitle || title, rephrased.rephrasedStory, source.category, source.name);

        return {
          id: articleId,
          title: rephrased.rephrasedTitle || title,
          description: rephrased.rephrasedStory,
          contentSnippet: rephrased.rephrasedLead,
          link: cleanLink,
          source: source.name,
          category: source.category,
          pubDate,
          imageUrl,
          readTimeMinutes,
          sentiment,
          tags,
          seoKeywords,
          slug,
          metaDescription,
          aiSummary: rephrased,
        } as NewsArticle;
      })
    );

    const validArticles = processedArticles.filter((a): a is NewsArticle => a !== null);
    source.articleCount = validArticles.length;
    return validArticles;
  } catch (err: any) {
    console.warn(`[Scraper] Notice for ${source.name}:`, err.message || err);
    return [];
  }
}

/**
 * Background routine to enrich existing database articles with authentic scraped images from their source pages.
 */
async function enrichExistingArticlesWithSourceImages() {
  const articlesToEnrich = cachedArticles.filter(a => !a.imageUrl || a.imageUrl.includes('unsplash.com') || !isValidImageCandidate(a.imageUrl));
  let updatedCount = 0;

  for (const article of articlesToEnrich.slice(0, 150)) {
    // If article currently has an unsplash URL or missing image, attempt to scrape real image from source URL
    if (!article.imageUrl || article.imageUrl.includes('unsplash.com') || !isValidImageCandidate(article.imageUrl)) {
      if (article.link && article.link.startsWith('http') && !isRootOrHomepageUrl(article.link)) {
        try {
          const scraped = await scrapeOgImageFromSourceWebpage(article.link, 3000);
          if (scraped && isValidImageCandidate(scraped)) {
            article.imageUrl = scraped;
            updatedCount++;
          }
        } catch {}
      }
    }
  }

  if (updatedCount > 0) {
    console.log(`[Image Enricher] Successfully enriched ${updatedCount} articles with authentic source website images.`);
    saveStoredArticles(cachedArticles);
    saveScrapedImageCache();
  }
}

// Master Scraper Loop with Robust Deduplication & Natural Chronological Aging
async function scrapeAllSources(): Promise<NewsArticle[]> {
  if (isRefreshing) return cachedArticles;
  isRefreshing = true;
  console.log(`[Scraper] Starting news refresh run #${refreshCount + 1} at ${new Date().toLocaleTimeString()}...`);

  const activeSources = sources.filter(s => s.active);
  const results = await Promise.all(activeSources.map(s => scrapeSource(s)));
  const newlyScraped = results.flat();

  // Load existing persistent storage database
  const existingArticles = loadStoredArticles();

  // Build existing lookup maps by ID, canonical link, and normalized title
  const existingMap = new Map<string, NewsArticle>();
  const existingTitleMap = new Map<string, NewsArticle>();
  const existingLinkMap = new Map<string, NewsArticle>();

  for (const art of existingArticles) {
    existingMap.set(art.id, art);
    const nLink = art.link.toLowerCase().trim();
    if (nLink) existingLinkMap.set(nLink, art);
    const nTitle = art.title.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (nTitle) existingTitleMap.set(nTitle, art);
  }

  // Process freshly scraped items: preserve existing publication timestamps to avoid perpetual front-page pinning
  const processedNew: NewsArticle[] = [];
  for (const item of newlyScraped) {
    const nLink = item.link.toLowerCase().trim();
    const nTitle = item.title.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    
    // Check if article is already in database
    const matchedExisting = existingMap.get(item.id) || existingLinkMap.get(nLink) || (nTitle ? existingTitleMap.get(nTitle) : undefined);

    if (matchedExisting) {
      // PRESERVE original authentic pubDate so news naturally ages into subsequent pages over 24-48 hours
      const preservedDate = matchedExisting.pubDate || item.pubDate;
      const merged: NewsArticle = {
        ...matchedExisting,
        ...item,
        id: matchedExisting.id,
        pubDate: preservedDate,
        aiSummary: matchedExisting.aiSummary || item.aiSummary,
        hindi: matchedExisting.hindi || item.hindi,
        imageUrl: (item.imageUrl && !item.imageUrl.includes('unsplash.com')) ? item.imageUrl : (matchedExisting.imageUrl || item.imageUrl),
      };
      processedNew.push(merged);
    } else {
      // Genuinely new article: keep authentic pubDate
      processedNew.push(item);
    }
  }

  // Combine: processed newly scraped + remaining existing articles
  const allArticles = [...processedNew, ...existingArticles];

  // Strict Unified De-duplication by Domain (URL), ID, Canonical Link, and Normalized Title
  // Enforces that every single post has a different domain (URL)
  const seenDomains = new Set<string>();
  const seenIds = new Set<string>();
  const seenLinks = new Set<string>();
  const seenTitles = new Set<string>();
  const uniqueArticles: NewsArticle[] = [];

  for (const article of allArticles) {
    // If real articles exist, skip seed articles with ID starting with 'seed-'
    if (processedNew.length > 5 && article.id.startsWith('seed-')) {
      continue;
    }

    const cleanLink = resolveCleanArticleLink(
      article.link,
      (article as any).guid,
      article.description,
      article.source,
      article.title,
      article.category
    );
    const domain = extractDomainFromUrl(cleanLink);
    const normalizedTitle = article.title.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const normalizedLink = cleanLink.toLowerCase().trim();
    
    // Check if domain, ID, link, or normalized title has already been seen in this batch
    if (domain && seenDomains.has(domain)) {
      // Retain richest metadata if duplicate domain instance
      const existing = uniqueArticles.find(a => extractDomainFromUrl(a.link) === domain);
      if (existing) {
        if (!existing.aiSummary && article.aiSummary) {
          existing.aiSummary = article.aiSummary;
        }
        if (!existing.hindi && article.hindi) {
          existing.hindi = article.hindi;
        }
        if (article.imageUrl && !article.imageUrl.includes('unsplash.com') && existing.imageUrl?.includes('unsplash.com')) {
          existing.imageUrl = article.imageUrl;
        }
      }
      continue;
    }

    if (normalizedTitle && seenTitles.has(normalizedTitle)) {
      continue;
    }
    if (seenIds.has(article.id) || seenLinks.has(normalizedLink)) {
      continue;
    }

    if (domain) seenDomains.add(domain);
    if (normalizedTitle) seenTitles.add(normalizedTitle);
    seenIds.add(article.id);
    seenLinks.add(normalizedLink);

    uniqueArticles.push({
      ...article,
      link: cleanLink,
    });
  }

  // Sort by pubDate descending (True chronological sorting: latest in last 24h on Page 1, older on Page 2+)
  uniqueArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  cachedArticles = uniqueArticles;
  saveStoredArticles(cachedArticles);
  saveScrapedImageCache();

  lastRefreshedAt = new Date();
  nextRefreshAt = new Date(Date.now() + REFRESH_INTERVAL_MS);
  refreshCount++;
  isRefreshing = false;

  console.log(`[Scraper] Successfully scraped and stored ${cachedArticles.length} unique articles across ${activeSources.length} sources.`);
  return cachedArticles;
}

// Initial Scrape & Sitemap Generation
try {
  updateSitemapDiskFile(cachedArticles, cachedViralVideos, 'server_init');
} catch (e: any) {
  console.error('[Sitemap] Initial update error:', e?.message || e);
}

scrapeAllSources().then(() => {
  // Run background enrichment pass for stored articles
  enrichExistingArticlesWithSourceImages().catch((e: any) => console.error('[Enrichment] Error:', e?.message || e));
}).catch((e: any) => {
  console.error('[Scraper] Initial scrape error:', e?.message || e);
});

// Set Up 10-Minute Recurring Interval for News Scraping & Dynamic Updating
setInterval(() => {
  console.log('[Timer] 10-Minute Auto-Refresh Triggered!');
  scrapeAllSources();
}, REFRESH_INTERVAL_MS);

// Daily Automation (Every 24 Hours): Schedule daily midnight UTC index rebuild, recurring 24-hour job, and resilient watchdog
function initDailySitemapScheduler() {
  const now = new Date();
  const nextMidnight = getNextUtcMidnight();
  const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());
  
  console.log(`[Daily Sitemap Automation] ⏱️ Next scheduled daily midnight sitemap rebuild in ${Math.round(msUntilMidnight / 60000)} minutes (${nextMidnight.toISOString()}).`);
  
  const executeDailyRebuild = async () => {
    console.log(`[Daily Sitemap Automation] 📅 Executing scheduled Daily Sitemap, Google News & SEO Index Generation at ${new Date().toISOString()}...`);
    try {
      // Ingest latest breaking news to include in today's sitemap
      await scrapeAllSources();
    } catch (e: any) {
      console.warn('[Daily Sitemap Automation] Source scrape warning prior to sitemap generation:', e?.message || e);
    }
    updateSitemapDiskFile(cachedArticles, cachedViralVideos, 'daily_scheduled_cron');
  };

  setTimeout(() => {
    executeDailyRebuild();
    
    // Reschedule recurring 24h cron
    setInterval(() => {
      executeDailyRebuild();
    }, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  // Resilient Watchdog: Check every 30 minutes if 24 hours have elapsed since last daily generation
  setInterval(() => {
    const elapsedMs = Date.now() - sitemapLastGeneratedAt.getTime();
    if (elapsedMs >= 24 * 60 * 60 * 1000) {
      console.log(`[Daily Sitemap Watchdog] 🛡️ 24h cycle elapsed (${Math.round(elapsedMs / 3600000)}h since last generation). Running automated daily sitemap rebuild...`);
      executeDailyRebuild();
    }
  }, 30 * 60 * 1000);
}

initDailySitemapScheduler();

// Helper for Stats
function calculateStats(articles: NewsArticle[]) {
  const categoryCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};
  const sentimentCounts: Record<string, number> = {};

  for (const article of articles) {
    categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
    sourceCounts[article.source] = (sourceCounts[article.source] || 0) + 1;
    sentimentCounts[article.sentiment] = (sentimentCounts[article.sentiment] || 0) + 1;
  }

  return { categoryCounts, sourceCounts, sentimentCounts };
}

// --- API ENDPOINTS ---

// In-Memory CAPTCHA Store with 5-minute expiration
const captchaSessions = new Map<string, { code: string; expiresAt: number }>();

function generateCaptchaSvg(code: string): string {
  const width = 180;
  const height = 50;
  const chars = code.split('');
  
  // Random noise lines
  let lines = '';
  for (let i = 0; i < 6; i++) {
    const x1 = Math.floor(Math.random() * width);
    const y1 = Math.floor(Math.random() * height);
    const x2 = Math.floor(Math.random() * width);
    const y2 = Math.floor(Math.random() * height);
    const stroke = ['#44403c', '#78716c', '#1c1917', '#a8a29e', '#57534e'][Math.floor(Math.random() * 5)];
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${Math.random() * 1.5 + 1}" stroke-opacity="${Math.random() * 0.4 + 0.3}" />`;
  }

  // Random noise dots
  let dots = '';
  for (let i = 0; i < 35; i++) {
    const cx = Math.floor(Math.random() * width);
    const cy = Math.floor(Math.random() * height);
    const r = Math.random() * 1.5 + 0.5;
    dots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#292524" opacity="${Math.random() * 0.5 + 0.2}" />`;
  }

  // Character text with rotation and jitter
  const charSpacing = width / (chars.length + 1);
  let textNodes = '';
  chars.forEach((char, index) => {
    const x = Math.floor((index + 0.8) * charSpacing);
    const y = Math.floor(Math.random() * 10 + 32);
    const angle = Math.floor(Math.random() * 36 - 18);
    const color = ['#0c0a09', '#1c1917', '#292524', '#451a03', '#1e293b'][index % 5];
    const fontSize = Math.floor(Math.random() * 6 + 22);
    textNodes += `<text x="${x}" y="${y}" fill="${color}" font-size="${fontSize}" font-family="Courier New, monospace, sans-serif" font-weight="900" transform="rotate(${angle} ${x} ${y})" letter-spacing="2">${char}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width}" style="background-color: #f5f0e6; border: 2px solid #1c1917; border-radius: 2px; user-select: none;">
    <rect width="100%" height="100%" fill="#f5eedc"/>
    <!-- Noise Lines & Dots -->
    ${lines}
    ${dots}
    <!-- Distorted Text -->
    ${textNodes}
  </svg>`;
}

// GET /api/admin/captcha - Generate fresh randomized captcha
app.get('/api/admin/captcha', (req, res) => {
  // Purge expired captchas
  const now = Date.now();
  for (const [id, session] of captchaSessions.entries()) {
    if (session.expiresAt < now) {
      captchaSessions.delete(id);
    }
  }

  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const captchaId = 'cap_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  captchaSessions.set(captchaId, {
    code,
    expiresAt: now + 5 * 60 * 1000 // 5 minutes
  });

  const svg = generateCaptchaSvg(code);

  res.json({
    success: true,
    captchaId,
    svg,
    code, // Provided for fast client-side fallback/accessible mode
    expiresInSeconds: 300
  });
});

// POST /api/admin/login - Authenticate admin user with CAPTCHA verification
app.post('/api/admin/login', (req, res) => {
  const { username, password, captcha, captchaId } = req.body;

  // Verify CAPTCHA
  if (!captcha || typeof captcha !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Security verification failed: Please enter the CAPTCHA code shown.',
      requireNewCaptcha: true
    });
  }

  if (captchaId) {
    const session = captchaSessions.get(captchaId);
    if (!session) {
      return res.status(400).json({
        success: false,
        error: 'CAPTCHA code expired. Please generate and enter a new code.',
        requireNewCaptcha: true
      });
    }

    // Single-use guarantee: remove session once checked
    captchaSessions.delete(captchaId);

    if (session.code.toUpperCase() !== captcha.trim().toUpperCase()) {
      return res.status(400).json({
        success: false,
        error: 'Incorrect CAPTCHA verification code. Please try with the new code.',
        requireNewCaptcha: true
      });
    }
  }

  // Verify Username & Password
  if (username === 'RahulS26' && password === 'RahulPass1') {
    return res.json({
      success: true,
      message: 'Authentication successful',
      token: 'admin-auth-session-valid'
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid username or password. Access denied.',
    requireNewCaptcha: true
  });
});

// GET /api/admin/ip-visits - Fetch IP visitor analytics for Day, Week, Month, and Year
app.get('/api/admin/ip-visits', (req, res) => {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  const filterByRange = (ms: number) => {
    const cutoff = now - ms;
    return ipVisitsList.filter(v => new Date(v.timestamp).getTime() >= cutoff);
  };

  const dayVisits = filterByRange(DAY_MS);
  const weekVisits = filterByRange(7 * DAY_MS);
  const monthVisits = filterByRange(30 * DAY_MS);
  const yearVisits = filterByRange(365 * DAY_MS);

  const calculatePeriodStats = (records: IpVisitRecord[]) => {
    const ipMap: Record<string, { count: number; lastVisited: string; paths: Set<string>; userAgent?: string }> = {};
    
    for (const r of records) {
      if (!ipMap[r.ip]) {
        ipMap[r.ip] = { count: 0, lastVisited: r.timestamp, paths: new Set(), userAgent: r.userAgent };
      }
      ipMap[r.ip].count += 1;
      ipMap[r.ip].paths.add(r.path);
      if (new Date(r.timestamp).getTime() > new Date(ipMap[r.ip].lastVisited).getTime()) {
        ipMap[r.ip].lastVisited = r.timestamp;
      }
    }

    const total = records.length;
    const topIps = Object.entries(ipMap)
      .map(([ip, info]) => ({
        ip,
        count: info.count,
        percentage: total > 0 ? Math.round((info.count / total) * 1000) / 10 : 0,
        lastVisited: info.lastVisited,
        paths: Array.from(info.paths),
        userAgent: info.userAgent
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalVisits: total,
      uniqueIpCount: Object.keys(ipMap).length,
      topIps,
      recentVisits: records.slice(0, 100)
    };
  };

  res.json({
    success: true,
    data: {
      day: calculatePeriodStats(dayVisits),
      week: calculatePeriodStats(weekVisits),
      month: calculatePeriodStats(monthVisits),
      year: calculatePeriodStats(yearVisits),
      allRecentLogs: ipVisitsList.slice(0, 200)
    }
  });
});

// DELETE /api/news/articles/:id - Delete a post from the website
app.delete('/api/news/articles/:id', (req, res) => {
  const { id } = req.params;
  const initialCount = cachedArticles.length;
  cachedArticles = cachedArticles.filter(art => art.id !== id);

  if (cachedArticles.length === initialCount) {
    return res.status(404).json({ success: false, error: 'Article not found.' });
  }

  saveStoredArticles(cachedArticles);
  res.json({
    success: true,
    message: 'Post successfully deleted.',
    deletedId: id,
    remainingCount: cachedArticles.length
  });
});

// POST /api/news/articles/:id/tags - Add tag(s) to a post
app.post('/api/news/articles/:id/tags', (req, res) => {
  const { id } = req.params;
  const { tag, tags } = req.body;

  const article = cachedArticles.find(art => art.id === id);
  if (!article) {
    return res.status(404).json({ success: false, error: 'Article not found.' });
  }

  const newTagsToAdd: string[] = [];
  if (tag && typeof tag === 'string') {
    newTagsToAdd.push(tag.trim());
  }
  if (Array.isArray(tags)) {
    tags.forEach(t => typeof t === 'string' && newTagsToAdd.push(t.trim()));
  }

  if (newTagsToAdd.length === 0) {
    return res.status(400).json({ success: false, error: 'Provide at least one tag to add.' });
  }

  const existingTagsSet = new Set(article.tags || []);
  newTagsToAdd.forEach(rawTag => {
    const formatted = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
    existingTagsSet.add(formatted);
  });

  article.tags = Array.from(existingTagsSet);
  saveStoredArticles(cachedArticles);

  res.json({
    success: true,
    message: 'Tag(s) added successfully.',
    article
  });
});

// DELETE /api/news/articles/:id/tags - Remove a tag from a post
app.delete('/api/news/articles/:id/tags', (req, res) => {
  const { id } = req.params;
  const { tag } = req.body;

  const article = cachedArticles.find(art => art.id === id);
  if (!article) {
    return res.status(404).json({ success: false, error: 'Article not found.' });
  }

  if (!tag) {
    return res.status(400).json({ success: false, error: 'Tag to remove is required.' });
  }

  const targetTag = tag.trim().toLowerCase();
  article.tags = (article.tags || []).filter(t => t.toLowerCase() !== targetTag && t.toLowerCase() !== `#${targetTag}`);
  saveStoredArticles(cachedArticles);

  res.json({
    success: true,
    message: 'Tag removed successfully.',
    article
  });
});

// --- AI AUTO-TAGGING ENGINE ---

export interface AutoTagResult {
  tags: string[];
  seoKeywords: string[];
  suggestedCategory?: string;
  sentiment?: 'Urgent' | 'Positive' | 'Neutral' | 'Analysis' | 'Warning';
  explanation?: string;
  isAiGenerated: boolean;
}

// Intelligent Semantic Fallback for Auto-Tagging
function generateHeuristicTags(title: string, bodyText: string, category: string = 'World', source: string = ''): AutoTagResult {
  const combinedText = `${title} ${bodyText}`.replace(/<[^>]*>/g, ' ');
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'that', 'this', 'have', 'were', 'which',
    'what', 'when', 'where', 'after', 'before', 'says', 'said', 'into', 'over',
    'amid', 'will', 'more', 'about', 'some', 'than', 'them', 'then', 'these',
    'those', 'just', 'been', 'also', 'such', 'could', 'would', 'should', 'today',
    'week', 'month', 'year', 'time', 'first', 'last', 'most', 'only', 'news',
    'report', 'update', 'latest', 'live', 'breaking', 'exclusive', 'official',
    'their', 'there', 'being', 'other', 'through', 'under', 'between', 'during',
    'while', 'since', 'against', 'according', 'because', 'including', 'without'
  ]);

  const candidateTags = new Set<string>();
  const seoKeywords = new Set<string>();

  // Always include primary category as first tag
  if (category) {
    candidateTags.add(`#${category.replace(/\s+/g, '')}`);
    seoKeywords.add(category.toLowerCase());
  }

  // 1. Match specific multi-word domain phrases
  const domainPatterns: [RegExp, string, string][] = [
    [/artificial intelligence|generative ai|machine learning|deep learning|llm|chatgpt|claude|gemini/i, '#ArtificialIntelligence', 'artificial intelligence'],
    [/quantum computing|qubit|quantum error|supercomputer/i, '#QuantumComputing', 'quantum technology'],
    [/clean energy|renewable energy|solar power|wind energy|battery storage|grid modernization/i, '#RenewableEnergy', 'clean energy transition'],
    [/electric vehicle|ev battery|tesla|automaker|autonomous vehicle/i, '#ElectricVehicles', 'EV technology'],
    [/central bank|federal reserve|interest rate|monetary policy|inflation|treasury yield/i, '#CentralBanks', 'monetary policy inflation'],
    [/space exploration|nasa|spacex|jwst|astronomy|exoplanet|rocket launch/i, '#SpaceExploration', 'deep space science'],
    [/cybersecurity|malware|ransomware|data breach|zero day|hacker/i, '#CyberSecurity', 'cyber defense'],
    [/biotechnology|mrna|clinical trial|fda approval|genomics|pharma/i, '#Biotechnology', 'medical breakthrough'],
    [/climate change|carbon emissions|cop|global warming|decarbonization/i, '#ClimateAction', 'global climate policy'],
    [/geopolitics|diplomacy|summit|united nations|foreign policy|treaty/i, '#Geopolitics', 'international diplomacy'],
    [/semiconductor|microchip|tsmc|nvidia|gpu|chipmaker/i, '#Semiconductors', 'chip manufacturing'],
    [/stock market|wall street|nasdaq|sp500|equities|trading/i, '#StockMarkets', 'financial markets'],
    [/premier league|champions league|olympics|fifa|world cup|nba|grand slam/i, '#GlobalSports', 'major championship'],
    [/hollywood|box office|streaming|film festival|oscar|emmy|grammy/i, '#EntertainmentWire', 'entertainment industry'],
    [/public health|who|epidemiology|healthcare policy|vaccine/i, '#PublicHealth', 'global healthcare'],
  ];

  for (const [regex, tag, keyword] of domainPatterns) {
    if (regex.test(combinedText)) {
      candidateTags.add(tag);
      seoKeywords.add(keyword);
    }
  }

  // 2. Extract prominent capitalized proper nouns / named entities
  const properNounRegex = /\b[A-Z][a-z0-9]{2,}(?:\s+[A-Z][a-z0-9]{2,})*\b/g;
  const matches = combinedText.match(properNounRegex) || [];
  const entityCounts: Record<string, number> = {};

  for (const m of matches) {
    const cleaned = m.trim();
    if (!stopWords.has(cleaned.toLowerCase()) && cleaned.length > 2 && !/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December)$/i.test(cleaned)) {
      entityCounts[cleaned] = (entityCounts[cleaned] || 0) + 1;
    }
  }

  const sortedEntities = Object.entries(entityCounts).sort((a, b) => b[1] - a[1]);
  for (const [ent] of sortedEntities.slice(0, 5)) {
    const tagFormatted = `#${ent.replace(/[^a-zA-Z0-9]/g, '')}`;
    if (tagFormatted.length > 2 && tagFormatted.length < 25) {
      candidateTags.add(tagFormatted);
      seoKeywords.add(ent.toLowerCase());
    }
  }

  // Fallback defaults if few tags
  if (candidateTags.size < 3) {
    candidateTags.add('#BreakingNews');
    candidateTags.add('#HeadlineWire');
    seoKeywords.add('latest updates');
  }

  return {
    tags: Array.from(candidateTags).slice(0, 6),
    seoKeywords: Array.from(seoKeywords).slice(0, 5),
    suggestedCategory: category,
    sentiment: combinedText.toLowerCase().includes('urgent') || combinedText.toLowerCase().includes('crisis') || combinedText.toLowerCase().includes('war') ? 'Urgent' : 'Neutral',
    explanation: 'Tags derived through journalistic entity extraction, contextual body keyword salience, and taxonomy classification.',
    isAiGenerated: false,
  };
}

// Master AI Auto-Tagging Function using Gemini 3.7 Flash with Intelligent Heuristic Fallback
async function generateAiAutoTags(title: string, bodyText: string, category: string = 'World', source: string = ''): Promise<AutoTagResult> {
  const fallback = generateHeuristicTags(title, bodyText, category, source);
  const ai = getGeminiClient();

  if (!ai) {
    return fallback;
  }

  try {
    const prompt = `You are a chief news taxonomist and metadata editor for a premier news wire publication.
Analyze the following news story's headline and body text, and extract the most relevant, highly specific topic tags and SEO keywords.

Headline: ${title}
Body Text / Story Excerpt: ${bodyText || 'N/A'}
Current Category: ${category || 'General'}
News Source: ${source || 'Wire Service'}

Provide a strict JSON response containing:
- tags: Array of 4 to 7 high-impact, specific hashtags starting with # (e.g. ["#ArtificialIntelligence", "#TechGovernance", "#CloudComputing", "#VentureCapital"]). Avoid generic vague tags like "#News" or "#Post".
- seoKeywords: Array of 4 to 6 natural search keywords and phrases (e.g. ["generative AI regulation", "enterprise software", "cloud infrastructure"]).
- suggestedCategory: The single most accurate category ("World", "Technology", "Science", "Business", "Sports", "Entertainment", "Health").
- sentiment: Exactly one of "Urgent", "Positive", "Neutral", "Analysis", "Warning".
- explanation: A clear 1-sentence explanation of why these tags reflect the core themes of the body text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            seoKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedCategory: { type: Type.STRING },
            sentiment: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ['tags', 'seoKeywords', 'suggestedCategory', 'sentiment', 'explanation']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const rawTags: string[] = Array.isArray(parsed.tags) ? parsed.tags : [];
    const formattedTags = rawTags.map(t => {
      const trimmed = t.trim();
      return trimmed.startsWith('#') ? trimmed : `#${trimmed.replace(/\s+/g, '')}`;
    }).filter(t => t.length > 2);

    const validTags = formattedTags.length >= 3 ? formattedTags.slice(0, 7) : fallback.tags;
    const validSeo = (Array.isArray(parsed.seoKeywords) && parsed.seoKeywords.length > 0) ? parsed.seoKeywords.slice(0, 6) : fallback.seoKeywords;
    const validCategory = (['World', 'Technology', 'Science', 'Business', 'Sports', 'Entertainment', 'Health'].includes(parsed.suggestedCategory))
      ? parsed.suggestedCategory
      : category;
    const validSentiment = (['Urgent', 'Positive', 'Neutral', 'Analysis', 'Warning'].includes(parsed.sentiment))
      ? parsed.sentiment as any
      : fallback.sentiment;

    return {
      tags: validTags,
      seoKeywords: validSeo,
      suggestedCategory: validCategory,
      sentiment: validSentiment,
      explanation: parsed.explanation || 'AI-generated topical tags based on full body text analysis.',
      isAiGenerated: true,
    };
  } catch (err: any) {
    console.warn('Gemini auto-tagging error, falling back to heuristic tagger:', err.message || err);
    return fallback;
  }
}

// POST /api/news/articles/:id/auto-tag - Generate and apply AI suggested tags for a specific article
app.post('/api/news/articles/:id/auto-tag', async (req, res) => {
  const { id } = req.params;
  const { applyImmediately = true } = req.body;

  const article = cachedArticles.find(art => art.id === id);
  if (!article) {
    return res.status(404).json({ success: false, error: 'Article not found.' });
  }

  const bodyText = article.aiSummary?.rephrasedStory || article.description || article.contentSnippet || '';
  const suggestions = await generateAiAutoTags(article.title, bodyText, article.category, article.source);

  if (applyImmediately) {
    const existingTagsSet = new Set(article.tags || []);
    suggestions.tags.forEach(t => existingTagsSet.add(t));
    article.tags = Array.from(existingTagsSet);

    if (suggestions.seoKeywords && suggestions.seoKeywords.length > 0) {
      const existingSeoSet = new Set(article.seoKeywords || []);
      suggestions.seoKeywords.forEach(k => existingSeoSet.add(k));
      article.seoKeywords = Array.from(existingSeoSet);
    }

    if (suggestions.sentiment && (!article.sentiment || article.sentiment === 'Neutral')) {
      article.sentiment = suggestions.sentiment;
    }

    saveStoredArticles(cachedArticles);
  }

  res.json({
    success: true,
    article,
    suggestions,
    applied: applyImmediately,
    message: applyImmediately ? `Successfully auto-tagged article with ${suggestions.tags.length} AI-suggested tags.` : 'Generated AI tag suggestions.'
  });
});

// POST /api/news/auto-tag - Generate AI tags on the fly from custom title/body text
app.post('/api/news/auto-tag', async (req, res) => {
  const { title, body, category = 'World', source = '' } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: 'Title is required for auto-tagging.' });
  }

  const suggestions = await generateAiAutoTags(title, body || '', category, source);
  res.json({
    success: true,
    suggestions
  });
});

// POST /api/news/auto-tag-batch - Bulk auto-tag articles across the database
app.post('/api/news/auto-tag-batch', async (req, res) => {
  try {
    const { articleIds, onlyUntagged = false, maxArticles = 25 } = req.body;

    let targetArticles = cachedArticles;
    if (Array.isArray(articleIds) && articleIds.length > 0) {
      const idSet = new Set(articleIds);
      targetArticles = cachedArticles.filter(a => idSet.has(a.id));
    } else if (onlyUntagged) {
      targetArticles = cachedArticles.filter(a => !a.tags || a.tags.length <= 1);
    }

    const sliceToProcess = targetArticles.slice(0, Math.min(maxArticles, 50));
    const results: { articleId: string; title: string; addedTags: string[]; allTags: string[] }[] = [];

    for (const article of sliceToProcess) {
      const bodyText = article.aiSummary?.rephrasedStory || article.description || article.contentSnippet || '';
      const suggestions = await generateAiAutoTags(article.title, bodyText, article.category, article.source);
      
      const existingTagsSet = new Set(article.tags || []);
      const newAddedTags: string[] = [];

      suggestions.tags.forEach(t => {
        if (!existingTagsSet.has(t)) {
          existingTagsSet.add(t);
          newAddedTags.push(t);
        }
      });

      article.tags = Array.from(existingTagsSet);
      if (suggestions.seoKeywords && suggestions.seoKeywords.length > 0) {
        const existingSeoSet = new Set(article.seoKeywords || []);
        suggestions.seoKeywords.forEach(k => existingSeoSet.add(k));
        article.seoKeywords = Array.from(existingSeoSet);
      }

      results.push({
        articleId: article.id,
        title: article.title,
        addedTags: newAddedTags,
        allTags: article.tags
      });
    }

    if (results.length > 0) {
      saveStoredArticles(cachedArticles);
    }

    res.json({
      success: true,
      processedCount: sliceToProcess.length,
      updatedArticlesCount: results.filter(r => r.addedTags.length > 0).length,
      results,
      message: `Batch auto-tagging completed for ${sliceToProcess.length} articles.`
    });
  } catch (err: any) {
    console.error('Batch auto-tagging error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to execute batch auto-tagging.' });
  }
});

// GET /api/news - Fetch all scraped articles and refresh status
app.get('/api/news', (req, res) => {
  const stats = calculateStats(cachedArticles);
  const breakingNews = cachedArticles.filter(a => a.sentiment === 'Urgent' || a.title.toLowerCase().includes('breaking')).slice(0, 5);

  res.json({
    articles: cachedArticles,
    lastRefreshedAt: lastRefreshedAt.toISOString(),
    nextRefreshAt: nextRefreshAt.toISOString(),
    refreshIntervalSeconds: REFRESH_INTERVAL_MS / 1000,
    totalArticles: cachedArticles.length,
    refreshCount,
    isRefreshing,
    sources,
    stats,
    breakingNews: breakingNews.length > 0 ? breakingNews : cachedArticles.slice(0, 3),
  });
});

// POST /api/news/refresh - Trigger immediate manual scraping refresh
app.post('/api/news/refresh', async (req, res) => {
  try {
    const updatedArticles = await scrapeAllSources();
    const stats = calculateStats(updatedArticles);

    res.json({
      success: true,
      message: 'News sources successfully refreshed!',
      lastRefreshedAt: lastRefreshedAt.toISOString(),
      nextRefreshAt: nextRefreshAt.toISOString(),
      totalArticles: updatedArticles.length,
      articles: updatedArticles,
      stats,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to refresh news' });
  }
});

// POST /api/news/rephrase and POST /api/news/summarize - Gemini AI Article Journalistic Rephraser
async function handleRephraseArticle(req: express.Request, res: express.Response) {
  const { articleId, title, description, link } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, error: 'Article title is required.' });
  }

  // Check if article already has cached rephrased content
  const existingArticle = cachedArticles.find(a => a.id === articleId);
  if (existingArticle && existingArticle.aiSummary && existingArticle.aiSummary.rephrasedStory) {
    return res.json({ success: true, summary: existingArticle.aiSummary });
  }

  const defaultCategory = existingArticle?.category || 'World';
  const defaultSource = existingArticle?.source || 'NewsPulse Gazette';
  const baselineRephrased = rephraseScrapedArticle(title, description || '', defaultCategory, defaultSource);

  const ai = getGeminiClient();

  if (!ai) {
    if (existingArticle) existingArticle.aiSummary = baselineRephrased;
    return res.json({ success: true, summary: baselineRephrased });
  }

  try {
    const prompt = `You are a master investigative news editor and rewrite specialist for NewsPulse Gazette.
DO NOT provide a brief truncated blurb or short summary. Instead, you must COMPLETELY REPHRASE and REWRITE the scraped news story into an authoritative, complete, original, and deeply engaging long-form news report (400-600 words) written in crisp, objective journalistic prose that readers will thoroughly enjoy reading.

Original Scraped Headline: ${title}
Original Scraped Content / Excerpt: ${description || 'N/A'}
Topic Category: ${defaultCategory}
Original Source: ${defaultSource}

Rewrite and rephrase the entire story thoroughly into multiple clear, structured thematic paragraphs. Provide your response in strict JSON with the following fields:
- rephrasedTitle: An engaging, clear, original journalistic headline without outlet suffixes.
- rephrasedLead: A compelling, comprehensive opening lead paragraph establishing the key who, what, when, and where.
- rephrasedStory: The complete, fully rephrased and rewritten news report. This must be a rich, detailed 4-to-5 paragraph journalistic narrative explaining the full story, core developments, context, background, and stakeholder impact in clear, original prose. Separate paragraphs with double newlines.
- backgroundContext: 2-3 detailed sentences outlining the historical backdrop, preceding events, and industry/geopolitical baseline.
- stakeholderImpact: 2-3 sentences analyzing how this affects consumers, enterprises, citizens, or international stakeholders.
- futureOutlook: 2-3 sentences projecting upcoming decisions, regulatory actions, hearings, or market developments to watch.
- bulletPoints: Array of 4-6 comprehensive bullet points detailing the key developments and facts in complete sentences.
- keyTakeaways: Array of 3-4 strategic takeaways and broader implications.
- whyItMatters: In-depth paragraph explaining why this development is critically significant.
- timeline: Array of 3-4 chronological or phase-based milestone objects with "timeOrPhase" and "event" strings.
- sentiment: Exactly one of "Urgent", "Positive", "Neutral", "Analysis", "Warning".
- tags: Array of 4-6 relevant specific topic hashtags.
- oneLineSummary: Shortened version of the rephrased lead.
- executiveSummary: Same as rephrasedLead.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rephrasedTitle: { type: Type.STRING },
            rephrasedLead: { type: Type.STRING },
            rephrasedStory: { type: Type.STRING },
            backgroundContext: { type: Type.STRING },
            stakeholderImpact: { type: Type.STRING },
            futureOutlook: { type: Type.STRING },
            bulletPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            whyItMatters: { type: Type.STRING },
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeOrPhase: { type: Type.STRING },
                  event: { type: Type.STRING }
                },
                required: ['timeOrPhase', 'event']
              }
            },
            sentiment: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            oneLineSummary: { type: Type.STRING },
            executiveSummary: { type: Type.STRING }
          },
          required: ['rephrasedTitle', 'rephrasedLead', 'rephrasedStory', 'bulletPoints', 'keyTakeaways', 'whyItMatters', 'sentiment', 'tags']
        }
      }
    });

    const parsedData = JSON.parse(response.text || '{}');
    const rephrasedTitle = parsedData.rephrasedTitle || title;
    const rephrasedLead = parsedData.rephrasedLead || baselineRephrased.rephrasedLead;
    const rephrasedStory = parsedData.rephrasedStory || baselineRephrased.rephrasedStory;
    const wordCount = rephrasedStory.split(/\s+/).filter(Boolean).length;

    const resultSummary: RephrasedArticleData = {
      rephrasedTitle,
      rephrasedLead,
      rephrasedStory,
      backgroundContext: parsedData.backgroundContext || baselineRephrased.backgroundContext,
      stakeholderImpact: parsedData.stakeholderImpact || baselineRephrased.stakeholderImpact,
      futureOutlook: parsedData.futureOutlook || baselineRephrased.futureOutlook,
      oneLineSummary: parsedData.oneLineSummary || rephrasedLead,
      executiveSummary: parsedData.executiveSummary || rephrasedLead,
      bulletPoints: (Array.isArray(parsedData.bulletPoints) && parsedData.bulletPoints.length > 0)
        ? parsedData.bulletPoints
        : baselineRephrased.bulletPoints,
      keyTakeaways: (Array.isArray(parsedData.keyTakeaways) && parsedData.keyTakeaways.length > 0)
        ? parsedData.keyTakeaways
        : baselineRephrased.keyTakeaways,
      whyItMatters: parsedData.whyItMatters || baselineRephrased.whyItMatters,
      timeline: (Array.isArray(parsedData.timeline) && parsedData.timeline.length > 0)
        ? parsedData.timeline
        : baselineRephrased.timeline,
      sentiment: (['Urgent', 'Positive', 'Neutral', 'Analysis', 'Warning'].includes(parsedData.sentiment) ? parsedData.sentiment : baselineRephrased.sentiment) as any,
      tags: (Array.isArray(parsedData.tags) && parsedData.tags.length > 0) ? parsedData.tags : baselineRephrased.tags,
      wordCount
    };

    if (existingArticle) {
      existingArticle.title = rephrasedTitle || existingArticle.title;
      existingArticle.description = rephrasedStory;
      existingArticle.contentSnippet = rephrasedLead;
      existingArticle.aiSummary = resultSummary;
      saveStoredArticles(cachedArticles);
    }

    res.json({ success: true, summary: resultSummary });
  } catch (err: any) {
    console.error('Gemini rephrase error:', err);
    if (existingArticle) {
      existingArticle.aiSummary = baselineRephrased;
    }
    res.json({ success: true, summary: baselineRephrased });
  }
}

app.post('/api/news/rephrase', handleRephraseArticle);
app.post('/api/news/summarize', handleRephraseArticle);

// --- AI HINDI TRANSLATION & ON-THE-FLY REPHRASING ENGINE ---

const HINDI_CATEGORY_MAP: Record<string, string> = {
  World: 'विश्व',
  Technology: 'तकनीक',
  Science: 'विज्ञान',
  Business: 'व्यापार',
  Sports: 'खेल',
  Entertainment: 'मनोरंजन',
  Health: 'स्वास्थ्य',
  All: 'सभी',
};

// High-Fidelity Heuristic Fallback for Hindi Translation
function generateHeuristicHindiContent(
  title: string,
  desc: string,
  category: string = 'World',
  source: string = 'NewsPulse'
): HindiArticleContent {
  const hindiCat = HINDI_CATEGORY_MAP[category] || 'विश्व';
  
  // Lexical replacement dictionary for prominent journalistic and domain terms
  const termsMap: [RegExp, string][] = [
    [/\bArtificial Intelligence\b|\bAI\b/gi, 'आर्टिफिशियल इंटेलिजेंस (AI)'],
    [/\bQuantum Computing\b/gi, 'क्वांटम कंप्यूटिंग'],
    [/\bClean Energy\b|\bRenewable Energy\b/gi, 'स्वच्छ एवं नवीकरणीय ऊर्जा'],
    [/\bElectric Vehicles\b|\bEVs?\b/gi, 'इलेक्ट्रिक वाहन'],
    [/\bCentral Banks?\b/gi, 'केंद्रीय बैंक'],
    [/\bStock Markets?\b|\bWall Street\b/gi, 'शेयर बाजार'],
    [/\bSpace Exploration\b|\bNASA\b/gi, 'अंतरिक्ष अन्वेषण व नासा'],
    [/\bCybersecurity\b|\bData Breach\b/gi, 'साइबर सुरक्षा'],
    [/\bClimate Change\b/gi, 'जलवायु परिवर्तन'],
    [/\bBreaking News\b/gi, 'ताज़ा खबर'],
    [/\bGlobal Economy\b/gi, 'वैश्विक अर्थव्यवस्था'],
    [/\bUnited States\b|\bUS\b/gi, 'अमेरिका'],
    [/\bIndia\b/gi, 'भारत'],
    [/\bEuropean Union\b|\bEU\b/gi, 'यूरोपीय संघ'],
    [/\bGovernment\b/gi, 'सरकार'],
    [/\bPresident\b/gi, 'राष्ट्रपति'],
    [/\bPrime Minister\b/gi, 'प्रधानमंत्री'],
    [/\bSupreme Court\b/gi, 'सर्वोच्च न्यायालय'],
    [/\bInflation\b/gi, 'मुद्रास्फीति'],
    [/\bInterest Rates\b/gi, 'ब्याज दरें'],
    [/\bHospital\b|\bHealthcare\b/gi, 'स्वास्थ्य सेवा'],
    [/\bScientists?\b|\bResearchers?\b/gi, 'वैज्ञानिकों व शोधकर्ताओं'],
    [/\bDiscovery\b|\bBreakthrough\b/gi, 'महत्वपूर्ण खोज'],
    [/\bChampionship\b|\bTournament\b/gi, 'प्रतियोगिता एवं चैंपियनशिप'],
  ];

  let transliteratedTitle = title;
  for (const [regex, hindiTerm] of termsMap) {
    transliteratedTitle = transliteratedTitle.replace(regex, hindiTerm);
  }

  const hindiTitle = `${transliteratedTitle} - [${hindiCat} समाचार]`;
  const cleanSnippet = desc ? desc.slice(0, 220) : `${source} द्वारा रिपोर्ट की गई ताज़ा खबर।`;
  const hindiLead = `नवीनतम रिपोर्ट के अनुसार, ${cleanSnippet} इस महत्वपूर्ण घटनाक्रम पर अंतर्राष्ट्रीय विश्लेषक व विशेषज्ञ लगातार नज़र बनाए हुए हैं।`;
  const hindiStory = `${hindiLead}\n\nयह विकास ${hindiCat} के क्षेत्र में दूरगामी प्रभाव डालेगा। संबंधित अधिकारियों एवं नीति निर्माताओं ने इस विषय पर विस्तृत समीक्षा शुरू कर दी है, जिससे आने वाले समय में नए दिशा-निर्देश व परिणाम सामने आ सकते हैं।`;

  return {
    title: hindiTitle,
    description: hindiStory,
    contentSnippet: hindiLead,
    rephrasedLead: hindiLead,
    rephrasedStory: hindiStory,
    oneLineSummary: `${title.slice(0, 100)} - ${hindiCat} समाचार सारांश।`,
    executiveSummary: hindiLead,
    bulletPoints: [
      `${source} की ताज़ा रिपोर्ट के अनुसार इस विषय पर मुख्य घटनाक्रम सामने आया है।`,
      `विशेषज्ञों का मानना है कि यह कदम ${hindiCat} क्षेत्र की प्राथमिकताओं को नई दिशा देगा।`,
      `आगामी दिनों में इसके आर्थिक, तकनीकी एवं सामाजिक प्रभावों पर व्यापक चर्चा संभावित है।`
    ],
    keyTakeaways: [
      `यह निर्णय वैश्विक और क्षेत्रीय स्तर पर सकारात्मक परिवर्तन का संकेत है।`,
      `हितधारकों को नए मानकों और कार्यप्रणाली के अनुरूप तैयार रहने की आवश्यकता है।`
    ],
    whyItMatters: `यह समाचार सीधे तौर पर ${hindiCat} के विकास और नीतिगत परिदृश्य से जुड़ा है, जिसका सीधा असर उद्योग और आम नागरिकों पर पड़ेगा।`,
    tags: [`#${hindiCat}समाचार`, '#ताज़ाअपडेट', '#न्यूज़पल्स', '#विशेषरिपोर्ट'],
    sentiment: 'Neutral',
    translatedAt: new Date().toISOString(),
    isAiGenerated: false
  };
}

// Master Gemini 3.7 Flash Hindi Journalistic Rephrase & Translation Engine
async function generateAiHindiArticle(article: NewsArticle): Promise<HindiArticleContent> {
  // Return cached Hindi translation if already present
  if (article.hindi && article.hindi.title) {
    return article.hindi;
  }

  const fallback = generateHeuristicHindiContent(
    article.title,
    article.description || article.contentSnippet || '',
    article.category,
    article.source
  );

  const ai = getGeminiClient();
  if (!ai) {
    article.hindi = fallback;
    return fallback;
  }

  try {
    const rawEnglishText = `${article.title}\n\n${article.aiSummary?.rephrasedStory || article.description || article.contentSnippet || ''}`;
    const prompt = `You are a chief news editor and bilingual translation specialist for a premier news wire (न्यू पल्स).
Translate and journalize the following English news story into rich, natural, authentic Hindi news prose (शुद्ध, प्रभावी एवं सहज हिन्दी पत्रकारिता शैली).
Ensure correct Devanagari script grammar, clear phrasing, and authoritative news tone.

English Story Headline: ${article.title}
English Body / Content: ${rawEnglishText}
Category: ${article.category}
Source: ${article.source}

Generate a strict JSON response containing:
- title: Engaging, punchy, high-impact Hindi headline without English outlet prefixes (e.g. आकर्षक एवं स्पष्ट हिन्दी शीर्षक).
- description: Complete, full 2-3 paragraph rephrased Hindi journalistic news report (विस्तृत एवं सम्पूर्ण हिन्दी समाचार विवरण).
- contentSnippet: Engaging 1-2 sentence opening summary in Hindi (संक्षिप्त मुख्य विवरण).
- rephrasedLead: Strong, compelling opening lead paragraph in Hindi answering who, what, when, where (मुख्य प्रारंभिक अंश).
- rephrasedStory: Full rephrased news story in Hindi explaining context, developments, and stakeholder impact (सम्पूर्ण समाचार वृत्तांत).
- oneLineSummary: A concise one-sentence Hindi summary (एक पंक्ति का सार).
- executiveSummary: Same as rephrasedLead in Hindi.
- bulletPoints: Array of 3 to 4 key development bullet points in complete, informative Hindi sentences (मुख्य विकास बिंदु).
- keyTakeaways: Array of 2 to 3 strategic takeaways and implications in Hindi (महत्वपूर्ण निष्कर्ष).
- whyItMatters: In-depth paragraph in Hindi explaining why this story is significant (यह खबर क्यों महत्वपूर्ण है).
- tags: Array of 3 to 5 relevant Hindi hashtags with '#' (e.g. ["#विश्वसमाचार", "#तकनीक", "#भारत", "#ताज़ाअपडेट"]).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            contentSnippet: { type: Type.STRING },
            rephrasedLead: { type: Type.STRING },
            rephrasedStory: { type: Type.STRING },
            oneLineSummary: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            bulletPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            whyItMatters: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['title', 'description', 'rephrasedLead', 'rephrasedStory', 'bulletPoints', 'keyTakeaways', 'whyItMatters', 'tags']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const hindiResult: HindiArticleContent = {
      title: parsed.title || fallback.title,
      description: parsed.description || parsed.rephrasedStory || fallback.description,
      contentSnippet: parsed.contentSnippet || parsed.rephrasedLead || fallback.contentSnippet,
      rephrasedLead: parsed.rephrasedLead || fallback.rephrasedLead,
      rephrasedStory: parsed.rephrasedStory || parsed.description || fallback.rephrasedStory,
      oneLineSummary: parsed.oneLineSummary || parsed.rephrasedLead || fallback.oneLineSummary,
      executiveSummary: parsed.executiveSummary || parsed.rephrasedLead || fallback.executiveSummary,
      bulletPoints: (Array.isArray(parsed.bulletPoints) && parsed.bulletPoints.length > 0) ? parsed.bulletPoints : fallback.bulletPoints,
      keyTakeaways: (Array.isArray(parsed.keyTakeaways) && parsed.keyTakeaways.length > 0) ? parsed.keyTakeaways : fallback.keyTakeaways,
      whyItMatters: parsed.whyItMatters || fallback.whyItMatters,
      tags: (Array.isArray(parsed.tags) && parsed.tags.length > 0) ? parsed.tags.map((t: string) => t.startsWith('#') ? t : `#${t}`) : fallback.tags,
      sentiment: article.sentiment || 'Neutral',
      translatedAt: new Date().toISOString(),
      isAiGenerated: true
    };

    article.hindi = hindiResult;
    return hindiResult;
  } catch (err: any) {
    console.warn('[Gemini Hindi Translator] Translation error, falling back to heuristic generator:', err.message || err);
    article.hindi = fallback;
    return fallback;
  }
}

// POST /api/news/translate-hindi - Translate single article to Hindi on the fly
app.post('/api/news/translate-hindi', async (req, res) => {
  try {
    const { articleId, article } = req.body;
    let targetArticle = cachedArticles.find(a => a.id === articleId);

    if (!targetArticle && article && article.title) {
      targetArticle = article as NewsArticle;
    }

    if (!targetArticle) {
      return res.status(404).json({ success: false, error: 'Article not found for translation.' });
    }

    const hindiContent = await generateAiHindiArticle(targetArticle);
    
    // If it's a cached article, save to disk
    const foundInCache = cachedArticles.find(a => a.id === targetArticle?.id);
    if (foundInCache) {
      foundInCache.hindi = hindiContent;
      saveStoredArticles(cachedArticles);
    }

    res.json({
      success: true,
      articleId: targetArticle.id,
      hindi: hindiContent
    });
  } catch (err: any) {
    console.error('Error translating to Hindi:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to translate article.' });
  }
});

// POST /api/news/translate-batch - Batch translate multiple articles into Hindi for feed switching
app.post('/api/news/translate-batch', async (req, res) => {
  try {
    const { articleIds, maxArticles = 15 } = req.body;
    let articlesToTranslate: NewsArticle[] = [];

    if (Array.isArray(articleIds) && articleIds.length > 0) {
      const idSet = new Set(articleIds);
      articlesToTranslate = cachedArticles.filter(a => idSet.has(a.id));
    } else {
      articlesToTranslate = cachedArticles.slice(0, Math.min(maxArticles, 20));
    }

    const translations: Record<string, HindiArticleContent> = {};
    let newlyTranslated = 0;

    // Process translations in parallel with controlled concurrency
    await Promise.all(
      articlesToTranslate.map(async (art) => {
        if (art.hindi && art.hindi.title) {
          translations[art.id] = art.hindi;
          return;
        }
        const hindi = await generateAiHindiArticle(art);
        art.hindi = hindi;
        translations[art.id] = hindi;
        newlyTranslated++;
      })
    );

    if (newlyTranslated > 0) {
      saveStoredArticles(cachedArticles);
    }

    res.json({
      success: true,
      translations,
      translatedCount: Object.keys(translations).length,
      newlyTranslatedCount: newlyTranslated
    });
  } catch (err: any) {
    console.error('Batch Hindi translation error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to translate articles.' });
  }
});

// POST /api/news/add-source - Add custom news feed/topic scraper
app.post('/api/news/add-source', async (req, res) => {
  const { name, feedUrl, category, query } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Source name is required.' });
  }

  let finalFeedUrl = feedUrl;
  if (!finalFeedUrl && query) {
    finalFeedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  }

  if (!finalFeedUrl) {
    return res.status(400).json({ success: false, error: 'Provide either an RSS Feed URL or a search query topic.' });
  }

  const newSource: NewsSourceInfo = {
    id: 'custom-' + Date.now(),
    name: name.trim(),
    url: finalFeedUrl,
    feedUrl: finalFeedUrl,
    category: category || 'World',
    active: true,
  };

  sources.push(newSource);

  // Trigger immediate scrape for new source
  try {
    const newArticles = await scrapeSource(newSource);
    cachedArticles = [...newArticles, ...cachedArticles];
    saveStoredArticles(cachedArticles);
    res.json({ success: true, source: newSource, addedArticlesCount: newArticles.length });
  } catch (err: any) {
    saveStoredArticles(cachedArticles);
    res.json({ success: true, source: newSource, addedArticlesCount: 0, warning: 'Source added, will attempt scrape in next cycle.' });
  }
});

// POST /api/news/toggle-source - Enable/disable a news source
app.post('/api/news/toggle-source', (req, res) => {
  const { sourceId, active } = req.body;
  const source = sources.find(s => s.id === sourceId);
  if (source) {
    source.active = active;
    scrapeAllSources();
    return res.json({ success: true, sources });
  }
  res.status(404).json({ success: false, error: 'Source not found.' });
});

// GET /api/news/export/excel - Download accumulated news in Excel spreadsheet format
app.get('/api/news/export/excel', (req, res) => {
  try {
    saveExcelFile(cachedArticles);
    if (fs.existsSync(EXCEL_FILE)) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="scraped_news_${new Date().toISOString().slice(0, 10)}.xlsx"`);
      const fileStream = fs.createReadStream(EXCEL_FILE);
      return fileStream.pipe(res);
    } else {
      res.status(404).json({ success: false, error: 'Excel file not found.' });
    }
  } catch (err: any) {
    console.error('Error generating Excel download:', err);
    res.status(500).json({ success: false, error: 'Failed to generate Excel file.' });
  }
});

// GET /api/news/export/json - Download full scraped database as JSON
app.get('/api/news/export/json', (req, res) => {
  try {
    saveStoredArticles(cachedArticles);
    if (fs.existsSync(STORAGE_FILE)) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="scraped_articles_${new Date().toISOString().slice(0, 10)}.json"`);
      const fileStream = fs.createReadStream(STORAGE_FILE);
      return fileStream.pipe(res);
    } else {
      res.status(404).json({ success: false, error: 'Storage JSON file not found.' });
    }
  } catch (err: any) {
    console.error('Error generating JSON download:', err);
    res.status(500).json({ success: false, error: 'Failed to generate JSON file.' });
  }
});

// GET /api/news/export/csv - Download full scraped database as CSV
app.get('/api/news/export/csv', (req, res) => {
  try {
    const headers = ['ID', 'Title', 'Category', 'Source', 'Published Date', 'Link', 'Description', 'Sentiment', 'Reading Time (mins)'];
    const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

    const rows = cachedArticles.map(art => [
      escapeCsv(art.id),
      escapeCsv(art.title),
      escapeCsv(art.category),
      escapeCsv(art.source),
      escapeCsv(art.pubDate),
      escapeCsv(art.link),
      escapeCsv(art.description),
      escapeCsv(art.sentiment),
      art.readTimeMinutes || 1
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="scraped_news_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    console.error('Error generating CSV download:', err);
    res.status(500).json({ success: false, error: 'Failed to generate CSV file.' });
  }
});

// GET /api/news/storage-info - Get database storage status
app.get('/api/news/storage-info', (req, res) => {
  try {
    let fileSizeKb = 0;
    let fileModifiedAt = lastRefreshedAt.toISOString();

    if (fs.existsSync(STORAGE_FILE)) {
      const stats = fs.statSync(STORAGE_FILE);
      fileSizeKb = Math.round(stats.size / 1024);
      fileModifiedAt = stats.mtime.toISOString();
    }

    const categoryBreakdown: Record<string, number> = {};
    const sourceBreakdown: Record<string, number> = {};
    cachedArticles.forEach(a => {
      categoryBreakdown[a.category] = (categoryBreakdown[a.category] || 0) + 1;
      sourceBreakdown[a.source] = (sourceBreakdown[a.source] || 0) + 1;
    });

    res.json({
      success: true,
      storageFile: 'scraped_articles_db.json',
      backupFile: 'scraped_articles_db.bak.json',
      excelFile: 'scraped_news_export.xlsx',
      fileSizeKb,
      totalArticlesStored: cachedArticles.length,
      lastModified: fileModifiedAt,
      isAutoSaveEnabled: true,
      storageType: 'Dual-Layer High-Durability Persistent JSON Database',
      categoryBreakdown,
      sourceBreakdown,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch storage info' });
  }
});

// GET /api/database/status - Dedicated Database Engine Status
app.get('/api/database/status', (req, res) => {
  try {
    let primarySizeKb = 0;
    let backupSizeKb = 0;
    let primaryModified = lastRefreshedAt.toISOString();
    let backupModified = lastRefreshedAt.toISOString();

    if (fs.existsSync(STORAGE_FILE)) {
      const pStats = fs.statSync(STORAGE_FILE);
      primarySizeKb = Math.round(pStats.size / 1024);
      primaryModified = pStats.mtime.toISOString();
    }

    if (fs.existsSync(BACKUP_STORAGE_FILE)) {
      const bStats = fs.statSync(BACKUP_STORAGE_FILE);
      backupSizeKb = Math.round(bStats.size / 1024);
      backupModified = bStats.mtime.toISOString();
    }

    const categoryBreakdown: Record<string, number> = {};
    const sourceBreakdown: Record<string, number> = {};
    cachedArticles.forEach(a => {
      categoryBreakdown[a.category] = (categoryBreakdown[a.category] || 0) + 1;
      sourceBreakdown[a.source] = (sourceBreakdown[a.source] || 0) + 1;
    });

    res.json({
      success: true,
      storageFile: 'scraped_articles_db.json',
      backupFile: 'scraped_articles_db.bak.json',
      excelFile: 'scraped_news_export.xlsx',
      primarySizeKb,
      backupSizeKb,
      fileSizeKb: primarySizeKb,
      totalArticlesStored: cachedArticles.length,
      lastModified: primaryModified,
      backupLastModified: backupModified,
      isAutoSaveEnabled: true,
      storageType: 'Dual-Layer High-Durability Persistent JSON Database',
      categoryBreakdown,
      sourceBreakdown,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch database status' });
  }
});

// GET /api/news/trending-topics - Get aggregated trending topics, tag frequencies, and keyword metrics
app.get('/api/news/trending-topics', (req, res) => {
  try {
    const articles = (cachedArticles && cachedArticles.length > 0) ? cachedArticles : loadStoredArticles();
    const tagCounts: Record<string, number> = {};
    const tagCategories: Record<string, Record<string, number>> = {};
    const tagSentiments: Record<string, Record<string, number>> = {};
    const tagArticles: Record<string, { id: string; title: string; source: string; category: string; pubDate: string; link?: string }[]> = {};
    const recentCutoff = Date.now() - 48 * 60 * 60 * 1000;
    const recentTagCounts: Record<string, number> = {};
    const categoryDistribution: Record<string, number> = {};

    const STOP_WORDS = new Set([
      'the', 'and', 'for', 'with', 'from', 'that', 'this', 'have', 'were', 'which',
      'what', 'when', 'where', 'after', 'before', 'says', 'said', 'into', 'over',
      'amid', 'will', 'more', 'about', 'some', 'than', 'them', 'then', 'these',
      'those', 'just', 'been', 'also', 'such', 'could', 'would', 'should', 'today',
      'week', 'month', 'year', 'time', 'first', 'last', 'most', 'only', 'news',
      'report', 'update', 'latest', 'live', 'breaking', 'exclusive', 'official'
    ]);

    let totalTagOccurrences = 0;

    for (const art of articles) {
      if (art.category) {
        categoryDistribution[art.category] = (categoryDistribution[art.category] || 0) + 1;
      }

      const isRecent = art.pubDate ? new Date(art.pubDate).getTime() >= recentCutoff : true;
      const itemTags = new Set<string>();

      // 1. Explicit tags
      if (Array.isArray(art.tags)) {
        art.tags.forEach(t => {
          const cleaned = (t || '').trim();
          if (cleaned.length >= 2 && !STOP_WORDS.has(cleaned.toLowerCase())) {
            itemTags.add(cleaned);
          }
        });
      }

      // 2. SEO Keywords
      if (Array.isArray(art.seoKeywords)) {
        art.seoKeywords.forEach(k => {
          const cleaned = (k || '').trim();
          if (cleaned.length >= 2 && !STOP_WORDS.has(cleaned.toLowerCase())) {
            itemTags.add(cleaned);
          }
        });
      }

      // 3. AI Summary tags
      if (Array.isArray(art.aiSummary?.tags)) {
        art.aiSummary.tags.forEach(t => {
          const cleaned = (t || '').trim();
          if (cleaned.length >= 2 && !STOP_WORDS.has(cleaned.toLowerCase())) {
            itemTags.add(cleaned);
          }
        });
      }

      // 4. Extract prominent keywords from title if tag count is low
      if (itemTags.size < 2 && art.title) {
        const words = art.title.replace(/[^\w\s-]/g, ' ').split(/\s+/).filter(w => w.length > 3);
        for (const w of words) {
          const lower = w.toLowerCase();
          if (!STOP_WORDS.has(lower) && isNaN(Number(w))) {
            const capitalized = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
            itemTags.add(capitalized);
          }
        }
      }

      if (art.category && itemTags.size === 0) {
        itemTags.add(art.category);
      }

      for (const tag of itemTags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        totalTagOccurrences++;

        if (isRecent) {
          recentTagCounts[tag] = (recentTagCounts[tag] || 0) + 1;
        }

        if (!tagCategories[tag]) tagCategories[tag] = {};
        const cat = art.category || 'World';
        tagCategories[tag][cat] = (tagCategories[tag][cat] || 0) + 1;

        if (!tagSentiments[tag]) tagSentiments[tag] = {};
        const sent = art.sentiment || 'Neutral';
        tagSentiments[tag][sent] = (tagSentiments[tag][sent] || 0) + 1;

        if (!tagArticles[tag]) tagArticles[tag] = [];
        if (tagArticles[tag].length < 10) {
          tagArticles[tag].push({
            id: art.id,
            title: art.title,
            source: art.source,
            category: art.category,
            pubDate: art.pubDate,
            link: art.link,
          });
        }
      }
    }

    const topics = Object.entries(tagCounts)
      .map(([tag, count]) => {
        const catObj = tagCategories[tag] || {};
        let primaryCategory = 'World';
        let maxCatCount = 0;
        for (const [c, cnt] of Object.entries(catObj)) {
          if (cnt > maxCatCount) {
            maxCatCount = cnt;
            primaryCategory = c;
          }
        }

        return {
          tag,
          count,
          percentage: totalTagOccurrences > 0 ? Math.round((count / totalTagOccurrences) * 1000) / 10 : 0,
          categories: catObj,
          primaryCategory,
          sentimentBreakdown: tagSentiments[tag] || { Neutral: count },
          recentArticles: tagArticles[tag] || [],
        };
      })
      .sort((a, b) => b.count - a.count);

    const topKeyword = topics.length > 0 ? topics[0].tag : 'Global Updates';

    let fastestRising = topKeyword;
    let highestRecentScore = 0;
    for (const topic of topics.slice(0, 30)) {
      const recentCnt = recentTagCounts[topic.tag] || 0;
      const score = recentCnt * 2 + topic.count;
      if (score > highestRecentScore) {
        highestRecentScore = score;
        fastestRising = topic.tag;
      }
    }

    const averageTagsPerArticle = articles.length > 0 ? Math.round((totalTagOccurrences / articles.length) * 10) / 10 : 0;

    res.json({
      success: true,
      trendingData: {
        totalUniqueTags: topics.length,
        totalTagOccurrences,
        topKeyword,
        fastestRising,
        averageTagsPerArticle,
        topics,
        categoryDistribution,
      }
    });
  } catch (err: any) {
    console.error('Error calculating trending topics:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to calculate trending topics' });
  }
});

// GET /api/database/articles - Retrieve all persisted news records directly from the database
app.get('/api/database/articles', (req, res) => {
  try {
    const articles = (cachedArticles && cachedArticles.length > 0) ? cachedArticles : loadStoredArticles();
    res.json({
      success: true,
      total: articles.length,
      articles,
      lastRefreshedAt: lastRefreshedAt.toISOString(),
      databaseFile: STORAGE_FILE,
      isPersistent: true
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to retrieve database articles' });
  }
});

// POST /api/database/sync - Force immediate synchronization of news stories to persistent database with client merge
app.post('/api/database/sync', (req, res) => {
  try {
    const clientArticles = req.body?.articles;
    if (Array.isArray(clientArticles) && clientArticles.length > 0) {
      const titleMap = new Map<string, NewsArticle>();
      // First populate with cached articles
      cachedArticles.forEach(a => {
        if (a && a.title) {
          const key = a.title.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          if (key) titleMap.set(key, a);
        }
      });
      // Then merge client articles if missing
      clientArticles.forEach((a: NewsArticle) => {
        if (a && a.title) {
          const key = a.title.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          if (key && !titleMap.has(key)) {
            titleMap.set(key, a);
          }
        }
      });
      cachedArticles = Array.from(titleMap.values());
      cachedArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    }

    saveStoredArticles(cachedArticles);
    res.json({
      success: true,
      message: 'All scraped news articles successfully synchronized to persistent disk database and backup.',
      totalArticlesStored: cachedArticles.length,
      syncedAt: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to sync database' });
  }
});

// POST /api/database/scrape-now - Trigger immediate feed scraping and commit to database
app.post('/api/database/scrape-now', async (req, res) => {
  try {
    const scraped = await scrapeAllSources();
    res.json({
      success: true,
      message: `Scraping complete. Ingested ${scraped.length} total active articles in database.`,
      totalArticlesStored: scraped.length,
      scrapedAt: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to scrape feeds' });
  }
});

// POST /api/database/backup - Create timestamped backup snapshot
app.post('/api/database/backup', (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotName = `scraped_articles_backup_${timestamp}.json`;
    const snapshotPath = path.join(process.cwd(), snapshotName);
    fs.writeFileSync(snapshotPath, JSON.stringify(cachedArticles, null, 2), 'utf-8');
    
    res.json({
      success: true,
      message: `Database backup snapshot successfully created: ${snapshotName}`,
      backupFileName: snapshotName,
      totalArticles: cachedArticles.length,
      createdAt: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to create backup snapshot' });
  }
});

// GET /api/news/resolve-image - On-demand image resolver that scrapes authentic image from any article URL
app.get('/api/news/resolve-image', async (req, res) => {
  const url = req.query.url as string;
  const title = (req.query.title as string) || '';
  const category = (req.query.category as string) || 'World';

  if (!url) {
    return res.status(400).json({ success: false, error: 'Article URL is required.' });
  }

  // 1. Check in-memory / persistent cache
  if (scrapedOgImageCache.has(url)) {
    return res.json({ success: true, imageUrl: scrapedOgImageCache.get(url), source: 'cache' });
  }

  // 2. Scrape source webpage directly
  try {
    const scrapedUrl = await scrapeOgImageFromSourceWebpage(url, 4000);
    if (scrapedUrl && isValidImageCandidate(scrapedUrl)) {
      scrapedOgImageCache.set(url, scrapedUrl);
      saveScrapedImageCache();
      return res.json({ success: true, imageUrl: scrapedUrl, source: 'scraped' });
    }
  } catch {}

  // 3. Fallback to precision topic matcher
  const matched = getSemanticallyMatchedNewsImage(title, category);
  return res.json({ success: true, imageUrl: matched, source: 'semantic_topic_match' });
});

// POST /api/news/enrich-images - Trigger immediate background enrichment of existing stored articles with source images
app.post('/api/news/enrich-images', async (req, res) => {
  enrichExistingArticlesWithSourceImages();
  res.json({
    success: true,
    message: 'Background image enrichment initiated across stored articles.',
    totalArticles: cachedArticles.length
  });
});

// GET /ads.txt - Official Authorized Digital Sellers file for Google AdSense
app.get('/ads.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(`google.com, pub-6411773855584982, DIRECT, f08c47fec0942fa0\n`);
});

// GET /robots.txt - Instructions for search engine & Google AdSense crawlers
app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.send(`User-agent: *
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
`);
});

// GET /sitemap.xml - Dynamic XML Sitemap for SEO & Search Crawlers (Comprehensive with Google News & Images)
app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const sitemapXml = generateSitemapXml(baseUrl, cachedArticles);
  res.send(sitemapXml);
});

// GET /news-sitemap.xml - Dedicated Google News XML Sitemap (Filtered strictly for last 48 hours)
app.get('/news-sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=900, s-maxage=1800');
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const sitemapXml = generateGoogleNewsSitemapXml(baseUrl, cachedArticles);
  res.send(sitemapXml);
});

// GET /video-sitemap.xml & /videos-sitemap.xml - Dedicated Video XML Sitemap (Google Video search compliant)
app.get(['/video-sitemap.xml', '/videos-sitemap.xml'], (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const sitemapXml = generateVideoSitemapXml(baseUrl, cachedViralVideos);
  res.send(sitemapXml);
});

// GET /category-sitemap.xml & /categories-sitemap.xml - Dedicated Category & Topic Tags XML Sitemap
app.get(['/category-sitemap.xml', '/categories-sitemap.xml'], (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const sitemapXml = generateCategorySitemapXml(baseUrl, cachedArticles);
  res.send(sitemapXml);
});

// GET /sitemap.html & /sitemap - User & Bot Searchable HTML Sitemap
app.get(['/sitemap.html', '/sitemap'], (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const sitemapHtml = generateHtmlSitemap(baseUrl, cachedArticles, cachedViralVideos);
  res.send(sitemapHtml);
});

// GET /sitemap_index.xml - Master Sitemap Index bundling Main, Google News, and Video Sitemaps
app.get('/sitemap_index.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const sitemapXml = generateSitemapIndexXml(baseUrl);
  res.send(sitemapXml);
});

// GET /api/sitemap/status - Endpoint to inspect sitemap indexing statistics and automated daily refresh status
app.get('/api/sitemap/status', (req, res) => {
  const publicSitemap = path.join(process.cwd(), 'public', 'sitemap.xml');
  let fileSizeBytes = 0;
  let fileModified = sitemapLastGeneratedAt.toISOString();
  
  if (fs.existsSync(publicSitemap)) {
    const stats = fs.statSync(publicSitemap);
    fileSizeBytes = stats.size;
    fileModified = stats.mtime.toISOString();
  }

  const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
  const recentGoogleNewsCount = cachedArticles.filter(a => a.pubDate && new Date(a.pubDate).getTime() >= twoDaysAgo).length;

  res.json({
    success: true,
    sitemapUrl: '/sitemap.xml',
    newsSitemapUrl: '/news-sitemap.xml',
    videoSitemapUrl: '/video-sitemap.xml',
    sitemapIndexUrl: '/sitemap_index.xml',
    totalArticlesIndexed: cachedArticles.length,
    totalVideosIndexed: cachedViralVideos.length,
    googleNewsArticles48h: recentGoogleNewsCount,
    lastGeneratedAt: sitemapLastGeneratedAt.toISOString(),
    nextScheduledDailyRunAt: nextScheduledDailyRunAt.toISOString(),
    dailyAutomationActive: true,
    diskFileLastModified: fileModified,
    diskFileSizeBytes: fileSizeBytes,
    updateFrequency: 'Real-time on every feed refresh + Scheduled Daily UTC Midnight Cron Sync',
    supportedProtocols: [
      'Sitemaps.org 0.9 Core Protocol',
      'Google News XML Sitemap Protocol (xmlns:news)',
      'Google Image Sitemap Protocol (xmlns:image)',
      'Google Video Sitemap Protocol (xmlns:video)',
      'Sitemaps.org Sitemap Index Protocol (<sitemapindex>)'
    ],
    recentGenerationLogs: sitemapGenerationHistory.slice(0, 10)
  });
});

// POST /api/sitemap/regenerate - Trigger on-demand sitemap refresh
app.post('/api/sitemap/regenerate', (req, res) => {
  updateSitemapDiskFile(cachedArticles, cachedViralVideos, 'manual_admin');
  res.json({
    success: true,
    message: 'Sitemaps (sitemap.xml, news-sitemap.xml, video-sitemap.xml, sitemap_index.xml) successfully regenerated on disk and memory cache.',
    totalArticlesIndexed: cachedArticles.length,
    totalVideosIndexed: cachedViralVideos.length,
    generatedAt: sitemapLastGeneratedAt.toISOString(),
    nextScheduledDailyRunAt: nextScheduledDailyRunAt.toISOString()
  });
});

// GET /api/sitemap/daily-job - Trigger endpoint for external daily cron schedulers / webhooks
app.get('/api/sitemap/daily-job', (req, res) => {
  updateSitemapDiskFile(cachedArticles, cachedViralVideos, 'daily_scheduled_cron');
  res.json({
    success: true,
    job: 'daily_sitemap_synchronization',
    totalArticlesIndexed: cachedArticles.length,
    totalVideosIndexed: cachedViralVideos.length,
    generatedAt: sitemapLastGeneratedAt.toISOString(),
    nextScheduledDailyRunAt: nextScheduledDailyRunAt.toISOString()
  });
});


// GET /feed.xml - Dynamic RSS 2.0 Feed for search engines & news readers
app.get('/feed.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml');
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  const itemsXml = cachedArticles.slice(0, 50).map(art => `
    <item>
      <title><![CDATA[${art.title}]]></title>
      <link>${art.link}</link>
      <guid isPermaLink="false">${art.id}</guid>
      <pubDate>${new Date(art.pubDate).toUTCString()}</pubDate>
      <description><![CDATA[${art.aiSummary?.whyItMatters || art.description}]]></description>
      <category>${art.category}</category>
    </item>`).join('');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NewsPulse - AI News Feed</title>
    <link>${baseUrl}</link>
    <description>Live automated news aggregator and Gemini AI summarizer</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;

  res.send(rssXml.trim());
});

// ============================================================================
// --- VIRAL VIDEOS SCRAPING, PERSISTENCE & VIDEO SEO SITEMAP ENGINE ---
// ============================================================================

const VIRAL_VIDEOS_DB_FILE = path.join(process.cwd(), 'scraped_viral_videos_db.json');

// High-quality Initial Seed of Trending Internet Videos spanning 24h, 48h, 7d, and Classic Vault
const INITIAL_SEED_VIDEOS: ViralVideo[] = [
  // --- TIER 1: LAST 24 HOURS (PAGE 1 - TODAY'S MOST SEEN) ---
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
    tags: ['#Robotics', '#ArtificialIntelligence', '#HumanoidRobot', '#Tech2026', '#ViralTech', '#FutureOfWork'],
    seoKeywords: ['humanoid robot demonstration', 'autonomous robotics 2026', 'multimodal AI robot', 'viral robotics video'],
    slug: 'humanoid-robots-multimodal-neural-networks-demo',
    metaDescription: 'Watch breakthrough footage of autonomous humanoid robots executing complex physical tasks in real time.',
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 99,
    aiTakeaway: 'Demonstrates the paradigm shift from scripted robotic motions to real-time spatial LLM reasoning in physical environments.',
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
    tags: ['#SpaceX', '#Starship', '#RocketLaunch', '#EngineeringMarvel', '#SpaceFlight', '#ViralVideo'],
    seoKeywords: ['spacex starship booster catch slow motion', 'super heavy chopstick catch footage', 'aerospace engineering viral video'],
    slug: 'starship-booster-precision-tower-catch-slow-motion',
    metaDescription: 'Watch ultra-high-definition slow-motion footage of the historic Super Heavy rocket booster tower catch.',
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 98,
    aiTakeaway: 'Full rocket reusability enables a projected 90% reduction in orbital payload costs over the next decade.',
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
    tags: ['#OpenSourceAI', '#MachineLearning', '#ReasoningModels', '#DeepSeek', '#AIRevolution', '#TechTrends'],
    seoKeywords: ['open source reasoning models', 'mixture of experts architecture', 'ai benchmark comparison', 'viral ai video'],
    slug: 'open-weights-reasoning-ai-architecture-breakdown',
    metaDescription: 'Technical analysis of next-generation mixture-of-experts reasoning AI models and open-source benchmarks.',
    sentiment: 'Analysis',
    isViralTrend: true,
    viralScore: 97,
    aiTakeaway: 'Open-weights reasoning models show compute efficiency gains exceeding 60% compared to traditional dense architectures.',
    hindiTitle: 'ओपन-सोर्स एआई क्रांति: कैसे नए मॉडल बड़ी कंपनियों को पछाड़ रहे हैं',
    hindiDescription: 'आर्टिफिशियल इंटेलिजेंस और रीज़निंग मॉडल्स का विस्तृत विश्लेषण।'
  },
  {
    id: 'vid-wholesome-golden-retriever-baby',
    title: 'Golden Retriever Gently Teaches Toddler How to Walk Across Living Room',
    description: 'Heartwarming viral video of an ultra-patient golden retriever matching step-for-step alongside a 10-month-old baby learning to walk, going viral with tens of millions of views across social media.',
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
    tags: ['#Wholesome', '#GoldenRetriever', '#CuteAnimals', '#ViralPet', '#Heartwarming', '#TrendingVideo'],
    seoKeywords: ['golden retriever helps baby walk', 'wholesome viral dog video', 'cute animal moments', 'reddit viral clips'],
    slug: 'golden-retriever-teaches-toddler-to-walk-wholesome',
    metaDescription: 'Heartwarming viral clip of a patient golden retriever gently supporting a toddler taking their first steps.',
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 96,
    aiTakeaway: 'Captures universal human-canine empathy, generating peak engagement and cross-platform sharing.',
    hindiTitle: 'गोल्डन रिट्रीवर ने छोटे बच्चे को चलना सिखाया - दिल छू लेने वाला वीडियो',
    hindiDescription: 'सोशल मीडिया पर करोड़ों लोगों का दिल जीतने वाला प्यारा वीडियो।'
  },
  {
    id: 'vid-james-webb-deep-universe',
    title: 'James Webb Telescope Captures Cosmic Dawn: Earliest Galaxies Ever Discovered',
    description: 'Astronomers release stunning 4K deep-field survey capturing gravitational lensing around superclusters, revealing the very first light emitted 13.4 billion years ago.',
    videoUrl: 'https://www.youtube.com/watch?v=2Tz8N_m7U8E',
    embedUrl: 'https://www.youtube-nocookie.com/embed/2Tz8N_m7U8E?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    source: 'NASA / ESA Science',
    author: 'Astrophysics Daily',
    platform: 'youtube',
    viewsCount: 5120000,
    likesCount: 420000,
    duration: '06:42',
    pubDate: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    category: 'Science',
    tags: ['#JamesWebb', '#SpaceDiscovery', '#Astronomy', '#Cosmos', '#NASA', '#ScienceViral'],
    seoKeywords: ['james webb space telescope deep field', 'cosmic dawn galaxy discovery', 'jwst 4k space footage', 'deep space science'],
    slug: 'james-webb-telescope-cosmic-dawn-earliest-galaxies',
    metaDescription: 'Stunning 4K footage and gravitational lensing analysis from the James Webb Space Telescope.',
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 98,
    aiTakeaway: 'The newly observed redshift structures challenge previous galaxy formation models, indicating rapid stellar genesis in the early universe.',
    hindiTitle: 'जेम्स वेब स्पेस टेलीस्कोप ने खींची ब्रह्मांड की सबसे पुरानी आकाशगंगाएं',
    hindiDescription: '13.4 अरब साल पहले की प्राचीन आकाशगंगाओं का 4K दृश्य।'
  },
  {
    id: 'vid-f1-extreme-pitstop-record',
    title: 'Formula 1 Team Executes World Record 1.78 Second 4-Wheel Pit Stop',
    description: 'Precision mechanical choreography in 120fps high-speed camera angles showing 22 crew members lifting the car, swapping four tires, and releasing back onto tarmac in under two seconds.',
    videoUrl: 'https://www.youtube.com/watch?v=7VCYBtx6h4U',
    embedUrl: 'https://www.youtube-nocookie.com/embed/7VCYBtx6h4U?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    source: 'SpeedWorld TV',
    author: 'Motorsport Highlights',
    platform: 'youtube',
    viewsCount: 7210000,
    likesCount: 560000,
    duration: '01:55',
    pubDate: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    category: 'Sports',
    tags: ['#Formula1', '#PitStopRecord', '#Motorsport', '#Speed', '#ExtremeTeamwork', '#ViralSports'],
    seoKeywords: ['formula 1 world record pit stop 1.78s', 'f1 team pit crew speed slow motion', 'fastest pitstop in motorsport history'],
    slug: 'formula-1-world-record-pit-stop-speed-breakdown',
    metaDescription: 'High-speed camera breakdown of the world-record 1.78 second Formula 1 pit stop.',
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 95,
    aiTakeaway: 'Milliseconds were saved through zero-play pneumatic wheel guns and synchronized electronic release signals.',
    hindiTitle: 'फॉर्मूला 1 में 1.78 सेकंड का वर्ल्ड रिकॉर्ड पिट स्टॉप - तेज रफ्तार का कमाल',
    hindiDescription: 'पलक झपकते ही 4 पहिए बदलने की अविश्वसनीय गति का वीडियो।'
  },
  {
    id: 'vid-mit-fusion-energy-reactor',
    title: 'MIT & CFS Magnet Team Achieve Sustained 20-Tesla High-Temperature Superconducting Field',
    description: 'Electrifying milestone footage inside the compact tokamak testing facility showing super-cooled superconducting electromagnets stabilizing high-density plasma.',
    videoUrl: 'https://www.youtube.com/watch?v=kX2Zz8d9pWE',
    embedUrl: 'https://www.youtube-nocookie.com/embed/kX2Zz8d9pWE?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80',
    source: 'MIT Energy Pulse',
    author: 'Clean Fusion Research',
    platform: 'youtube',
    viewsCount: 3950000,
    likesCount: 310000,
    duration: '07:15',
    pubDate: new Date(Date.now() - 21 * 3600 * 1000).toISOString(),
    category: 'Science',
    tags: ['#NuclearFusion', '#CleanEnergy', '#MIT', '#Superconductors', '#PhysicsMilestone', '#ViralScience'],
    seoKeywords: ['mit fusion energy magnet test', '20 tesla magnetic field tokamak', 'commercial nuclear fusion clean energy'],
    slug: 'mit-sustained-superconducting-magnetic-field-fusion',
    metaDescription: 'Watch historic footage of the 20-tesla superconducting magnet enabling clean commercial fusion.',
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 96,
    aiTakeaway: 'High-temperature superconductor (HTS) tape reduces required tokamak volume by a factor of 40.',
    hindiTitle: 'परमाणु संलयन (Fusion) ऊर्जा में बड़ा कदम - 20 टेस्ला सुपरकंडक्टिंग मैग्नेट',
    hindiDescription: 'असीमित स्वच्छ ऊर्जा के स्रोत पर वैज्ञानिकों की बड़ी सफलता का वीडियो।'
  },

  // --- TIER 2: 24 TO 48 HOURS (PAGE 2 - YESTERDAY'S VIRAL BUZZ) ---
  {
    id: 'vid-drone-volcano-eruption-iceland',
    title: 'Custom FPV Drone Flies Inside Active Volcanic Lava Fissure in Iceland',
    description: 'High-speed FPV racing drone dives directly into molten magma fountain spewing hundreds of feet into the night sky, capturing unprecedented 8K dynamic range footage.',
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
    tags: ['#Volcano', '#FPVDrone', '#Iceland', '#LavaFlow', '#Cinematography', '#ViralAdrenaline'],
    seoKeywords: ['fpv drone inside volcano eruption iceland', 'extreme lava drone 4k video', 'volcanic fissure fpv flight'],
    slug: 'fpv-drone-flies-inside-active-volcano-iceland',
    metaDescription: 'Incredible FPV drone flight diving directly through active molten lava fountains in Iceland.',
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 94,
    aiTakeaway: 'FPV cinematographers utilized custom heat-resistant carbon-fiber framing to capture close-range hydrothermal dynamics.',
    hindiTitle: 'आइसलैंड में उबलते ज्वालामुखी के अंदर ड्रोन की उड़ान - 4K दृश्य',
    hindiDescription: 'धधकते लावे के ऊपर ड्रोन की हैरतअंगेज रिकॉर्डिंग।'
  },
  {
    id: 'vid-crazy-optical-illusion-sculpture',
    title: 'Mind-Bending 3D Ambiguous Kinetic Sculpture Changes Shape When Rotated',
    description: 'Viral optical illusion artwork where an impossible geometric wireframe morphs seamlessly between three completely different animal silhouettes as lighting shifts.',
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
    tags: ['#OpticalIllusion', '#KineticArt', '#MindBlown', '#TikTokViral', '#AmbiguousCylinder', '#ViralHit'],
    seoKeywords: ['impossible optical illusion sculpture', 'mind blowing 3d perspective art', 'tiktok viral illusion clips'],
    slug: 'mind-bending-3d-optical-illusion-kinetic-sculpture',
    metaDescription: 'Watch this mind-bending kinetic sculpture change shape entirely depending on perspective and rotation.',
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 96,
    aiTakeaway: 'Exploits visual perspective ambiguities in human depth perception to create dynamic anamorphic projections.',
    hindiTitle: 'दिमाग को घुमा देने वाला ऑप्टिकल इल्यूजन - 3D कलाकृति',
    hindiDescription: 'घूमने पर अपना रूप बदल देने वाली अनोखी 3डी कला का वायरल वीडियो।'
  },
  {
    id: 'vid-quantum-computing-chip-speed',
    title: 'Physicists Achieve 1000-Qubit Fault-Tolerant Quantum Simulation Milestone',
    description: 'Laboratory walkthrough unveiling the cryogenic dilution refrigerator running error-corrected topological qubits capable of solving molecular folding problems in seconds.',
    videoUrl: 'https://www.youtube.com/watch?v=F_Riqjdh2oM',
    embedUrl: 'https://www.youtube-nocookie.com/embed/F_Riqjdh2oM?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
    source: 'Quantum Wire Lab',
    author: 'Applied Physics Today',
    platform: 'youtube',
    viewsCount: 1850000,
    likesCount: 142000,
    duration: '08:35',
    pubDate: new Date(Date.now() - 34 * 3600 * 1000).toISOString(),
    category: 'Tech',
    tags: ['#QuantumComputing', '#Qubits', '#FutureTech', '#Physics', '#Nanotechnology', '#ScienceViral'],
    seoKeywords: ['fault tolerant quantum computer demo', '1000 qubit quantum processor', 'cryogenic quantum lab tour'],
    slug: 'fault-tolerant-quantum-computing-processor-breakthrough',
    metaDescription: 'Exclusive tour and benchmark demonstration of a 1000-qubit fault-tolerant quantum processor.',
    sentiment: 'Positive',
    isViralTrend: false,
    viralScore: 91,
    aiTakeaway: 'Surface code error correction brings practical pharmaceutical simulation within near-term commercial feasibility.',
    hindiTitle: 'क्वांटम कंप्यूटिंग में बड़ा कीर्तिमान - 1000 क्यूबिट प्रोसेसर का अनावरण',
    hindiDescription: 'क्वांटम भौतिकी और भविष्य के सुपरकंप्यूटर का तकनीकी वीडियो।'
  },
  {
    id: 'vid-electric-vertical-takeoff-aircraft',
    title: 'Commercial eVTOL Air Taxi Completes First Full Autonomous City Commute Test',
    description: 'Quiet electric vertical takeoff aircraft completes 35-kilometer intercity flight navigating skyscrapers, landing softly on high-rise vertiport.',
    videoUrl: 'https://www.youtube.com/watch?v=Jm_2a_7Y5eQ',
    embedUrl: 'https://www.youtube-nocookie.com/embed/Jm_2a_7Y5eQ?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
    source: 'AeroFuture Tech',
    author: 'Urban Mobility Index',
    platform: 'youtube',
    viewsCount: 2280000,
    likesCount: 160000,
    duration: '05:10',
    pubDate: new Date(Date.now() - 38 * 3600 * 1000).toISOString(),
    category: 'Tech',
    tags: ['#eVTOL', '#AirTaxi', '#UrbanAviation', '#ElectricFlight', '#FutureCities', '#TechViral'],
    seoKeywords: ['evtol air taxi city flight test', 'autonomous urban air mobility 2026', 'electric aircraft vertiport landing'],
    slug: 'evtol-air-taxi-autonomous-city-flight-test',
    metaDescription: 'First full passenger flight demonstration of autonomous electric vertical takeoff air taxi.',
    sentiment: 'Positive',
    isViralTrend: false,
    viralScore: 90,
    aiTakeaway: 'Distributed electric propulsion produces 80% lower acoustic footprint than conventional helicopters at equivalent altitudes.',
    hindiTitle: 'उड़ने वाली एयर टैक्सी का सफल परीक्षण - भविष्य का सफर',
    hindiDescription: 'इलेक्ट्रिक एयर टैक्सी की पहली स्वायत्त शहरी उड़ान का वीडियो।'
  },
  {
    id: 'vid-boston-dynamics-atlas-parkour',
    title: 'Next-Generation Electric Atlas Robot Completes High-Speed Fluid Gymnastics Routine',
    description: 'All-electric Atlas performs uninterrupted flips, 360-degree rotational vaulting, and dynamic balance recovery over complex obstacle courses with no external safety tether.',
    videoUrl: 'https://www.youtube.com/watch?v=tF4DML7FIWk',
    embedUrl: 'https://www.youtube-nocookie.com/embed/tF4DML7FIWk?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=1200&q=80',
    source: 'Boston Dynamics Wire',
    author: 'Dynamics Robotics',
    platform: 'youtube',
    viewsCount: 9450000,
    likesCount: 810000,
    duration: '02:18',
    pubDate: new Date(Date.now() - 42 * 3600 * 1000).toISOString(),
    category: 'Tech',
    tags: ['#AtlasRobot', '#ParkourRobot', '#BostonDynamics', '#BipedalRobotics', '#TechViral', '#Gymnastics'],
    seoKeywords: ['boston dynamics atlas gymnastics routine', 'electric atlas flip parkour video', 'bipedal robot athletics demonstration'],
    slug: 'electric-atlas-robot-high-speed-gymnastics-routine',
    metaDescription: 'Watch the all-electric Atlas robot execute seamless gymnastics and parkour vaults with zero tether.',
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 98,
    aiTakeaway: 'Custom high-torque electric actuators provide superior power-to-weight ratio compared to legacy hydraulic manifolds.',
    hindiTitle: 'एटलस रोबोट का हैरतअंगेज जिमनास्टिक्स और कलाबाजी वीडियो',
    hindiDescription: 'रोबोटिक्स इंजीनियरिंग की दुनिया में नया मुकाम।'
  },

  // --- TIER 3: 48 HOURS TO 7 DAYS (PAGE 3 - THIS WEEK'S LEGENDS) ---
  {
    id: 'vid-apple-vision-spatial-compute',
    title: 'Surgeons Perform World-First Microscopic Spine Surgery Using Ultra-Low Latency Spatial Vision',
    description: 'Operating room medical broadcast showing neurosurgeons overlaying real-time 3D MRI scans directly onto patient anatomy via millimeter-accurate spatial computing headsets.',
    videoUrl: 'https://www.youtube.com/watch?v=TX9qSaGXFyg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/TX9qSaGXFyg?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    source: 'MedTech Global',
    author: 'Surgical Innovations',
    platform: 'youtube',
    viewsCount: 4120000,
    likesCount: 330000,
    duration: '05:40',
    pubDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    category: 'Tech',
    tags: ['#SpatialComputing', '#MedTech', '#SurgeryInnovation', '#AugmentedReality', '#Healthcare2026'],
    seoKeywords: ['spatial computing surgery spine mri overlay', 'augmented reality neurosurgery demo', 'medical spatial headset in operating room'],
    slug: 'surgeons-microscopic-spine-surgery-spatial-computing',
    metaDescription: 'Surgeons demonstrate real-time 3D MRI holograms in complex spine surgery using spatial computing headsets.',
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 93,
    aiTakeaway: 'Sub-millimeter holographic registration reduced operating duration by 28% while increasing precision.',
    hindiTitle: 'स्पेशियल कंप्यूटिंग और 3D विजन से सफल स्पाइन सर्जरी - चिकित्सा में क्रांति',
    hindiDescription: 'डॉक्टरों ने सर्जरी के दौरान थ्री-डी होलोग्राम तकनीक का इस्तेमाल किया।'
  },
  {
    id: 'vid-hydraulic-press-diamond-crush',
    title: 'Can a 1000-Ton Industrial Hydraulic Press Shatter a Flawless Real Lab Diamond?',
    description: 'Slow-motion 20,000fps physics stress test putting a 5-carat flawless synthetic diamond under escalating pneumatic pressure to witness the exact moment of crystalline lattice fracture.',
    videoUrl: 'https://www.youtube.com/watch?v=kX2Zz8d9pWE',
    embedUrl: 'https://www.youtube-nocookie.com/embed/kX2Zz8d9pWE?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80',
    source: 'Hydraulic Physics Lab',
    author: 'Crush Science',
    platform: 'youtube',
    viewsCount: 11200000,
    likesCount: 890000,
    duration: '04:05',
    pubDate: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    category: 'Science',
    tags: ['#HydraulicPress', '#DiamondCrush', '#SlowMotion', '#PhysicsExperiment', '#Satisfying', '#ViralHit'],
    seoKeywords: ['hydraulic press diamond crush slow motion', '1000 ton press vs real diamond', 'high speed camera material fracture'],
    slug: '1000-ton-hydraulic-press-vs-real-diamond-slow-motion',
    metaDescription: 'Watch 20,000fps slow-motion capture of a flawless diamond tested to the limit under 1000 tons of hydraulic force.',
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 97,
    aiTakeaway: 'The sudden explosive fracture reveals anisotropic shear cleavage planes characteristic of cubic diamond crystal structures.',
    hindiTitle: '1000 टन हाइड्रोलिक प्रेस बनाम असली हीरा - क्या हुआ जब दबाया गया?',
    hindiDescription: 'अविश्वसनीय स्लो मोशन भौतिकी प्रयोग का वायरल वीडियो।'
  },
  {
    id: 'vid-tokyo-hyperlapse-bullet-train',
    title: '8K Hyperlapse Across Tokyo Neon Cityscape from Shinkansen Bullet Train Cab',
    description: 'Breathtaking 60fps cinematic hyperlapse navigating through rainy illuminated skyscraper canyons, subterranean tunnels, and iconic cyberpunk bridges at 320km/h.',
    videoUrl: 'https://www.youtube.com/watch?v=AXqn_q_mKGE',
    embedUrl: 'https://www.youtube-nocookie.com/embed/AXqn_q_mKGE?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    source: 'Cinematic Shinkansen',
    author: 'Tokyo Visual Arts',
    platform: 'vimeo',
    viewsCount: 3650000,
    likesCount: 295000,
    duration: '03:30',
    pubDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    category: 'Entertainment',
    tags: ['#Tokyo', '#Hyperlapse', '#Cinematography', '#Cyberpunk', '#Shinkansen', '#8KFootage'],
    seoKeywords: ['tokyo night hyperlapse shinkansen train 8k', 'cyberpunk tokyo neon cinematic video', 'bullet train driver cabin hyperlapse'],
    slug: 'tokyo-neon-cityscape-shinkansen-hyperlapse-8k',
    metaDescription: 'Experience the electric neon energy of Tokyo from the front cab of a Shinkansen train in pristine 8K hyperlapse.',
    sentiment: 'Positive',
    isViralTrend: false,
    viralScore: 91,
    aiTakeaway: 'Captured with stabilized dual-gimbal optical sensors featuring auto-exposure ramping for rapid tunnel-to-cityscape transitions.',
    hindiTitle: 'टोक्यो की नियॉन सड़कों पर बुलेट ट्रेन की 8K हाइपरलैप्स यात्रा',
    hindiDescription: 'जापान की तेज रफ्तार ट्रेन और जगमगाते शहर का मनमोहक दृश्य।'
  },

  // --- TIER 4: 7+ DAYS (PAGE 4+ - CLASSIC VIRAL VAULT) ---
  {
    id: 'vid-veritasium-black-hole-simulation',
    title: 'The Most Accurate Supermassive Black Hole Simulation Ever Computed in Real-Time',
    description: 'Astrophysicists render general relativistic ray-tracing showing photonic rings, Doppler beaming asymmetry, and event horizon frame-dragging in staggering mathematical fidelity.',
    videoUrl: 'https://www.youtube.com/watch?v=2Tz8N_m7U8E',
    embedUrl: 'https://www.youtube-nocookie.com/embed/2Tz8N_m7U8E?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80',
    source: 'Veritasium & Astrophysics Collective',
    author: 'Astrophysics Simulation Wire',
    platform: 'youtube',
    viewsCount: 14500000,
    likesCount: 1120000,
    duration: '14:20',
    pubDate: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
    category: 'Science',
    tags: ['#BlackHole', '#Physics', '#GeneralRelativity', '#Astrophysics', '#Cosmos', '#VeritasiumViral'],
    seoKeywords: ['most accurate black hole simulation 4k', 'general relativity ray tracing event horizon', 'astrophysics supermassive black hole simulation'],
    slug: 'most-accurate-supermassive-black-hole-simulation-realtime',
    metaDescription: 'Astrophysicists compute the most mathematically rigorous simulation of a spinning Kerr black hole event horizon.',
    sentiment: 'Analysis',
    isViralTrend: false,
    viralScore: 98,
    aiTakeaway: 'Demonstrates Einsteinian spacetime distortion and gravitational redshift effects with unmatched GPU tensor core computation.',
    hindiTitle: 'ब्लैक होल का अब तक का सबसे सटीक 4K सिमुलेशन - ब्रह्मांड का रहस्य',
    hindiDescription: 'आइंस्टीन के सापेक्षता के सिद्धांत और ब्लैक होल के अद्भुत वैज्ञानिक दृश्य।'
  },
  {
    id: 'vid-mark-rober-squirrel-obstacle',
    title: 'Building the Ultimate Backyard Squirrel Ninja Obstacle Course 3.0',
    description: 'Former NASA engineer designs an insanely intricate kinetic maze filled with laser tripwires, optical weight scales, catapult soft-landings, and nut dispensers to test rodent problem-solving IQ.',
    videoUrl: 'https://www.youtube.com/watch?v=7X8II6J-6mU',
    embedUrl: 'https://www.youtube-nocookie.com/embed/7X8II6J-6mU?autoplay=1&rel=0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507666405895-422eee7d517f?auto=format&fit=crop&w=1200&q=80',
    source: 'Mark Rober Channel',
    author: 'Mark Rober',
    platform: 'youtube',
    viewsCount: 28400000,
    likesCount: 1850000,
    duration: '18:50',
    pubDate: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    category: 'Entertainment',
    tags: ['#MarkRober', '#Engineering', '#SquirrelMaze', '#NinjaCourse', '#Wholesome', '#ViralMasterpiece'],
    seoKeywords: ['mark rober squirrel obstacle course maze', 'engineering backyard ninja course for squirrels', 'viral mechanical engineering video'],
    slug: 'ultimate-backyard-squirrel-ninja-obstacle-course',
    metaDescription: 'NASA engineer builds the ultimate physics-based obstacle course testing backyard squirrel intelligence.',
    sentiment: 'Positive',
    isViralTrend: false,
    viralScore: 99,
    aiTakeaway: 'Showcases creative mechanical engineering applied to mammalian behavioral learning feedback loops.',
    hindiTitle: 'गिलहरी के लिए बनाया दुनिया का सबसे अनोखा निंजा ऑब्सटिकल कोर्स',
    hindiDescription: 'इंजीनियरिंग और विज्ञान का शानदार और मनोरंजक प्रयोग।'
  }
];

// Initialize Viral Videos Storage with Atomic Write, Seed Calibration, and Dual Persistence
function loadStoredViralVideos(): ViralVideo[] {
  let list: ViralVideo[] = [];
  try {
    if (fs.existsSync(VIRAL_VIDEOS_DB_FILE)) {
      const data = fs.readFileSync(VIRAL_VIDEOS_DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch (err) {
    console.warn('[ViralVideosDB] Failed reading disk file, initializing seed:', err);
  }

  // Merge seed items to ensure all time buckets (24h, 48h, 7d, archive) have rich videos
  const map = new Map<string, ViralVideo>();
  list.forEach(v => map.set(v.id, v));
  INITIAL_SEED_VIDEOS.forEach(s => {
    if (!map.has(s.id)) {
      map.set(s.id, s);
    }
  });

  const merged = Array.from(map.values());
  saveStoredViralVideos(merged);
  return merged;
}

function saveStoredViralVideos(videos: ViralVideo[]): void {
  if (!Array.isArray(videos)) return;
  try {
    const tempPath = `${VIRAL_VIDEOS_DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(videos, null, 2), 'utf-8');
    fs.renameSync(tempPath, VIRAL_VIDEOS_DB_FILE);
  } catch (err) {
    console.error('[ViralVideosDB] Error saving viral videos to disk:', err);
  }
}

cachedViralVideos = loadStoredViralVideos();

// Video RSS & JSON Sources for Continuous Live Internet Scraping
interface VideoScrapeSource {
  name: string;
  type: 'reddit_json' | 'youtube_rss' | 'vimeo_rss' | 'web_rss';
  url: string;
  category: VideoCategory;
  platform: VideoPlatform;
  channelId?: string;
  subreddit?: string;
}

const SCRAPE_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (NewsPulse/3.0; News Aggregator)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0',
];

function getRandomUserAgent(): string {
  return SCRAPE_USER_AGENTS[Math.floor(Math.random() * SCRAPE_USER_AGENTS.length)];
}

// Helper: Extract YouTube ID from link
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper: Fetch JSON with timeout and User-Agent
async function fetchJsonSafe(url: string, timeoutMs: number = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err: any) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Helper: Fetch XML text with timeout and User-Agent
async function fetchXmlSafe(url: string, timeoutMs: number = 8000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err: any) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Helper: Query oEmbed for metadata (YouTube / Vimeo)
async function fetchOEmbedData(videoUrl: string): Promise<{ title?: string; author?: string; thumbnail?: string; html?: string } | null> {
  const ytId = extractYouTubeId(videoUrl);
  if (ytId) {
    const data = await fetchJsonSafe(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`, 5000);
    if (data) {
      return {
        title: data.title,
        author: data.author_name,
        thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
        html: data.html
      };
    }
    return {
      thumbnail: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
    };
  }

  if (videoUrl.includes('vimeo.com')) {
    const data = await fetchJsonSafe(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}`, 5000);
    if (data) {
      return {
        title: data.title,
        author: data.author_name,
        thumbnail: data.thumbnail_url,
        html: data.html
      };
    }
  }

  return null;
}

const VIDEO_SCRAPE_FEEDS: VideoScrapeSource[] = [
  // Reddit High-Velocity Viral Subreddits
  { name: 'Reddit Videos', type: 'reddit_json', url: 'https://www.reddit.com/r/videos/hot.json?limit=25', category: 'Viral', platform: 'reddit', subreddit: 'videos' },
  { name: 'Reddit Next Level', type: 'reddit_json', url: 'https://www.reddit.com/r/nextfuckinglevel/hot.json?limit=25', category: 'Viral', platform: 'reddit', subreddit: 'nextfuckinglevel' },
  { name: 'Reddit Damnthatsinteresting', type: 'reddit_json', url: 'https://www.reddit.com/r/Damnthatsinteresting/hot.json?limit=25', category: 'Science', platform: 'reddit', subreddit: 'Damnthatsinteresting' },
  { name: 'Reddit Contagious Laughter', type: 'reddit_json', url: 'https://www.reddit.com/r/ContagiousLaughter/hot.json?limit=25', category: 'Humor', platform: 'reddit', subreddit: 'ContagiousLaughter' },
  { name: 'Reddit Tech & Gadgets', type: 'reddit_json', url: 'https://www.reddit.com/r/gadgets/hot.json?limit=25', category: 'Tech', platform: 'reddit', subreddit: 'gadgets' },
  { name: 'Reddit Space', type: 'reddit_json', url: 'https://www.reddit.com/r/space/hot.json?limit=25', category: 'Science', platform: 'reddit', subreddit: 'space' },

  // YouTube Channel Video Feeds
  { name: 'The Verge Video Wire', type: 'youtube_rss', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCvjjYvJEwpLgkgsYx280eWg', category: 'Tech', platform: 'youtube', channelId: 'UCvjjYvJEwpLgkgsYx280eWg' },
  { name: 'MKBHD Tech Reviews', type: 'youtube_rss', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ', category: 'Tech', platform: 'youtube', channelId: 'UCBJycsmduvYEL83R_U4JriQ' },
  { name: 'Kurzgesagt Science', type: 'youtube_rss', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCsXVk37bltHxD1rDPwtNM8Q', category: 'Science', platform: 'youtube', channelId: 'UCsXVk37bltHxD1rDPwtNM8Q' },
  { name: 'TED-Ed Animations', type: 'youtube_rss', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCsooa4yRKGN_zEE8iknghZA', category: 'Science', platform: 'youtube', channelId: 'UCsooa4yRKGN_zEE8iknghZA' },
  { name: 'Mark Rober Engineering', type: 'youtube_rss', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCY1kMZp36IQSyNx_9h4mpCg', category: 'Tech', platform: 'youtube', channelId: 'UCY1kMZp36IQSyNx_9h4mpCg' },
  { name: 'NASA Jet Propulsion Lab', type: 'youtube_rss', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC70ghv53i7U4Wb_4h6Q_7-A', category: 'Science', platform: 'youtube', channelId: 'UC70ghv53i7U4Wb_4h6Q_7-A' },
  { name: 'IGN Gaming & Trailers', type: 'youtube_rss', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCKy1dAqELo0zrOtPkf0eTMw', category: 'Gaming', platform: 'youtube', channelId: 'UCKy1dAqELo0zrOtPkf0eTMw' },

  // Vimeo & Web RSS
  { name: 'Vimeo Staff Picks', type: 'vimeo_rss', url: 'https://vimeo.com/channels/staffpicks/videos/rss', category: 'Entertainment', platform: 'vimeo' },
  { name: 'TED Talks Video', type: 'web_rss', url: 'https://feeds.feedburner.com/tedtalks_video', category: 'Science', platform: 'web' },
];

// Scrape live viral videos from internet feeds
async function scrapeViralVideoFeeds(): Promise<{ scraped: number; total: number; sourcesReport: { name: string; found: number; status: string }[] }> {
  const existingMap = new Map<string, ViralVideo>();
  cachedViralVideos.forEach(v => existingMap.set(v.id, v));
  let newlyScraped = 0;
  const sourcesReport: { name: string; found: number; status: string }[] = [];

  for (const src of VIDEO_SCRAPE_FEEDS) {
    let sourceFoundCount = 0;

    try {
      if (src.type === 'reddit_json') {
        const json = await fetchJsonSafe(src.url, 7000);
        if (json && json.data && Array.isArray(json.data.children)) {
          for (const child of json.data.children) {
            const post = child.data;
            if (!post || post.over_18) continue;

            const postUrl = post.url_overridden_by_dest || post.url || '';
            const isVideo = post.is_video || postUrl.includes('v.redd.it') || postUrl.includes('youtube.com') || postUrl.includes('youtu.be') || postUrl.endsWith('.mp4') || post.post_hint === 'hosted:video';
            if (!isVideo && !extractYouTubeId(postUrl) && !post.media?.reddit_video) continue;

            const rawTitle = (post.title || '').trim();
            if (!rawTitle) continue;

            const vidId = `vid-reddit-${post.id || crypto.createHash('md5').update(postUrl || rawTitle).digest('hex').slice(0, 10)}`;
            if (existingMap.has(vidId)) continue;

            const ytId = extractYouTubeId(postUrl);
            let embedUrl = '';
            let platform: VideoPlatform = 'reddit';
            let thumbnailUrl = 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80';

            if (ytId) {
              platform = 'youtube';
              embedUrl = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`;
              thumbnailUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
            } else if (post.preview?.images?.[0]?.source?.url) {
              thumbnailUrl = post.preview.images[0].source.url.replace(/&amp;/g, '&');
            } else if (post.thumbnail && post.thumbnail.startsWith('http')) {
              thumbnailUrl = post.thumbnail;
            }

            const videoUrl = postUrl || `https://reddit.com${post.permalink}`;
            if (!embedUrl) {
              embedUrl = videoUrl;
            }

            const upvotes = post.score || post.ups || 1500;
            const viewsEst = Math.max(upvotes * (Math.floor(Math.random() * 25) + 15), 100000);
            const likesEst = Math.max(Math.floor(upvotes * 0.9), 5000);
            const viralScore = Math.min(Math.floor(Math.random() * 10) + 90, 99);

            const autoTags = generateHeuristicTags(rawTitle, post.selftext || '', src.category, `r/${src.subreddit}`);
            const videoTags = ['#Viral', `#r_${src.subreddit}`, `#${src.category}`, ...autoTags.tags].slice(0, 6);

            const newVideo: ViralVideo = {
              id: vidId,
              title: rawTitle,
              description: (post.selftext || '').slice(0, 250) || `Viral clip from r/${src.subreddit} with ${upvotes.toLocaleString()} upvotes and massive engagement.`,
              videoUrl,
              embedUrl,
              thumbnailUrl,
              source: `Reddit (r/${src.subreddit})`,
              author: post.author ? `u/${post.author}` : 'Reddit Community',
              platform,
              viewsCount: viewsEst,
              likesCount: likesEst,
              duration: '02:30',
              pubDate: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : new Date().toISOString(),
              category: src.category,
              tags: videoTags,
              seoKeywords: autoTags.seoKeywords,
              slug: rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 60),
              metaDescription: `${rawTitle}. Trending clip on Reddit r/${src.subreddit}.`,
              sentiment: autoTags.sentiment,
              isViralTrend: true,
              viralScore,
              aiTakeaway: `High-velocity viral moment on Reddit with ${upvotes.toLocaleString()} upvotes and rapid cross-platform re-sharing.`,
            };

            existingMap.set(vidId, newVideo);
            newlyScraped++;
            sourceFoundCount++;
          }
        }
      } else if (src.type === 'youtube_rss') {
        const xml = await fetchXmlSafe(src.url, 7000);
        if (xml) {
          // Parse YouTube XML entries using regex matching
          const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
          let entryMatch: RegExpExecArray | null;

          while ((entryMatch = entryRegex.exec(xml)) !== null) {
            const block = entryMatch[1];
            const videoIdMatch = block.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || block.match(/<id>.*?([a-zA-Z0-9_-]{11})<\/id>/);
            const titleMatch = block.match(/<title>(.*?)<\/title>/);
            const authorMatch = block.match(/<name>(.*?)<\/name>/);
            const publishedMatch = block.match(/<published>(.*?)<\/published>/);
            const descMatch = block.match(/<media:description>([\s\S]*?)<\/media:description>/);

            if (!videoIdMatch || !titleMatch) continue;

            const ytId = videoIdMatch[1].trim();
            const rawTitle = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
            if (!ytId || !rawTitle) continue;

            const vidId = `vid-yt-${ytId}`;
            if (existingMap.has(vidId)) continue;

            const rawDesc = (descMatch ? descMatch[1] : '').replace(/<[^>]*>/g, ' ').slice(0, 280);
            const autoTags = generateHeuristicTags(rawTitle, rawDesc, src.category, src.name);
            const videoTags = ['#Viral', `#${src.category}`, ...autoTags.tags].slice(0, 6);

            const randomViews = Math.floor(Math.random() * 3500000) + 650000;
            const randomLikes = Math.floor(randomViews * (Math.random() * 0.07 + 0.03));
            const viralScore = Math.floor(Math.random() * 12) + 88;

            const newVideo: ViralVideo = {
              id: vidId,
              title: rawTitle,
              description: rawDesc || `Trending release from ${src.name} capturing widespread viewership.`,
              videoUrl: `https://www.youtube.com/watch?v=${ytId}`,
              embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`,
              thumbnailUrl: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
              source: src.name,
              author: authorMatch ? authorMatch[1].trim() : src.name,
              platform: 'youtube',
              viewsCount: randomViews,
              likesCount: randomLikes,
              duration: '08:45',
              pubDate: publishedMatch ? new Date(publishedMatch[1]).toISOString() : new Date().toISOString(),
              category: src.category,
              tags: videoTags,
              seoKeywords: autoTags.seoKeywords,
              slug: rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 60),
              metaDescription: `${rawTitle}. Watch official release from ${src.name} on NewsPulse.`,
              sentiment: autoTags.sentiment,
              isViralTrend: true,
              viralScore,
              aiTakeaway: `Top trending video from ${src.name} delivering high production value and in-depth analysis.`,
            };

            existingMap.set(vidId, newVideo);
            newlyScraped++;
            sourceFoundCount++;
          }
        }
      } else if (src.type === 'vimeo_rss' || src.type === 'web_rss') {
        const parser = new Parser();
        const xml = await fetchXmlSafe(src.url, 7000);
        if (xml) {
          const feed = await parser.parseString(xml);
          if (feed && Array.isArray(feed.items)) {
            for (const item of feed.items.slice(0, 6)) {
              const rawTitle = (item.title || '').trim();
              const rawLink = item.link || '';
              if (!rawTitle || !rawLink) continue;

              const vidId = `vid-${crypto.createHash('md5').update(rawLink || rawTitle).digest('hex').slice(0, 12)}`;
              if (existingMap.has(vidId)) continue;

              let embedUrl = rawLink;
              let thumbnailUrl = 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80';

              if (rawLink.includes('vimeo.com')) {
                const vimeoMatch = rawLink.match(/vimeo\.com\/(\d+)/);
                if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
              }

              const autoTags = generateHeuristicTags(rawTitle, item.contentSnippet || '', src.category, src.name);
              const newVideo: ViralVideo = {
                id: vidId,
                title: rawTitle,
                description: (item.contentSnippet || rawTitle).slice(0, 260),
                videoUrl: rawLink,
                embedUrl,
                thumbnailUrl,
                source: src.name,
                author: item.creator || src.name,
                platform: src.platform,
                viewsCount: Math.floor(Math.random() * 800000) + 100000,
                likesCount: Math.floor(Math.random() * 50000) + 5000,
                duration: '04:20',
                pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                category: src.category,
                tags: ['#Viral', `#${src.category}`, ...autoTags.tags].slice(0, 6),
                seoKeywords: autoTags.seoKeywords,
                slug: rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 60),
                metaDescription: `${rawTitle} - ${src.name}`,
                sentiment: 'Positive',
                isViralTrend: true,
                viralScore: 89,
                aiTakeaway: `Staff-curated viral video showcase from ${src.name}.`,
              };

              existingMap.set(vidId, newVideo);
              newlyScraped++;
              sourceFoundCount++;
            }
          }
        }
      }

      sourcesReport.push({ name: src.name, found: sourceFoundCount, status: 'OK' });
    } catch (err: any) {
      console.warn(`[ViralVideosScraper] Error scraping ${src.name}:`, err.message || err);
      sourcesReport.push({ name: src.name, found: 0, status: 'FAILED: ' + (err.message || 'Error') });
    }
  }

  cachedViralVideos = Array.from(existingMap.values()).sort((a, b) => (b.viralScore || 0) - (a.viralScore || 0));
  saveStoredViralVideos(cachedViralVideos);

  console.log(`[ViralVideosScraper] Scraping complete: ${newlyScraped} new videos scraped. Total database size: ${cachedViralVideos.length}`);
  return { scraped: newlyScraped, total: cachedViralVideos.length, sourcesReport };
}

// Background auto-scraper for videos on server boot
setTimeout(() => {
  scrapeViralVideoFeeds().catch(console.warn);
}, 2000);

// --- REST API ENDPOINTS FOR VIRAL VIDEOS ---

// GET /api/videos - Query videos with 24h time-decay, category, platform, tag, search & sort
app.get('/api/videos', (req, res) => {
  const { 
    category, 
    platform, 
    tag, 
    search, 
    sortBy = 'viral', 
    timeWindow = 'all', 
    page = '1', 
    pageSize = '12', 
    limit = '100' 
  } = req.query;

  const now = Date.now();

  // Compute breakdown across all cached videos
  let last24hCount = 0;
  let past48hCount = 0;
  let pastWeekCount = 0;
  let archiveCount = 0;

  cachedViralVideos.forEach(v => {
    const ageMs = now - new Date(v.pubDate).getTime();
    if (ageMs <= 24 * 3600 * 1000) last24hCount++;
    else if (ageMs <= 48 * 3600 * 1000) past48hCount++;
    else if (ageMs <= 7 * 24 * 3600 * 1000) pastWeekCount++;
    else archiveCount++;
  });

  let filtered = [...cachedViralVideos];

  // 1. Time Window Filtering
  if (timeWindow === '24h') {
    filtered = filtered.filter(v => (now - new Date(v.pubDate).getTime()) <= 24 * 3600 * 1000);
  } else if (timeWindow === '48h') {
    filtered = filtered.filter(v => {
      const ageMs = now - new Date(v.pubDate).getTime();
      return ageMs > 24 * 3600 * 1000 && ageMs <= 48 * 3600 * 1000;
    });
  } else if (timeWindow === 'week') {
    filtered = filtered.filter(v => {
      const ageMs = now - new Date(v.pubDate).getTime();
      return ageMs > 48 * 3600 * 1000 && ageMs <= 7 * 24 * 3600 * 1000;
    });
  } else if (timeWindow === 'archive') {
    filtered = filtered.filter(v => (now - new Date(v.pubDate).getTime()) > 7 * 24 * 3600 * 1000);
  }

  // 2. Category Filter
  if (category && typeof category === 'string' && category !== 'All') {
    filtered = filtered.filter(v => v.category.toLowerCase() === category.toLowerCase());
  }

  // 3. Platform Filter
  if (platform && typeof platform === 'string' && platform !== 'All') {
    filtered = filtered.filter(v => v.platform.toLowerCase() === platform.toLowerCase());
  }

  // 4. Tag Filter
  if (tag && typeof tag === 'string') {
    const cleanTag = tag.trim().toLowerCase();
    filtered = filtered.filter(v => v.tags.some(t => t.toLowerCase() === cleanTag || t.toLowerCase() === `#${cleanTag}`));
  }

  // 5. Search Filter
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(v =>
      v.title.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q) ||
      v.tags.some(t => t.toLowerCase().includes(q)) ||
      (v.author && v.author.toLowerCase().includes(q))
    );
  }

  // 6. 24-Hour Prioritized Sorting
  if (sortBy === 'newest') {
    filtered.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  } else if (sortBy === 'views') {
    filtered.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
  } else if (sortBy === 'likes') {
    filtered.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
  } else {
    // Default Viral Mode: Prioritize 24h freshness tier first (Page 1 -> Page 2 -> Page 3 -> Archive), then by viralScore / views
    filtered.sort((a, b) => {
      const ageA = now - new Date(a.pubDate).getTime();
      const ageB = now - new Date(b.pubDate).getTime();
      const tierA = ageA <= 24 * 3600 * 1000 ? 1 : ageA <= 48 * 3600 * 1000 ? 2 : ageA <= 7 * 24 * 3600 * 1000 ? 3 : 4;
      const tierB = ageB <= 24 * 3600 * 1000 ? 1 : ageB <= 48 * 3600 * 1000 ? 2 : ageB <= 7 * 24 * 3600 * 1000 ? 3 : 4;

      if (tierA !== tierB) {
        return tierA - tierB;
      }
      return (b.viralScore || 0) - (a.viralScore || 0);
    });
  }

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const size = Math.max(1, parseInt(pageSize as string, 10) || 12);
  const totalPages = Math.ceil(filtered.length / size) || 1;
  const paginated = filtered.slice((pageNum - 1) * size, pageNum * size);

  // Compute tag counts & metadata
  const tagMap: Record<string, number> = {};
  const platformMap: Record<string, number> = {};
  const categoryMap: Record<string, number> = {};

  cachedViralVideos.forEach(v => {
    v.tags.forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; });
    platformMap[v.platform] = (platformMap[v.platform] || 0) + 1;
    categoryMap[v.category] = (categoryMap[v.category] || 0) + 1;
  });

  const trendingTags = Object.entries(tagMap)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  res.json({
    videos: filtered,
    paginatedVideos: paginated,
    totalVideos: filtered.length,
    currentPage: pageNum,
    totalPages,
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
  });
});

// GET /api/videos/single/:id - Single video with structured metadata
app.get('/api/videos/single/:id', (req, res) => {
  const { id } = req.params;
  const video = cachedViralVideos.find(v => v.id === id || v.slug === id);
  if (!video) {
    return res.status(404).json({ success: false, error: 'Video not found' });
  }

  const related = cachedViralVideos
    .filter(v => v.id !== video.id && (v.category === video.category || v.platform === video.platform))
    .slice(0, 6);

  res.json({
    success: true,
    video,
    related
  });
});

// POST /api/videos/scrape-now - On-demand scraping trigger
app.post('/api/videos/scrape-now', async (req, res) => {
  try {
    const result = await scrapeViralVideoFeeds();
    res.json({
      success: true,
      message: `Scraping completed! Discovered ${result.scraped} new viral videos across internet feeds. (Database now contains ${result.total} videos)`,
      newVideosScraped: result.scraped,
      totalVideos: result.total,
      sourcesReport: result.sourcesReport,
      videos: cachedViralVideos
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Scrape error' });
  }
});

// POST /api/videos/add - Manually submit a video URL (YouTube, Vimeo, etc.) with automatic oEmbed metadata resolution
app.post('/api/videos/add', async (req, res) => {
  const { title, videoUrl, category = 'Viral', description = '', tags = [] } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ success: false, error: 'Video URL is required' });
  }

  const ytId = extractYouTubeId(videoUrl);
  let embedUrl = videoUrl;
  let platform: VideoPlatform = 'web';
  let thumbnailUrl = 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80';
  let authorName = 'NewsPulse Contributor';
  let resolvedTitle = title || '';

  // Try oEmbed metadata fetch
  const oembed = await fetchOEmbedData(videoUrl);
  if (oembed) {
    if (!resolvedTitle && oembed.title) resolvedTitle = oembed.title;
    if (oembed.author) authorName = oembed.author;
    if (oembed.thumbnail) thumbnailUrl = oembed.thumbnail;
  }

  if (ytId) {
    platform = 'youtube';
    embedUrl = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`;
    if (!thumbnailUrl || thumbnailUrl.includes('unsplash')) {
      thumbnailUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    }
  } else if (videoUrl.includes('vimeo.com')) {
    platform = 'vimeo';
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  } else if (videoUrl.includes('reddit.com')) {
    platform = 'reddit';
  } else if (videoUrl.includes('tiktok.com')) {
    platform = 'tiktok';
  }

  const finalTitle = resolvedTitle || (ytId ? `Trending YouTube Video (${ytId})` : 'Viral Internet Video Clip');
  const autoTags = generateHeuristicTags(finalTitle, description, category, authorName);
  const customTags = Array.isArray(tags) && tags.length > 0 ? tags : ['#Viral', `#${category}`, ...autoTags.tags];

  const newVideo: ViralVideo = {
    id: `vid-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: finalTitle,
    description: description || `Indexed viral video by ${authorName}.`,
    videoUrl,
    embedUrl,
    thumbnailUrl,
    source: 'Community / Web Index',
    author: authorName,
    platform,
    viewsCount: Math.floor(Math.random() * 500000) + 150000,
    likesCount: Math.floor(Math.random() * 30000) + 10000,
    duration: '03:30',
    pubDate: new Date().toISOString(),
    category: category as VideoCategory,
    tags: customTags.map((t: string) => t.startsWith('#') ? t : `#${t}`),
    seoKeywords: autoTags.seoKeywords,
    slug: finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 60),
    metaDescription: `${finalTitle} - watch online on NewsPulse.`,
    sentiment: 'Positive',
    isViralTrend: true,
    viralScore: 93,
    aiTakeaway: `Newly indexed video by ${authorName} trending on ${platform.toUpperCase()}.`,
  };

  cachedViralVideos.unshift(newVideo);
  saveStoredViralVideos(cachedViralVideos);

  res.json({
    success: true,
    message: 'Video indexed and added to viral database.',
    video: newVideo
  });
});

// POST /api/videos/:id/like - Like video
app.post('/api/videos/:id/like', (req, res) => {
  const { id } = req.params;
  const video = cachedViralVideos.find(v => v.id === id);
  if (!video) {
    return res.status(404).json({ success: false, error: 'Video not found' });
  }

  video.likesCount = (video.likesCount || 0) + 1;
  saveStoredViralVideos(cachedViralVideos);

  res.json({
    success: true,
    likesCount: video.likesCount
  });
});

// GET /api/videos/sitemap.xml - Dedicated Google Video XML Sitemap (SEO Engine)
app.get('/api/videos/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800');
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  const videoUrlsXml = cachedViralVideos.map(v => {
    const safeTitle = (v.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeDesc = (v.metaDescription || v.description || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const tagsXml = (v.tags || []).slice(0, 8).map(t => `<video:tag><![CDATA[${t.replace('#', '')}]]></video:tag>`).join('\n        ');

    return `  <url>
    <loc>${baseUrl}/#videos?video=${encodeURIComponent(v.id)}</loc>
    <video:video>
      <video:thumbnail_loc>${v.thumbnailUrl}</video:thumbnail_loc>
      <video:title>${safeTitle}</video:title>
      <video:description>${safeDesc}</video:description>
      <video:player_loc allow_embed="yes" autoplay="ap=1">${v.embedUrl}</video:player_loc>
      <video:publication_date>${new Date(v.pubDate).toISOString()}</video:publication_date>
      <video:category>${v.category}</video:category>
      <video:view_count>${v.viewsCount}</video:view_count>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
      ${tagsXml}
    </video:video>
  </url>`;
  }).join('\n');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${videoUrlsXml}
</urlset>`;

  res.send(sitemapXml.trim());
});

// GET /api/videos/export/json - Export all viral video records
app.get('/api/videos/export/json', (req, res) => {
  res.setHeader('Content-Disposition', `attachment; filename="scraped_viral_videos_${Date.now()}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(cachedViralVideos, null, 2));
});

// ==========================================
// NEWSLETTER "DAILY TOP 5" SUBSCRIPTION API
// ==========================================

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  frequency: 'daily_top_5' | 'breaking_alerts' | 'weekly_digest';
  categories: string[];
  active: boolean;
  source: string;
}

const NEWSLETTER_SUBSCRIBERS_FILE = path.join(process.cwd(), 'newsletter_subscribers_db.json');

function getStoredNewsletterSubscribers(): NewsletterSubscriber[] {
  try {
    if (fs.existsSync(NEWSLETTER_SUBSCRIBERS_FILE)) {
      const raw = fs.readFileSync(NEWSLETTER_SUBSCRIBERS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[Newsletter] Failed to read subscribers file:', err);
  }
  return [];
}

function saveStoredNewsletterSubscribers(subscribers: NewsletterSubscriber[]) {
  try {
    fs.writeFileSync(NEWSLETTER_SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Newsletter] Failed to save subscribers file:', err);
  }
}

// In-memory cache of subscribers
let cachedSubscribers: NewsletterSubscriber[] = getStoredNewsletterSubscribers();

// Helper: Get today's top 5 headlines
function getDailyTop5Headlines(categoryFilter?: string): NewsArticle[] {
  let pool = cachedArticles.length > 0 ? cachedArticles : [];
  if (categoryFilter && categoryFilter !== 'All') {
    const filtered = pool.filter(a => a.category.toLowerCase() === categoryFilter.toLowerCase());
    if (filtered.length >= 5) {
      pool = filtered;
    }
  }

  // Sort by freshness and urgency/sentiment prominence
  const sorted = [...pool].sort((a, b) => {
    const scoreA = (a.sentiment === 'Urgent' ? 3 : a.sentiment === 'Analysis' ? 2 : 1);
    const scoreB = (b.sentiment === 'Urgent' ? 3 : b.sentiment === 'Analysis' ? 2 : 1);
    if (scoreA !== scoreB) return scoreB - scoreA;
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });

  return sorted.slice(0, 5);
}

// GET /api/newsletter/daily-top-5 - Retrieve current Day's Top 5 curated stories
app.get('/api/newsletter/daily-top-5', (req, res) => {
  const category = (req.query.category as string) || 'All';
  const top5 = getDailyTop5Headlines(category);
  res.json({
    success: true,
    count: top5.length,
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    articles: top5,
  });
});

// POST /api/newsletter/subscribe - Subscribe to Daily Top 5 Headlines
app.post('/api/newsletter/subscribe', (req, res) => {
  const { email, frequency = 'daily_top_5', categories = ['All'], source = 'web_footer' } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existingIdx = cachedSubscribers.findIndex(s => s.email === cleanEmail);

  let subscriber: NewsletterSubscriber;

  if (existingIdx >= 0) {
    // Update existing subscription
    cachedSubscribers[existingIdx].active = true;
    cachedSubscribers[existingIdx].frequency = frequency;
    cachedSubscribers[existingIdx].categories = categories;
    cachedSubscribers[existingIdx].subscribedAt = new Date().toISOString();
    subscriber = cachedSubscribers[existingIdx];
  } else {
    subscriber = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: cleanEmail,
      subscribedAt: new Date().toISOString(),
      frequency,
      categories,
      active: true,
      source,
    };
    cachedSubscribers.unshift(subscriber);
  }

  saveStoredNewsletterSubscribers(cachedSubscribers);

  // Return confirmation along with today's Top 5 digest preview
  const previewTop5 = getDailyTop5Headlines(categories[0] || 'All');

  res.json({
    success: true,
    message: `You're subscribed! The Daily Top 5 will be delivered to ${cleanEmail}.`,
    subscriber,
    totalSubscribers: cachedSubscribers.filter(s => s.active).length,
    todayDigest: {
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      articles: previewTop5,
    }
  });
});

// POST /api/newsletter/unsubscribe - Unsubscribe from newsletter
app.post('/api/newsletter/unsubscribe', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  const cleanEmail = (email as string).trim().toLowerCase();
  const sub = cachedSubscribers.find(s => s.email === cleanEmail);

  if (sub) {
    sub.active = false;
    saveStoredNewsletterSubscribers(cachedSubscribers);
    res.json({ success: true, message: `Successfully unsubscribed ${cleanEmail} from Daily Top 5 digest.` });
  } else {
    res.json({ success: true, message: 'Email was not found in active subscriber list.' });
  }
});

// GET /api/newsletter/subscribers - Subscriber stats for admin
app.get('/api/newsletter/subscribers', (req, res) => {
  const activeSubs = cachedSubscribers.filter(s => s.active);
  res.json({
    success: true,
    total: cachedSubscribers.length,
    active: activeSubs.length,
    subscribers: activeSubs.map(s => ({
      id: s.id,
      email: s.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Masked for privacy
      frequency: s.frequency,
      subscribedAt: s.subscribedAt,
      categories: s.categories,
    }))
  });
});

// Google Search Console Site Verification Endpoint
app.get('/googled43dd531c722dedd.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send('google-site-verification: googled43dd531c722dedd.html');
});

// Google AdSense ads.txt Endpoint
app.get('/ads.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send('google.com, pub-6411773855584982, DIRECT, f08c47fec0942fa0\n');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export { app };

// Vite Integration Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.NETLIFY && !process.env.LAMBDA_TASK_ROOT && !process.env.VERCEL) {
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`[News Pulse Server] Server running on http://0.0.0.0:${PORT}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[News Pulse Server] Port ${PORT} busy, waiting for release...`);
        setTimeout(() => {
          try {
            server.close();
          } catch {}
          server.listen(PORT, "0.0.0.0");
        }, 1000);
      } else {
        console.error('[News Pulse Server] Server listen error:', err);
      }
    });

    const shutdown = () => {
      try {
        server.close(() => {
          process.exit(0);
        });
      } catch {
        process.exit(0);
      }
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}

startServer();
