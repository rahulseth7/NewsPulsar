import React from 'react';
import { Globe, Sparkles, Loader2 } from 'lucide-react';
import { Language } from '../types';

interface LanguageSwitcherProps {
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  isTranslating?: boolean;
  variant?: 'compact' | 'default' | 'badge';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  language,
  onToggleLanguage,
  isTranslating = false,
  variant = 'default',
  className = '',
}) => {
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 bg-white p-0.5 border border-black neo-shadow-sm ${className}`}>
        <button
          type="button"
          onClick={() => onToggleLanguage('en')}
          className={`px-2 py-0.5 text-[10px] font-mono font-black transition-all cursor-pointer ${
            language === 'en'
              ? 'bg-black text-[#ccff00]'
              : 'text-zinc-700 hover:text-black hover:bg-zinc-100'
          }`}
          title="Switch to English Feed"
          aria-label="English language"
          aria-pressed={language === 'en'}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => onToggleLanguage('hi')}
          className={`px-2 py-0.5 text-[10px] font-mono font-black transition-all cursor-pointer flex items-center gap-1 ${
            language === 'hi'
              ? 'bg-[#ff2a85] text-white'
              : 'text-zinc-700 hover:text-black hover:bg-zinc-100'
          }`}
          title="Switch to Hindi Feed (AI Rephrased)"
          aria-label="Hindi language with AI translation"
          aria-pressed={language === 'hi'}
        >
          <span>हिन्दी</span>
          {isTranslating && language === 'hi' && (
            <Loader2 className="w-2.5 h-2.5 animate-spin text-white" />
          )}
        </button>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <button
        type="button"
        onClick={() => onToggleLanguage(language === 'en' ? 'hi' : 'en')}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-neo font-black border-2 border-black neo-shadow-sm transition-all cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 ${
          language === 'hi'
            ? 'bg-[#ff2a85] text-white hover:bg-[#e01e74]'
            : 'bg-[#ccff00] text-black hover:bg-[#b8e600]'
        } ${className}`}
        title={`Current Language: ${language === 'en' ? 'English' : 'Hindi'}. Click to toggle.`}
        aria-label="Toggle language between English and Hindi"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{language === 'en' ? 'EN ⇄ हिन्दी' : 'हिन्दी ⇄ EN'}</span>
        {isTranslating && <Loader2 className="w-3 h-3 animate-spin" />}
      </button>
    );
  }

  // Default Standard Header Switcher
  return (
    <div
      className={`relative inline-flex items-center bg-white border-2 border-black neo-shadow-sm font-neo ${className}`}
      role="group"
      aria-label="Language selection"
    >
      {/* English Option */}
      <button
        type="button"
        onClick={() => onToggleLanguage('en')}
        className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-black transition-all cursor-pointer ${
          language === 'en'
            ? 'bg-black text-[#ccff00]'
            : 'text-black hover:bg-[#ffe600]'
        }`}
        title="View news feed in English"
        aria-pressed={language === 'en'}
      >
        <span className="font-mono font-bold">EN</span>
        <span className="hidden sm:inline text-[11px]">English</span>
      </button>

      {/* Divider */}
      <div className="w-[1.5px] h-4 bg-black/30" />

      {/* Hindi Option with AI Badge */}
      <button
        type="button"
        onClick={() => onToggleLanguage('hi')}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-black transition-all cursor-pointer ${
          language === 'hi'
            ? 'bg-[#ccff00] text-black'
            : 'text-black hover:bg-[#ffe600]'
        }`}
        title="View news feed in Hindi with AI rephrasing on the fly"
        aria-pressed={language === 'hi'}
      >
        <span className="font-bold">हिन्दी</span>
        <span className="hidden md:inline-flex items-center text-[9px] font-mono uppercase bg-black text-[#ccff00] px-1 py-0.2 border border-black">
          AI
        </span>
        {isTranslating && language === 'hi' ? (
          <Loader2 className="w-3 h-3 animate-spin text-black" />
        ) : (
          <Sparkles className={`w-3 h-3 ${language === 'hi' ? 'text-[#ff2a85]' : 'text-zinc-600'}`} />
        )}
      </button>

      {/* Active Indicator Tooltip / Sub-label for Hindi Mode */}
      {language === 'hi' && (
        <div className="absolute -bottom-5 right-0 whitespace-nowrap text-[9px] font-mono font-black text-black bg-[#ffe600] px-1.5 py-0.2 border border-black hidden xl:flex items-center gap-1">
          <span>⚡ AI हिन्दी अनुवाद सक्रिय</span>
        </div>
      )}
    </div>
  );
};
