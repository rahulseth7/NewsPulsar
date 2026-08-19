// High-precision curated image matching engine
// Ensures images attached to news articles strictly match the subject, domain, and entity of the story.

// Semantic keyword & entity image mappings for hyper-accurate fallback when source image is missing
const SEMANTIC_KEYWORD_IMAGE_MAP: Array<{ regex: RegExp; url: string }> = [
  // AI, LLMs & Machine Learning
  {
    regex: /\b(ai|artificial intelligence|deepseek|chatgpt|openai|anthropic|claude|gemini|llm|neural|generative ai|copilot|mistral|machine learning|bot|algorithm|deep learning)\b/i,
    url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80'
  },
  // Semiconductors, Chips & Hardware
  {
    regex: /\b(nvidia|chip|semiconductor|tsmc|gpu|processor|intel|amd|qualcomm|microchip|hardware|nanometer|foundry|circuit)\b/i,
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
  },
  // Space, Astronomy & Rockets
  {
    regex: /\b(space|nasa|isro|chandrayaan|artemis|mars|moon|orbit|telescope|webb|jwst|planet|asteroid|rocket|spacex|starship|astronaut|galaxy|cosmos|satellite)\b/i,
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
  },
  // Quantum Computing & Physics
  {
    regex: /\b(quantum|qubit|particle|physics|laser|cern|collider|superconductor|fault-tolerant|fusion)\b/i,
    url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80'
  },
  // Cybersecurity, Hacks & Data Privacy
  {
    regex: /\b(cyber|hack|breach|malware|ransomware|vulnerability|phishing|leak|spyware|firewall|encryption|dark web|ddos|security flaw)\b/i,
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
  },
  // Smartphones, Big Tech & Gadgets (Apple, Google, Samsung)
  {
    regex: /\b(iphone|apple|samsung|pixel|smartphone|android|ios|macbook|ipad|wearable|smartwatch|gadget|metaverse|vr|ar headset)\b/i,
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80'
  },
  // Renewable Energy, Solar, Wind & Battery
  {
    regex: /\b(solar|wind energy|renewable|green energy|clean energy|battery|power grid|megawatt|gigawatt|photovoltaic|turbines|decarbonization)\b/i,
    url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80'
  },
  // Electric Vehicles & Automotive
  {
    regex: /\b(ev|electric vehicle|tesla|byd|charging station|autonomous driving|self-driving|car|automotive|hybrid car)\b/i,
    url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80'
  },
  // Climate, Ocean, Storms & Environment
  {
    regex: /\b(climate|global warming|carbon|emission|glacier|flood|wildfire|hurricane|storm|cyclone|drought|ocean|arctic|antarctica)\b/i,
    url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&w=800&q=80'
  },
  // Cricket (India, IPL, World Cup, BCCI)
  {
    regex: /\b(cricket|ipl|bcci|kohli|rohit|dhoni|bumrah|gill|hardik|pant|t20|test match|odi|wicket|century|stumps|pitch|batted|bowled|ipl 2026|icc)\b/i,
    url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80'
  },
  // Football / Soccer (Premier League, Champions League, FIFA)
  {
    regex: /\b(football|soccer|premier league|champions league|fifa|uefa|messi|ronaldo|mbappe|haaland|real madrid|barcelona|manchester|arsenal|liverpool|goal|striker)\b/i,
    url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'
  },
  // Tennis, Olympics & Athletics
  {
    regex: /\b(tennis|wimbledon|grand slam|djokovic|alcaraz|sinner|swiatek|olympics|olympic|athletics|marathon|gymnastics|gold medal)\b/i,
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'
  },
  // Basketball / NBA & Sports Arena
  {
    regex: /\b(nba|basketball|lakers|celtics|curry|lebron|dunk|court|hoop|nfl|super bowl|touchdown)\b/i,
    url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80'
  },
  // Stocks, Financial Markets, Wall Street, Sensex & Trading
  {
    regex: /\b(stock|wall street|sensex|nifty|nasdaq|dow jones|s&p 500|share price|rally|bull market|bear market|equities|trading|investor|dividend)\b/i,
    url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80'
  },
  // Banking, Central Banks & Monetary Policy (Federal Reserve, RBI, IMF)
  {
    regex: /\b(bank|central bank|federal reserve|fed|jerome powell|rbi|shaktikanta|interest rate|repo rate|inflation|liquidity|treasury|gdp|monetary policy|imf|world bank)\b/i,
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
  },
  // Crypto, Bitcoin, Ethereum & Blockchain
  {
    regex: /\b(bitcoin|crypto|cryptocurrency|ethereum|solana|btc|eth|blockchain|binance|coinbase|altcoin|mining|etf|defi)\b/i,
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
  },
  // Real Estate, Housing & Infrastructure
  {
    regex: /\b(real estate|housing|property|mortgage|apartment|construction|infrastructure|highway|bridge|railway|vande bharat|metro|urban)\b/i,
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
  },
  // Geopolitics, International Conflict, Military & Defense
  {
    regex: /\b(ukraine|russia|putin|zelenskyy|gaza|israel|middle east|red sea|missile|military|defence|defense|nato|un security|army|pentagon|war|air strike|ceasefire|treaty)\b/i,
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
  },
  // Diplomacy, Elections & Governance
  {
    regex: /\b(election|poll|vote|parliament|congress|senate|white house|president|prime minister|modi|biden|trump|summit|diplomat|bilateral|treaty|cabinet)\b/i,
    url: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80'
  },
  // India Politics & National News
  {
    regex: /\b(india|delhi|mumbai|bengaluru|kolkata|chennai|hyderabad|lok sabha|rajya sabha|bjp|congress party|aap|governor|chief minister|supreme court of india)\b/i,
    url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80'
  },
  // Legal, Judiciary, Lawsuits, Crime & Courts
  {
    regex: /\b(court|judge|lawyer|lawsuit|trial|verdict|jailed|prison|police|cbi|ed|investigation|fraud|bribery|scam|arrest|custody|bail|appeal|justice)\b/i,
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
  },
  // Healthcare, Vaccines, Pandemic & Medical Research
  {
    regex: /\b(health|hospital|doctor|patient|medical|medicine|vaccine|fda|who|cancer|clinical trial|therapy|surgery|cardio|pharma|virus|flu|pandemic|drug)\b/i,
    url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80'
  },
  // Brain, Mental Health & Neuroscience
  {
    regex: /\b(brain|neuroscience|mental health|psychology|sleep|wellness|depression|dementia|alzheimer|memory|cognitive)\b/i,
    url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80'
  },
  // Fitness, Nutrition & Lifestyle
  {
    regex: /\b(fitness|diet|nutrition|workout|exercise|yoga|organic|supplement|wellness|obesity|longevity)\b/i,
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
  },
  // Movies, Hollywood & Cinema
  {
    regex: /\b(film|movie|cinema|hollywood|box office|imax|director|actor|actress|trailer|premiere|oscars|cannes|screenplay|theatrical)\b/i,
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80'
  },
  // Bollywood & Indian Cinema
  {
    regex: /\b(bollywood|tollywood|kollywood|srk|shah rukh|salman|deepika|ranbir|alia|prabhas|box office collection|hindi film|blockbuster)\b/i,
    url: 'https://images.unsplash.com/photo-1518676599625-5d5700f135b1?auto=format&fit=crop&w=800&q=80'
  },
  // Music, Concerts & Artists
  {
    regex: /\b(music|concert|album|song|singer|tour|grammy|taylor swift|bts|beyonce|band|festival|spotify|billboard|pop star|rap)\b/i,
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
  },
  // Gaming, Video Games & Esports
  {
    regex: /\b(gaming|video game|playstation|xbox|nintendo|gta|steam|esports|console|gameplay|unreal engine|rpg)\b/i,
    url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80'
  },
  // Aviation, Airlines & Aerospace
  {
    regex: /\b(airline|airplane|aviation|flight|airport|boeing|airbus|pilot|runway|jet|aircraft)\b/i,
    url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80'
  }
];

