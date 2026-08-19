import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Tag, 
  Check, 
  Plus, 
  Layers, 
  FileText, 
  HelpCircle, 
  Zap, 
  CheckCircle2, 
  Loader2,
  Compass,
  Search
} from 'lucide-react';
import { NewsArticle, AutoTagSuggestion, NewsCategory } from '../types';

interface AutoTagInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: NewsArticle | null;
  suggestion: AutoTagSuggestion | null;
  isLoading: boolean;
  onApplyTags: (articleId: string, selectedTags: string[]) => Promise<void>;
}

export const AutoTagInspectorModal: React.FC<AutoTagInspectorModalProps> = ({
  isOpen,
  onClose,
  article,
  suggestion,
  isLoading,
  onApplyTags
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [isApplying, setIsApplying] = useState<boolean>(false);

  // Sync suggested tags when suggestion changes
  useEffect(() => {
    if (suggestion && suggestion.tags) {
      setSelectedTags([...suggestion.tags]);
    } else if (article?.tags) {
      setSelectedTags([...article.tags]);
    }
  }, [suggestion, article]);

  if (!isOpen || !article) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customTagInput.trim();
    if (!clean) return;
    const formatted = clean.startsWith('#') ? clean : `#${clean.replace(/\s+/g, '')}`;
    if (!selectedTags.includes(formatted)) {
      setSelectedTags(prev => [...prev, formatted]);
    }
    setCustomTagInput('');
  };

  const handleConfirmApply = async () => {
    setIsApplying(true);
    try {
      await onApplyTags(article.id, selectedTags);
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  const bodySnippet = article.aiSummary?.rephrasedStory || article.description || article.contentSnippet || 'No body text available.';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-stone-950/80 backdrop-blur-sm animate-fadeIn font-serif">
      <div className="relative w-full max-w-2xl bg-[#faf6ed] text-stone-900 border-4 border-stone-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#e8e0d0] px-5 py-3.5 border-b-2 border-stone-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-stone-900 text-stone-100 border border-stone-900">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-stone-950 flex items-center gap-2">
                <span>AI Auto-Tagging Inspector</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-200 text-amber-950 border border-amber-800 font-bold uppercase">
                  {suggestion?.isAiGenerated ? 'Gemini 3.7 Flash Engine' : 'NLP Semantic Extractor'}
                </span>
              </h2>
              <p className="text-[11px] font-sans text-stone-600">
                Body text semantic analysis &amp; taxonomic classification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-stone-900 text-stone-100 hover:bg-stone-800 transition-all border border-stone-900 cursor-pointer"
            title="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          
          {/* Article Context Box */}
          <div className="bg-[#f0eae0] p-3.5 border border-stone-800 space-y-2">
            <div className="flex items-center gap-2 font-sans text-[11px] text-stone-600">
              <span className="font-bold px-1.5 py-0.5 bg-stone-900 text-stone-100 uppercase text-[10px]">
                {article.category}
              </span>
              <span>•</span>
              <span className="font-bold text-stone-800">{article.source}</span>
              <span>•</span>
              <span>{new Date(article.pubDate).toLocaleDateString()}</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-stone-950 leading-snug">
              {article.title}
            </h3>
            <div className="bg-[#faf6ed] p-2.5 border border-stone-300 text-stone-700 font-serif text-xs leading-relaxed max-h-28 overflow-y-auto">
              <span className="font-sans font-bold text-[10px] uppercase text-stone-500 block mb-1">
                Analyzed Body Text Excerpt:
              </span>
              {bodySnippet}
            </div>
          </div>

          {/* Loading Spinner */}
          {isLoading && (
            <div className="p-8 text-center space-y-3 bg-[#f0eae0] border border-stone-800">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-900" />
              <p className="text-sm font-bold uppercase tracking-wider text-stone-900">
                Analyzing Article Body Text &amp; Generating Suggested Tags...
              </p>
              <p className="text-xs font-sans text-stone-600">
                Extracting named entities, topical salience, and taxonomy keywords with Gemini AI
              </p>
            </div>
          )}

          {/* AI Suggestions Results */}
          {!isLoading && suggestion && (
            <div className="space-y-4">
              
              {/* Rationale / Explanation Box */}
              {suggestion.explanation && (
                <div className="p-3 bg-amber-50/80 border border-amber-400/80 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-sans font-bold text-[10px] uppercase text-amber-900 tracking-wider">
                      AI Editorial Rationale
                    </span>
                    <p className="text-xs font-sans text-stone-800 leading-relaxed">
                      {suggestion.explanation}
                    </p>
                  </div>
                </div>
              )}

              {/* Tag Selection Matrix */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-950 uppercase tracking-wider text-[11px] font-sans flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Suggested Topic Tags ({selectedTags.length} selected)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTags(suggestion.tags || [])}
                      className="text-[10px] font-sans font-bold text-stone-600 hover:text-stone-950 underline cursor-pointer"
                    >
                      Select All AI Tags
                    </button>
                    <span>|</span>
                    <button
                      onClick={() => setSelectedTags([])}
                      className="text-[10px] font-sans font-bold text-stone-600 hover:text-stone-950 underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 p-3 bg-[#f0eae0] border border-stone-800">
                  {(suggestion.tags || []).map((t) => {
                    const isSelected = selectedTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTag(t)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-stone-900 text-stone-100 border-stone-900 shadow-sm'
                            : 'bg-[#faf6ed] text-stone-600 border-stone-400 hover:border-stone-800'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-none flex items-center justify-center border ${isSelected ? 'bg-amber-400 border-amber-400 text-stone-950' : 'border-stone-400'}`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{t}</span>
                      </button>
                    );
                  })}

                  {/* Any custom selected tags not originally in AI suggestion */}
                  {selectedTags.filter(t => !suggestion.tags?.includes(t)).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold border bg-stone-900 text-stone-100 border-stone-900 shadow-sm cursor-pointer"
                    >
                      <div className="w-3.5 h-3.5 flex items-center justify-center bg-amber-400 text-stone-950 border border-amber-400">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span>{t}</span>
                      <span className="text-[10px] text-amber-300 ml-1">(Custom)</span>
                    </button>
                  ))}
                </div>

                {/* Add Custom Tag Inline Form */}
                <form onSubmit={handleAddCustomTag} className="flex items-center gap-2 pt-1 font-sans">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    placeholder="Add additional custom tag (e.g. #Geopolitics)..."
                    className="flex-1 px-3 py-1.5 bg-[#faf6ed] border border-stone-800 text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-stone-100 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tag</span>
                  </button>
                </form>
              </div>

              {/* Inferred SEO Keywords & Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                
                {/* SEO Keywords */}
                <div className="p-3 bg-[#f0eae0] border border-stone-800 space-y-1.5">
                  <span className="font-sans font-bold text-[10px] uppercase text-stone-600 block flex items-center gap-1">
                    <Search className="w-3 h-3" />
                    Extracted SEO Keywords
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(suggestion.seoKeywords || []).map((kw, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-[#faf6ed] border border-stone-300 font-sans text-[11px] text-stone-800">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Inferred Sentiment & Category */}
                <div className="p-3 bg-[#f0eae0] border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-[10px] uppercase text-stone-600">
                      Recommended Category:
                    </span>
                    <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 bg-stone-900 text-stone-100 uppercase">
                      {suggestion.suggestedCategory || article.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-[10px] uppercase text-stone-600">
                      Topical Sentiment:
                    </span>
                    <span className="font-sans font-bold text-[11px] px-2 py-0.5 bg-[#faf6ed] border border-stone-400 text-stone-900">
                      {suggestion.sentiment || article.sentiment || 'Neutral'}
                    </span>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-[#e8e0d0] px-5 py-3 border-t-2 border-stone-900 flex items-center justify-between shrink-0 font-sans">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-300 hover:bg-stone-400 text-stone-900 font-bold text-xs border border-stone-800 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmApply}
            disabled={isApplying || selectedTags.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-stone-950 hover:bg-stone-800 text-stone-100 font-bold text-xs uppercase tracking-wider border border-stone-950 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Applying Tags...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Apply {selectedTags.length} Tags to Article</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
