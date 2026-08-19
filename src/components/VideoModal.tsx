import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Eye, 
  ThumbsUp, 
  Share2, 
  Tag, 
  ExternalLink, 
  Sparkles, 
  Check, 
  Clock, 
  Flame, 
  Bookmark, 
  BookmarkCheck,
  Radio,
  Tv
} from 'lucide-react';
import { ViralVideo, Language } from '../types';
import { likeViralVideo } from '../services/videoApi';

interface VideoModalProps {
  video: ViralVideo | null;
  onClose: () => void;
  onSelectVideo?: (video: ViralVideo) => void;
  relatedVideos?: ViralVideo[];
  language?: Language;
  onSelectTag?: (tag: string) => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  video,
  onClose,
  onSelectVideo,
  relatedVideos = [],
  language = 'en',
  onSelectTag,
}) => {
  const [likes, setLikes] = useState<number>(video?.likesCount || 0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!video) return null;

  const handleLike = async () => {
    if (hasLiked) return;
    setHasLiked(true);
    setLikes(prev => prev + 1);
    await likeViralVideo(video.id);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#videos?video=${encodeURIComponent(video.id)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`Watch "${video.title}" - Trending on NewsPulse Viral Wire:`);
    const url = encodeURIComponent(`${window.location.origin}/#videos?video=${encodeURIComponent(video.id)}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`🎬 Trending Viral Video: "${video.title}"\nWatch here: ${window.location.origin}/#videos?video=${encodeURIComponent(video.id)}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Structured Data for SEO / Schema.org
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.title,
    "description": video.description,
    "thumbnailUrl": [video.thumbnailUrl],
    "uploadDate": video.pubDate,
    "duration": `PT${video.duration.replace(':', 'M')}S`,
    "contentUrl": video.videoUrl,
    "embedUrl": video.embedUrl,
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": { "@type": "WatchAction" },
      "userInteractionCount": video.viewsCount
    },
    "keywords": video.tags.join(', ')
  };

  const isHindi = language === 'hi';
  const displayTitle = (isHindi && video.hindiTitle) ? video.hindiTitle : video.title;
  const displayDesc = (isHindi && video.hindiDescription) ? video.hindiDescription : video.description;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      {/* Invisible SEO Structured Data Tag */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div 
        className="bg-white border-4 border-black neo-shadow-lg w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden font-neo"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black text-white border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-[#ff2a85] text-white border border-white">
              <Tv className="w-4 h-4 animate-pulse" />
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black uppercase text-[#ccff00]">
                VIRAL VIDEO STREAM
              </span>
              <span className="hidden sm:inline-block text-zinc-400 text-xs">|</span>
              <span className="hidden sm:inline-block text-xs font-mono text-zinc-300">
                SCORE: {video.viralScore}/100 🔥
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 bg-white text-black hover:bg-[#ff2a85] hover:text-white border border-black transition-colors cursor-pointer"
            title="Close Player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
          
          {/* 1. Video Player Container */}
          <div className="relative w-full aspect-video bg-black border-2 border-black neo-shadow overflow-hidden group">
            {video.embedUrl && (video.embedUrl.includes('youtube') || video.embedUrl.includes('vimeo')) ? (
              <iframe
                src={video.embedUrl}
                title={video.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-all cursor-pointer"
                >
                  <div className="p-4 bg-[#ccff00] text-black border-2 border-black neo-shadow flex items-center gap-2 font-black text-sm hover:scale-105 transition-transform">
                    <Play className="w-5 h-5 fill-black" />
                    <span>WATCH ON ORIGINAL PLATFORM</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              </div>
            )}
          </div>

          {/* 2. Video Title & Meta Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 text-[10px] font-black uppercase border border-black ${
                video.platform === 'youtube' ? 'bg-[#ff0000] text-white' :
                video.platform === 'tiktok' ? 'bg-black text-[#00f0ff]' :
                video.platform === 'reddit' ? 'bg-[#ff4500] text-white' :
                video.platform === 'vimeo' ? 'bg-[#1ab7ea] text-white' :
                'bg-[#ccff00] text-black'
              }`}>
                {video.platform.toUpperCase()}
              </span>

              <span className="px-2 py-0.5 bg-[#faf7ee] text-black text-[10px] font-bold uppercase border border-black">
                {video.category}
              </span>

              <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-zinc-600">
                <Clock className="w-3 h-3" />
                {video.duration}
              </span>

              <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-zinc-600">
                <Eye className="w-3 h-3 text-black" />
                {video.viewsCount.toLocaleString()} {isHindi ? 'दृश्य' : 'views'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-tight">
              {displayTitle}
            </h1>

            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-600 font-mono font-bold">
              <span>{video.author || video.source}</span>
              <span>•</span>
              <time dateTime={video.pubDate}>
                {new Date(video.pubDate).toLocaleDateString(isHindi ? 'hi-IN' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </time>
            </div>
          </div>

          {/* 3. Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#faf7ee] border-2 border-black">
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className={`px-3 py-1.5 border-2 border-black font-neo font-black text-xs neo-shadow-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                  hasLiked ? 'bg-[#ff2a85] text-white' : 'bg-white hover:bg-zinc-100 text-black'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-white' : ''}`} />
                <span>{likes.toLocaleString()}</span>
              </button>

              <button
                onClick={() => setIsSaved(!isSaved)}
                className={`px-3 py-1.5 border-2 border-black font-neo font-black text-xs neo-shadow-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSaved ? 'bg-[#00f5a0] text-black' : 'bg-white hover:bg-zinc-100 text-black'
                }`}
              >
                {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{isSaved ? (isHindi ? 'सहेजा गया' : 'SAVED') : (isHindi ? 'सहेजें' : 'SAVE')}</span>
              </button>
            </div>

            {/* Social Share Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1.5 bg-white hover:bg-black hover:text-white border-2 border-black text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Copy Direct Video Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#008000]" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? (isHindi ? 'लिंक कॉपी हुआ' : 'COPIED') : (isHindi ? 'लिंक कॉपी' : 'COPY LINK')}</span>
              </button>

              <button
                onClick={shareToTwitter}
                className="px-2.5 py-1.5 bg-white hover:bg-[#1DA1F2] hover:text-white border-2 border-black text-xs font-mono font-bold transition-all cursor-pointer"
                title="Share on X / Twitter"
              >
                X / TWITTER
              </button>

              <button
                onClick={shareToWhatsApp}
                className="px-2.5 py-1.5 bg-white hover:bg-[#25D366] hover:text-white border-2 border-black text-xs font-mono font-bold transition-all cursor-pointer"
                title="Share on WhatsApp"
              >
                WHATSAPP
              </button>

              <a
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 bg-[#ccff00] hover:bg-[#b8e600] text-black border-2 border-black text-xs font-mono font-bold flex items-center gap-1 transition-all"
                title="Open Source Link"
              >
                <span>SOURCE</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 4. AI Viral Takeaway */}
          {video.aiTakeaway && (
            <div className="p-3 bg-[#e6ffe6] border-2 border-black neo-shadow-sm">
              <div className="flex items-center gap-1.5 font-bold text-xs text-[#008000] uppercase mb-1">
                <Sparkles className="w-4 h-4 text-[#008000]" />
                <span>{isHindi ? 'एआई वायरल विश्लेषण' : 'AI VIRAL TAKEAWAY & CONTEXT'}</span>
              </div>
              <p className="text-xs text-zinc-900 font-medium leading-relaxed">
                {video.aiTakeaway}
              </p>
            </div>
          )}

          {/* 5. Video Description */}
          <div className="space-y-2">
            <h3 className="font-black text-xs font-mono uppercase tracking-wider text-black">
              {isHindi ? 'विवरण' : 'VIDEO DESCRIPTION & METADATA'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed">
              {displayDesc}
            </p>
          </div>

          {/* 6. Tags Cloud */}
          {video.tags && video.tags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-xs font-mono font-black uppercase text-black">
                <Tag className="w-3.5 h-3.5" />
                <span>{isHindi ? 'ट्रेंडिंग टैग्स' : 'TRENDING VIDEO TAGS'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {video.tags.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (onSelectTag) onSelectTag(t);
                      onClose();
                    }}
                    className="px-2 py-0.5 bg-white hover:bg-[#ccff00] text-black text-xs font-mono font-bold border border-black neo-shadow-sm transition-colors cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 7. Related Viral Videos Reel */}
          {relatedVideos && relatedVideos.length > 0 && (
            <div className="border-t-2 border-black pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#ff2a85]" />
                <h3 className="font-black text-xs font-mono uppercase tracking-wider text-black">
                  {isHindi ? 'अधिक संबंधित वायरल वीडियो' : 'RELATED VIRAL CLIPS'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {relatedVideos.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectVideo && onSelectVideo(rel)}
                    className="border-2 border-black bg-white p-2 neo-shadow-sm hover:translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer group"
                  >
                    <div className="relative aspect-video bg-black overflow-hidden mb-1.5">
                      <img
                        src={rel.thumbnailUrl}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 text-white font-mono text-[9px] font-bold">
                        {rel.duration}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-black line-clamp-2 leading-snug group-hover:text-[#0055ff]">
                      {rel.title}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-1">
                      <span>{rel.platform.toUpperCase()}</span>
                      <span>{rel.viewsCount.toLocaleString()} views</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="px-4 py-2 bg-zinc-100 border-t-2 border-black flex items-center justify-between text-[11px] font-mono text-zinc-600">
          <span>ID: {video.id}</span>
          <span>SEO SLUG: /{video.slug}</span>
        </div>
      </div>
    </div>
  );
};
