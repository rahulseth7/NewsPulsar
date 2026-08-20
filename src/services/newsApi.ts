import { NewsResponse, NewsArticle, AISummaryResponse, NewsSourceInfo, TrendingTopicsData, TrendingTopicItem, NewsCategory, AutoTagSuggestion, BatchAutoTagResult, HindiArticleContent } from '../types';
import { getArticleImageUrl } from '../utils/imageUtils';
import { resolveCleanArticleLink } from '../utils/linkUtils';
import { saveArticlesToIndexedDb, loadArticlesFromIndexedDb, getArticleCountFromIndexedDb } from '../utils/indexedDbStorage';

const CLIENT_SOURCES_KEY = 'news_pulse_client_sources';
const CLIENT_DATABASE_CACHE_KEY = 'newspulse_articles_db_cache';

export function getCachedDatabaseNews(): NewsResponse | null {
  try {
    const raw = localStorage.getItem(CLIENT_DATABASE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.articles) && parsed.articles.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading cached database news:', e);
  }
  return null;
}

const DEFAULT_SOURCES: NewsSourceInfo[] = [
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

  // --- Prominent Indian Outlets ---
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

// Rich fallback seed articles across all categories ensuring instant cold-start archive (with fixed past dates)
const FALLBACK_ARTICLES: NewsArticle[] = [
  // World News
  {
    id: 'fb-world-1',
    title: 'Global Renewable Energy Investments Surge Past $1.8 Trillion Target',
    description: 'International energy consortiums report record-breaking investments in solar, wind, and smart battery storage grids across North America, Europe, and Asia-Pacific regions, outpacing fossil fuel commitments.',
    contentSnippet: 'International energy consortiums report record-breaking investments in solar, wind, and smart battery storage grids across North America, Europe, and Asia-Pacific regions.',
    link: 'https://www.bbc.com/news/world',
    source: 'BBC News',
    category: 'World',
    imageUrl: getArticleImageUrl(undefined, 'World', 'Global Renewable Energy Investments Surge Past $1.8 Trillion Target'),
    pubDate: '2024-01-15T08:00:00.000Z',
    readTimeMinutes: 3,
    sentiment: 'Positive',
    tags: ['#World', '#RenewableEnergy', '#Climate', '#Sustainability'],
    seoKeywords: ['renewable energy', 'solar power', 'sustainability', 'global investment'],
    slug: 'global-renewable-energy-investments-surge-past-target',
    metaDescription: 'International energy reports reveal unprecedented investments in solar, wind, and battery storage infrastructure.',
  },
  {
    id: 'fb-world-2',
    title: 'United Nations Climate Summit Finalizes Historic Multilateral Clean Water Accord',
    description: 'Representatives from 140 nations ratify binding framework for cross-border freshwater preservation, aquifer replenishment, and coastal desalination infrastructure.',
    contentSnippet: 'Representatives from 140 nations ratify binding framework for cross-border freshwater preservation and desalination.',
    link: 'https://www.reuters.com/world',
    source: 'Reuters World',
    category: 'World',
    imageUrl: getArticleImageUrl(undefined, 'World', 'United Nations Climate Summit Finalizes Historic Clean Water Accord'),
    pubDate: '2024-01-14T10:00:00.000Z',
    readTimeMinutes: 4,
    sentiment: 'Positive',
    tags: ['#World', '#Climate', '#UnitedNations', '#WaterSecurity'],
    seoKeywords: ['climate summit', 'freshwater accord', 'united nations', 'sustainability'],
    slug: 'un-climate-summit-clean-water-accord',
    metaDescription: 'Global delegates agree on comprehensive multilateral water preservation treaties.',
  },
  {
    id: 'fb-world-3',
    title: 'India Unveils High-Speed Clean Energy Infrastructure and Next-Gen Tech Initiatives',
    description: 'Indian government agencies and private tech consortiums launch major renewable power grids and semiconductor manufacturing facilities across key economic hubs.',
    contentSnippet: 'Indian government agencies and tech consortiums launch major renewable power grids and semiconductor facilities.',
    link: 'https://www.ndtv.com',
    source: 'NDTV News',
    category: 'World',
    imageUrl: getArticleImageUrl(undefined, 'World', 'India Unveils High-Speed Clean Energy Infrastructure'),
    pubDate: '2024-01-13T09:00:00.000Z',
    readTimeMinutes: 3,
    sentiment: 'Positive',
    tags: ['#India', '#Energy', '#Technology', '#Infrastructure'],
    seoKeywords: ['india news', 'renewable energy', 'semiconductors', 'infrastructure'],
    slug: 'india-unveils-high-speed-clean-energy-infrastructure',
    metaDescription: 'Indian agencies launch major renewable power grids and semiconductor manufacturing facilities.',
  },
  {
    id: 'fb-world-4',
    title: 'European Union Streamlines Cross-Border Digital Identity and Mobility Standards',
    description: 'Member states approve unified digital identity wallets for frictionless civil documentation, digital voting security, and seamless continent-wide transit.',
    contentSnippet: 'Member states approve unified digital identity wallets for frictionless civil documentation.',
    link: 'https://www.bbc.com/news',
    source: 'BBC News',
    category: 'World',
    imageUrl: getArticleImageUrl(undefined, 'World', 'European Union Streamlines Cross-Border Digital Identity'),
    pubDate: '2024-01-12T11:00:00.000Z',
    readTimeMinutes: 4,
    sentiment: 'Neutral',
    tags: ['#World', '#Europe', '#DigitalIdentity', '#Governance'],
    seoKeywords: ['european union', 'digital wallet', 'cross-border identity'],
    slug: 'european-union-cross-border-digital-identity-standards',
    metaDescription: 'EU member states approve unified digital identity wallets for frictionless civil documentation.',
  },
  {
    id: 'fb-world-5',
    title: 'Southeast Asian Maritime Consortium Expedites Zero-Emission Freight Corridors',
    description: 'Regional port authorities invest in ammonia and electric hydrogen bunkering facilities to decarbonize high-volume shipping channels across the Pacific and Indian oceans.',
    contentSnippet: 'Regional port authorities invest in ammonia and electric hydrogen bunkering facilities.',
    link: 'https://www.aljazeera.com',
    source: 'Al Jazeera',
    category: 'World',
    imageUrl: getArticleImageUrl(undefined, 'World', 'Southeast Asian Maritime Consortium Expedites Zero-Emission Freight'),
    pubDate: '2024-01-11T14:00:00.000Z',
    readTimeMinutes: 4,
    sentiment: 'Positive',
    tags: ['#World', '#Maritime', '#Trade', '#GreenShipping'],
    seoKeywords: ['maritime shipping', 'green corridors', 'zero emission', 'trade'],
    slug: 'southeast-asian-maritime-consortium-zero-emission',
    metaDescription: 'Port authorities invest in green bunkering facilities to decarbonize shipping channels.',
  },

  // Technology & AI
  {
    id: 'fb-tech-1',
    title: 'Breakthrough Artificial Intelligence Model Accelerates Drug Discovery Timelines',
    description: 'Researchers demonstrate a next-generation neural architecture capable of analyzing complex protein folding in seconds, opening new avenues for treatment discovery.',
    contentSnippet: 'Researchers demonstrate a next-generation neural architecture capable of analyzing complex protein folding in seconds.',
    link: 'https://techcrunch.com',
    source: 'TechCrunch',
    category: 'Technology',
    imageUrl: getArticleImageUrl(undefined, 'Technology', 'Breakthrough Artificial Intelligence Model Accelerates Drug Discovery Timelines'),
    pubDate: '2024-01-10T15:00:00.000Z',
    readTimeMinutes: 4,
    sentiment: 'Analysis',
    tags: ['#AI', '#Tech', '#Healthcare', '#DeepLearning'],
    seoKeywords: ['artificial intelligence', 'biotech', 'machine learning', 'drug discovery'],
    slug: 'breakthrough-ai-model-accelerates-drug-discovery',
    metaDescription: 'Researchers demonstrate a next-generation neural architecture capable of analyzing complex protein folding in seconds.',
  },
  {
    id: 'fb-tech-2',
    title: 'Next-Generation Quantum Computing Processors Achieve Fault-Tolerant Logical Qubit Milestone',
    description: 'Quantum hardware engineers have successfully demonstrated continuous quantum error correction with over 100 high-fidelity logical qubits, opening practical commercial applications.',
    contentSnippet: 'Quantum hardware engineers successfully demonstrate continuous quantum error correction with over 100 logical qubits.',
    link: 'https://www.theverge.com',
    source: 'The Verge',
    category: 'Technology',
    imageUrl: getArticleImageUrl(undefined, 'Technology', 'Next-Generation Quantum Computing Processors Achieve Milestone'),
    pubDate: '2024-01-09T16:00:00.000Z',
    readTimeMinutes: 4,
    sentiment: 'Analysis',
    tags: ['#Technology', '#QuantumComputing', '#Hardware', '#DeepTech'],
    seoKeywords: ['quantum computing', 'logical qubits', 'error correction', 'tech trends'],
    slug: 'quantum-computing-fault-tolerant-logical-qubit-milestone',
    metaDescription: 'Hardware engineers demonstrate continuous quantum error correction with over 100 logical qubits.',
  },
  {
    id: 'fb-tech-3',
    title: 'Global AI Safety Standards Consortium Ratifies Universal Model Verification Protocols',
    description: 'Leading international research laboratories and technical institutions establish unified benchmarks for alignment, transparency, and computational resilience across frontier architectures.',
    contentSnippet: 'Leading research laboratories and technical institutions establish unified benchmarks for AI alignment and transparency.',
    link: 'https://www.wired.com',
    source: 'Wired Tech',
    category: 'Technology',
    imageUrl: getArticleImageUrl(undefined, 'Technology', 'Global AI Safety Standards Consortium Ratifies Protocols'),
    pubDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    readTimeMinutes: 4,
    sentiment: 'Analysis',
    tags: ['#Technology', '#AI', '#Safety', '#Governance'],
    seoKeywords: ['AI standards', 'machine learning safety', 'tech policy', 'artificial intelligence'],
    slug: 'global-ai-safety-standards-consortium-ratifies-protocols',
    metaDescription: 'Leading international laboratories establish unified benchmarks for alignment and transparency across AI architectures.',
  },
  {
    id: 'fb-tech-4',
    title: 'Open-Source Developer Ecosystems See Rapid Adoption of WebAssembly Modules',
    description: 'Software engineers report significant execution speedups by embedding high-performance Rust and C++ WebAssembly binaries into modern web and cloud applications.',
    contentSnippet: 'Software engineers report significant execution speedups by embedding WebAssembly binaries.',
    link: 'https://news.ycombinator.com',
    source: 'Hacker News',
    category: 'Technology',
    imageUrl: getArticleImageUrl(undefined, 'Technology', 'Open-Source Developer Ecosystems WebAssembly'),
    pubDate: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    readTimeMinutes: 4,
    sentiment: 'Analysis',
    tags: ['#Technology', '#WebDev', '#Wasm', '#OpenSource'],
    seoKeywords: ['webassembly', 'rust', 'software engineering', 'developer'],
    slug: 'open-source-developer-ecosystems-wasm-adoption',
    metaDescription: 'Software engineers report significant execution speedups by embedding WebAssembly binaries.',
  },
  {
    id: 'fb-tech-5',
    title: 'Autonomous Robotics Fleet Deploys Across Global Logistics and Fulfillment Centers',
    description: 'Next-generation bipedal and wheeled autonomous robots achieve 99.8% sorting efficiency in automated logistics facilities, reducing transit latency.',
    contentSnippet: 'Autonomous robots achieve 99.8% sorting efficiency in automated logistics facilities.',
    link: 'https://www.engadget.com',
    source: 'Engadget',
    category: 'Technology',
    imageUrl: getArticleImageUrl(undefined, 'Technology', 'Autonomous Robotics Fleet Logistics'),
    pubDate: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    readTimeMinutes: 3,
    sentiment: 'Positive',
    tags: ['#Technology', '#Robotics', '#Automation', '#Logistics'],
    seoKeywords: ['robotics', 'automation', 'logistics', 'autonomous systems'],
    slug: 'autonomous-robotics-fleet-deploys-logistics',
    metaDescription: 'Autonomous robotics achieve 99.8% sorting efficiency in automated logistics facilities.',
  },

  // Science
  {
    id: 'fb-sci-1',
    title: 'James Webb Space Telescope Observes Atmospheric Composition of Distant Exoplanet',
    description: 'Astronomers detect water vapor, carbon dioxide, and methane in the atmosphere of a habitable-zone exoplanet located 120 light-years from Earth.',
    contentSnippet: 'Astronomers detect water vapor, carbon dioxide, and methane in the atmosphere of a habitable-zone exoplanet.',
    link: 'https://www.sciencedaily.com',
    source: 'ScienceDaily',
    category: 'Science',
    imageUrl: getArticleImageUrl(undefined, 'Science', 'James Webb Space Telescope Observes Atmospheric Composition Exoplanet'),
    pubDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    readTimeMinutes: 5,
    sentiment: 'Positive',
    tags: ['#Science', '#Space', '#Astronomy', '#NASA', '#JWST'],
    seoKeywords: ['james webb', 'exoplanet', 'astronomy', 'space science'],
    slug: 'jwst-observes-atmospheric-composition-exoplanet',
    metaDescription: 'Astronomers detect water vapor, carbon dioxide, and methane in the atmosphere of a habitable-zone exoplanet.',
  },
  {
    id: 'fb-sci-2',
    title: 'SpaceX Starship Completes Orbital Refueling Milestone in Deep-Space Preparation',
    description: 'Aerospace engineers achieve cryogenic propellant transfer in low Earth orbit, marking a critical operational breakthrough for upcoming lunar and planetary exploration missions.',
    contentSnippet: 'Aerospace engineers achieve cryogenic propellant transfer in low Earth orbit for lunar exploration.',
    link: 'https://www.nasa.gov',
    source: 'NASA News',
    category: 'Science',
    imageUrl: getArticleImageUrl(undefined, 'Science', 'SpaceX Starship Completes Orbital Refueling Milestone'),
    pubDate: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    readTimeMinutes: 4,
    sentiment: 'Positive',
    tags: ['#Science', '#Space', '#NASA', '#Starship', '#Innovation'],
    seoKeywords: ['space exploration', 'orbital refueling', 'starship', 'NASA'],
    slug: 'spacex-starship-completes-orbital-refueling-milestone',
    metaDescription: 'Aerospace engineers achieve cryogenic propellant transfer in low Earth orbit for upcoming exploration missions.',
  },
  {
    id: 'fb-sci-3',
    title: 'Fusion Energy Pilot Facility Achieves Net Energy Gain in Extended Plasma Burn',
    description: 'Tokamak research facility sustains high-confinement magnetic fusion reaction for record duration, generating net electrical surplus back into test grid.',
    contentSnippet: 'Tokamak research facility sustains magnetic fusion reaction generating net electrical surplus.',
    link: 'https://phys.org',
    source: 'Phys.org',
    category: 'Science',
    imageUrl: getArticleImageUrl(undefined, 'Science', 'Fusion Energy Pilot Facility Achieves Net Energy Gain'),
    pubDate: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
    readTimeMinutes: 4,
    sentiment: 'Positive',
    tags: ['#Science', '#Fusion', '#CleanEnergy', '#Physics'],
    seoKeywords: ['nuclear fusion', 'tokamak', 'clean energy', 'physics'],
    slug: 'fusion-energy-facility-net-energy-gain',
    metaDescription: 'Tokamak research facility sustains high-confinement magnetic fusion reaction for record duration.',
  },
  {
    id: 'fb-sci-4',
    title: 'Deep-Sea Oceanographic Expedition Discovers Uncharted Hydrothermal Ecosystems',
    description: 'Marine biologists utilizing submersible robotics document hundreds of previously unknown benthic organisms thriving near volcanic vent systems in the Marianas.',
    contentSnippet: 'Marine biologists document hundreds of previously unknown benthic organisms near volcanic vents.',
    link: 'https://www.nature.com',
    source: 'Nature',
    category: 'Science',
    imageUrl: getArticleImageUrl(undefined, 'Science', 'Deep-Sea Oceanographic Expedition Hydrothermal Ecosystems'),
    pubDate: new Date(Date.now() - 115 * 60 * 1000).toISOString(),
    readTimeMinutes: 4,
    sentiment: 'Positive',
    tags: ['#Science', '#Oceanography', '#Biology', '#Discovery'],
    seoKeywords: ['oceanography', 'marine biology', 'hydrothermal vents', 'deep sea'],
    slug: 'deep-sea-oceanographic-expedition-uncharted-ecosystems',
    metaDescription: 'Marine biologists document hundreds of unknown benthic organisms thriving near volcanic vent systems.',
  },

  // Business & Stocks
  {
    id: 'fb-biz-1',
    title: 'Central Banks Signal Coordinated Liquidity Stabilization Amid Resilient Manufacturing Indices',
    description: 'Global financial regulators and central banking authorities outline synchronized monetary policy adjustments following stronger-than-expected industrial output metrics.',
    contentSnippet: 'Global financial regulators outline synchronized monetary adjustments following strong output.',
    link: 'https://www.cnbc.com',
    source: 'CNBC Business',
    category: 'Business',
    imageUrl: getArticleImageUrl(undefined, 'Business', 'Central Banks Signal Coordinated Liquidity Stabilization'),
    pubDate: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    readTimeMinutes: 3,
    sentiment: 'Positive',
    tags: ['#Business', '#Economy', '#CentralBanks', '#GlobalTrade'],
    seoKeywords: ['monetary policy', 'central banks', 'inflation', 'industrial output'],
    slug: 'central-banks-signal-coordinated-liquidity-stabilization',
    metaDescription: 'Central banking authorities outline synchronized monetary adjustments following strong industrial output.',
  },
  {
    id: 'fb-biz-2',
    title: 'Sensex and Nifty Touch New Heights Driven by Strong Domestic Tech & Banking Growth',
    description: 'Indian stock indices record strong momentum as quarterly earnings exceed expectations across IT services, digital banking, and automotive sectors.',
    contentSnippet: 'Indian stock market indices record strong momentum as quarterly earnings exceed market projections.',
    link: 'https://www.livemint.com',
    source: 'Livemint',
    category: 'Business',
    imageUrl: getArticleImageUrl(undefined, 'Business', 'Sensex and Nifty Touch New Heights Domestic Growth'),
    pubDate: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    readTimeMinutes: 3,
    sentiment: 'Positive',
    tags: ['#India', '#Markets', '#Sensex', '#Economy', '#Business'],
    seoKeywords: ['sensex', 'nifty', 'indian economy', 'livemint', 'stock market'],
    slug: 'sensex-and-nifty-touch-new-heights-domestic-growth',
    metaDescription: 'Indian stock indices record strong momentum as quarterly earnings exceed expectations.',
  },
  {
    id: 'fb-biz-3',
    title: 'Global Semiconductor Supply Chains Diversify with New Foundries in US and Europe',
    description: 'Major microchip fabricators inaugurate state-of-the-art 2nm and 3nm wafer fabrication plants, securing regional component supply chains for automotive and computing.',
    contentSnippet: 'Major microchip fabricators inaugurate state-of-the-art 2nm and 3nm wafer plants.',
    link: 'https://www.bloomberg.com',
    source: 'Bloomberg Markets',
    category: 'Business',
    imageUrl: getArticleImageUrl(undefined, 'Business', 'Global Semiconductor Supply Chains Diversify Foundries'),
    pubDate: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    readTimeMinutes: 4,
    sentiment: 'Positive',
    tags: ['#Business', '#Semiconductors', '#SupplyChain', '#Manufacturing'],
    seoKeywords: ['semiconductors', 'chips', 'foundry', 'manufacturing', 'supply chain'],
    slug: 'global-semiconductor-supply-chains-foundries',
    metaDescription: 'Microchip fabricators inaugurate wafer fabrication plants, securing regional component supply chains.',
  },
  {
    id: 'fb-biz-4',
    title: 'Venture Capital Allocations Rebound Strongly into Climate Tech and Applied AI Ventures',
    description: 'Quarterly venture funding reports highlight surge in late-stage funding rounds for clean energy grid storage, autonomous aerospace, and foundation AI models.',
    contentSnippet: 'Venture funding reports highlight surge in late-stage rounds for clean tech and AI.',
    link: 'https://www.wsj.com',
    source: 'WSJ Markets',
    category: 'Business',
    imageUrl: getArticleImageUrl(undefined, 'Business', 'Venture Capital Allocations Rebound Climate Tech AI'),
    pubDate: new Date(Date.now() - 125 * 60 * 1000).toISOString(),
    readTimeMinutes: 3,
    sentiment: 'Positive',
    tags: ['#Business', '#VentureCapital', '#Startups', '#ClimateTech'],
    seoKeywords: ['venture capital', 'startups', 'climate tech', 'fundraising'],
    slug: 'venture-capital-allocations-rebound-climate-tech',
    metaDescription: 'Quarterly funding reports highlight surge in funding rounds for clean tech and AI.',
  },

  // Sports
  {
    id: 'fb-sports-1',
    title: 'Championship Finals Showcase Historic Comeback and Record Television Viewership',
    description: 'Sports analysts highlight tactical adjustments and athletic precision in an electrifying final tournament watched by over 85 million international fans.',
    contentSnippet: 'Sports analysts highlight tactical adjustments and athletic precision in an electrifying final tournament.',
    link: 'https://www.espn.com',
    source: 'ESPN Sports',
    category: 'Sports',
    imageUrl: getArticleImageUrl(undefined, 'Sports', 'Championship Finals Showcase Historic Comeback Viewership'),
    pubDate: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    readTimeMinutes: 3,
    sentiment: 'Positive',
    tags: ['#Sports', '#Championship', '#Athletics', '#Tournament'],
    seoKeywords: ['sports', 'championship', 'tournament', 'finals'],
    slug: 'championship-finals-showcase-historic-comeback',
    metaDescription: 'Sports analysts highlight tactical adjustments and athletic precision in an electrifying final tournament.',
  },
  {
    id: 'fb-sports-2',
    title: 'Premier League Title Race Tightens Following Stoppage-Time Derby Thriller',
    description: 'A dramatic 94th-minute winner shakes up the league standings as top contenders prepare for decisive head-to-head fixtures heading into the season finale.',
    contentSnippet: 'A dramatic 94th-minute winner shakes up league standings as contenders clash.',
    link: 'https://www.skysports.com',
    source: 'Sky Sports',
    category: 'Sports',
    imageUrl: getArticleImageUrl(undefined, 'Sports', 'Premier League Title Race Tightens Derby Thriller'),
    pubDate: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    readTimeMinutes: 3,
    sentiment: 'Urgent',
    tags: ['#Sports', '#Football', '#PremierLeague', '#Soccer'],
    seoKeywords: ['premier league', 'football', 'soccer', 'sky sports'],
    slug: 'premier-league-title-race-derby-thriller',
    metaDescription: 'A dramatic 94th-minute winner shakes up the league standings as top contenders clash.',
  },
  {
    id: 'fb-sports-3',
    title: 'Grand Slam Tennis Tournament Sets Record for Longest Five-Set Marathon Final',
    description: 'Athletes battle through five grueling sets across nearly five hours of world-class tennis, showcasing incredible endurance and strategic shot-making.',
    contentSnippet: 'Athletes battle through five grueling sets in historic tennis championship.',
    link: 'https://www.bbc.com/sport',
    source: 'BBC Sport',
    category: 'Sports',
    imageUrl: getArticleImageUrl(undefined, 'Sports', 'Grand Slam Tennis Tournament Sets Record Five Set Final'),
    pubDate: new Date(Date.now() - 105 * 60 * 1000).toISOString(),
    readTimeMinutes: 4,
    sentiment: 'Positive',
    tags: ['#Sports', '#Tennis', '#GrandSlam', '#Champions'],
    seoKeywords: ['tennis', 'grand slam', 'championship', 'sports news'],
    slug: 'grand-slam-tennis-tournament-record-final',
    metaDescription: 'Athletes battle through five grueling sets across nearly five hours of world-class tennis.',
  },

  // Entertainment
  {
    id: 'fb-ent-1',
    title: 'Global Film Festival Premieres Pioneering Virtual Production Cinema Techniques',
    description: 'Directors and visual artists showcase real-time volume rendering technology transforming storytelling paradigms across independent and studio cinema.',
    contentSnippet: 'Directors and visual artists showcase real-time volume rendering transforming cinema.',
    link: 'https://variety.com',
    source: 'Variety',
    category: 'Entertainment',
    imageUrl: getArticleImageUrl(undefined, 'Entertainment', 'Global Film Festival Premieres Virtual Production Cinema'),
    pubDate: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    readTimeMinutes: 4,
    sentiment: 'Analysis',
    tags: ['#Entertainment', '#Cinema', '#Film', '#VirtualProduction'],
    seoKeywords: ['film festival', 'cinema', 'virtual production', 'movies'],
    slug: 'global-film-festival-premieres-virtual-production',
    metaDescription: 'Directors and visual artists showcase real-time volume rendering technology transforming cinema.',
  },
  {
    id: 'fb-ent-2',
    title: 'Streaming Industry Shifts Toward High-Fidelity Spatial Audio and Immersive Media',
    description: 'Music and video streaming platforms unveil lossless spatial audio catalogues and interactive live performance streaming features for global audiences.',
    contentSnippet: 'Streaming platforms unveil lossless spatial audio and interactive live concerts.',
    link: 'https://www.billboard.com',
    source: 'Billboard',
    category: 'Entertainment',
    imageUrl: getArticleImageUrl(undefined, 'Entertainment', 'Streaming Industry Shifts Spatial Audio Immersive Media'),
    pubDate: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    readTimeMinutes: 3,
    sentiment: 'Positive',
    tags: ['#Entertainment', '#Music', '#Streaming', '#SpatialAudio'],
    seoKeywords: ['music streaming', 'spatial audio', 'billboard', 'entertainment'],
    slug: 'streaming-industry-spatial-audio-immersive',
    metaDescription: 'Streaming platforms unveil lossless spatial audio and interactive live performance streaming.',
  },
  {
    id: 'fb-ent-3',
    title: 'Acclaimed Studio Unveils Groundbreaking Hand-Drawn Animated Feature Trailer',
    description: 'Renowned animators combine traditional cell animation with dynamic procedural lighting in an emotional coming-of-age fantasy cinematic release.',
    contentSnippet: 'Renowned animators combine traditional cell animation with dynamic procedural lighting.',
    link: 'https://www.hollywoodreporter.com',
    source: 'Hollywood Reporter',
    category: 'Entertainment',
    imageUrl: getArticleImageUrl(undefined, 'Entertainment', 'Studio Unveils Hand Drawn Animated Feature Trailer'),
    pubDate: new Date(Date.now() - 135 * 60 * 1000).toISOString(),
    readTimeMinutes: 3,
    sentiment: 'Positive',
    tags: ['#Entertainment', '#Animation', '#Movies', '#Cinema'],
    seoKeywords: ['animation', 'film', 'cinema', 'hollywood reporter'],
    slug: 'acclaimed-studio-animated-feature-trailer',
    metaDescription: 'Renowned animators combine traditional cell animation with dynamic procedural lighting.',
  },

  // Health
  {
    id: 'fb-health-1',
    title: 'New Clinical Research Highlights Long-Term Cardiovascular Benefits of Circadian Sleep Alignment',
    description: 'Medical institutions publish comprehensive multi-year health studies linking consistent circadian sleep schedules with reduced metabolic and vascular stress.',
    contentSnippet: 'Medical institutions publish comprehensive health studies linking consistent sleep schedules with cardiovascular wellness.',
    link: 'https://www.medicalnewstoday.com',
    source: 'Medical News Today',
    category: 'Health',
    imageUrl: getArticleImageUrl(undefined, 'Health', 'New Clinical Research Cardiovascular Benefits Circadian Sleep'),
    pubDate: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    readTimeMinutes: 4,
    sentiment: 'Positive',
    tags: ['#Health', '#Medicine', '#Wellness', '#SleepScience'],
    seoKeywords: ['health', 'circadian rhythm', 'sleep research', 'cardiovascular'],
    slug: 'clinical-research-cardiovascular-benefits-sleep',
    metaDescription: 'Medical institutions publish comprehensive multi-year health studies linking consistent sleep schedules.',
  },
  {
    id: 'fb-health-2',
    title: 'Precision Oncology Advances with Targeted Gene-Editing Therapies in Clinical Trials',
    description: 'Oncology research teams report positive phase-III results using personalized CRISPR base-editing to treat treatment-resistant leukemia and solid tumors.',
    contentSnippet: 'Oncology research teams report positive results using personalized CRISPR base-editing.',
    link: 'https://www.npr.org/sections/health/',
    source: 'NPR Health',
    category: 'Health',
    imageUrl: getArticleImageUrl(undefined, 'Health', 'Precision Oncology Targeted Gene Editing Therapies'),
    pubDate: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    readTimeMinutes: 4,
    sentiment: 'Positive',
    tags: ['#Health', '#Oncology', '#Genetics', '#Biotech'],
    seoKeywords: ['oncology', 'gene editing', 'CRISPR', 'health innovation'],
    slug: 'precision-oncology-gene-editing-trials',
    metaDescription: 'Oncology research teams report positive results using personalized CRISPR base-editing.',
  },
  {
    id: 'fb-health-3',
    title: 'Global Nutrition Study Identifies Microbiome Biomarkers for Longevity and Vitality',
    description: 'Large-scale longitudinal metagenomic sequencing reveals key beneficial gut bacterial strains linked to lower systemic inflammation in healthy centenarians.',
    contentSnippet: 'Large-scale metagenomic sequencing reveals beneficial gut bacterial strains linked to healthy longevity.',
    link: 'https://www.medicalnewstoday.com',
    source: 'Medical News Today',
    category: 'Health',
    imageUrl: getArticleImageUrl(undefined, 'Health', 'Global Nutrition Study Microbiome Biomarkers Longevity'),
    pubDate: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    readTimeMinutes: 4,
    sentiment: 'Analysis',
    tags: ['#Health', '#Microbiome', '#Nutrition', '#Longevity'],
    seoKeywords: ['microbiome', 'nutrition', 'longevity', 'health science'],
    slug: 'microbiome-biomarkers-longevity-nutrition',
    metaDescription: 'Metagenomic sequencing reveals key beneficial gut bacterial strains linked to lower systemic inflammation.',
  },
];

export async function fetchNews(): Promise<NewsResponse> {
  // 1. First retrieve all articles currently preserved in IndexedDB & LocalStorage
  let localDbArticles: NewsArticle[] = [];
  try {
    const idbArticles = await loadArticlesFromIndexedDb();
    if (idbArticles && idbArticles.length > 0) {
      localDbArticles = idbArticles;
    }
  } catch {}

  if (localDbArticles.length === 0) {
    const cachedDb = getCachedDatabaseNews();
    if (cachedDb && Array.isArray(cachedDb.articles)) {
      localDbArticles = cachedDb.articles;
    }
  }

  try {
    const res = await fetch('/api/news');
    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && data.articles && Array.isArray(data.articles) && data.articles.length > 0) {
        const titleSet = new Set<string>();
        const idSet = new Set<string>();
        const linkSet = new Set<string>();
        const mergedArticles: NewsArticle[] = [];

        const hasLiveArticles = (data.articles || []).some(a => !a.id.startsWith('seed-') && !a.id.startsWith('fb-'));

        const addArt = (art: NewsArticle) => {
          if (!art || !art.title) return;
          if (hasLiveArticles && (art.id.startsWith('seed-') || art.id.startsWith('fb-'))) return;
          const normTitle = art.title.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          const normId = (art.id || '').trim();
          const normLink = (art.link || '').trim().toLowerCase();

          if (normTitle && !titleSet.has(normTitle) && (!normId || !idSet.has(normId)) && (!normLink || !linkSet.has(normLink))) {
            titleSet.add(normTitle);
            if (normId) idSet.add(normId);
            if (normLink) linkSet.add(normLink);
            mergedArticles.push(art);
          }
        };

        // Prefer newest articles from server, then merge remaining unique local articles
        data.articles.forEach(addArt);
        localDbArticles.forEach(addArt);
        mergedArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

        const mergedData: NewsResponse = {
          ...data,
          articles: mergedArticles,
          totalArticles: mergedArticles.length,
        };

        // Persist to both IndexedDB and LocalStorage
        try {
          saveArticlesToIndexedDb(mergedArticles);
        } catch (_) {}

        try {
          // Store recent slice in localStorage to avoid quota limits
          const localSlice = {
            ...mergedData,
            articles: mergedArticles.slice(0, 300),
          };
          localStorage.setItem(CLIENT_DATABASE_CACHE_KEY, JSON.stringify(localSlice));
        } catch (_) {}

        return mergedData;
      }
    }
  } catch (err) {
    console.warn('Backend API unavailable, checking local database cache or client-side RSS scraper:', err);
  }

  // Fallback to cumulative client-side live RSS scraper
  const clientScraped = await fetchClientSideNews();
  try {
    saveArticlesToIndexedDb(clientScraped.articles);
    localStorage.setItem(CLIENT_DATABASE_CACHE_KEY, JSON.stringify(clientScraped));
  } catch (_) {}
  return clientScraped;
}

