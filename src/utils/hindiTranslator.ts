import { NewsArticle, HindiArticleContent, Language, NewsCategory } from '../types';

const HINDI_TRANSLATION_CACHE_KEY = 'newspulse_hindi_translations_cache';

// Load stored client translation cache
export function getStoredHindiTranslations(): Record<string, HindiArticleContent> {
  try {
    const raw = localStorage.getItem(HINDI_TRANSLATION_CACHE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading Hindi translation cache:', e);
  }
  return {};
}

// Save to client translation cache
export function saveStoredHindiTranslations(translations: Record<string, HindiArticleContent>) {
  try {
    localStorage.setItem(HINDI_TRANSLATION_CACHE_KEY, JSON.stringify(translations));
  } catch (e) {
    console.error('Error saving Hindi translation cache:', e);
  }
}

export const CATEGORY_HINDI_MAP: Record<NewsCategory, string> = {
  All: 'सभी समाचार',
  World: 'विश्व',
  Technology: 'तकनीक',
  Science: 'विज्ञान',
  Business: 'व्यापार',
  Sports: 'खेल',
  Entertainment: 'मनोरंजन',
  Health: 'स्वास्थ्य',
};

export const UI_STRINGS_HINDI = {
  breaking: 'ताज़ा ख़बर',
  allNews: 'सभी समाचार',
  liveWire: 'लाइव 24/7 वायर',
  about: 'हमारे बारे में',
  advertise: 'विज्ञापन दें',
  contact: 'संपर्क करें',
  privacy: 'गोपनीयता नीति',
  dashboard: 'डैशबोर्ड',
  saved: 'सुरक्षित',
  refresh: 'ताज़ा करें',
  searchPlaceholder: 'ताज़ा सुर्खियाँ, स्रोत और विषय खोजें...',
  showingStories: 'सत्यापित समाचार',
  readTime: 'पढ़ने का समय',
  minRead: 'मिनट',
  keyPoints: 'मुख्य बिंदु',
  keyTakeaways: 'महत्वपूर्ण निष्कर्ष',
  whyItMatters: 'यह खबर क्यों महत्वपूर्ण है?',
  readOriginal: 'मूल स्रोत पर पढ़ें',
  listenAudio: 'ऑडियो सुनें',
  stopAudio: 'रोकें',
  copyLink: 'लिंक कॉपी करें',
  copied: 'कॉपी हो गया!',
  aiRephrasedBadge: '⚡ AI हिन्दी अनुवाद',
  translatingFeed: 'AI द्वारा हिन्दी में अनुवाद जारी...',
  resetFilters: 'फ़िल्टर हटाएं',
  noStoriesFound: 'कोई समाचार नहीं मिला',
  readerMode: 'रीडर मोड',
  close: 'बंद करें',
  share: 'शेयर करें',
};

// Heuristic client fallback translator for zero-latency instant rendering
export function createClientHindiFallback(article: NewsArticle): HindiArticleContent {
  const cat = CATEGORY_HINDI_MAP[article.category] || 'विश्व';
  const rawTitle = article.title;
  
  // Keyword replacement dictionary
  const terms: [RegExp, string][] = [
    [/\bAI\b|\bArtificial Intelligence\b/gi, 'आर्टिफिशियल इंटेलिजेंस (AI)'],
    [/\bQuantum Computing\b/gi, 'क्वांटम तकनीक'],
    [/\bClean Energy\b|\bRenewable Energy\b/gi, 'स्वच्छ ऊर्जा'],
    [/\bElectric Vehicles\b|\bEVs?\b/gi, 'इलेक्ट्रिक वाहन'],
    [/\bStock Market\b|\bWall Street\b/gi, 'शेयर बाज़ार'],
    [/\bCentral Bank\b|\bFederal Reserve\b/gi, 'केंद्रीय बैंक'],
    [/\bNASA\b|\bSpace\b/gi, 'अंतरिक्ष व नासा'],
    [/\bCybersecurity\b/gi, 'साइबर सुरक्षा'],
    [/\bClimate Change\b/gi, 'जलवायु परिवर्तन'],
    [/\bBreaking News\b/gi, 'ताज़ा समाचार'],
    [/\bHospital\b|\bHealthcare\b/gi, 'स्वास्थ्य सेवा'],
    [/\bVaccine\b/gi, 'वैक्सीन'],
  ];

  let hindiTitle = rawTitle;
  for (const [re, rep] of terms) {
    hindiTitle = hindiTitle.replace(re, rep);
  }

  const desc = article.aiSummary?.rephrasedLead || article.description || article.contentSnippet || '';
  const hindiLead = `नवीनतम रिपोर्ट: ${desc.slice(0, 180)}...`;
  const hindiStory = `${hindiLead}\n\nइस घटनाक्रम पर विशेषज्ञ और नीति निर्माता बारीकी से नजर बनाए हुए हैं। आने वाले समय में इसके व्यापक प्रभाव देखने को मिल सकते हैं।`;

  return {
    title: `${hindiTitle} [${cat}]`,
    description: hindiStory,
    contentSnippet: hindiLead,
    rephrasedLead: hindiLead,
    rephrasedStory: hindiStory,
    oneLineSummary: `${rawTitle.slice(0, 80)} - हिन्दी संक्षिप्त समाचार।`,
    executiveSummary: hindiLead,
    bulletPoints: [
      `${article.source} द्वारा प्रकाशित रिपोर्ट के अनुसार प्रमुख विकास सामने आया है।`,
      `यह कदम ${cat} क्षेत्र में नए अवसरों और मानकों का मार्ग प्रशस्त करेगा।`,
      `संबद्ध अधिकारियों द्वारा विस्तृत समीक्षा जारी है।`
    ],
    keyTakeaways: [
      `वैश्विक एवं क्षेत्रीय स्तर पर इसके दूरगामी सकारात्मक परिणाम संभावित हैं।`,
      `हितधारकों को नए दिशा-निर्देशों के अनुरूप तैयारी करने की सलाह दी गई है।`
    ],
    whyItMatters: `यह विकास सीधे तौर पर ${cat} के भविष्य और जनसामान्य के सरोकारों से जुड़ा हुआ है।`,
    tags: [`#${cat}`, '#ताज़ासमाचार', '#न्यूज़पल्स', '#भारत'],
    sentiment: article.sentiment || 'Neutral',
    translatedAt: new Date().toISOString(),
    isAiGenerated: false,
  };
}

// Return localized version of a NewsArticle based on active language
export function getLocalizedArticle(
  article: NewsArticle,
  language: Language,
  translationsCache?: Record<string, HindiArticleContent>
): NewsArticle {
  if (language === 'en') {
    return article;
  }

  // Look for Hindi content in order: article.hindi -> translationsCache -> client fallback
  const hindiContent = article.hindi || (translationsCache && translationsCache[article.id]);

  if (hindiContent) {
    return {
      ...article,
      title: hindiContent.title || article.title,
      description: hindiContent.rephrasedStory || hindiContent.description || article.description,
      contentSnippet: hindiContent.contentSnippet || hindiContent.rephrasedLead || article.contentSnippet,
      tags: (hindiContent.tags && hindiContent.tags.length > 0) ? hindiContent.tags : article.tags,
      aiSummary: {
        rephrasedTitle: hindiContent.title || article.title,
        rephrasedLead: hindiContent.rephrasedLead || hindiContent.contentSnippet || article.aiSummary?.rephrasedLead,
        rephrasedStory: hindiContent.rephrasedStory || hindiContent.description || article.aiSummary?.rephrasedStory,
        oneLineSummary: hindiContent.oneLineSummary || article.aiSummary?.oneLineSummary,
        executiveSummary: hindiContent.executiveSummary || article.aiSummary?.executiveSummary,
        bulletPoints: (hindiContent.bulletPoints && hindiContent.bulletPoints.length > 0) ? hindiContent.bulletPoints : (article.aiSummary?.bulletPoints || []),
        keyTakeaways: (hindiContent.keyTakeaways && hindiContent.keyTakeaways.length > 0) ? hindiContent.keyTakeaways : (article.aiSummary?.keyTakeaways || []),
        whyItMatters: hindiContent.whyItMatters || article.aiSummary?.whyItMatters || '',
        sentiment: hindiContent.sentiment || article.sentiment,
        tags: (hindiContent.tags && hindiContent.tags.length > 0) ? hindiContent.tags : (article.aiSummary?.tags || []),
      },
      hindi: hindiContent,
    };
  }

  // Immediate fallback if still fetching
  const fallback = createClientHindiFallback(article);
  return {
    ...article,
    title: fallback.title,
    description: fallback.description,
    contentSnippet: fallback.contentSnippet,
    tags: fallback.tags || article.tags,
    aiSummary: {
      rephrasedTitle: fallback.title,
      rephrasedLead: fallback.rephrasedLead,
      rephrasedStory: fallback.rephrasedStory,
      oneLineSummary: fallback.oneLineSummary,
      executiveSummary: fallback.executiveSummary,
      bulletPoints: fallback.bulletPoints || [],
      keyTakeaways: fallback.keyTakeaways || [],
      whyItMatters: fallback.whyItMatters || '',
      sentiment: fallback.sentiment || article.sentiment,
      tags: fallback.tags || [],
    },
    hindi: fallback,
  };
}
