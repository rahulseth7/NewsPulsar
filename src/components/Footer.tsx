import React from 'react';
import { Newspaper, ShieldCheck, DollarSign, Rss, FileCode, Lock, Mail } from 'lucide-react';
import { PolicyTab } from './PolicyModal';
import { PageView, NewsArticle } from '../types';
import { NewsletterSignup } from './NewsletterSignup';

interface FooterProps {
  onOpenPolicy: (tab: PolicyTab) => void;
  onOpenDashboard?: () => void;
  onNavigatePage?: (page: PageView) => void;
  onOpenArticle?: (article: NewsArticle) => void;
  totalArticles?: number;
  lastRefreshedAt?: string;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPolicy,
  onOpenDashboard,
  onNavigatePage,
  onOpenArticle,
  totalArticles = 0,
  lastRefreshedAt,
}) => {
  const handleNav = (page: PageView, policyTab?: PolicyTab) => {
    if (onNavigatePage) {
      onNavigatePage(page);
    } else if (page === 'dashboard' && onOpenDashboard) {
      onOpenDashboard();
    } else if (policyTab) {
      onOpenPolicy(policyTab);
    }
  };

  return (
    <footer className="w-full bg-[#faf7ee] text-black mt-12 border-t-[3px] border-black shadow-[0_-4px_0_0_#000] font-neo safe-bottom">
      
      {/* Persistent Daily Top 5 Newsletter Signup Banner */}
      <NewsletterSignup variant="footer" onOpenArticle={onOpenArticle} />

      {/* Upper Footer Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Col 1: About */}
          <div className="bg-white border-2 border-black p-4 neo-shadow space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#ccff00] text-black border-2 border-black neo-shadow-sm shrink-0">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black font-neo text-black tracking-tight leading-none">
                  NEWS PULSAR
                </h3>
                <span className="text-[10px] font-mono text-[#ff2a85] font-black uppercase tracking-wider block mt-0.5">
                  REAL-TIME NEWS WIRE
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-700 leading-relaxed font-body font-medium">
              Real-time, automated journalism portal delivering factual breaking stories, AI-curated market analyses, tech updates, and verified news feeds.
            </p>

            <div className="pt-2 text-xs text-black font-bold flex items-center gap-2 font-mono">
              <span className="w-2.5 h-2.5 bg-[#00f5a0] border border-black animate-pulse" />
              <span>{totalArticles} Articles Indexed</span>
              {lastRefreshedAt && (
                <span className="text-zinc-600">• {new Date(lastRefreshedAt).toLocaleTimeString()}</span>
              )}
            </div>
          </div>

          {/* Col 2: Legal & Governance */}
          <div className="bg-white border-2 border-black p-4 neo-shadow space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
              <ShieldCheck className="w-4 h-4 text-black shrink-0" />
              <h4 className="font-neo font-black text-xs uppercase tracking-wider text-black">
                LEGAL &amp; GOVERNANCE
              </h4>
            </div>

            <ul className="space-y-1.5 text-xs font-bold">
              <li>
                <button
                  onClick={() => handleNav('privacy', 'privacy')}
                  className="hover:text-[#ff2a85] flex items-center gap-2 transition-colors cursor-pointer text-left w-full py-0.5"
                >
                  <Lock className="w-3.5 h-3.5 text-black shrink-0" />
                  <span>Privacy Policy &amp; Cookies</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('advertise', 'adsense')}
                  className="hover:text-[#ff2a85] flex items-center gap-2 transition-colors cursor-pointer text-left w-full py-0.5 text-black"
                >
                  <DollarSign className="w-3.5 h-3.5 text-black shrink-0" />
                  <span className="bg-[#ffe600] px-1 border border-black">AdSense Disclosures &amp; Advertise</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('privacy', 'terms')}
                  className="hover:text-[#ff2a85] flex items-center gap-2 transition-colors cursor-pointer text-left w-full py-0.5"
                >
                  <span>•</span>
                  <span>Terms of Service</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('about', 'about')}
                  className="hover:text-[#ff2a85] flex items-center gap-2 transition-colors cursor-pointer text-left w-full py-0.5"
                >
                  <span>•</span>
                  <span>Editorial Standards &amp; About</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('contact', 'contact')}
                  className="hover:text-[#ff2a85] flex items-center gap-2 transition-colors cursor-pointer text-left w-full py-0.5"
                >
                  <Mail className="w-3.5 h-3.5 text-black shrink-0" />
                  <span>Contact Editorial Board</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Feeds & Crawlers */}
          <div className="bg-white border-2 border-black p-4 neo-shadow space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
              <FileCode className="w-4 h-4 text-black shrink-0" />
              <h4 className="font-neo font-black text-xs uppercase tracking-wider text-black">
                SYNDICATION &amp; SITEMAP
              </h4>
            </div>

            <ul className="space-y-1.5 text-xs font-mono font-bold">
              <li>
                <a
                  href="/sitemap_index.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-black hover:text-[#ff2a85] py-0.5 transition-colors"
                >
                  <span className="bg-[#ccff00] px-1 border border-black text-[11px]">/sitemap_index.xml (Master Index)</span>
                </a>
              </li>
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-black hover:text-[#ff2a85] py-0.5 transition-colors"
                >
                  <span>/sitemap.xml (All Scraped Posts)</span>
                </a>
              </li>
              <li>
                <a
                  href="/news-sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-black hover:text-[#ff2a85] py-0.5 transition-colors"
                >
                  <span>/news-sitemap.xml (Google News 48h)</span>
                </a>
              </li>
              <li>
                <a
                  href="/video-sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-black hover:text-[#ff2a85] py-0.5 transition-colors"
                >
                  <span className="bg-[#ff2a85] text-white px-1 text-[11px]">/video-sitemap.xml (Videos)</span>
                </a>
              </li>
              <li>
                <a
                  href="/sitemap.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-black hover:text-[#ff2a85] py-0.5 transition-colors"
                >
                  <span className="bg-amber-200 px-1 border border-black text-[11px]">/sitemap.html (HTML Index)</span>
                </a>
              </li>
              <li>
                <a
                  href="/feed.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-black hover:text-[#ff2a85] py-0.5 transition-colors"
                >
                  <Rss className="w-3.5 h-3.5 text-black shrink-0" />
                  <span>/feed.xml (RSS 2.0)</span>
                </a>
              </li>
            </ul>

            <div className="pt-1 text-[10px] text-zinc-600 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>Daily Automated Cron Sync Active</span>
            </div>
          </div>

        </div>
      </div>

      {/* AdSense Compliance & Copyright Bar */}
      <div className="bg-black py-4 px-4 sm:px-6 border-t-2 border-black text-xs text-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="text-white font-neo font-bold">
              © {new Date().getFullYear()} NEWS PULSAR. ALL RIGHTS RESERVED.
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
              Google AdSense Monetized • Publisher ID: <span className="text-[#ccff00] font-black">ca-pub-6411773855584982</span>
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-neo font-bold">
            <button
              onClick={() => handleNav('privacy', 'privacy')}
              className="text-zinc-300 hover:text-[#ccff00] transition-colors cursor-pointer"
            >
              PRIVACY
            </button>
            <span>•</span>
            <button
              onClick={() => handleNav('advertise', 'adsense')}
              className="text-[#ffe600] hover:underline transition-colors cursor-pointer"
            >
              ADSENSE POLICY
            </button>
            <span>•</span>
            <button
              onClick={() => handleNav('about', 'about')}
              className="text-zinc-300 hover:text-[#ccff00] transition-colors cursor-pointer"
            >
              ABOUT
            </button>
            <span>•</span>
            <button
              onClick={() => handleNav('contact', 'contact')}
              className="text-zinc-300 hover:text-[#ccff00] transition-colors cursor-pointer"
            >
              CONTACT
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};