export async function triggerRefresh(): Promise<NewsResponse> {
  try {
    const res = await fetch('/api/news/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && data.articles && Array.isArray(data.articles) && data.articles.length > 0) {
        let existingArticles: NewsArticle[] = [];
        try {
          existingArticles = await loadArticlesFromIndexedDb();
        } catch {}

        if (existingArticles.length === 0) {
          const cachedDb = getCachedDatabaseNews();
          existingArticles = (cachedDb && Array.isArray(cachedDb.articles)) ? cachedDb.articles : [];
        }

        const titleSet = new Set<string>();
        const idSet = new Set<string>();
        const mergedArticles: NewsArticle[] = [];

        const addArt = (art: NewsArticle) => {
          if (!art || !art.title) return;
          const normTitle = art.title.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          const normId = (art.id || '').trim();
          if (normTitle && !titleSet.has(normTitle) && (!normId || !idSet.has(normId))) {
            titleSet.add(normTitle);
            if (normId) idSet.add(normId);
            mergedArticles.push(art);
          }
        };

        data.articles.forEach(addArt);
        existingArticles.forEach(addArt);
        mergedArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

        const mergedData: NewsResponse = {
          ...data,
          articles: mergedArticles,
          totalArticles: mergedArticles.length,
        };

        try {
          saveArticlesToIndexedDb(mergedArticles);
        } catch (_) {}

        try {
          const localSlice = {
            ...mergedData,
            articles: mergedArticles.slice(0, 300),
          };
          localStorage.setItem(CLIENT_DATABASE_CACHE_KEY, JSON.stringify(localSlice));
        } catch (_) {}

        return mergedData;
      }
    }
  } catch (err) {
    console.warn('Backend API unavailable for refresh, falling back to client-side RSS scraper:', err);
  }

  const clientScraped = await fetchClientSideNews();
  try {
    saveArticlesToIndexedDb(clientScraped.articles);
    localStorage.setItem(CLIENT_DATABASE_CACHE_KEY, JSON.stringify(clientScraped));
  } catch (_) {}
  return clientScraped;
}

