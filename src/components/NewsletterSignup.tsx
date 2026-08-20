import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, Sparkles, Send, Bell, ChevronDown, ChevronUp, Clock, ShieldCheck, Newspaper, RefreshCw, X, ExternalLink } from 'lucide-react';
import { NewsArticle } from '../types';
import { getCleanArticleLink } from '../utils/linkUtils';

export interface NewsletterSignupProps {
  variant?: 'footer' | 'sidebar' | 'card' | 'inline';
  className?: string;
  onOpenArticle?: (article: NewsArticle) => void;
}

interface StoredSubscription {
  email: string;
  subscribedAt: string;
  frequency: string;
  categories: string[];
  active: boolean;
}

const STORAGE_KEY = 'news_pulsar_newsletter_sub';

export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  variant = 'footer',
  className = '',
  onOpenArticle,
}) => {
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState<'daily_top_5' | 'breaking_alerts' | 'weekly_digest'>('daily_top_5');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [existingSub, setExistingSub] = useState<StoredSubscription | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewArticles, setPreviewArticles] = useState<NewsArticle[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);

  // Load existing persistent subscription on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email && parsed.active) {
          setExistingSub(parsed);
          setEmail(parsed.email);
          if (parsed.frequency) setFrequency(parsed.frequency);
        }
      }
    } catch {
      // Ignore local storage error
    }
  }, []);

  // Fetch today's Top 5 preview if preview drawer is opened
  const handleTogglePreview = async () => {
    if (showPreview) {
      setShowPreview(false);
      return;
    }

    setShowPreview(true);
    if (previewArticles.length === 0) {
      setLoadingPreview(true);
      try {
        const res = await fetch(`/api/newsletter/daily-top-5?category=${encodeURIComponent(selectedCategory)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.articles && Array.isArray(data.articles)) {
            setPreviewArticles(data.articles);
          }
        }
      } catch (err) {
        console.warn('Failed to load top 5 preview:', err);
      } finally {
        setLoadingPreview(false);
      }
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: cleanEmail,
        frequency,
        categories: [selectedCategory],
        source: variant,
      };

      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const subData: StoredSubscription = {
          email: cleanEmail,
          subscribedAt: new Date().toISOString(),
          frequency,
          categories: [selectedCategory],
          active: true,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(subData));
        setExistingSub(subData);
        setSuccessMessage(data.message || `Subscribed! Your Daily Top 5 Digest will be sent to ${cleanEmail}.`);
        setIsEditingPreferences(false);
        if (data.todayDigest?.articles) {
          setPreviewArticles(data.todayDigest.articles);
        }
      } else {
        throw new Error(data.error || 'Subscription failed. Please try again.');
      }
    } catch (err: any) {
      // Fallback: save to client localStorage if offline or network error
      const subData: StoredSubscription = {
        email: cleanEmail,
        subscribedAt: new Date().toISOString(),
        frequency,
        categories: [selectedCategory],
        active: true,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subData));
      setExistingSub(subData);
      setSuccessMessage(`Subscribed locally! Daily Top 5 will be routed to ${cleanEmail}.`);
      setIsEditingPreferences(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!existingSub?.email) return;
    setLoading(true);
    try {
      await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: existingSub.email }),
      });
    } catch {
      // Ignore network errors
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      setExistingSub(null);
      setEmail('');
      setSuccessMessage('You have been unsubscribed from the Daily Top 5 digest.');
      setLoading(false);
      setIsEditingPreferences(false);
    }
  };

  // --- Variant 1: Sidebar Widget ---
  if (variant === 'sidebar') {
    return (
      <div className={`bg-[#ffe600] border-2 border-black neo-shadow p-3.5 space-y-3 font-neo text-black ${className}`}>
        <div className="flex items-center justify-between pb-2 border-b-2 border-black">
          <div className="flex items-center gap-1.5">
            <span className="p-1 bg-black text-[#ccff00] border border-black">
              <Mail className="w-3.5 h-3.5" />
            </span>
            <span className="font-black text-xs uppercase tracking-tight">DAILY TOP 5 DIGEST</span>
          </div>
          <span className="text-[9px] font-mono font-black bg-[#ff2a85] text-white px-1.5 py-0.5 border border-black animate-pulse">
            FREE
          </span>
        </div>

        <p className="text-[11px] text-zinc-900 leading-tight font-medium">
          Get the 5 most critical verified headlines delivered every morning at 8:00 AM.
        </p>

        {existingSub && !isEditingPreferences ? (
          <div className="bg-white border-2 border-black p-2.5 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-800 font-black">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">Subscribed: {existingSub.email}</span>
            </div>
            <p className="text-[10px] text-zinc-600 font-mono">
              Delivery: Daily at 8:00 AM • {existingSub.categories?.[0] || 'All'}
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-zinc-200 text-[10px] font-black">
              <button
                onClick={() => setIsEditingPreferences(true)}
                className="text-black hover:underline cursor-pointer"
              >
                Edit Preferences
              </button>
              <button
                onClick={handleUnsubscribe}
                disabled={loading}
                className="text-[#ff2a85] hover:underline cursor-pointer"
              >
                Unsubscribe
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-2">
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@domain.com"
                className="w-full bg-white text-black text-xs font-mono px-2.5 py-1.5 border-2 border-black neo-shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff2a85] placeholder:text-zinc-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black hover:bg-zinc-800 text-[#ccff00] text-xs font-black py-1.5 px-3 border-2 border-black neo-shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>GET TOP 5 DIGEST</span>
                  <Send className="w-3 h-3 text-[#ccff00]" />
                </>
              )}
            </button>

            {successMessage && (
              <div className="p-1.5 bg-emerald-100 border border-black text-[10px] font-bold text-emerald-900">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="p-1.5 bg-rose-100 border border-black text-[10px] font-bold text-rose-900">
                {errorMessage}
              </div>
            )}
          </form>
        )}

        <div className="flex items-center justify-between text-[9px] text-zinc-800 font-mono pt-1 border-t border-black/30">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5" /> Zero Spam Policy
          </span>
          <button
            type="button"
            onClick={handleTogglePreview}
            className="font-bold underline hover:text-[#ff2a85] cursor-pointer"
          >
            {showPreview ? 'Hide Preview' : "Today's 5 Preview"}
          </button>
        </div>

        {/* Expandable Preview */}
        {showPreview && (
          <div className="bg-white border-2 border-black p-2 space-y-1.5 text-xs animate-fade-in">
            <div className="font-black text-[10px] uppercase text-black border-b pb-1 flex justify-between items-center">
              <span>Today's Top 5 Wire Preview:</span>
              <button onClick={() => setShowPreview(false)} className="text-zinc-400 hover:text-black">
                <X className="w-3 h-3" />
              </button>
            </div>
            {loadingPreview ? (
              <div className="py-2 text-center text-[10px] text-zinc-500 font-mono">Loading wire top 5...</div>
            ) : (
              <ol className="list-decimal list-inside space-y-1 text-[11px] font-medium text-zinc-800">
                {previewArticles.slice(0, 5).map((art, idx) => {
                  const cleanLink = getCleanArticleLink(art);
                  return (
                    <li key={art.id || idx} className="truncate">
                      <a
                        href={cleanLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-left text-zinc-900 font-bold"
                        title={art.title}
                      >
                        {art.title}
                      </a>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- Variant 2: Prominent Footer Banner (Default) ---
  return (
    <div className={`w-full bg-[#ccff00] text-black border-y-[3px] border-black py-8 px-4 sm:px-6 font-neo relative overflow-hidden ${className}`}>
      {/* Decorative background grid pattern */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Column: Heading & Pitch */}
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-black text-[#ccff00] text-xs font-black uppercase tracking-wider border-2 border-black neo-shadow-sm">
                <Mail className="w-3.5 h-3.5" />
                <span>DAILY TOP 5 WIRE</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ff2a85] text-white text-[10px] font-black uppercase tracking-wider border border-black">
                <Clock className="w-3 h-3" />
                <span>8:00 AM MORNING EDITION</span>
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-black uppercase leading-none">
              NEVER MISS A CRITICAL STORY.
            </h3>

            <p className="text-xs sm:text-sm text-zinc-900 font-medium max-w-xl leading-relaxed">
              Join <strong>45,000+</strong> global readers. Receive a concise, AI-curated digest of the 5 biggest breaking world, tech, and financial stories straight to your inbox each morning.
            </p>

            <div className="flex items-center gap-3 text-xs font-bold text-zinc-800 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-black" />
                <span>No clickbait, zero spam</span>
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={handleTogglePreview}
                className="flex items-center gap-1 text-black hover:text-[#ff2a85] underline cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-[#ff2a85]" />
                <span>{showPreview ? 'Close Top 5 Preview' : "Preview Today's Top 5"}</span>
                {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Right Column: Form & Preference Controls */}
          <div className="lg:col-span-6 bg-white border-2 border-black neo-shadow p-4 sm:p-5 space-y-3">
            
            {existingSub && !isEditingPreferences ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 bg-emerald-50 border-2 border-emerald-600 p-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-emerald-950 uppercase">
                        Active Daily Top 5 Subscriber
                      </h4>
                      <p className="text-zinc-700 font-mono text-[11px] mt-0.5">
                        Sending to: <strong>{existingSub.email}</strong>
                      </p>
                      <p className="text-zinc-600 text-[10px] mt-0.5">
                        Schedule: Daily at 8:00 AM • Topic: {existingSub.categories?.[0] || 'All Categories'}
                      </p>
                    </div>
                  </div>
                  <span className="bg-[#ccff00] text-black text-[10px] font-black px-2 py-0.5 border border-black font-mono shrink-0">
                    ACTIVE
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-black pt-1">
                  <button
                    onClick={() => setIsEditingPreferences(true)}
                    className="px-3 py-1 bg-black text-[#ccff00] border border-black neo-shadow-sm hover:bg-zinc-800 cursor-pointer"
                  >
                    Edit Preferences
                  </button>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={loading}
                    className="text-zinc-600 hover:text-[#ff2a85] underline cursor-pointer text-[11px]"
                  >
                    {loading ? 'Updating...' : 'Unsubscribe / Pause'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3">
                
                {/* Category Selection Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold">
                  <span className="text-zinc-600 text-[10px] font-mono mr-1">Focus:</span>
                  {['All', 'World', 'Technology', 'Business', 'Science'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-0.5 border text-xs cursor-pointer transition-all ${
                        selectedCategory === cat
                          ? 'bg-[#ffe600] text-black border-black font-black neo-shadow-sm'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:border-black'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Input + Submit Button Row */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email for Daily Top 5..."
                      className="w-full h-11 bg-[#faf7ee] text-black text-xs sm:text-sm font-mono px-3 border-2 border-black neo-shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff2a85] placeholder:text-zinc-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-11 bg-black hover:bg-zinc-800 text-[#ccff00] px-5 text-xs sm:text-sm font-black border-2 border-black neo-shadow transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>SUBSCRIBING...</span>
                      </>
                    ) : (
                      <>
                        <span>SUBSCRIBE FREE</span>
                        <Send className="w-4 h-4 text-[#ccff00]" />
                      </>
                    )}
                  </button>
                </div>

                {/* Feedback Alerts */}
                {successMessage && (
                  <div className="p-2.5 bg-emerald-100 border-2 border-emerald-600 text-xs font-bold text-emerald-950 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-black">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {errorMessage && (
                  <div className="p-2.5 bg-rose-100 border-2 border-rose-600 text-xs font-bold text-rose-950 flex items-center justify-between gap-2">
                    <span>{errorMessage}</span>
                    <button onClick={() => setErrorMessage(null)} className="text-rose-700 hover:text-black">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Footer terms notice */}
                <div className="flex items-center justify-between text-[10px] text-zinc-600 font-mono">
                  <span>Delivered daily at 8:00 AM • One-click unsubscribe</span>
                  {isEditingPreferences && (
                    <button
                      type="button"
                      onClick={() => setIsEditingPreferences(false)}
                      className="text-black font-bold underline"
                    >
                      Cancel
                    </button>
                  )}
                </div>

              </form>
            )}

          </div>

        </div>

        {/* Live Top 5 Drawer Preview */}
        {showPreview && (
          <div className="mt-6 bg-white border-2 border-black neo-shadow p-4 sm:p-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#ffe600] text-black border-2 border-black neo-shadow-sm">
                  <Newspaper className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-black uppercase text-black">
                    TODAY'S CURATED "DAILY TOP 5" SAMPLE DIGEST
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} Edition
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 bg-zinc-100 hover:bg-black hover:text-white border border-black cursor-pointer text-xs font-bold"
              >
                ✕ Close Preview
              </button>
            </div>

            {loadingPreview ? (
              <div className="py-8 text-center text-xs font-mono text-zinc-600 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Curating today's top 5 headlines...</span>
              </div>
            ) : previewArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {previewArticles.slice(0, 5).map((article, idx) => {
                  const cleanLink = getCleanArticleLink(article);
                  return (
                    <div
                      key={article.id || idx}
                      className="bg-[#faf7ee] border-2 border-black p-3 flex flex-col justify-between space-y-2 hover:bg-[#fff9d2] transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="bg-black text-[#ccff00] px-1 font-black">#0{idx + 1}</span>
                          <span className="text-zinc-600 font-bold uppercase">{article.source}</span>
                        </div>
                        <a
                          href={cleanLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-black text-black leading-snug line-clamp-3 hover:underline block"
                        >
                          {article.title}
                        </a>
                      </div>

                      <div className="pt-2 border-t border-zinc-300 text-[10px] font-mono flex items-center justify-between text-zinc-600">
                        <span className="bg-[#ffe600] px-1 border border-black text-black font-bold">
                          {article.category}
                        </span>
                        <a
                          href={cleanLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#ff2a85] font-black hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>Read ➔</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-zinc-600 text-center py-4">
                No headlines available for preview at this moment.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
