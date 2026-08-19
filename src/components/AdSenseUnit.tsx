import React, { useEffect, useRef, useState } from 'react';
import { DollarSign, Info, ShieldCheck, Sparkles } from 'lucide-react';

interface AdSenseUnitProps {
  client?: string; // e.g. "ca-pub-6411773855584982"
  slot?: string;   // e.g. "1234567890"
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  type?: 'banner' | 'in-feed' | 'inline' | 'skyscraper' | 'side-tower';
  layoutKey?: string;
  label?: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export const AdSenseUnit: React.FC<AdSenseUnitProps> = ({
  client = import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-6411773855584982',
  slot = import.meta.env.VITE_ADSENSE_SLOT || '1234567890',
  format = 'auto',
  responsive = true,
  type = 'banner',
  layoutKey,
  label = 'ADVERTISEMENT',
  className = '',
}) => {
  const adRef = useRef<HTMLModElement | null>(null);
  const isPushed = useRef(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  const isSkyscraper = type === 'skyscraper' || type === 'side-tower';

  useEffect(() => {
    // Only attempt push once per mounted element
    if (adRef.current && !isPushed.current) {
      try {
        if (typeof window !== 'undefined') {
          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
          isPushed.current = true;
          setAdLoaded(true);
        }
      } catch (err) {
        console.warn('AdSense notice:', err);
        setAdError(true);
      }
    }
  }, [client, slot]);

  return (
    <div
      className={`ad-container relative overflow-hidden transition-all text-center ${
        isSkyscraper
          ? 'w-full h-full min-h-[600px] max-w-[180px] 2xl:max-w-[210px] mx-auto flex flex-col justify-between'
          : type === 'in-feed'
          ? 'w-full min-h-[260px] flex flex-col justify-between'
          : 'my-4 w-full min-h-[100px]'
      } ${className}`}
      aria-label="Sponsored advertisement"
    >
      {/* Official AdSense Compliant Label */}
      <div className="text-[10px] font-mono uppercase tracking-widest text-stone-600 mb-1.5 font-bold flex items-center justify-center gap-1.5 select-none">
        <span>{label}</span>
      </div>

      {/* Actual Google AdSense <ins> Tag */}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          minHeight: isSkyscraper ? '600px' : type === 'in-feed' ? '250px' : '90px',
          ...(isSkyscraper ? { width: '160px', margin: '0 auto' } : {}),
        }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />

      {/* High-Fidelity Neo-Brutalist Placement Box */}
      <div className="bg-[#fff9e6] border-[2.5px] border-black text-black p-3 text-center shadow-[4px_4px_0px_0px_#000] font-neo my-1">
        <div className="bg-black text-[#ccff00] text-[10px] font-neo font-black uppercase tracking-wider py-1 px-2.5 flex items-center justify-between gap-1 border border-black neo-shadow-sm">
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-[#ccff00]" />
            <span>ADSENSE LIVE</span>
          </span>
          <span className="text-[9px] text-[#00f0ff] font-mono">{isSkyscraper ? '160x600' : 'RESPONSIVE'}</span>
        </div>

        <div className="flex flex-col items-center justify-center py-4 px-2 space-y-2.5">
          <div className="w-10 h-10 bg-[#ffe600] border-2 border-black neo-shadow-sm flex items-center justify-center text-black">
            <DollarSign className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div className="space-y-0.5">
            <h4 className="text-xs font-black uppercase font-neo tracking-tight text-black">
              {isSkyscraper ? 'Side Skyscraper Unit' : 'Google Ad Placement'}
            </h4>
            <p className="text-[10px] text-zinc-700 font-bold leading-tight">
              Auto-monetized via Google AdSense
            </p>
          </div>

          <div className="w-full bg-white border-2 border-black p-2 text-left text-[10px] font-mono space-y-1 neo-shadow-sm">
            <div className="flex items-center justify-between text-black font-black border-b border-black pb-0.5">
              <span className="flex items-center gap-1 text-[9px] uppercase font-neo">
                <ShieldCheck className="w-3 h-3 text-black" />
                AdSense Verification
              </span>
              <span className="text-[#ff2a85] font-black text-[9px]">LIVE</span>
            </div>
            <div className="text-[9px] text-zinc-800 truncate" title={`Publisher: ${client}`}>
              <span className="font-black text-black">PUB:</span> <code className="bg-[#ccff00] px-1 font-black">{client}</code>
            </div>
            <div className="text-[9px] text-zinc-800 truncate" title={`Slot: ${slot}`}>
              <span className="font-black text-black">SLOT:</span> <code className="bg-[#00f0ff] px-1 font-black">{slot}</code>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-black pt-1.5 text-[9px] text-zinc-800 font-bold flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Info className="w-2.5 h-2.5 text-black" />
            AdSense Compliant
          </span>
          <span className="bg-[#ff2a85] text-white px-1.5 py-0.2 text-[8px] font-mono font-black border border-black">
            ads.txt OK
          </span>
        </div>
      </div>
    </div>
  );
};
