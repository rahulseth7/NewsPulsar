import React, { useState } from 'react';
import { NewsArticle } from '../types';
import { getCleanArticleLink } from '../utils/linkUtils';
import { 
  Share2, 
  Copy, 
  Check, 
  ExternalLink,
  MessageCircle,
  Linkedin,
  Send,
  Mail,
  Link2
} from 'lucide-react';

interface SocialShareProps {
  article: NewsArticle;
  variant?: 'compact' | 'card' | 'inline';
  className?: string;
}

export const SocialShare: React.FC<SocialShareProps> = ({
  article,
  variant = 'card',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const cleanLink = getCleanArticleLink(article);
  const shareTitle = article.aiSummary?.rephrasedTitle || article.title;
  const shareText = article.aiSummary?.rephrasedLead || article.description;

  const encodedUrl = encodeURIComponent(cleanLink);
  const encodedTitle = encodeURIComponent(shareTitle);
  const encodedText = encodeURIComponent(shareText);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0ARead%20more%3A%20${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(cleanLink);
      } else {
        // Fallback for older browsers / iframe security contexts
        const textArea = document.createElement('textarea');
        textArea.value = cleanLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setToastMessage('Link copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setToastMessage(null);
      }, 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: cleanLink,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // Compact Pill Variant (useful for quick inline toolbars)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 font-neo ${className}`}>
        {/* Twitter / X */}
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          title="Share to Twitter / X"
          aria-label="Share to Twitter"
          className="flex items-center justify-center p-2 bg-black text-white hover:bg-zinc-800 border-2 border-black neo-shadow-sm transition-all cursor-pointer min-w-[34px] min-h-[34px] active:translate-x-0.5 active:translate-y-0.5"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        {/* Facebook */}
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          title="Share to Facebook"
          aria-label="Share to Facebook"
          className="flex items-center justify-center p-2 bg-[#1877F2] text-white hover:bg-[#166fe5] border-2 border-black neo-shadow-sm transition-all cursor-pointer min-w-[34px] min-h-[34px] active:translate-x-0.5 active:translate-y-0.5"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </a>

        {/* Copy URL */}
        <button
          onClick={handleCopyLink}
          title={copied ? 'URL Copied!' : 'Copy article URL'}
          aria-label="Copy article URL"
          className={`flex items-center justify-center p-2 border-2 border-black transition-all cursor-pointer min-w-[34px] min-h-[34px] neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5 ${
            copied ? 'bg-[#00f5a0] text-black font-black' : 'bg-[#ffe600] text-black hover:bg-[#edd400]'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  // Full Card Variant (Featured Social Media Sharing Component)
  return (
    <div className={`bg-[#faf7ee] border-2 border-black p-5 sm:p-6 neo-shadow space-y-4 font-neo text-black ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-[#00f0ff] border border-black neo-shadow-sm">
            <Share2 className="w-4 h-4 text-black" />
          </span>
          <div>
            <h3 className="font-black text-sm uppercase tracking-wide text-black">
              SHARE THIS ARTICLE
            </h3>
            <p className="text-[11px] text-zinc-600 font-mono">
              Spread news across social networks or copy direct link
            </p>
          </div>
        </div>

        {/* Web Share API trigger if available */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#ccff00] text-black border-2 border-black text-xs font-black neo-shadow-sm cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
            title="System share sheet"
          >
            <Share2 className="w-3 h-3" />
            <span>DEVICE SHARE</span>
          </button>
        )}
      </div>

      {/* Social Media Sharing Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        
        {/* 1. Twitter / X */}
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-black text-white hover:bg-zinc-800 border-2 border-black text-xs font-black neo-shadow-sm transition-all cursor-pointer group active:translate-x-0.5 active:translate-y-0.5"
          title="Share to Twitter / X"
        >
          <svg className="w-4 h-4 fill-white group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>SHARE TO TWITTER</span>
        </a>

        {/* 2. Facebook */}
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1877F2] text-white hover:bg-[#166fe5] border-2 border-black text-xs font-black neo-shadow-sm transition-all cursor-pointer group active:translate-x-0.5 active:translate-y-0.5"
          title="Share to Facebook"
        >
          <svg className="w-4 h-4 fill-white group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>SHARE TO FACEBOOK</span>
        </a>

        {/* 3. Copy Link Action Button */}
        <button
          onClick={handleCopyLink}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-black border-2 border-black neo-shadow-sm transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5 ${
            copied
              ? 'bg-[#00f5a0] text-black'
              : 'bg-[#ccff00] text-black hover:bg-[#b8e600]'
          }`}
          title="Copy article URL to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 stroke-[3] shrink-0" />
              <span>COPIED TO CLIPBOARD!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 shrink-0" />
              <span>COPY URL</span>
            </>
          )}
        </button>
      </div>

      {/* Additional Quick Channels (WhatsApp, LinkedIn, Telegram, Email) */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 mr-1">
          MORE CHANNELS:
        </span>

        <a
          href={shareLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-[#25D366] hover:text-white text-zinc-800 text-[11px] font-bold border border-black neo-shadow-sm transition-all"
        >
          <MessageCircle className="w-3 h-3" />
          <span>WhatsApp</span>
        </a>

        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-[#0a66c2] hover:text-white text-zinc-800 text-[11px] font-bold border border-black neo-shadow-sm transition-all"
        >
          <Linkedin className="w-3 h-3" />
          <span>LinkedIn</span>
        </a>

        <a
          href={shareLinks.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-[#229ED9] hover:text-white text-zinc-800 text-[11px] font-bold border border-black neo-shadow-sm transition-all"
        >
          <Send className="w-3 h-3" />
          <span>Telegram</span>
        </a>

        <a
          href={shareLinks.email}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-[#ff2a85] hover:text-white text-zinc-800 text-[11px] font-bold border border-black neo-shadow-sm transition-all"
        >
          <Mail className="w-3 h-3" />
          <span>Email</span>
        </a>
      </div>

      {/* URL Input Box with Inline Copy */}
      <div className="pt-2 border-t border-black/20">
        <label className="block text-[10px] font-mono font-bold text-zinc-600 uppercase mb-1.5 flex items-center gap-1">
          <Link2 className="w-3 h-3 text-black" />
          <span>ARTICLE DIRECT URL</span>
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              readOnly
              value={cleanLink}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-mono text-black truncate select-all focus:outline-none focus:bg-yellow-50/50"
              aria-label="Direct article link"
            />
          </div>
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black border-2 border-black transition-all cursor-pointer shrink-0 neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5 ${
              copied
                ? 'bg-[#00f5a0] text-black'
                : 'bg-black text-[#ccff00] hover:bg-zinc-800'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Confirmation */}
      {toastMessage && (
        <div className="flex items-center gap-2 bg-[#00f5a0] text-black px-3 py-1.5 border border-black text-xs font-black animate-fade-in font-mono">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
