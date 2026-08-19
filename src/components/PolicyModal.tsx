import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  DollarSign, 
  Info, 
  Mail, 
  ExternalLink, 
  CheckCircle2, 
  Globe, 
  Lock 
} from 'lucide-react';

export type PolicyTab = 'privacy' | 'terms' | 'adsense' | 'about' | 'contact';

interface PolicyModalProps {
  isOpen: boolean;
  initialTab?: PolicyTab;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);

  // Sync initial tab when reopened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 w-full h-full min-h-screen bg-[#faf6ed] flex flex-col overflow-hidden font-serif animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-modal-title"
    >
      <div className="relative w-full h-full flex flex-col overflow-hidden text-stone-900 bg-[#faf6ed]">
        
        {/* Header Bar */}
        <div className="bg-[#e8e0d0] px-4 sm:px-8 py-3.5 sm:py-4 border-b-2 border-stone-900 flex items-center justify-between gap-4 shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-stone-100 hover:bg-stone-800 text-xs font-sans font-bold uppercase transition-all border border-stone-900 cursor-pointer"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-stone-900" />
              <div>
                <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-stone-600 block">
                  Official Compliance & Governance
                </span>
                <h2 id="policy-modal-title" className="text-base sm:text-xl font-black uppercase tracking-tight text-stone-950">
                  News Pulsar Legal & Policy Center
                </h2>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-stone-900 text-stone-100 hover:bg-stone-800 transition-all border border-stone-900 cursor-pointer"
            title="Close Policy Center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#f0eae0] px-4 sm:px-6 border-b-2 border-stone-900 flex items-center gap-1 sm:gap-2 pt-2 overflow-x-auto">
          {[
            { id: 'privacy', label: 'Privacy Policy', icon: Lock },
            { id: 'adsense', label: 'Google AdSense & Cookies', icon: DollarSign },
            { id: 'terms', label: 'Terms of Service', icon: FileText },
            { id: 'about', label: 'About & Editorial', icon: Info },
            { id: 'contact', label: 'Contact Us', icon: Mail },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PolicyTab)}
                className={`px-3 py-2 text-xs font-serif font-bold uppercase tracking-wider transition-all border-t-2 border-x-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#faf6ed] text-stone-950 border-stone-900 -mb-[2px] shadow-sm'
                    : 'bg-transparent text-stone-700 border-transparent hover:text-stone-950'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 text-stone-900 leading-relaxed">
          
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="border-b border-stone-300 pb-3">
                <h3 className="text-2xl font-black uppercase tracking-tight text-stone-950">
                  Privacy Policy
                </h3>
                <p className="text-xs text-stone-600 font-sans mt-1">
                  Last Updated: August 2026 • Compliant with GDPR, CCPA, and Google Publisher Policies
                </p>
              </div>

              <div className="space-y-4 text-sm font-sans">
                <section className="space-y-2">
                  <h4 className="font-serif font-bold text-base text-stone-950 uppercase">1. Introduction & Scope</h4>
                  <p className="text-stone-800">
                    Welcome to <strong>News Pulsar</strong> ("we", "our", or "us"). We are committed to protecting the privacy of our readers and visitors. This Privacy Policy explains how information is collected, used, and safeguarded when you visit our real-time news aggregation portal.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-serif font-bold text-base text-stone-950 uppercase">2. Information We Collect</h4>
                  <p className="text-stone-800">
                    When you access News Pulsar, certain non-personally identifiable information may be automatically recorded by our servers and authorized third-party vendors:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-stone-700">
                    <li><strong>Log Data & Diagnostics:</strong> IP address, browser type, operating system, referring URL, pages visited, and timestamp.</li>
                    <li><strong>Cookies & Web Beacons:</strong> Small data files stored on your device to remember user preferences (e.g., category selection, layout preferences, bookmarking).</li>
                    <li><strong>Analytics & Telemetry:</strong> Aggregated readership statistics and traffic patterns to optimize scraping frequency and server load.</li>
                  </ul>
                </section>

                <section className="space-y-2 bg-[#f0eae0] p-4 border border-stone-400">
                  <h4 className="font-serif font-bold text-base text-stone-950 uppercase flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-700" />
                    <span>3. Google AdSense & Third-Party Advertising (Critical Disclosure)</span>
                  </h4>
                  <p className="text-stone-800">
                    We use <strong>Google AdSense</strong> to monetize this website and display advertisements. In accordance with Google's policies:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-stone-700 text-xs">
                    <li>Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to News Pulsar or other websites.</li>
                    <li>Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our sites and/or other sites on the Internet.</li>
                    <li>Users may opt out of personalized advertising by visiting{' '}
                      <a 
                        href="https://adssettings.google.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-bold underline text-stone-950 hover:text-stone-700 inline-flex items-center gap-1"
                      >
                        Google Ads Settings <ExternalLink className="w-3 h-3" />
                      </a>.
                    </li>
                    <li>Alternatively, users can opt out of a third-party vendor's use of cookies for personalized advertising by visiting{' '}
                      <a 
                        href="https://www.aboutads.info/choices/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-bold underline text-stone-950 hover:text-stone-700 inline-flex items-center gap-1"
                      >
                        www.aboutads.info <ExternalLink className="w-3 h-3" />
                      </a>.
                    </li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="font-serif font-bold text-base text-stone-950 uppercase">4. GDPR (European Economic Area) & CCPA Rights</h4>
                  <p className="text-stone-800">
                    If you reside in the EEA, UK, or California, you have specific rights regarding your data, including the right to access, correct, delete, or restrict the processing of your personal data, as well as opting out of the sale or sharing of personal data for cross-context behavioral advertising.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-serif font-bold text-base text-stone-950 uppercase">5. Contact Our Data Protection Team</h4>
                  <p className="text-stone-800">
                    For inquiries regarding this policy or to exercise your privacy rights, please reach out directly to our editorial board at: <code className="bg-stone-200 px-1 py-0.5 font-bold">fciuttarakhand@gmail.com</code>.
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: ADSENSE & COOKIES */}
          {activeTab === 'adsense' && (
            <div className="space-y-6">
              <div className="border-b border-stone-300 pb-3">
                <h3 className="text-2xl font-black uppercase tracking-tight text-stone-950">
                  Google AdSense & Monetization Disclosures
                </h3>
                <p className="text-xs text-stone-600 font-sans mt-1">
                  Full transparency regarding publisher identity, ad units, and crawler compliance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#f0eae0] p-4 border-2 border-stone-900 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-stone-700 uppercase font-bold">
                    <span>Publisher Identity</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-800" />
                  </div>
                  <div className="text-sm font-mono font-bold text-stone-950 break-all">
                    ca-pub-6411773855584982
                  </div>
                  <p className="text-[11px] text-stone-600 font-sans">
                    Official authorized digital seller ID registered with Google AdSense.
                  </p>
                </div>

                <div className="bg-[#f0eae0] p-4 border-2 border-stone-900 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-stone-700 uppercase font-bold">
                    <span>Authorized Sellers File</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                  </div>
                  <div className="text-sm font-mono font-bold text-stone-950">
                    /ads.txt Status: ACTIVE & VERIFIED
                  </div>
                  <a
                    href="/ads.txt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-950 underline font-sans"
                    title="Open /ads.txt in separate window"
                  >
                    View raw /ads.txt file <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="space-y-4 text-sm font-sans">
                <section className="space-y-2">
                  <h4 className="font-serif font-bold text-base text-stone-950 uppercase">
                    Ad Placement & Editorial Separation Policy
                  </h4>
                  <p className="text-stone-800 leading-relaxed">
                    News Pulsar strictly adheres to the <strong>Google AdSense Program Policies</strong> and <strong>Better Ads Standards</strong>:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-stone-700">
                    <li><strong>Clear Ad Demarcation:</strong> All advertisement units are explicitly labeled with "ADVERTISEMENT" or "SPONSORED" to avoid confusion with journalistic content.</li>
                    <li><strong>No Deceptive Formatting:</strong> Ads are never placed under misleading headings, placed directly over interactive elements, or formatted to imitate organic news headlines.</li>
                    <li><strong>Content-Ad Ratio:</strong> Advertisements never overpower news stories. Main content remains the primary focus across desktop, tablet, and mobile views.</li>
                    <li><strong>Bot & Crawler Transparency:</strong> Search engine and AdSense crawlers (including <code>Mediapartners-Google</code>) are permitted via <code>/robots.txt</code> without obstruction.</li>
                  </ul>
                </section>

                <section className="space-y-2 bg-[#f0eae0] p-4 border border-stone-400">
                  <h4 className="font-serif font-bold text-sm text-stone-950 uppercase">
                    How to Manage Ad Personalization
                  </h4>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    You can manage how Google serves ads to you or disable personalized interest-based advertising entirely at any time by configuring your preferences at{' '}
                    <a 
                      href="https://myadcenter.google.com/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-bold underline text-stone-950"
                    >
                      Google My Ad Center
                    </a>.
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* TAB 3: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div className="border-b border-stone-300 pb-3">
                <h3 className="text-2xl font-black uppercase tracking-tight text-stone-950">
                  Terms of Service
                </h3>
                <p className="text-xs text-stone-600 font-sans mt-1">
                  Conditions governing use of the News Pulsar automated news aggregator.
                </p>
              </div>

              <div className="space-y-4 text-sm font-sans">
                <section className="space-y-2">
                  <h4 className="font-serif font-bold text-base text-stone-950 uppercase">1. News Aggregation & Attribution</h4>
                  <p className="text-stone-800 leading-relaxed">
                    News Pulsar aggregates headlines, excerpts, and publicly available RSS syndication feeds from esteemed publishers (BBC, TechCrunch, Hacker News, NPR, NASA, Reuters, etc.). All original reporting remains the exclusive intellectual property of the respective source publishers. We provide direct canonical links to every original story.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-serif font-bold text-base text-stone-950 uppercase">2. AI Summaries & Fair Use</h4>
                  <p className="text-stone-800 leading-relaxed">
                    Summaries and analytical bullet points generated by our Gemini AI engine are created for informational, indexing, and commentary purposes under Fair Use principles (17 U.S. Code § 107). Readers are encouraged to visit the original reporting publication for full text and multimedia.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-serif font-bold text-base text-stone-950 uppercase">3. Disclaimer of Warranties</h4>
                  <p className="text-stone-800 leading-relaxed">
                    News content is provided "as is" and "as available". While our scraping engine updates continuously every 10 minutes, News Pulsar makes no express warranties regarding the absolute completeness or real-time accuracy of third-party syndicated reports.
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* TAB 4: ABOUT & EDITORIAL */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="border-b border-stone-300 pb-3">
                <h3 className="text-2xl font-black uppercase tracking-tight text-stone-950">
                  About News Pulsar & Editorial Mission
                </h3>
                <p className="text-xs text-stone-600 font-sans mt-1">
                  The automated journalistic intelligence engine for global news readers.
                </p>
              </div>

              <div className="space-y-4 text-sm font-sans">
                <p className="text-stone-800 leading-relaxed">
                  <strong>News Pulsar</strong> is a modern news aggregation platform combining classical broadsheet editorial design with automated real-time web scraping and Gemini AI intelligence synthesis.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                  <div className="bg-[#f0eae0] p-3 border border-stone-800">
                    <h5 className="font-serif font-bold text-xs uppercase text-stone-950">10-Min Live Refresh</h5>
                    <p className="text-[11px] text-stone-700 mt-1">Continuous multi-source polling across global newsrooms.</p>
                  </div>
                  <div className="bg-[#f0eae0] p-3 border border-stone-800">
                    <h5 className="font-serif font-bold text-xs uppercase text-stone-950">AI Summarization</h5>
                    <p className="text-[11px] text-stone-700 mt-1">Instant key takeaway extractions powered by Gemini AI.</p>
                  </div>
                  <div className="bg-[#f0eae0] p-3 border border-stone-800">
                    <h5 className="font-serif font-bold text-xs uppercase text-stone-950">AdSense Verified</h5>
                    <p className="text-[11px] text-stone-700 mt-1">Full ads.txt and Google publisher policy compliance.</p>
                  </div>
                </div>

                <section className="space-y-2">
                  <h4 className="font-serif font-bold text-base text-stone-950 uppercase">Publisher & Contact Information</h4>
                  <p className="text-stone-800">
                    <strong>Site Operator:</strong> News Pulsar Media & Editorial Team<br />
                    <strong>Editorial Contact:</strong> <a href="mailto:fciuttarakhand@gmail.com" className="text-stone-950 underline font-bold">fciuttarakhand@gmail.com</a><br />
                    <strong>Platform:</strong> Google AI Studio Cloud Run Infrastructure
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* TAB 5: CONTACT US */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="border-b border-stone-300 pb-3">
                <h3 className="text-2xl font-black uppercase tracking-tight text-stone-950">
                  Contact News Pulsar Editorial Board
                </h3>
                <p className="text-xs text-stone-600 font-sans mt-1">
                  Get in touch for editorial corrections, advertising partnerships, or technical inquiries.
                </p>
              </div>

              <div className="bg-[#f0eae0] p-5 border-2 border-stone-900 space-y-4 font-sans">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-stone-900 text-amber-300 border border-stone-950">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-serif font-bold uppercase text-stone-950">
                      Official Contact Email
                    </h4>
                    <a
                      href="mailto:fciuttarakhand@gmail.com"
                      className="text-base font-bold font-mono text-stone-950 underline hover:text-stone-700"
                    >
                      fciuttarakhand@gmail.com
                    </a>
                  </div>
                </div>

                <div className="border-t border-stone-300 pt-3 text-xs text-stone-700 space-y-2">
                  <p><strong>Response Time:</strong> Inquiries are typically reviewed within 24–48 business hours.</p>
                  <p><strong>DMCA & Content Removal:</strong> If you are a copyright owner and wish to request removal or custom syndication parameters for your feed, please include the headline, source URL, and verified ownership proof in your email.</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="bg-[#e8e0d0] px-6 py-3 border-t-2 border-stone-900 flex items-center justify-between text-xs font-serif text-stone-700 uppercase">
          <span>AdSense Account: ca-pub-6411773855584982</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 text-stone-100 font-bold hover:bg-stone-800 cursor-pointer border border-stone-900"
          >
            Close Policy Center
          </button>
        </div>

      </div>
    </div>
  );
};
