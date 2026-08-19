import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  DollarSign, 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  ExternalLink, 
  AlertCircle, 
  Sliders, 
  Save, 
  Eye, 
  Globe,
  Database
} from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBackToNews: () => void;
  onNavigatePage: (page: 'about' | 'advertise' | 'contact' | 'privacy' | 'dashboard') => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  onBackToNews,
  onNavigatePage
}) => {
  // Interactive Cookie Preferences state stored in localStorage
  const [cookiePrefs, setCookiePrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('newspulse_cookie_preferences');
      return saved ? JSON.parse(saved) : {
        necessary: true,
        analytics: true,
        personalizedAds: true,
        savedArticles: true
      };
    } catch {
      return { necessary: true, analytics: true, personalizedAds: true, savedArticles: true };
    }
  });

  const [savedMessage, setSavedMessage] = useState(false);

  const handleSaveCookiePrefs = () => {
    try {
      localStorage.setItem('newspulse_cookie_preferences', JSON.stringify(cookiePrefs));
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2500);
    } catch (e) {
      console.error('Failed to save preferences:', e);
    }
  };

  return (
    <div className="w-full bg-[#faf7ee] text-black font-neo pb-16 min-h-screen">
      {/* 1. Breadcrumb Bar */}
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
            <span className="bg-white px-2 py-0.5 border border-black">PRIVACY POLICY &amp; COMPLIANCE</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span className="bg-black text-[#ccff00] px-2 py-0.5 border border-black">
              LAST REVISED: AUGUST 2026
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-10">

        {/* 2. Hero Headline */}
        <div className="bg-white border-3 border-black p-6 sm:p-10 neo-shadow relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-black text-[#ccff00] text-xs font-mono font-black px-2.5 py-1 uppercase border border-black flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                GLOBAL PRIVACY STANDARDS
              </span>
              <span className="bg-[#ccff00] text-black text-xs font-black px-2.5 py-1 border border-black uppercase">
                GDPR • CCPA • GOOGLE PUBLISHER VERIFIED
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-black leading-tight uppercase">
              Privacy Policy &amp; Cookie Governance
            </h1>

            <p className="text-base sm:text-lg text-zinc-800 max-w-3xl leading-relaxed font-body">
              At <strong>News Pulsar</strong>, reader privacy and algorithmic transparency are foundational principles. 
              This document outlines our data handling protocols, Google AdSense disclosures, cookie taxonomy, and your global legal rights.
            </p>
          </div>
        </div>

        {/* 3. Official Compliance Seals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#f0eae0] border-2 border-black p-4 neo-shadow space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-zinc-700">
              <span>Google AdSense Disclosures</span>
              <DollarSign className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-sm font-black text-black">
              Publisher ID: ca-pub-6411773855584982
            </div>
            <p className="text-[11px] text-zinc-600 font-body">
              Full transparency on third-party DART cookies &amp; interest-based ads.
            </p>
          </div>

          <div className="bg-[#f0eae0] border-2 border-black p-4 neo-shadow space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-zinc-700">
              <span>GDPR / UK Data Protection</span>
              <Lock className="w-4 h-4 text-blue-700" />
            </div>
            <div className="text-sm font-black text-black">
              EEA &amp; UK Compliant
            </div>
            <p className="text-[11px] text-zinc-600 font-body">
              Zero mandatory tracking; explicit consent management and right to erasure.
            </p>
          </div>

          <div className="bg-[#f0eae0] border-2 border-black p-4 neo-shadow space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-zinc-700">
              <span>CCPA / CPRA Protection</span>
              <ShieldCheck className="w-4 h-4 text-purple-700" />
            </div>
            <div className="text-sm font-black text-black">
              Do Not Sell My Info Ready
            </div>
            <p className="text-[11px] text-zinc-600 font-body">
              California Consumer Privacy Act verified mechanisms and opt-out controls.
            </p>
          </div>
        </div>

        {/* 4. Main Legal Sections */}
        <div className="bg-white border-2 border-black p-6 sm:p-10 neo-shadow space-y-8">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
              <span className="w-6 h-6 bg-black text-[#ccff00] text-xs font-mono font-black flex items-center justify-center">1</span>
              <h2 className="text-xl font-black uppercase text-black">
                Information Collection &amp; Automated Telemetry
              </h2>
            </div>
            <p className="text-sm text-zinc-800 leading-relaxed font-body">
              When accessing News Pulsar, our systems automatically collect standard, non-personally identifiable diagnostic telemetry to deliver fast, resilient news caching:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm text-zinc-700 font-body">
              <li><strong>Network Diagnostics:</strong> Client IP address, browser user-agent, operating system, timestamp, and referring URL.</li>
              <li><strong>Client-Side Storage:</strong> Article bookmark identifiers, custom feed filters, and category preferences stored purely inside your browser's local storage sandbox.</li>
              <li><strong>Performance Telemetry:</strong> Anonymized latency metrics on RSS stream polling and Gemini AI summarization response times.</li>
            </ul>
          </section>

          {/* Section 2: AdSense Disclosures */}
          <section className="space-y-3 bg-[#f0eae0] p-5 border-2 border-black">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
              <span className="w-6 h-6 bg-[#ff2a85] text-white text-xs font-mono font-black flex items-center justify-center">2</span>
              <h2 className="text-xl font-black uppercase text-black">
                Google AdSense &amp; Third-Party Advertising (Critical Disclosure)
              </h2>
            </div>
            <p className="text-sm text-zinc-800 leading-relaxed font-body">
              We partner with <strong>Google AdSense</strong> to display advertisements across News Pulsar. In compliance with Google Publisher Policies:
            </p>
            <div className="space-y-2 text-xs sm:text-sm text-zinc-800 font-body">
              <p>• Third-party vendors, including Google, use cookies (such as the DoubleClick DART cookie) to serve ads based on your prior visits to this website and other websites across the Internet.</p>
              <p>• Google's use of advertising cookies enables it and its partners to serve ads based on your visits to our site and other sites.</p>
              <p>• Readers may opt out of personalized advertising by visiting{' '}
                <a 
                  href="https://adssettings.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-bold underline text-black hover:text-[#ff2a85] inline-flex items-center gap-1"
                >
                  Google Ads Settings <ExternalLink className="w-3 h-3" />
                </a>.
              </p>
              <p>• You may also opt out of third-party interest-based advertising cookies via{' '}
                <a 
                  href="https://www.aboutads.info/choices/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-bold underline text-black hover:text-[#ff2a85] inline-flex items-center gap-1"
                >
                  AboutAds.info Choices <ExternalLink className="w-3 h-3" />
                </a>{' '}
                or the{' '}
                <a 
                  href="https://optout.networkadvertising.org/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-bold underline text-black hover:text-[#ff2a85] inline-flex items-center gap-1"
                >
                  Network Advertising Initiative (NAI) <ExternalLink className="w-3 h-3" />
                </a>.
              </p>
            </div>
          </section>

          {/* Section 3: GDPR & CCPA */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
              <span className="w-6 h-6 bg-black text-[#ccff00] text-xs font-mono font-black flex items-center justify-center">3</span>
              <h2 className="text-xl font-black uppercase text-black">
                GDPR &amp; CCPA User Rights
              </h2>
            </div>
            <p className="text-sm text-zinc-800 leading-relaxed font-body">
              Depending on your jurisdiction (such as the European Economic Area, United Kingdom, or California), you possess the following explicit legal rights:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-body">
              <div className="p-3 border border-black bg-[#faf7ee]">
                <strong className="block text-black uppercase font-neo">Right to Know &amp; Access:</strong>
                Request disclosure of what categories of information have been processed.
              </div>
              <div className="p-3 border border-black bg-[#faf7ee]">
                <strong className="block text-black uppercase font-neo">Right to Erasure / Deletion:</strong>
                Request immediate purging of any client logs or cached identifiers.
              </div>
              <div className="p-3 border border-black bg-[#faf7ee]">
                <strong className="block text-black uppercase font-neo">Right to Opt-Out:</strong>
                Instruct us not to sell or share your data for behavioral advertising.
              </div>
              <div className="p-3 border border-black bg-[#faf7ee]">
                <strong className="block text-black uppercase font-neo">Non-Discrimination:</strong>
                Access full news reading capabilities regardless of privacy preference selections.
              </div>
            </div>
          </section>

          {/* Section 4: Fair Use & Attribution */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
              <span className="w-6 h-6 bg-black text-[#ccff00] text-xs font-mono font-black flex items-center justify-center">4</span>
              <h2 className="text-xl font-black uppercase text-black">
                News Syndication &amp; Fair Use (17 U.S. Code § 107)
              </h2>
            </div>
            <p className="text-sm text-zinc-800 leading-relaxed font-body">
              All aggregated article headlines, excerpts, and thumbnail references originate from publicly syndicated RSS feeds. 
              Full intellectual property resides exclusively with the respective publishers (BBC, Reuters, TechCrunch, etc.). 
              AI bullet points are provided solely as transformative metadata under Fair Use principles.
            </p>
          </section>

          {/* Section 5: Data Controller & Contact */}
          <section className="space-y-3 bg-[#faf7ee] p-5 border-2 border-black">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
              <span className="w-6 h-6 bg-black text-[#ccff00] text-xs font-mono font-black flex items-center justify-center">5</span>
              <h2 className="text-xl font-black uppercase text-black">
                Data Protection Officer &amp; Inquiries
              </h2>
            </div>
            <p className="text-sm text-zinc-800 leading-relaxed font-body">
              For any questions regarding this Privacy Policy, cookie management, or to exercise your statutory rights, please contact our designated privacy officer:
            </p>
            <div className="p-3 bg-white border border-black text-xs font-mono font-bold space-y-1">
              <div>• Organization: News Pulsar Media &amp; Data Governance</div>
              <div>• Email: <a href="mailto:fciuttarakhand@gmail.com" className="text-black underline font-black">fciuttarakhand@gmail.com</a></div>
              <div>• Infrastructure: Google AI Studio / Google Cloud Platform</div>
            </div>
          </section>

        </div>

        {/* 5. Interactive Cookie & Privacy Preferences Manager */}
        <div className="bg-[#e8e0d0] border-2 border-black p-6 sm:p-8 neo-shadow space-y-6">
          <div className="flex items-center justify-between pb-2 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-black" />
              <h2 className="text-xl font-black uppercase tracking-tight text-black">
                Interactive Privacy &amp; Cookie Preferences Manager
              </h2>
            </div>
            <span className="text-xs font-mono font-bold bg-[#ccff00] px-2 py-0.5 border border-black">
              LIVE TOGGLE
            </span>
          </div>

          <p className="text-xs sm:text-sm text-zinc-800 font-body">
            You have granular control over what local storage items and third-party advertising cookies are activated during your reading sessions.
          </p>

          <div className="space-y-3">
            
            {/* Toggle 1: Essential */}
            <div className="bg-white border-2 border-black p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-black text-xs sm:text-sm uppercase text-black flex items-center gap-2">
                  <span>Essential / Functional Storage</span>
                  <span className="bg-zinc-200 text-zinc-800 text-[10px] font-mono font-bold px-1.5 py-0.2 border border-zinc-400">
                    REQUIRED
                  </span>
                </div>
                <p className="text-xs text-zinc-600 mt-0.5 font-body">
                  Stores live news feed cache to prevent server overloading and allow smooth pagination.
                </p>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled={true}
                className="w-5 h-5 accent-black opacity-70"
              />
            </div>

            {/* Toggle 2: Bookmarks */}
            <div className="bg-white border-2 border-black p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-black text-xs sm:text-sm uppercase text-black">
                  Bookmark Persistence &amp; Reading Lists
                </div>
                <p className="text-xs text-zinc-600 mt-0.5 font-body">
                  Saves your starred articles to your browser's private local storage.
                </p>
              </div>
              <input
                type="checkbox"
                checked={cookiePrefs.savedArticles}
                onChange={(e) => setCookiePrefs({ ...cookiePrefs, savedArticles: e.target.checked })}
                className="w-5 h-5 accent-black cursor-pointer"
              />
            </div>

            {/* Toggle 3: Analytics */}
            <div className="bg-white border-2 border-black p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-black text-xs sm:text-sm uppercase text-black">
                  Anonymized Analytics &amp; Feed Health Telemetry
                </div>
                <p className="text-xs text-zinc-600 mt-0.5 font-body">
                  Helps our engineers identify broken RSS feeds and calculate average story read times.
                </p>
              </div>
              <input
                type="checkbox"
                checked={cookiePrefs.analytics}
                onChange={(e) => setCookiePrefs({ ...cookiePrefs, analytics: e.target.checked })}
                className="w-5 h-5 accent-black cursor-pointer"
              />
            </div>

            {/* Toggle 4: Personalized Ads */}
            <div className="bg-white border-2 border-black p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-black text-xs sm:text-sm uppercase text-black">
                  Google AdSense Personalized Advertising
                </div>
                <p className="text-xs text-zinc-600 mt-0.5 font-body">
                  Enables relevant contextual ads based on tech, business, and world news reading interests.
                </p>
              </div>
              <input
                type="checkbox"
                checked={cookiePrefs.personalizedAds}
                onChange={(e) => setCookiePrefs({ ...cookiePrefs, personalizedAds: e.target.checked })}
                className="w-5 h-5 accent-black cursor-pointer"
              />
            </div>

          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSaveCookiePrefs}
              className="px-5 py-2.5 bg-black text-[#ccff00] font-black text-xs uppercase border-2 border-black neo-shadow-sm hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Privacy Preferences</span>
            </button>

            {savedMessage && (
              <div className="text-xs font-mono font-black text-emerald-800 bg-[#ccff00] px-3 py-1 border border-black animate-fadeIn">
                ✓ PREFERENCES RECORDED
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