export async function fetchDatabaseInfo(): Promise<any> {
  try {
    const res = await fetch('/api/database/status');
    if (res.ok) {
      const data = await res.json();
      const idbCount = await getArticleCountFromIndexedDb();
      return {
        ...data,
        indexedDbArticlesStored: idbCount,
      };
    }
  } catch (err) {
    console.error('Failed to fetch database status:', err);
  }

  const idbCount = await getArticleCountFromIndexedDb();
  return {
    success: true,
    storageType: 'Client Dual-Layer IndexedDB & LocalStorage Database',
    totalArticlesStored: idbCount || getCachedDatabaseNews()?.articles?.length || 0,
    indexedDbArticlesStored: idbCount,
  };
}

export async function syncDatabaseStorage(clientArticles?: NewsArticle[]): Promise<{ success: boolean; message: string; totalArticlesStored?: number }> {
  try {
    const articlesToSync = clientArticles || await loadArticlesFromIndexedDb();
    const res = await fetch('/api/database/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles: articlesToSync })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.error('Failed to sync database storage:', err);
  }
  return {
    success: true,
    message: 'Local browser database cache synchronized.',
  };
}

export async function createDatabaseBackup(): Promise<{ success: boolean; message: string; backupFileName?: string }> {
  try {
    const res = await fetch('/api/database/backup', { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.error('Failed to create backup:', err);
  }
  return {
    success: false,
    message: 'Failed to create server database snapshot.',
  };
}

export async function fetchAllDatabaseArticles(): Promise<NewsArticle[]> {
  try {
    const res = await fetch('/api/database/articles');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.articles)) {
        saveArticlesToIndexedDb(data.articles);
        return data.articles;
      }
    }
  } catch {}

  return await loadArticlesFromIndexedDb();
}

