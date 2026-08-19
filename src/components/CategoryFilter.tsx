import React from 'react';
import { NewsCategory, Language } from '../types';
import { CATEGORY_HINDI_MAP } from '../utils/hindiTranslator';
import { Globe, Cpu, Atom, Briefcase, Trophy, Film, HeartPulse, Sparkles } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: NewsCategory;
  onSelectCategory: (category: NewsCategory) => void;
  categoryCounts: Record<string, number>;
  language?: Language;
}

interface CategoryConfig {
  name: NewsCategory;
  labelEn: string;
  icon: React.ReactNode;
  activeColor: string;
  badgeColor: string;
  hoverColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  { 
    name: 'All', 
    labelEn: 'ALL STORIES', 
    icon: <Sparkles className="w-3.5 h-3.5" />,
    activeColor: 'bg-[#ccff00] text-black border-2 border-black neo-shadow-sm',
    badgeColor: 'bg-black text-[#ccff00]',
    hoverColor: 'hover:bg-[#ccff00]/40'
  },
  { 
    name: 'World', 
    labelEn: 'WORLD', 
    icon: <Globe className="w-3.5 h-3.5" />,
    activeColor: 'bg-[#00f0ff] text-black border-2 border-black neo-shadow-sm',
    badgeColor: 'bg-black text-[#00f0ff]',
    hoverColor: 'hover:bg-[#00f0ff]/40'
  },
  { 
    name: 'Technology', 
    labelEn: 'TECH & AI', 
    icon: <Cpu className="w-3.5 h-3.5" />,
    activeColor: 'bg-[#ff2a85] text-white border-2 border-black neo-shadow-sm',
    badgeColor: 'bg-black text-white',
    hoverColor: 'hover:bg-[#ff2a85]/40'
  },
  { 
    name: 'Science', 
    labelEn: 'SCIENCE', 
    icon: <Atom className="w-3.5 h-3.5" />,
    activeColor: 'bg-[#b800ff] text-white border-2 border-black neo-shadow-sm',
    badgeColor: 'bg-black text-white',
    hoverColor: 'hover:bg-[#b800ff]/40'
  },
  { 
    name: 'Business', 
    labelEn: 'BIZ & STOCKS', 
    icon: <Briefcase className="w-3.5 h-3.5" />,
    activeColor: 'bg-[#ffe600] text-black border-2 border-black neo-shadow-sm',
    badgeColor: 'bg-black text-[#ffe600]',
    hoverColor: 'hover:bg-[#ffe600]/40'
  },
  { 
    name: 'Sports', 
    labelEn: 'SPORTS', 
    icon: <Trophy className="w-3.5 h-3.5" />,
    activeColor: 'bg-[#00f5a0] text-black border-2 border-black neo-shadow-sm',
    badgeColor: 'bg-black text-[#00f5a0]',
    hoverColor: 'hover:bg-[#00f5a0]/40'
  },
  { 
    name: 'Entertainment', 
    labelEn: 'CULTURE', 
    icon: <Film className="w-3.5 h-3.5" />,
    activeColor: 'bg-[#ff5500] text-white border-2 border-black neo-shadow-sm',
    badgeColor: 'bg-black text-white',
    hoverColor: 'hover:bg-[#ff5500]/40'
  },
  { 
    name: 'Health', 
    labelEn: 'HEALTH', 
    icon: <HeartPulse className="w-3.5 h-3.5" />,
    activeColor: 'bg-[#00e5ff] text-black border-2 border-black neo-shadow-sm',
    badgeColor: 'bg-black text-[#00e5ff]',
    hoverColor: 'hover:bg-[#00e5ff]/40'
  },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  language = 'en',
}) => {
  const isHindi = language === 'hi';

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-none touch-pan-x touch-scrolling font-neo">
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat.name;
        const count = cat.name === 'All'
          ? Object.values(categoryCounts).reduce<number>((a, b) => a + Number(b), 0)
          : (categoryCounts[cat.name] || 0);

        const label = isHindi ? (CATEGORY_HINDI_MAP[cat.name] || cat.labelEn) : cat.labelEn;

        return (
          <button
            key={cat.name}
            onClick={() => onSelectCategory(cat.name)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-neo font-black whitespace-nowrap transition-all duration-150 border-2 border-black cursor-pointer min-h-[36px] active:translate-x-0.5 active:translate-y-0.5 touch-manipulation shrink-0 ${
              isSelected
                ? `${cat.activeColor}`
                : `bg-white text-black neo-shadow-sm ${cat.hoverColor}`
            }`}
          >
            <span className="shrink-0">{cat.icon}</span>
            <span>{label}</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] font-mono font-black border border-black ${
                isSelected ? cat.badgeColor : 'bg-[#faf7ee] text-black'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

