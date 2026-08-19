import React from 'react';
import { NewsCategory, Language } from '../types';
import { CATEGORY_HINDI_MAP } from '../utils/hindiTranslator';
import { Globe, Cpu, Atom, Briefcase, Trophy, Film, HeartPulse, Sparkles, Check } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: NewsCategory;
  onSelectCategory: (category: NewsCategory) => void;
  categoryCounts: Record<string, number>;
  readCounts?: Record<string, number>;
  language?: Language;
}

interface CategoryConfig {
  name: NewsCategory;
  labelEn: string;
  icon: React.ReactNode;
  activeColor: string;
  badgeColor: string;
  hoverColor: string;
  progressColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  { 
    name: 'All', 
    labelEn: 'ALL STORIES', 
    icon: <Sparkles className="w-3.5 h-3.5" />,
    activeColor: 'bg-[#ccff00] text-black border-2 border-black neo-shadow-sm',
    badgeColor: 'bg-black text-[#ccff00]',
    hoverColor: 'hover:bg-[#ccff00]/40',
    progressColor: 'bg-[#ff2a85]'
  },
  { 
    name: 'World', 
    labelEn: 'WORLD', 
    icon: <Globe className="w-3.5 h-3.5" />,
    activeColor: 'bg-[#00f0ff] text-black border-2 border-black neo-shadow-sm',
    badgeColor: 'bg-black text-[#00f0ff]',
    hoverColor: 'hover:bg-[#00f0ff]/40',
    progressColor: 'bg-[#00f0ff]'
  },
  { 
    name: 'Technology', 
    labelEn: 'TECH & AI', 
    icon: <Cpu className="w-3.5 h-3.5" />,
    activeColor: 'bg-[#ff2a85] text-white border-2 border-black neo-shadow-sm',
    badgeColor: 'bg-black text-white',
    hoverColor: 'hover:bg-[#ff2a85]/40',
    progressColor: 'bg-[#ff2a85]'
  },
  { 
    name: 'Science', 
    labelEn: 'SCIENCE', 
    icon: <Atom className="w-3.5 h-3.5" />,
    activeColor: 'bg-[#b800ff] text-white border-2 border-black neo-shadow-sm',
    badgeColor: 'bg-black text-white',
    hoverColor: 'hover:bg-[#b800ff]/40',
    progressColor: 'bg-[#b800ff]'
  },
  { 
    name: 'Business', 
    labelEn: 'BIZ & STOCKS', 
    icon: <Briefcase className="w-3.5 h-3.5" />,
    activeColor: 'bg-[#ffe600] text-black border-2 border-black neo-shadow-sm',
    badgeColor: 'bg-black text-[#ffe600]',
    hoverColor: 'hover:bg-[#ffe600]/40',
    progressColor: 'bg-[#ffe600]'
  },
  { 
    name: 'Sports', 
    labelEn: 'SPORTS', 
    icon: <Trophy className="w-3.5 h-3.5" />,
    activeColor: 'bg-[#00f5a0] text-black border-2 border-black neo-shadow-sm',
    badgeColor: 'bg-black text-[#00f5a0]',
    hoverColor: 'hover:bg-[#00f5a0]/40',
    progressColor: 'bg-[#00f5a0]'
  },
  { 
    name: 'Entertainment', 
    labelEn: 'CULTURE', 
    icon: <Film className="w-3.5 h-3.5" />,
    activeColor: 'bg-[#ff5500] text-white border-2 border-black neo-shadow-sm',
    badgeColor: 'bg-black text-white',
    hoverColor: 'hover:bg-[#ff5500]/40',
    progressColor: 'bg-[#ff5500]'
  },
  { 
    name: 'Health', 
    labelEn: 'HEALTH', 
    icon: <HeartPulse className="w-3.5 h-3.5" />,
    activeColor: 'bg-[#00e5ff] text-black border-2 border-black neo-shadow-sm',
    badgeColor: 'bg-black text-[#00e5ff]',
    hoverColor: 'hover:bg-[#00e5ff]/40',
    progressColor: 'bg-[#00e5ff]'
  },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  readCounts = {},
  language = 'en',
}) => {
  const isHindi = language === 'hi';

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-none touch-pan-x touch-scrolling font-neo">
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat.name;
        const totalCount = cat.name === 'All'
          ? Object.values(categoryCounts).reduce<number>((a, b) => a + Number(b), 0)
          : (categoryCounts[cat.name] || 0);

        const readCount = cat.name === 'All'
          ? Object.values(readCounts).reduce<number>((a, b) => a + Number(b), 0)
          : (readCounts[cat.name] || 0);

        const progressPercent = totalCount > 0
          ? Math.min(100, Math.round((readCount / totalCount) * 100))
          : 0;

        const label = isHindi ? (CATEGORY_HINDI_MAP[cat.name] || cat.labelEn) : cat.labelEn;
        const tooltip = `${label}: ${readCount} read / ${totalCount} total (${progressPercent}% completed)`;

        return (
          <button
            key={cat.name}
            onClick={() => onSelectCategory(cat.name)}
            title={tooltip}
            aria-label={tooltip}
            className={`relative overflow-hidden flex flex-col justify-center px-3 pt-2 pb-2.5 text-xs font-neo font-black whitespace-nowrap transition-all duration-150 border-2 border-black cursor-pointer min-h-[38px] active:translate-x-0.5 active:translate-y-0.5 touch-manipulation shrink-0 ${
              isSelected
                ? `${cat.activeColor}`
                : `bg-white text-black neo-shadow-sm ${cat.hoverColor}`
            }`}
          >
            {/* Top row: Icon, Label, Seen Bubble & Total Count */}
            <div className="flex items-center gap-1.5">
              <span className="shrink-0">{cat.icon}</span>
              <span>{label}</span>

              {/* Read / Seen Count Bubble */}
              {readCount > 0 && (
                <span
                  title={`${readCount} articles read in session`}
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-mono font-black border border-black ${
                    isSelected
                      ? 'bg-white text-black'
                      : 'bg-[#ccff00] text-black'
                  }`}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  {readCount}
                </span>
              )}

              {/* Total Category Count Badge */}
              <span
                className={`px-1.5 py-0.2 text-[10px] font-mono font-black border border-black ${
                  isSelected ? cat.badgeColor : 'bg-[#faf7ee] text-black'
                }`}
              >
                {totalCount}
              </span>
            </div>

            {/* Bottom Visual Progress Bar */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 ${
                isSelected ? 'bg-black/25' : 'bg-zinc-200'
              }`}
            >
              <div
                className={`h-full transition-all duration-500 ease-out ${
                  isSelected ? 'bg-white' : cat.progressColor
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};


