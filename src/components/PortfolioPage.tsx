import React, { useState, useMemo } from 'react';
import { PortfolioItem } from '../lib/validators.ts';
import { PortfolioCard } from './PortfolioCard.tsx';
import { ProjectDetailModal } from './ProjectDetailModal.tsx';
import { Search, Filter, Sparkles, ArrowRight } from 'lucide-react';

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

  const categories = [
    'All',
    'Booking System',
    'Order System',
    'Portfolio Website',
    'Dashboard',
  ];

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
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center gap-2 font-mono text-xs text-[#0EA5E9] uppercase tracking-widest">
          <span>(PORTFOLIO)</span>
          <span aria-hidden="true">·</span>
          <span>PRODUCTION SYSTEMS</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-heading font-extrabold text-white tracking-tight leading-tight">
          Engineered Web Systems for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EA580C] via-[#0284C7] to-[#16A34A]">
            Market Leaders.
          </span>
        </h1>
        <p className="text-base text-slate-300 leading-relaxed">
          Explore our tailored booking engines, order platforms, real-time dashboards, and visual showcases built for healthcare clinics, dining brands, salons, and growth enterprises.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        {/* Category Segmented Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white shadow-lg shadow-[#0284C7]/25 font-bold'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by tech, title, client..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#060D1A] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#0EA5E9] transition-colors"
          />
        </div>
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
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <ProjectDetailModal
        item={activeItem}
        onClose={() => setActiveItem(null)}
        onNavigateToContact={service => {
          onSelectService(service);
          onNavigate('/contact');
        }}
      />

      {/* Bottom CTA Banner */}
      <div className="glass-panel p-8 sm:p-10 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-xl font-heading font-bold text-white">
            Have a custom web system in mind?
          </h3>
          <p className="text-xs text-slate-400">
            We engineer tailored systems matching your unique operational workflow.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/contact')}
          className="px-6 py-3 rounded-full font-semibold text-xs text-white bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] hover:shadow-lg hover:shadow-[#0284C7]/30 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <span>Request System Architecture</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
