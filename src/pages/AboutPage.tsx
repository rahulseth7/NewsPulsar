import React, { useState } from 'react';
import { 
  Newspaper, 
  Sparkles, 
  Cpu, 
  Globe, 
  ShieldCheck, 
  Clock, 
  ArrowLeft, 
  CheckCircle2, 
  Flame, 
  Database, 
  Layers, 
  TrendingUp, 
  Share2, 
  Award,
  BookOpen,
  Terminal,
  ExternalLink,
  Zap,
  Users,
  Target,
  FileText
} from 'lucide-react';
import { NewsResponse } from '../types';

interface AboutPageProps {
  onBackToNews: () => void;
  onNavigatePage: (page: 'about' | 'advertise' | 'contact' | 'privacy' | 'dashboard') => void;
  data: NewsResponse | null;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onBackToNews,
  onNavigatePage,
  data
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const totalArticles = data?.totalArticles || 50;
  const activeSourcesCount = data?.sources?.filter(s => s.active).length || 24;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="w-full bg-[#faf7ee] text-black font-neo pb-16 min-h-screen">
      {/* 1. Breadcrumb & Back Action Bar */}
      <div className="bg-[#ffe600] border-b-2 border-black py-2.5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase">
            <button 
              onClick={onBackToNews}
              className="flex items-center gap-1.5 bg-black text-[#ccff00] px-3 py-1 border border-black hover:bg-zinc-800 transition-all cursor-pointer neo-shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Live News</span>
            </button>
            <span className="text-black/40">/</span>
            <span className="bg-white px-2 py-0.5 border border-black">ABOUT &amp; EDITORIAL MISSION</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 bg-white px-2.5 py-1 text-xs font-black border border-black neo-shadow-sm hover:bg-[#00f0ff] transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-black" />
              <span>{copiedShare ? 'COPIED LINK!' : 'SHARE PAGE'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-10">

        {/* 2. Hero Gazette Masthead */}
        <div className="bg-white border-3 border-black p-6 sm:p-10 neo-shadow relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#ccff00] border-2 border-black rotate-12 opacity-40 pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-black text-[#ccff00] text-xs font-mono font-black px-2.5 py-1 uppercase border border-black">
                EST. 2026 • REAL-TIME JOURNALISM
              </span>
              <span className="bg-[#ff2a85] text-white text-xs font-black px-2.5 py-1 border border-black uppercase">
                AI SYNTHESIS &amp; OPEN WIRE
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-black leading-tight uppercase">
              The Architecture of Autonomous Journalism
            </h1>

            <p className="text-base sm:text-lg text-zinc-800 max-w-3xl leading-relaxed font-body">
              <strong>News Pulsar</strong> is an autonomous real-time news aggregation and journalistic synthesis platform. 
              We bridge classical broadsheet editorial rigor with modern distributed web scraping, neural language intelligence, 
              and verified source attribution.
            </p>
          </div>
        </div>

        {/* 3. Live Newsroom Stats Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#ccff00] border-2 border-black p-4 neo-shadow">
            <div className="flex items-center justify-between text-xs font-mono font-black uppercase text-black">
              <span>Indexed Articles</span>
              <Database className="w-4 h-4" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-black mt-2 font-neo">
              {totalArticles}+
            </div>
            <p className="text-[11px] font-bold text-zinc-800 mt-1">Live in persistent memory</p>
          </div>

          <div className="bg-[#00f0ff] border-2 border-black p-4 neo-shadow">
            <div className="flex items-center justify-between text-xs font-mono font-black uppercase text-black">
              <span>Monitored Feeds</span>
              <Globe className="w-4 h-4" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-black mt-2 font-neo">
              {activeSourcesCount}
            </div>
            <p className="text-[11px] font-bold text-zinc-800 mt-1">Global verified newsrooms</p>
          </div>

          <div className="bg-[#ff2a85] text-white border-2 border-black p-4 neo-shadow">
            <div className="flex items-center justify-between text-xs font-mono font-black uppercase">
              <span>Refresh Interval</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white mt-2 font-neo">
              10 MIN
            </div>
            <p className="text-[11px] font-bold text-white/90 mt-1">Continuous live polling</p>
          </div>

          <div className="bg-[#ffe600] border-2 border-black p-4 neo-shadow">
            <div className="flex items-center justify-between text-xs font-mono font-black uppercase text-black">
              <span>AI Pipeline</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-black mt-2 font-neo">
              GEMINI 3.7
            </div>
            <p className="text-[11px] font-bold text-zinc-800 mt-1">Flash NLP &amp; Taxonomy</p>
          </div>
        </div>

        {/* 4. Core Pillars of News Pulsar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
            <Layers className="w-5 h-5 text-black" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
              Our Core Journalistic &amp; Technical Pillars
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pillar 1 */}
            <div className="bg-white border-2 border-black p-5 neo-shadow space-y-3">
              <div className="w-10 h-10 bg-[#ccff00] border-2 border-black flex items-center justify-center neo-shadow-sm font-black text-lg">
                1
              </div>
              <h3 className="text-lg font-black uppercase text-black">
                Distributed Wire Ingestion
              </h3>
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-body">
                Our server-side crawler continuously interrogates RSS and XML endpoints from leading global publishers including Reuters, BBC, TechCrunch, Livemint, Hacker News, NPR, and NASA.
              </p>
              <ul className="text-xs space-y-1.5 text-zinc-800 font-bold pt-2 border-t border-zinc-200">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sub-second XML feed parser</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Robust cross-origin CORS fallbacks</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white border-2 border-black p-5 neo-shadow space-y-3">
              <div className="w-10 h-10 bg-[#00f0ff] border-2 border-black flex items-center justify-center neo-shadow-sm font-black text-lg">
                2
              </div>
              <h3 className="text-lg font-black uppercase text-black">
                Gemini AI Synthesis &amp; Auto-Tagging
              </h3>
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-body">
                Every story undergoes rapid semantic taxonomy extraction. The Gemini 3.7 Flash model extracts concise executive bullet points, SEO search queries, sentiment ratings, and topical hashtags.
              </p>
              <ul className="text-xs space-y-1.5 text-zinc-800 font-bold pt-2 border-t border-zinc-200">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Instant 3-bullet executive takeaways</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sentiment &amp; urgency classification</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white border-2 border-black p-5 neo-shadow space-y-3">
              <div className="w-10 h-10 bg-[#ff2a85] text-white border-2 border-black flex items-center justify-center neo-shadow-sm font-black text-lg">
                3
              </div>
              <h3 className="text-lg font-black uppercase text-black">
                Transparent Source Attribution
              </h3>
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-body">
                We believe in ethical news dissemination. Every excerpt clearly credits the original reporting outlet, provides direct canonical backlinks, and complies with Fair Use standards.
              </p>
              <ul className="text-xs space-y-1.5 text-zinc-800 font-bold pt-2 border-t border-zinc-200">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% direct canonical publisher links</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>No paywall circumvention or alteration</span>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* 5. Editorial Code of Ethics & Transparency */}
        <div className="bg-[#f0eae0] border-2 border-black p-6 sm:p-8 neo-shadow space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
            <ShieldCheck className="w-5 h-5 text-black" />
            <h2 className="text-xl font-black uppercase tracking-tight text-black">
              Editorial Standards &amp; Ethical Commitments
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <h4 className="font-black text-sm uppercase text-black flex items-center gap-1.5">
                <span className="w-2 h-2 bg-black" />
                Commitment to Factual Accuracy
              </h4>
              <p className="text-xs text-zinc-800 leading-relaxed font-body">
                News Pulsar only ingests feeds from vetted journalistic organizations, institutional science desks, and established trade periodicals. We do not index unverified social rumors or sensationalist clickbait.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-sm uppercase text-black flex items-center gap-1.5">
                <span className="w-2 h-2 bg-black" />
                AI Transparency &amp; Non-Distortion
              </h4>
              <p className="text-xs text-zinc-800 leading-relaxed font-body">
                AI models are strictly used for structured summaries, key takeaways, and indexing taxonomy. The engine is instructed never to hallucinate quotes or inject synthetic opinions into reporting.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-sm uppercase text-black flex items-center gap-1.5">
                <span className="w-2 h-2 bg-black" />
                Advertising &amp; Editorial Separation
              </h4>
              <p className="text-xs text-zinc-800 leading-relaxed font-body">
                Sponsored placements and Google AdSense units are strictly demarcated with high-visibility borders and labels. Advertisers possess zero influence over feed indexing or headline selection.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-sm uppercase text-black flex items-center gap-1.5">
                <span className="w-2 h-2 bg-black" />
                DMCA &amp; Content Removal Rights
              </h4>
              <p className="text-xs text-zinc-800 leading-relaxed font-body">
                Content owners and original publishers can manage feed inclusion or request metadata adjustments at any time via our direct contact desk (<code className="bg-white px-1 py-0.5 border border-black font-bold">fciuttarakhand@gmail.com</code>).
              </p>
            </div>
          </div>
        </div>

        {/* 6. Masthead & Engineering Guild */}
        <div className="bg-white border-2 border-black p-6 neo-shadow space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-black" />
              <h2 className="text-xl font-black uppercase tracking-tight text-black">
                Masthead &amp; Platform Operations
              </h2>
            </div>
            <span className="text-xs font-mono font-bold bg-[#ccff00] px-2 py-0.5 border border-black">
              GLOBAL DESK
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 border-2 border-black bg-[#faf7ee]">
              <div className="text-xs font-mono font-black text-[#ff2a85] uppercase">Publisher &amp; Editorial</div>
              <div className="text-base font-black text-black mt-1">News Pulsar Media Desk</div>
              <p className="text-xs text-zinc-700 mt-1">Directing syndication taxonomy and journalistic integrity.</p>
            </div>

            <div className="p-4 border-2 border-black bg-[#faf7ee]">
              <div className="text-xs font-mono font-black text-blue-700 uppercase">AI Systems &amp; Scraping</div>
              <div className="text-base font-black text-black mt-1">Neural Pipeline Team</div>
              <p className="text-xs text-zinc-700 mt-1">Overseeing RSS stream parsers and Gemini 3.7 Flash agents.</p>
            </div>

            <div className="p-4 border-2 border-black bg-[#faf7ee]">
              <div className="text-xs font-mono font-black text-emerald-800 uppercase">Governance &amp; Ads</div>
              <div className="text-base font-black text-black mt-1">Compliance Bureau</div>
              <p className="text-xs text-zinc-700 mt-1">Monitoring AdSense safety, GDPR policies, and /ads.txt validity.</p>
            </div>
          </div>
        </div>

        {/* 7. Quick Navigation Footer Banner */}
        <div className="bg-[#ffe600] border-2 border-black p-5 neo-shadow flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black uppercase text-black">Ready to explore more?</h3>
            <p className="text-xs font-bold text-black/80">Check our advertising guidelines or get in touch with our desk.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigatePage('advertise')}
              className="px-4 py-2 bg-white text-black font-black text-xs uppercase border-2 border-black neo-shadow-sm hover:bg-[#ccff00] transition-all cursor-pointer"
            >
              Advertise with Us →
            </button>
            <button
              onClick={() => onNavigatePage('contact')}
              className="px-4 py-2 bg-black text-white font-black text-xs uppercase border-2 border-black neo-shadow-sm hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Contact Desk →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
