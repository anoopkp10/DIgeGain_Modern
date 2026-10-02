import React, { useState, useMemo, useEffect } from 'react';
import { PortfolioItem } from '../lib/validators.ts';
import { PortfolioCard } from './PortfolioCard.tsx';
import { ProjectDetailModal } from './ProjectDetailModal.tsx';
import { Search, Sparkles, ArrowRight, ShieldCheck, Zap, Layers, X } from 'lucide-react';

interface PortfolioPageProps {
  portfolio: PortfolioItem[];
  onNavigate: (path: string) => void;
  onSelectService: (service: string) => void;
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({
  portfolio,
  onNavigate,
  onSelectService,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItem, setActiveItem] = useState<PortfolioItem | null>(null);

  // Sync active project with browser history and back/forward navigation
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash) {
        const found = portfolio.find(p => p.slug === hash || p.id === hash);
        if (found) {
          setActiveItem(found);
          return;
        }
      }
      setActiveItem(null);
    };

    handleHashSync();
    window.addEventListener('popstate', handleHashSync);
    window.addEventListener('hashchange', handleHashSync);

    return () => {
      window.removeEventListener('popstate', handleHashSync);
      window.removeEventListener('hashchange', handleHashSync);
    };
  }, [portfolio]);

  const categories = useMemo(() => {
    const list = ['All'];
    portfolio.forEach(item => {
      if (item.category && !list.includes(item.category)) {
        list.push(item.category);
      }
    });
    return list;
  }, [portfolio]);

  const filteredItems = useMemo(() => {
    return portfolio.filter(item => {
      const matchCategory =
        selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [portfolio, selectedCategory, searchQuery]);

  return (
    <div className="pt-28 pb-24 px-6 sm:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header & Stats Banner */}
      <div className="space-y-6">
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-[#0EA5E9] uppercase tracking-widest px-3 py-1 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/20">
            <span>(PORTFOLIO)</span>
            <span aria-hidden="true">·</span>
            <span>PRODUCTION WEB ENGINES</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-heading font-extrabold text-white tracking-tight leading-tight">
            Engineered Web Systems for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EA580C] via-[#0284C7] to-[#16A34A]">
              Market Leaders.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Browse our deployed booking engines, real-time ordering platforms, interactive dashboards, and creative showcases. Click any project to inspect its architecture, media, and tech stack.
          </p>
        </div>

        {/* Quick Enterprise Metrics Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#060D1A] border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0284C7]/20 flex items-center justify-center text-[#0EA5E9] flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white font-mono">&lt; 200ms Latency</div>
              <div className="text-[11px] text-slate-400">Real-time sync</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060D1A] border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#16A34A]/20 flex items-center justify-center text-[#16A34A] flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white font-mono">100% Tailored</div>
              <div className="text-[11px] text-slate-400">Zero template bloat</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060D1A] border border-white/10 flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-8 h-8 rounded-lg bg-[#EA580C]/20 flex items-center justify-center text-[#EA580C] flex-shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white font-mono">{portfolio.length} Systems Deployed</div>
              <div className="text-[11px] text-slate-400">Healthcare, Dining & Salons</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        {/* Category Segmented Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map(cat => {
            const count =
              cat === 'All'
                ? portfolio.length
                : portfolio.filter(p => p.category.toLowerCase() === cat.toLowerCase()).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white shadow-lg shadow-[#0284C7]/25 font-bold scale-[1.02]'
                    : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search systems, clients, stack..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#060D1A] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#0EA5E9] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Showing count indicator */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 -mt-6">
        <span>Showing {filteredItems.length} of {portfolio.length} verified production systems</span>
        {selectedCategory !== 'All' && (
          <button
            onClick={() => setSelectedCategory('All')}
            className="text-[#0EA5E9] hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Portfolio Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item, idx) => (
            <PortfolioCard
              key={item.id}
              item={item}
              index={idx}
              onClick={() => setActiveItem(item)}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center glass-panel rounded-2xl border border-white/10 space-y-4">
          <Sparkles className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-lg font-heading font-bold text-white">No projects found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different category filter.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-xs font-bold text-white transition-transform hover:scale-105"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Detail Lightbox Modal */}
      <ProjectDetailModal
        item={activeItem}
        onClose={() => setActiveItem(null)}
        onNavigateToContact={service => {
          onSelectService(service);
          onNavigate('/contact');
        }}
      />

      {/* Bottom CTA Banner */}
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/15 bg-gradient-to-r from-[#060D1A] via-[#091829] to-[#060D1A] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 text-center sm:text-left max-w-xl">
          <div className="text-xs font-mono text-[#0EA5E9] font-bold uppercase tracking-wider">
            Ready to scale your business operations?
          </div>
          <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
            Have a custom web system in mind?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            We engineer tailored booking engines, order kiosks, and operational portals in 2 to 4 weeks.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/contact')}
          className="px-8 py-3.5 rounded-full font-bold text-xs text-white bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] hover:shadow-xl hover:shadow-[#0284C7]/30 transition-all flex items-center gap-2 whitespace-nowrap group hover:scale-105"
        >
          <span>Request System Architecture</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
