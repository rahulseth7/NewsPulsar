import React from 'react';
import { X, Keyboard, RefreshCw, Search, Bookmark, Eye, ArrowLeft, ArrowRight, Sparkles, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Navigation' | 'Actions' | 'Article View' | 'Filters';
}

const SHORTCUT_LIST: ShortcutItem[] = [
  {
    keys: ['R'],
    description: 'Refresh live news feed from all sources',
    category: 'Actions',
  },
  {
    keys: ['Esc'],
    description: 'Close any open modal or clear search input',
    category: 'Navigation',
  },
  {
    keys: ['/'],
    description: 'Focus search bar instantly',
    category: 'Navigation',
  },
  {
    keys: ['B'],
    description: 'Toggle saved / bookmarked articles view',
    category: 'Filters',
  },
  {
    keys: ['G'],
    description: 'Toggle layout between Grid and Compact list',
    category: 'Actions',
  },
  {
    keys: ['1', '-', '8'],
    description: 'Quick switch news categories (All, Tech, World, etc.)',
    category: 'Filters',
  },
  {
    keys: ['J', '/', 'K'],
    description: 'Navigate to Next / Previous article in modal',
    category: 'Article View',
  },
  {
    keys: ['S'],
    description: 'Toggle share menu inside open article',
    category: 'Article View',
  },
  {
    keys: ['M'],
    description: 'Bookmark / save currently opened article',
    category: 'Article View',
  },
  {
    keys: ['?'],
    description: 'Open this keyboard shortcuts cheatsheet',
    category: 'Navigation',
  },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-neo"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-[#fffdfa] border-[3.5px] border-black shadow-[8px_8px_0px_0px_#000] flex flex-col overflow-hidden text-black max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#ccff00] p-4 sm:p-5 border-b-[3px] border-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black text-white border-2 border-black neo-shadow-sm">
              <Keyboard className="w-5 h-5 text-[#ccff00]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-black tracking-widest text-black/70 block">
                SPEED NAVIGATION ENGINE
              </span>
              <h2 id="shortcuts-modal-title" className="text-lg sm:text-xl font-display font-black tracking-tight uppercase">
                Keyboard Shortcuts
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white hover:bg-[#ff2a85] hover:text-white border-2 border-black font-black transition-all neo-shadow-sm cursor-pointer"
            aria-label="Close shortcuts modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#faf8f5]">
          <p className="text-xs sm:text-sm text-zinc-700 font-medium">
            Use these global hotkeys to navigate, refresh feeds, and inspect stories without touching your mouse:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SHORTCUT_LIST.map((sc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-white border-2 border-black neo-shadow-sm"
              >
                <span className="text-xs sm:text-sm font-bold text-zinc-900 pr-2">
                  {sc.description}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {sc.keys.map((k, kidx) => (
                    <kbd
                      key={kidx}
                      className="px-2 py-1 bg-black text-[#ccff00] font-mono font-black text-xs border border-black shadow-[2px_2px_0px_#000] rounded-sm min-w-[24px] text-center"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pro Tip Callout */}
          <div className="p-3 bg-[#fff9e6] border-2 border-black flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#ff5e00] shrink-0" />
            <div className="text-xs text-zinc-800">
              <span className="font-black font-mono">PRO TIP:</span> Shortcuts are disabled when typing inside search boxes or forms to prevent conflicts. Press <kbd className="px-1.5 py-0.5 bg-black text-white font-mono text-[10px] font-bold">Esc</kbd> anytime to return to navigation mode.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t-[2.5px] border-black bg-white flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
            Press <kbd className="font-bold text-black bg-zinc-200 px-1 border border-zinc-400 rounded">Esc</kbd> or <kbd className="font-bold text-black bg-zinc-200 px-1 border border-zinc-400 rounded">?</kbd> to toggle
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-[#00f0ff] hover:bg-[#00d8e6] text-black font-neo font-black text-xs border-2 border-black neo-shadow-sm cursor-pointer ml-auto"
          >
            Got It (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