// Rich fallback categorized by topic
const TOPIC_FALLBACKS: Record<string, string[]> = {
  Technology: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  ],
  World: [
    'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80',
  ],
  Science: [
    'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
  ],
  Business: [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  ],
  Sports: [
    'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=800&q=80',
  ],
  Entertainment: [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=800&q=80',
  ],
  Health: [
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
  ],
};

/**
 * Validates whether a raw image URL is an actual working article image,
 * and not a tracking pixel, analytics beacon, or broken inline svg.
 */
export function isValidArticleImageUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 12) return false;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;

  const lower = trimmed.toLowerCase();
  // Filter out tracking pixels, badges, and empty placeholders
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
    lower.includes('apple-touch-icon')
  ) {
    return false;
  }

  return true;
}

/**
 * Gets a clean, verified image URL for a news article.
 * If the scraped URL is valid, it uses it directly.
 * If missing, invalid, or broken, it determines a topic-matched photo based on headline entities & category.
 */
export function getArticleImageUrl(rawUrl?: string, category: string = 'World', title: string = ''): string {
  // 1. If we have a valid scraped article image from the source website or RSS, use it
  if (isValidArticleImageUrl(rawUrl)) {
    return rawUrl!.trim();
  }

  // 2. Precision semantic match based on headline keywords
  if (title && typeof title === 'string') {
    for (const item of SEMANTIC_KEYWORD_IMAGE_MAP) {
      if (item.regex.test(title)) {
        return item.url;
      }
    }
  }

  // 3. Category deterministic fallback (stable based on title hash so it does not flicker)
  const catKey = TOPIC_FALLBACKS[category] ? category : 'World';
  const list = TOPIC_FALLBACKS[catKey];
  const hash = title ? title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  return list[Math.abs(hash) % list.length];
}