export async function fetchAISummary(article: NewsArticle): Promise<AISummaryResponse> {
  try {
    const res = await fetch('/api/news/rephrase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleId: article.id,
        title: article.title,
        description: article.description,
        link: article.link,
      }),
    });
    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend rephrase unavailable, generating client-side rephrase:', err);
  }

  return generateClientSideSummary(article);
}

export const fetchAIRephrase = fetchAISummary;

export async function addCustomSource(data: { name: string; category: string; feedUrl?: string; query?: string }): Promise<{ success: boolean; source?: NewsSourceInfo; warning?: string }> {
  try {
    const res = await fetch('/api/news/add-source', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend add-source unavailable, storing in browser local storage:', err);
  }

  return addClientSideCustomSource(data);
}

export async function toggleSource(sourceId: string, active: boolean): Promise<boolean> {
  try {
    const res = await fetch('/api/news/toggle-source', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId, active }),
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn('Backend toggle-source unavailable, toggling in browser local storage:', err);
  }

  const sources = getStoredClientSources();
  const found = sources.find(s => s.id === sourceId);
  if (found) {
    found.active = active;
    localStorage.setItem(CLIENT_SOURCES_KEY, JSON.stringify(sources));
  }
  return true;
}

// Helper: Get sources from localStorage or default
function getStoredClientSources(): NewsSourceInfo[] {
  try {
    const stored = localStorage.getItem(CLIENT_SOURCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading client sources:', e);
  }
  return DEFAULT_SOURCES;
}

// Helper: Fetch articles from a single source concurrently
async function fetchSourceArticles(src: NewsSourceInfo): Promise<NewsArticle[]> {
  const targetUrl = src.feedUrl.includes('allorigins')
    ? decodeURIComponent(src.feedUrl.split('url=')[1] || src.feedUrl)
    : src.feedUrl;

  const articles: NewsArticle[] = [];

  // Try 1: RSS2JSON (Fast, native JSON, CORS enabled)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000); // 2 second timeout per source

    const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(rss2jsonUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'ok' && Array.isArray(data.items)) {
        for (const item of data.items) {
          const title = item.title?.trim() || '';
          const link = item.link?.trim() || item.guid?.trim() || '';
          const pubDateText = item.pubDate || new Date().toISOString();
          const descriptionRaw = item.description || item.content || '';
          const description = descriptionRaw.replace(/<[^>]*>?/gm, '').trim().slice(0, 300);

          if (!title) continue;
          const rawLink = item.link?.trim() || item.guid?.trim() || '';
          const cleanLink = resolveCleanArticleLink(rawLink, item.guid?.trim(), descriptionRaw, src.name, title);

          const words = `${title} ${description}`.split(/\s+/).length;
          const readTimeMinutes = Math.max(1, Math.ceil(words / 200));

          const text = `${title} ${description}`.toLowerCase();
          let sentiment: 'Urgent' | 'Positive' | 'Neutral' | 'Analysis' | 'Warning' = 'Neutral';
          if (text.includes('warn') || text.includes('alert') || text.includes('risk') || text.includes('threat') || text.includes('crisis')) {
            sentiment = 'Warning';
          } else if (text.includes('breaking') || text.includes('urgent') || text.includes('emergency')) {
            sentiment = 'Urgent';
          } else if (text.includes('soar') || text.includes('record') || text.includes('gain') || text.includes('breakthrough') || text.includes('success')) {
            sentiment = 'Positive';
          } else if (text.includes('report') || text.includes('study') || text.includes('analysis') || text.includes('future') || text.includes('ai')) {
            sentiment = 'Analysis';
          }

          const rawImgRss = item.thumbnail || (item.enclosure && item.enclosure.link) || (descriptionRaw.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]);
          const imageUrl = getArticleImageUrl(rawImgRss, src.category, title);

          const id = btoa(encodeURIComponent(cleanLink)).replace(/=/g, '').slice(-20);

          articles.push({
            id,
            title,
            description: description || title,
            contentSnippet: description,
            link: cleanLink,
            source: src.name,
            category: src.category,
            imageUrl,
            pubDate: new Date(pubDateText).toISOString(),
            readTimeMinutes,
            sentiment,
            tags: [src.category, src.name],
            seoKeywords: [src.category.toLowerCase(), src.name.toLowerCase()],
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            metaDescription: description || title,
          });
        }
        if (articles.length > 0) return articles;
      }
    }
  } catch {
    // Fallback to XML proxy
  }

  // Try 2: AllOrigins proxy with DOM Parser
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const xmlText = await res.text();
      if (xmlText && (xmlText.includes('<rss') || xmlText.includes('<feed') || xmlText.includes('<item') || xmlText.includes('<entry'))) {
        const dom = new DOMParser().parseFromString(xmlText, 'text/xml');
        const items = dom.querySelectorAll('item, entry');

        items.forEach((item) => {
          const title = item.querySelector('title')?.textContent?.trim() || '';
          const rawXmlLink = item.querySelector('link')?.textContent?.trim() || item.querySelector('link')?.getAttribute('href') || '';
          const rawGuid = item.querySelector('guid')?.textContent?.trim() || '';
          const pubDateText = item.querySelector('pubDate, updated, published')?.textContent?.trim() || new Date().toISOString();
          const descriptionRaw = item.querySelector('description, content, summary')?.textContent?.trim() || '';
          const description = descriptionRaw.replace(/<[^>]*>?/gm, '').trim().slice(0, 300);
          const cleanLink = resolveCleanArticleLink(rawXmlLink, rawGuid, descriptionRaw, src.name, title);

          if (!title || !cleanLink) return;

          const words = `${title} ${description}`.split(/\s+/).length;
          const readTimeMinutes = Math.max(1, Math.ceil(words / 200));

          const text = `${title} ${description}`.toLowerCase();
          let sentiment: 'Urgent' | 'Positive' | 'Neutral' | 'Analysis' | 'Warning' = 'Neutral';
          if (text.includes('warn') || text.includes('alert') || text.includes('risk') || text.includes('threat') || text.includes('crisis')) {
            sentiment = 'Warning';
          } else if (text.includes('breaking') || text.includes('urgent') || text.includes('emergency')) {
            sentiment = 'Urgent';
          } else if (text.includes('soar') || text.includes('record') || text.includes('gain') || text.includes('breakthrough') || text.includes('success')) {
            sentiment = 'Positive';
          } else if (text.includes('report') || text.includes('study') || text.includes('analysis') || text.includes('future') || text.includes('ai')) {
            sentiment = 'Analysis';
          }

          const rawXmlImg = item.querySelector('media\\:content, content, media\\:thumbnail, enclosure')?.getAttribute('url') || (descriptionRaw.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]);
          const imageUrl = getArticleImageUrl(rawXmlImg, src.category, title);

          const id = btoa(encodeURIComponent(cleanLink)).replace(/=/g, '').slice(-20);

          articles.push({
            id,
            title,
            description: description || title,
            contentSnippet: description,
            link: cleanLink,
            source: src.name,
            category: src.category,
            imageUrl,
            pubDate: new Date(pubDateText).toISOString(),
            readTimeMinutes,
            sentiment,
            tags: [src.category, src.name],
            seoKeywords: [src.category.toLowerCase(), src.name.toLowerCase()],
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            metaDescription: description || title,
          });
        });
      }
    }
  } catch {
    // Ignore error
  }

  return articles;
}

