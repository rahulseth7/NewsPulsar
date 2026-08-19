import React, { useState } from 'react';
import { 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  BarChart3, 
  Eye, 
  Target, 
  Layers, 
  Zap, 
  Download, 
  ExternalLink, 
  Send, 
  Sparkles, 
  TrendingUp, 
  Award,
  Globe
} from 'lucide-react';

interface AdvertisePageProps {
  onBackToNews: () => void;
  onNavigatePage: (page: 'about' | 'advertise' | 'contact' | 'privacy' | 'dashboard') => void;
}

export const AdvertisePage: React.FC<AdvertisePageProps> = ({
  onBackToNews,
  onNavigatePage
}) => {
  // Campaign Estimator State
  const [estimatedImpressions, setEstimatedImpressions] = useState<number>(50000);
  const [selectedFormat, setSelectedFormat] = useState<'billboard' | 'medium_rect' | 'skyscraper' | 'sponsored_post'>('billboard');
  const [targetCategory, setTargetCategory] = useState<string>('All');

  // Ad Inquiry Form State
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    website: '',
    budget: '$500 - $2,500',
    campaignGoals: 'Brand Awareness',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [inquiryId, setInquiryId] = useState<string>('');

  const cpmRates: Record<string, number> = {
    billboard: 4.5,
    medium_rect: 3.2,
    skyscraper: 2.8,
    sponsored_post: 6.0
  };

  const estimatedCost = Math.round((estimatedImpressions / 1000) * (cpmRates[selectedFormat] || 3.5));

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.email) return;

    const ref = 'AD-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    setInquiryId(ref);
    setSubmitted(true);
  };

  return (
    <div className="w-full bg-[#faf7ee] text-black font-neo pb-16 min-h-screen">
      {/* 1. Breadcrumb & Navigation Bar */}
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
            <span className="bg-white px-2 py-0.5 border border-black">ADVERTISING &amp; SPONSORSHIP</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/ads.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-white px-2.5 py-1 text-xs font-black border border-black neo-shadow-sm hover:bg-[#ccff00] transition-all"
            >
              <FileCheckIcon className="w-3.5 h-3.5 text-black" />
              <span>VIEW /ADS.TXT</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-10">

        {/* 2. Hero Headline Banner */}
        <div className="bg-white border-3 border-black p-6 sm:p-10 neo-shadow relative overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-full bg-[#ff2a85] opacity-10 pointer-events-none -skew-x-12" />

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-black text-[#ccff00] text-xs font-mono font-black px-2.5 py-1 uppercase border border-black flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                ADSENSE MONETIZED &amp; DIRECT SPONSORSHIP
              </span>
              <span className="bg-[#00f0ff] text-black text-xs font-black px-2.5 py-1 border border-black uppercase">
                HIGH-ENGAGEMENT TECH &amp; GLOBAL READERS
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-black leading-tight uppercase">
              Monetization, Ad Units &amp; Brand Partnerships
            </h1>

            <p className="text-base sm:text-lg text-zinc-800 max-w-3xl leading-relaxed font-body">
              Reach tech leaders, financial analysts, and global news followers. 
              News Pulsar offers Google AdSense integration, verified <code>/ads.txt</code> publisher certification, 
              and direct high-impact broadsheet display sponsorships.
            </p>
          </div>
        </div>

        {/* 3. Verified Publisher Credentials */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border-2 border-black p-4 neo-shadow space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-zinc-600">
              <span>Google Publisher ID</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-sm font-mono font-black text-black break-all bg-[#faf7ee] p-2 border border-black">
              ca-pub-6411773855584982
            </div>
            <p className="text-[11px] text-zinc-600 font-body">
              Officially registered Google AdSense publisher client identifier.
            </p>
          </div>

          <div className="bg-white border-2 border-black p-4 neo-shadow space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-zinc-600">
              <span>Authorized Seller Verification</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-sm font-mono font-black text-emerald-800 bg-[#ccff00]/40 p-2 border border-black">
              /ads.txt: ACTIVE &amp; VALIDATED
            </div>
            <p className="text-[11px] text-zinc-600 font-body">
              Conforms strictly to IAB Tech Lab Ads.txt v1.1 standards.
            </p>
          </div>

          <div className="bg-white border-2 border-black p-4 neo-shadow space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-zinc-600">
              <span>Better Ads Compliance</span>
              <Award className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-sm font-mono font-black text-black bg-[#faf7ee] p-2 border border-black">
              100% NON-INTRUSIVE UNITS
            </div>
            <p className="text-[11px] text-zinc-600 font-body">
              Zero auto-playing audio, zero pop-unders, zero obstructive interstitials.
            </p>
          </div>
        </div>

        {/* 4. Display Placement Matrix */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
            <Layers className="w-5 h-5 text-black" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
              Standard Display Units &amp; Placements
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Format 1 */}
            <div className="bg-white border-2 border-black p-5 neo-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="bg-[#ccff00] text-black font-mono text-xs font-black px-2 py-0.5 border border-black">
                  TOP BILLBOARD (728x90 / RESPONSIVE)
                </span>
                <span className="text-xs font-mono font-bold text-zinc-600">Above The Fold</span>
              </div>
              <h3 className="text-lg font-black uppercase text-black">
                Header Hero Sponsorship Unit
              </h3>
              <p className="text-xs sm:text-sm text-zinc-700 font-body leading-relaxed">
                Appears prominently in the header area immediately below the top masthead. Captures 100% viewability on every initial page load across desktop, tablet, and mobile.
              </p>
              <div className="bg-[#faf7ee] p-2.5 border border-black text-xs font-mono flex items-center justify-between">
                <span>Est. CTR: 0.8% – 1.6%</span>
                <span className="font-black bg-black text-[#ccff00] px-1.5 py-0.5">$4.50 CPM</span>
              </div>
            </div>

            {/* Format 2 */}
            <div className="bg-white border-2 border-black p-5 neo-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="bg-[#00f0ff] text-black font-mono text-xs font-black px-2 py-0.5 border border-black">
                  IN-FEED MEDIUM RECTANGLE (300x250)
                </span>
                <span className="text-xs font-mono font-bold text-zinc-600">Article Flow</span>
              </div>
              <h3 className="text-lg font-black uppercase text-black">
                Mid-Feed Breaking News Placement
              </h3>
              <p className="text-xs sm:text-sm text-zinc-700 font-body leading-relaxed">
                Interspersed naturally within the live article feed grid between stories. Blends seamlessly with high-engagement journalistic snippets and executive summaries.
              </p>
              <div className="bg-[#faf7ee] p-2.5 border border-black text-xs font-mono flex items-center justify-between">
                <span>Est. CTR: 1.2% – 2.4%</span>
                <span className="font-black bg-black text-[#00f0ff] px-1.5 py-0.5">$3.20 CPM</span>
              </div>
            </div>

            {/* Format 3 */}
            <div className="bg-white border-2 border-black p-5 neo-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="bg-[#ff2a85] text-white font-mono text-xs font-black px-2 py-0.5 border border-black">
                  STICKY SKYSCRAPER (160x600 / 300x600)
                </span>
                <span className="text-xs font-mono font-bold text-zinc-600">Sidebar Rail</span>
              </div>
              <h3 className="text-lg font-black uppercase text-black">
                Sidebar Half-Page Anchor
              </h3>
              <p className="text-xs sm:text-sm text-zinc-700 font-body leading-relaxed">
                Fixed position unit that travels gracefully as users scroll through extensive feeds and categories. Maximizes dwell time and message absorption.
              </p>
              <div className="bg-[#faf7ee] p-2.5 border border-black text-xs font-mono flex items-center justify-between">
                <span>Est. Dwell Time: 45s+</span>
                <span className="font-black bg-black text-[#ff2a85] px-1.5 py-0.5">$2.80 CPM</span>
              </div>
            </div>

            {/* Format 4 */}
            <div className="bg-white border-2 border-black p-5 neo-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="bg-[#ffe600] text-black font-mono text-xs font-black px-2 py-0.5 border border-black">
                  SPONSORED EDITORIAL WIRE (NATIVE)
                </span>
                <span className="text-xs font-mono font-bold text-zinc-600">Native Post</span>
              </div>
              <h3 className="text-lg font-black uppercase text-black">
                Verified Press Release Broadcast
              </h3>
              <p className="text-xs sm:text-sm text-zinc-700 font-body leading-relaxed">
                Includes full article modal view, AI auto-tagging, SEO keyword indexing, and direct outbound links with clear "SPONSORED" disclosure labeling.
              </p>
              <div className="bg-[#faf7ee] p-2.5 border border-black text-xs font-mono flex items-center justify-between">
                <span>Permanent Archive</span>
                <span className="font-black bg-black text-[#ffe600] px-1.5 py-0.5">$6.00 CPM</span>
              </div>
            </div>

          </div>
        </div>

        {/* 5. Interactive Campaign Estimator Calculator */}
        <div className="bg-[#e8e0d0] border-2 border-black p-6 sm:p-8 neo-shadow space-y-6">
          <div className="flex items-center justify-between pb-2 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-black" />
              <h2 className="text-xl font-black uppercase tracking-tight text-black">
                Interactive Campaign &amp; Reach Estimator
              </h2>
            </div>
            <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 border border-black">
              INSTANT ESTIMATOR
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 space-y-5">
              
              {/* Impressions Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold font-mono">
                  <span>Target Monthly Impressions:</span>
                  <span className="bg-black text-[#ccff00] px-2 py-0.5 text-sm">
                    {estimatedImpressions.toLocaleString()} views
                  </span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="500000"
                  step="5000"
                  value={estimatedImpressions}
                  onChange={(e) => setEstimatedImpressions(Number(e.target.value))}
                  className="w-full h-3 bg-white border-2 border-black appearance-none cursor-pointer accent-black"
                />
                <div className="flex justify-between text-[10px] font-mono text-zinc-600 font-bold">
                  <span>10,000</span>
                  <span>100,000</span>
                  <span>250,000</span>
                  <span>500,000+</span>
                </div>
              </div>

              {/* Format Radio Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase block">Select Target Placement Format:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'billboard', label: 'Billboard' },
                    { id: 'medium_rect', label: 'Mid-Feed' },
                    { id: 'skyscraper', label: 'Skyscraper' },
                    { id: 'sponsored_post', label: 'Sponsored Post' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFormat(f.id as any)}
                      className={`p-2 text-xs font-black uppercase border-2 border-black transition-all cursor-pointer text-center ${
                        selectedFormat === f.id
                          ? 'bg-black text-[#ccff00] neo-shadow-sm'
                          : 'bg-white text-black hover:bg-zinc-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase block">Audience Vertical Category:</label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full p-2 bg-white border-2 border-black text-xs font-bold uppercase"
                >
                  <option value="All">All Categories (Global Aggregate)</option>
                  <option value="Technology">Technology &amp; Artificial Intelligence</option>
                  <option value="Business">Business &amp; Financial Markets</option>
                  <option value="Science">Science &amp; Space Exploration</option>
                  <option value="World">World News &amp; Geopolitics</option>
                </select>
              </div>

            </div>

            {/* Calculated Quote Box */}
            <div className="bg-black text-white p-5 border-2 border-black neo-shadow space-y-4">
              <div className="text-xs font-mono font-black uppercase text-[#ccff00]">
                ESTIMATED INVESTMENT
              </div>
              <div className="text-4xl sm:text-5xl font-black font-neo text-white">
                ${estimatedCost}
                <span className="text-xs font-mono text-zinc-400 font-normal"> / mo</span>
              </div>
              <div className="text-xs text-zinc-300 space-y-1 font-mono pt-2 border-t border-zinc-700">
                <div>• Effective CPM: ${cpmRates[selectedFormat].toFixed(2)}</div>
                <div>• Target Format: {selectedFormat.toUpperCase()}</div>
                <div>• Category: {targetCategory.toUpperCase()}</div>
                <div>• Verified Publisher Billing</div>
              </div>
              <button
                onClick={() => {
                  const el = document.getElementById('ad-inquiry-form');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2.5 bg-[#ccff00] text-black font-black text-xs uppercase border-2 border-black neo-shadow-sm hover:bg-white transition-all cursor-pointer"
              >
                Lock In Rate &amp; Inquire →
              </button>
            </div>

          </div>
        </div>

        {/* 6. Direct Partnership & Sponsorship Form */}
        <div id="ad-inquiry-form" className="bg-white border-2 border-black p-6 sm:p-8 neo-shadow space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
            <Send className="w-5 h-5 text-black" />
            <h2 className="text-xl font-black uppercase tracking-tight text-black">
              Direct Advertising &amp; Sponsorship Inquiry
            </h2>
          </div>

          {submitted ? (
            <div className="bg-[#ccff00]/40 border-2 border-black p-6 space-y-3 text-center">
              <div className="w-12 h-12 bg-black text-[#ccff00] border-2 border-black mx-auto flex items-center justify-center neo-shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black uppercase text-black">
                Advertising Inquiry Received
              </h3>
              <p className="text-xs sm:text-sm text-zinc-800 max-w-md mx-auto font-body">
                Thank you! Your inquiry reference is <strong className="font-mono bg-white px-2 py-0.5 border border-black">{inquiryId}</strong>. 
                Our commercial desk will review your campaign criteria and follow up within 24 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-2 px-4 py-1.5 bg-black text-white text-xs font-black uppercase border border-black cursor-pointer hover:bg-zinc-800"
              >
                Send Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corp or Global Media Group"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full p-2.5 bg-[#faf7ee] border-2 border-black text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase">Contact Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full p-2.5 bg-[#faf7ee] border-2 border-black text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. jane@acme.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-[#faf7ee] border-2 border-black text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase">Website / Landing Page</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full p-2.5 bg-[#faf7ee] border-2 border-black text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase">Monthly Budget Target</label>
                  <select
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full p-2.5 bg-[#faf7ee] border-2 border-black text-xs font-bold"
                  >
                    <option value="$250 - $500">$250 - $500 (Starter Test)</option>
                    <option value="$500 - $2,500">$500 - $2,500 (Standard Growth)</option>
                    <option value="$2,500 - $10,000">$2,500 - $10,000 (Dominance Campaign)</option>
                    <option value="$10,000+">$10,000+ (Enterprise Exclusive)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase">Primary Objective</label>
                  <select
                    value={formData.campaignGoals}
                    onChange={(e) => setFormData({ ...formData, campaignGoals: e.target.value })}
                    className="w-full p-2.5 bg-[#faf7ee] border-2 border-black text-xs font-bold"
                  >
                    <option value="Brand Awareness">Brand Awareness &amp; Reach</option>
                    <option value="Product Launch">New Product Launch / Press Release</option>
                    <option value="Lead Generation">Direct Response / Lead Generation</option>
                    <option value="Event Promotion">Conference / Webinar Registration</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase">Campaign Details &amp; Preferred Dates</label>
                <textarea
                  rows={3}
                  placeholder="Describe your target dates, creative asset specifications, and campaign timeline..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-2.5 bg-[#faf7ee] border-2 border-black text-xs font-bold resize-none"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-[#ccff00] text-black font-black text-xs uppercase border-2 border-black neo-shadow-sm hover:bg-black hover:text-[#ccff00] transition-all cursor-pointer flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Advertising Inquiry</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

// Helper small icon
const FileCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="m9 15 2 2 4-4"/>
  </svg>
);
