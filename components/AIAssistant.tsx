
import React, { useState } from 'react';
import { getComplexFinancialAdvice, getQuickAnalysis, searchFinancialInfo, generateGoalImage } from '../services/geminiService';
import { Transaction, AspectRatio, Language, Currency } from '../types';
import { Sparkles, Zap, BrainCircuit, Globe, Image as ImageIcon, Loader2, ArrowRight } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  lang: Language;
  currency: Currency;
  t: any;
}

type Tab = 'quick' | 'advisor' | 'search' | 'visualize';

export const AIAssistant: React.FC<Props> = ({ transactions, lang, currency, t }) => {
  const [activeTab, setActiveTab] = useState<Tab>('quick');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // Inputs
  const [query, setQuery] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.Square);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleQuickAnalysis = async () => {
    setLoading(true);
    setResult(null);
    const summary = `${t.income}: ${totalIncome} ${currency}, ${t.expenses}: ${totalExpense} ${currency}, ${t.balance}: ${balance} ${currency}. ${t.category}: ${[...new Set(transactions.map(t => t.category))].join(', ')}`;
    
    try {
      const analysis = await getQuickAnalysis(summary, lang);
      setResult(analysis);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvisor = async () => {
    if (!query) return;
    setLoading(true);
    setResult(null);
    const context = `User Balance: ${balance} ${currency}. Recent History: ${transactions.slice(0, 5).map(t => `${t.description} (${t.amount} ${currency})`).join(', ')}.`;
    
    try {
      const advice = await getComplexFinancialAdvice(query, context, lang);
      setResult(advice);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setResult(null);
    setSources([]);
    
    try {
      const { text, sources } = await searchFinancialInfo(query, lang);
      setResult(text);
      setSources(sources);
    } finally {
      setLoading(false);
    }
  };

  const handleImageGen = async () => {
    if (!imagePrompt) return;
    setLoading(true);
    setImageUrl(null);
    try {
      const url = await generateGoalImage(imagePrompt, aspectRatio);
      setImageUrl(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl shadow-xl border border-white/5 overflow-hidden transition-colors duration-300">
      <div className="bg-gradient-to-r from-surface to-surfaceHighlight p-6 border-b border-white/5">
        <h2 className="text-xl font-bold flex items-center gap-2 text-textMain">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="tracking-wide">AI COACH</span>
        </h2>
        <p className="text-textMuted text-xs mt-1 uppercase tracking-widest">{t.aiIntro}</p>
      </div>

      <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
        {[
          { id: 'quick', icon: Zap, label: 'Flash' },
          { id: 'advisor', icon: BrainCircuit, label: 'Pro' },
          { id: 'search', icon: Globe, label: 'Data' },
          { id: 'visualize', icon: ImageIcon, label: 'Vision' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as Tab); setResult(null); setImageUrl(null); }}
            className={`flex-1 px-4 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'text-textMain border-b-2 border-primary bg-surfaceHighlight' 
                : 'text-textMuted hover:text-textMain hover:bg-surfaceHighlight/50'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 min-h-[300px]">
        {/* Quick Tips */}
        {activeTab === 'quick' && (
          <div className="space-y-6">
            <p className="text-textMuted text-sm font-light leading-relaxed">
              <strong className="text-textMain">Gemini Flash Lite</strong>. {t.aiScan}
            </p>
            <button
              onClick={handleQuickAnalysis}
              disabled={loading}
              className="w-full py-4 bg-primary/10 border border-primary/20 text-primary rounded-xl hover:bg-primary/20 font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {t.aiScan}
            </button>
          </div>
        )}

        {/* Advisor */}
        {activeTab === 'advisor' && (
          <div className="space-y-4">
            <p className="text-textMuted text-sm font-light"><strong className="text-textMain">Thinking Mode</strong>. {t.aiThinking}</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.placeholderAdvice}
                className="flex-1 glass-input p-4 rounded-xl text-textMain placeholder-textMuted focus:outline-none focus:border-primary/50 text-sm transition-colors duration-300"
              />
              <button
                onClick={handleAdvisor}
                disabled={loading || !query}
                className="px-6 bg-textMain text-background rounded-xl hover:opacity-80 font-bold transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <p className="text-textMuted text-sm font-light"><strong className="text-textMain">Search Grounding</strong>. {t.aiSearch}</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.placeholderSearch}
                className="flex-1 glass-input p-4 rounded-xl text-textMain placeholder-textMuted focus:outline-none focus:border-primary/50 text-sm transition-colors duration-300"
              />
              <button
                onClick={handleSearch}
                disabled={loading || !query}
                className="px-6 bg-textMain text-background rounded-xl hover:opacity-80 font-bold transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Visualize */}
        {activeTab === 'visualize' && (
          <div className="space-y-4">
            <p className="text-textMuted text-sm font-light">{t.aiVision}</p>
            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder={t.placeholderImage}
                className="flex-1 glass-input p-4 rounded-xl text-textMain placeholder-textMuted focus:outline-none focus:border-primary/50 text-sm transition-colors duration-300"
              />
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <select 
                  value={aspectRatio} 
                  onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                  className="glass-input p-2 rounded-lg text-xs text-textMuted focus:outline-none transition-colors duration-300"
                >
                  {Object.entries(AspectRatio).map(([key, value]) => (
                    <option key={value} value={value} className="bg-surface text-textMain">{key} ({value})</option>
                  ))}
                </select>
                <button
                  onClick={handleImageGen}
                  disabled={loading || !imagePrompt}
                  className="px-6 py-2 bg-textMain text-background rounded-lg hover:opacity-80 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {t.generate}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Area */}
        <div className="mt-8">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-textMuted animate-pulse">
              <BrainCircuit className="w-10 h-10 mb-3 text-primary" />
              <p className="text-xs uppercase tracking-widest">{t.analyzing}</p>
            </div>
          )}

          {!loading && result && (
            <div className="bg-background/50 p-6 rounded-xl border border-white/5 animate-fade-in transition-colors duration-300">
              <h3 className="text-xs font-bold text-primary mb-3 uppercase tracking-widest">Informe Generado</h3>
              <div className="prose prose-invert prose-sm max-w-none text-textMain leading-relaxed whitespace-pre-wrap">{result}</div>
              
              {sources.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/5">
                  <h4 className="text-[10px] font-bold text-textMuted mb-2 uppercase tracking-wider">{t.sources}</h4>
                  <ul className="space-y-1">
                    {sources.map((source, idx) => (
                      <li key={idx} className="text-xs truncate">
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-textMain transition-colors flex items-center gap-2">
                           <Globe className="w-3 h-3" /> {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!loading && imageUrl && (
             <div className="mt-6 flex flex-col items-center animate-fade-in">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img src={imageUrl} alt="Generated Goal" className="max-w-full max-h-[400px] object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                     <p className="text-white text-xs font-mono">GEN_ID: {Math.floor(Math.random() * 10000)}</p>
                  </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