// Client-Side Live RSS Scraper (Parallel Execution with accumulation so NO articles are ever deleted)
async function fetchClientSideNews(): Promise<NewsResponse> {
  const sources = getStoredClientSources().filter(s => s.active);

  // Fetch all sources concurrently in parallel
  const liveScinePromises = sources.map(src => fetchSourceArticles(src));

  // Race against a 3.5 second total limit so the UI never hangs
  const timeoutPromise = new Promise<NewsArticle[][]>((resolve) => {
    setTimeout(() => resolve([]), 3500);
  });

  const results = await Promise.race([
    Promise.all(liveScinePromises),
    timeoutPromise,
  ]);

  const fetchedArticles: NewsArticle[] = [];
  if (Array.isArray(results)) {
    results.forEach(sourceArts => {
      if (Array.isArray(sourceArts)) {
        fetchedArticles.push(...sourceArts);
      }
    });
  }

  // Load existing articles stored in browser localStorage
  const existingDb = getCachedDatabaseNews();
  const existingArticles: NewsArticle[] = (existingDb && Array.isArray(existingDb.articles)) ? existingDb.articles : [];

  // Combine newly fetched articles + existing archived articles + fallback seed articles
  // NEVER delete older posts: cumulative archive
  const titleSet = new Set<string>();
  const idSet = new Set<string>();
  const mergedArticles: NewsArticle[] = [];

  const addArticleIfNotExists = (art: NewsArticle) => {
    if (!art || !art.title) return;
    const normTitle = art.title.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const normId = (art.id || '').trim();
    if (normTitle && !titleSet.has(normTitle) && (!normId || !idSet.has(normId))) {
      titleSet.add(normTitle);
      if (normId) idSet.add(normId);
      mergedArticles.push(art);
    }
  };

  // 1. First add newly fetched live articles
  fetchedArticles.forEach(addArticleIfNotExists);

  // 2. Then add all previous accumulated articles so old posts are NEVER deleted
  existingArticles.forEach(addArticleIfNotExists);

  // 3. Supplement with rich seed catalog
  FALLBACK_ARTICLES.forEach(addArticleIfNotExists);

  // Sort by pubDate descending
  mergedArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  // Category, Source & Sentiment counts
  const categoryCounts: Record<string, number> = { All: mergedArticles.length };
  const sourceCounts: Record<string, number> = {};
  const sentimentCounts: Record<string, number> = {};

  mergedArticles.forEach(art => {
    categoryCounts[art.category] = (categoryCounts[art.category] || 0) + 1;
    sourceCounts[art.source] = (sourceCounts[art.source] || 0) + 1;
    sentimentCounts[art.sentiment] = (sentimentCounts[art.sentiment] || 0) + 1;
  });

  return {
    articles: mergedArticles,
    lastRefreshedAt: new Date().toISOString(),
    nextRefreshAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    refreshIntervalSeconds: 600,
    totalArticles: mergedArticles.length,
    refreshCount: (existingDb?.refreshCount || 0) + 1,
    isRefreshing: false,
    sources,
    stats: {
      categoryCounts,
      sourceCounts,
      sentimentCounts,
    },
    breakingNews: mergedArticles.slice(0, 3),
  };
}

