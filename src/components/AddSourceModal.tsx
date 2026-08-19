import React, { useState } from 'react';
import { NewsCategory } from '../types';
import { addCustomSource } from '../services/newsApi';
import { X, Plus, Rss, Search, Sparkles, Globe, Landmark, Zap } from 'lucide-react';

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSourceAdded: () => void;
}

const CATEGORIES: NewsCategory[] = ['World', 'Technology', 'Science', 'Business', 'Sports', 'Entertainment', 'Health'];

const POPULAR_PRESETS = [
  { name: 'The Guardian', category: 'World' as NewsCategory, feedUrl: 'https://www.theguardian.com/world/rss', tag: 'International' },
  { name: 'The New York Times', category: 'World' as NewsCategory, feedUrl: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', tag: 'International' },
  { name: 'CNN International', category: 'World' as NewsCategory, feedUrl: 'http://rss.cnn.com/rss/edition_world.rss', tag: 'International' },
  { name: 'DW News Germany', category: 'World' as NewsCategory, feedUrl: 'https://rss.dw.com/xml/rss-en-world', tag: 'International' },
  { name: 'France 24', category: 'World' as NewsCategory, feedUrl: 'https://www.france24.com/en/rss', tag: 'International' },
  { name: 'The Economic Times', category: 'Business' as NewsCategory, feedUrl: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', tag: 'India' },
  { name: 'Business Standard', category: 'Business' as NewsCategory, feedUrl: 'https://www.business-standard.com/rss/latest.rss', tag: 'India' },
  { name: 'The Indian Express', category: 'World' as NewsCategory, feedUrl: 'https://news.google.com/rss/search?q=site:indianexpress.com&hl=en-IN&gl=IN&ceid=IN:en', tag: 'India' },
  { name: 'ThePrint India', category: 'World' as NewsCategory, feedUrl: 'https://theprint.in/feed/', tag: 'India' },
  { name: 'Moneycontrol India', category: 'Business' as NewsCategory, feedUrl: 'https://www.moneycontrol.com/rss/latestnews.xml', tag: 'India' },
  { name: 'India Today', category: 'World' as NewsCategory, feedUrl: 'https://www.indiatoday.in/rss/1206514', tag: 'India' },
  { name: 'Financial Times', category: 'Business' as NewsCategory, feedUrl: 'https://news.google.com/rss/search?q=site:ft.com+markets+OR+world&hl=en-GB&gl=GB&ceid=GB:en', tag: 'International' },
];

export const AddSourceModal: React.FC<AddSourceModalProps> = ({
  isOpen,
  onClose,
  onSourceAdded,
}) => {
  const [tab, setTab] = useState<'url' | 'topic'>('topic');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<NewsCategory>('Technology');
  const [feedUrl, setFeedUrl] = useState('');
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Source name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await addCustomSource({
        name: name.trim(),
        category,
        feedUrl: tab === 'url' ? feedUrl.trim() : undefined,
        query: tab === 'topic' ? query.trim() : undefined,
      });

      if (res.success) {
        onSourceAdded();
        onClose();
        setName('');
        setFeedUrl('');
        setQuery('');
      } else {
        setError('Failed to add source.');
      }
    } catch (err: any) {
      setError(err.message || 'Error adding custom feed.');
    } finally {
      setSubmitting(false);
    }
  };

  const applyPreset = (preset: typeof POPULAR_PRESETS[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setFeedUrl(preset.feedUrl);
    setTab('url');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-neo animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#faf7ee] border-[3px] border-black shadow-[6px_6px_0px_0px_#000] overflow-hidden text-black max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b-[2.5px] border-black bg-[#ccff00] shrink-0">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-black stroke-[3]" />
            <h2 className="text-base font-black text-black uppercase tracking-wider">
              Add News Scraper Feed
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 border-2 border-black bg-white hover:bg-[#ffe600] text-black transition-all cursor-pointer neo-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Quick Presets for Prominent International & India News */}
          <div className="p-3.5 bg-white border-2 border-black neo-shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase text-black flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Quick-Add Prominent Outlets (International & India)
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-2.5 py-1 text-[11px] font-black border border-black bg-[#faf7ee] hover:bg-[#ffe600] text-black transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>{preset.name}</span>
                  <span className={`text-[9px] px-1 py-0.2 border border-black font-mono ${preset.tag === 'India' ? 'bg-[#00f5a0]' : 'bg-[#00f0ff]'}`}>
                    {preset.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex border-2 border-black bg-white p-1 gap-1 neo-shadow-sm">
            <button
              onClick={() => setTab('topic')}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent ${
                tab === 'topic' ? 'bg-[#00f0ff] border-black text-black neo-shadow-sm' : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Search Topic Scraper</span>
            </button>
            <button
              onClick={() => setTab('url')}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent ${
                tab === 'url' ? 'bg-[#ffe600] border-black text-black neo-shadow-sm' : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
            >
              <Rss className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Custom RSS / XML URL</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="p-3 bg-red-100 border-2 border-black text-red-700 text-xs font-black">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                Source Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Economist or Business Standard"
                className="w-full px-3 py-2 bg-white border-2 border-black text-sm text-black font-bold placeholder-zinc-400 focus:outline-hidden focus:bg-[#fffdf0]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NewsCategory)}
                className="w-full px-3 py-2 bg-white border-2 border-black text-sm text-black font-bold focus:outline-hidden focus:bg-[#fffdf0]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {tab === 'topic' ? (
              <div>
                <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                  Keyword or Topic Query
                </label>
                <input
                  type="text"
                  required
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. India Economy or Global Space Exploration"
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm text-black font-bold placeholder-zinc-400 focus:outline-hidden focus:bg-[#fffdf0]"
                />
                <p className="text-[11px] text-zinc-600 mt-1 font-mono">
                  The live scraper will auto-syndicate fresh Google News XML streams matching this keyword.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                  RSS / XML Feed URL
                </label>
                <input
                  type="url"
                  required
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  placeholder="https://example.com/rss.xml"
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm text-black font-bold placeholder-zinc-400 focus:outline-hidden focus:bg-[#fffdf0]"
                />
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white text-black text-xs font-black border-2 border-black hover:bg-zinc-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-[#ccff00] hover:bg-[#b8e600] text-black text-xs font-black border-2 border-black neo-shadow-sm cursor-pointer active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
              >
                {submitting ? 'Connecting Feed...' : '⚡ Connect Scraper Feed'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};
