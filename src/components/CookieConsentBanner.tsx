import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, Check, X, Settings } from 'lucide-react';

interface CookieConsentBannerProps {
  onOpenPolicy: (tab: 'privacy' | 'terms' | 'adsense' | 'about') => void;
  onNavigatePage?: (page: 'privacy' | 'advertise') => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onOpenPolicy, onNavigatePage }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('newspulse_cookie_consent');
    if (!consent) {
      // Small delay for smooth entry
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('newspulse_cookie_consent', 'accepted_all');
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem('newspulse_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie & Privacy Consent"
      className="fixed bottom-0 inset-x-0 z-40 p-2.5 sm:p-4 animate-slideUp font-neo safe-bottom"
    >
      <div className="max-w-5xl mx-auto bg-white text-black border-[3px] border-black shadow-[6px_6px_0px_0px_#000] p-3.5 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 bg-[#ffe600] text-black border-2 border-black neo-shadow-sm shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-black">
                🍪 COOKIES & PRIVACY VIBE CHECK
              </h3>
              <span className="px-2 py-0.5 bg-[#ccff00] text-black border border-black text-[9px] font-mono font-black uppercase">
                GDPR / CCPA COMPLIANT
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-700 leading-relaxed font-body font-medium">
              News Pulsar and authorized partners (including <strong className="text-black font-black">Google AdSense</strong>) use cookies to keep the feed fresh, personalize content, and serve relevant ads. Check our{' '}
              <button
                onClick={() => onNavigatePage ? onNavigatePage('privacy') : onOpenPolicy('privacy')}
                className="text-black font-neo font-black underline hover:text-[#ff2a85] cursor-pointer"
              >
                Privacy Policy
              </button>{' '}
              and{' '}
              <button
                onClick={() => onNavigatePage ? onNavigatePage('advertise') : onOpenPolicy('adsense')}
                className="text-black font-neo font-black underline hover:text-[#ff2a85] cursor-pointer"
              >
                AdSense Info
              </button>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 shrink-0 w-full md:w-auto justify-end font-neo text-xs pt-1 md:pt-0">
          <button
            onClick={handleEssentialOnly}
            className="px-3 sm:px-4 py-2.5 sm:py-2 bg-white hover:bg-zinc-100 text-black border-2 border-black font-black uppercase tracking-wider transition-all cursor-pointer text-xs min-h-[40px] flex items-center justify-center neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5 touch-manipulation"
          >
            Essential Only
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-4 sm:px-5 py-2.5 sm:py-2 bg-[#ccff00] hover:bg-[#b8e600] text-black border-2 border-black font-black uppercase tracking-wider transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5 neo-shadow-hover min-h-[40px] touch-manipulation"
          >
            <Check className="w-4 h-4 text-black stroke-[3] shrink-0" />
            <span className="truncate">Accept All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