function generateClientSideSummary(article: NewsArticle): AISummaryResponse {
  const sentences = article.description 
    ? article.description.split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(s => s.length > 12)
    : [article.title];
  
  const rephrasedTitle = article.title.replace(/\s*-\s*[^-]+$/, '').trim();
  const cat = article.category || 'General';
  const src = article.source || 'News Dispatch';

  let backgroundContext = `Over recent quarters, the ${cat.toLowerCase()} landscape has witnessed heightened attention and accelerating developments, driven by institutional shifts, public engagement, and evolving industry standards.`;
  let stakeholderImpact = `For industry professionals, community stakeholders, and active observers, this announcement introduces crucial considerations regarding strategy, implementation, and resource prioritization.`;
  let futureOutlook = `Observers and sector analysts will follow upcoming press briefings, stakeholder consultations, and verified follow-up disclosures to monitor long-term outcomes.`;

  if (cat === 'Technology') {
    backgroundContext = `The technology ecosystem continues to evolve rapidly through advancements in artificial intelligence, digital security frameworks, and computational efficiency across enterprise networks.`;
    stakeholderImpact = `Developers, enterprise strategists, and digital consumers are evaluating the long-term architectural and competitive ramifications of this milestone.`;
    futureOutlook = `Next-generation roadmap updates, API benchmarks, and industry ecosystem announcements are expected during upcoming technical summits.`;
  } else if (cat === 'Business') {
    backgroundContext = `International markets remain focused on capital efficiency, supply chain robustness, and corporate governance amid shifting macroeconomic metrics.`;
    stakeholderImpact = `Investors, corporate executives, and market participants are adjusting risk calculations and operational benchmarks accordingly.`;
    futureOutlook = `Upcoming financial disclosures, quarterly earning calls, and regulatory filings will provide essential data on performance trajectories.`;
  } else if (cat === 'World') {
    backgroundContext = `Diplomatic channels and international cooperation frameworks are continually responding to regional realignments and multi-stakeholder governance priorities.`;
    stakeholderImpact = `Civic organizations, regional communities, and international missions are assessing immediate operational impacts and collaborative opportunities.`;
    futureOutlook = `Bilateral envoys and observer groups are scheduled to hold follow-up sessions to review milestones and cooperative initiatives.`;
  }

  const firstSentence = sentences[0] || article.title;
  const secondSentence = sentences[1] || '';
  const rephrasedLead = firstSentence.endsWith('.') ? firstSentence : `${firstSentence}.`;

  const paragraphs: string[] = [
    `${rephrasedLead} According to dispatches verified by ${src}, this story represents an essential focal point in current ${cat.toLowerCase()} coverage. ${secondSentence}`,
    `${backgroundContext} Historical trends and recent market data illustrate why this development has captured widespread editorial focus.`,
    `${stakeholderImpact} Observers highlight that timely execution and objective scrutiny are central to understanding the full scope of these actions.`,
    `${futureOutlook} Dedicated correspondents from ${src} continue to track the ongoing narrative as additional confirmations become available.`
  ];

  const rephrasedStory = paragraphs.join('\n\n');
  const bulletPoints = sentences.slice(0, 5).map(s => s.endsWith('.') ? s : `${s}.`);
  if (bulletPoints.length < 3) {
    bulletPoints.push(`Continuous reporting and coverage maintained across ${src} news channels.`);
  }

  const timeline = [
    { timeOrPhase: 'Initial Report', event: `${src} publishes primary dispatch regarding ${rephrasedTitle}.` },
    { timeOrPhase: 'Active Review', event: `Analysis and stakeholder reactions underway across ${cat} networks.` },
    { timeOrPhase: 'Forward Milestone', event: `Upcoming progress briefings and formal verifications expected.` }
  ];

  return {
    success: true,
    summary: {
      rephrasedTitle,
      rephrasedLead,
      rephrasedStory,
      backgroundContext,
      stakeholderImpact,
      futureOutlook,
      oneLineSummary: rephrasedLead,
      executiveSummary: rephrasedLead,
      bulletPoints,
      keyTakeaways: [
        `Primary Source: ${src} (${cat})`,
        `Estimated reading duration: ${article.readTimeMinutes || 3} min.`,
        `Strategic significance: Structural evolution within the global ${cat.toLowerCase()} sector.`,
        'Direct link available to inspect the primary original wire report.'
      ],
      whyItMatters: `This key report from ${src} provides critical insights into ongoing transitions in ${cat.toLowerCase()}, affecting policy, market momentum, and public understanding.`,
      sentiment: article.sentiment,
      tags: article.tags || [cat, src.replace(/[^a-zA-Z0-9]/g, '') || 'News'],
      timeline,
      wordCount: rephrasedStory.split(/\s+/).filter(Boolean).length
    },
  };
}

