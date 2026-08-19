import React from 'react';
import { NewsSourceInfo } from '../types';
import { Rss, Check } from 'lucide-react';

interface SourceFilterProps {
  sources: NewsSourceInfo[];
  selectedSource: string;
  onSelectSource: (sourceName: string) => void;
}

export const SourceFilter: React.FC<SourceFilterProps> = ({
  sources,
  selectedSource,
  onSelectSource,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
      <button
        onClick={() => onSelectSource('All')}
        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
          selectedSource === 'All'
            ? 'bg-slate-700 text-white font-semibold'
            : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`}
      >
        All Sources
      </button>

      {sources.map((s) => {
        const isSelected = selectedSource === s.name;
        return (
          <button
            key={s.id}
            onClick={() => onSelectSource(s.name)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all whitespace-nowrap border ${
              isSelected
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40 font-semibold'
                : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <Rss className="w-3 h-3 text-slate-500" />
            <span>{s.name}</span>
            {s.articleCount !== undefined && (
              <span className="text-[10px] text-slate-500 font-mono">({s.articleCount})</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