function addClientSideCustomSource(data: { name: string; category: string; feedUrl?: string; query?: string }) {
  let feedUrl = data.feedUrl;
  if (!feedUrl && data.query) {
    const encoded = encodeURIComponent(data.query);
    feedUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;
  }

  const sources = getStoredClientSources();
  const newSource: NewsSourceInfo = {
    id: `custom-${Date.now()}`,
    name: data.name,
    url: feedUrl || 'https://news.google.com',
    feedUrl: feedUrl || '',
    category: (data.category as any) || 'World',
    active: true,
  };

  sources.push(newSource);
  localStorage.setItem(CLIENT_SOURCES_KEY, JSON.stringify(sources));

  return {
    success: true,
    source: newSource,
  };
}

// Extract keywords and calculate comprehensive trending topics from articles
export function calculateTrendingTopicsFromArticles(articles: NewsArticle[]): TrendingTopicsData {
  const tagCounts: Record<string, number> = {};
  const tagCategories: Record<string, Record<string, number>> = {};
  const tagSentiments: Record<string, Record<string, number>> = {};
  const tagArticles: Record<string, { id: string; title: string; source: string; category: NewsCategory; pubDate: string; link?: string }[]> = {};
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

    // 1. Explicit tags from article
    if (Array.isArray(art.tags)) {
      art.tags.forEach(t => {
        const cleaned = t.trim();
        if (cleaned.length >= 2 && !STOP_WORDS.has(cleaned.toLowerCase())) {
          itemTags.add(cleaned);
        }
      });
    }

    // 2. SEO Keywords
    if (Array.isArray(art.seoKeywords)) {
      art.seoKeywords.forEach(k => {
        const cleaned = k.trim();
        if (cleaned.length >= 2 && !STOP_WORDS.has(cleaned.toLowerCase())) {
          itemTags.add(cleaned);
        }
      });
    }

    // 3. AI Summary tags
    if (Array.isArray(art.aiSummary?.tags)) {
      art.aiSummary.tags.forEach(t => {
        const cleaned = t.trim();
        if (cleaned.length >= 2 && !STOP_WORDS.has(cleaned.toLowerCase())) {
          itemTags.add(cleaned);
        }
      });
    }

    // 4. If few tags, extract significant capitalized/keyword phrases from title
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

    // Always ensure category is represented if needed
    if (art.category && itemTags.size === 0) {
      itemTags.add(art.category);
    }

    // Record data for each tag
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

  // Convert to sorted array of TrendingTopicItems
  const topics: TrendingTopicItem[] = Object.entries(tagCounts)
    .map(([tag, count]) => {
      const catObj = tagCategories[tag] || {};
      let primaryCategory: NewsCategory = 'World';
      let maxCatCount = 0;
      for (const [c, cnt] of Object.entries(catObj)) {
        if (cnt > maxCatCount) {
          maxCatCount = cnt;
          primaryCategory = c as NewsCategory;
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

  // Find fastest rising topic (highest ratio of recent occurrences)
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

  return {
    totalUniqueTags: topics.length,
    totalTagOccurrences,
    topKeyword,
    fastestRising,
    averageTagsPerArticle,
    topics,
    categoryDistribution,
  };
}

// Fetch trending topics from API with automatic client fallback
export async function fetchTrendingTopics(fallbackArticles: NewsArticle[] = []): Promise<TrendingTopicsData> {
  try {
    const res = await fetch('/api/news/trending-topics');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.trendingData) {
        return data.trendingData;
      }
    }
  } catch (err) {
    console.warn('API fetchTrendingTopics failed, using client-side calculation:', err);
  }

  return calculateTrendingTopicsFromArticles(fallbackArticles);
}

// Auto-tag a single article by ID
export async function autoTagArticle(
  articleId: string,
  applyImmediately: boolean = true
): Promise<{ success: boolean; article?: NewsArticle; suggestions: AutoTagSuggestion; message?: string }> {
  try {
    const res = await fetch(`/api/news/articles/${encodeURIComponent(articleId)}/auto-tag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applyImmediately })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend autoTagArticle failed, using client heuristic fallback:', err);
  }

  // Client-side fallback if backend unavailable
  return {
    success: true,
    suggestions: {
      tags: ['#BreakingNews', '#HeadlineWire', '#Trending'],
      seoKeywords: ['latest news', 'global updates'],
      sentiment: 'Neutral',
      explanation: 'Generated via client heuristic fallback tagger.',
      isAiGenerated: false
    },
    message: 'Auto-tag generated.'
  };
}

// Auto-tag custom text on the fly
export async function autoTagCustomText(
  title: string,
  body?: string,
  category?: string,
  source?: string
): Promise<{ success: boolean; suggestions: AutoTagSuggestion }> {
  try {
    const res = await fetch('/api/news/auto-tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, category, source })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.suggestions) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend autoTagCustomText failed:', err);
  }

  return {
    success: true,
    suggestions: {
      tags: [`#${(category || 'World').replace(/\s+/g, '')}`, '#BreakingNews', '#NewsWire'],
      seoKeywords: [(category || 'world').toLowerCase(), 'latest news'],
      sentiment: 'Neutral',
      explanation: 'Extracted via client fallback tagger.',
      isAiGenerated: false
    }
  };
}

// Bulk / Batch auto-tagging
export async function batchAutoTagArticles(
  options: { articleIds?: string[]; onlyUntagged?: boolean; maxArticles?: number } = {}
): Promise<BatchAutoTagResult> {
  try {
    const res = await fetch('/api/news/auto-tag-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return data;
      }
    }
  } catch (err) {
    console.error('Batch auto-tagging error:', err);
  }

  return {
    success: false,
    processedCount: 0,
    updatedArticlesCount: 0,
    results: []
  };
}

// Translate a single article to Hindi on the fly using Gemini AI
export async function translateArticleToHindi(article: NewsArticle): Promise<HindiArticleContent | null> {
  try {
    const res = await fetch('/api/news/translate-hindi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleId: article.id,
        article: {
          id: article.id,
          title: article.title,
          description: article.description,
          contentSnippet: article.contentSnippet,
          category: article.category,
          source: article.source,
          sentiment: article.sentiment,
          aiSummary: article.aiSummary,
        }
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.hindi) {
        return data.hindi;
      }
    }
  } catch (err) {
    console.warn('[newsApi] Error calling /api/news/translate-hindi:', err);
  }
  return null;
}

// Translate a batch of articles to Hindi on the fly
export async function batchTranslateArticlesToHindi(
  articleIds: string[],
  maxArticles: number = 15
): Promise<Record<string, HindiArticleContent>> {
  try {
    const res = await fetch('/api/news/translate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleIds, maxArticles })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.translations) {
        return data.translations;
      }
    }
  } catch (err) {
    console.warn('[newsApi] Error calling /api/news/translate-batch:', err);
  }
  return {};
}

// Fetch Sitemap & Google News automated indexing diagnostics
export async function fetchSitemapStatus(): Promise<import('../types').SitemapStatusInfo | null> {
  try {
    const res = await fetch('/api/sitemap/status');
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[newsApi] Error fetching /api/sitemap/status:', err);
  }
  return null;
}

// Trigger on-demand sitemap refresh across disk and memory
export async function regenerateSitemapNow(): Promise<{
  success: boolean;
  message: string;
  totalArticlesIndexed: number;
  totalVideosIndexed: number;
  generatedAt: string;
  nextScheduledDailyRunAt: string;
} | null> {
  try {
    const res = await fetch('/api/sitemap/regenerate', { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[newsApi] Error triggering /api/sitemap/regenerate:', err);
  }
  return null;
}



