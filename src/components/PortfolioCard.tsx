import React, { useRef, useState } from 'react';
import { PortfolioItem } from '../lib/validators.ts';
import { ArrowUpRight } from 'lucide-react';

interface PortfolioCardProps {
  item: PortfolioItem;
  onClick: () => void;
  index: number;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ item, onClick, index }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle 3D tilt angle
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const coverMedia = item.media[item.coverIndex || 0] || item.media[0];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      data-cursor-label="View"
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(${
          isHovered ? '1.02, 1.02, 1.02' : '1, 1, 1'
        })`,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="group relative cursor-pointer rounded-2xl overflow-hidden glass-panel glass-panel-hover border border-white/10 flex flex-col"
    >
      {/* Media Image Container with Zoom & Fluid Glow */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#0a1626]">
        {coverMedia ? (
          <img
            src={coverMedia.path}
            alt={coverMedia.alt || item.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 group-hover:filter group-hover:brightness-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#0d2238] text-slate-500 font-mono text-xs">
            DIGEGAIN SYSTEM
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060D1A] via-transparent to-transparent opacity-80" />

        {/* Top Floating Category & Index (Zero-pill discipline: unboxed clean text) */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs font-mono">
          <span className="text-[#0EA5E9] font-semibold tracking-wider uppercase">
            {item.category}
          </span>
          <span className="text-slate-400">
            PRJCT/0{index + 1}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Client unboxed kicker */}
          {item.clientName && (
            <div className="text-xs font-mono text-slate-400">
              {item.clientName}
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-heading font-bold text-white group-hover:text-[#0EA5E9] transition-colors line-clamp-1 flex items-center justify-between">
            <span>{item.title}</span>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-[#0EA5E9] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 flex-shrink-0 ml-2" />
          </h3>

          {/* Description */}
          <p className="text-xs leading-relaxed text-slate-400 line-clamp-2">
            {item.description}
          </p>
        </div>

        {/* Zero-Pill Tags Discipline: Clean unboxed metadata separated by middots */}
        <div className="pt-3 border-t border-white/5 flex items-center flex-wrap gap-1 text-[11px] text-slate-400 font-mono">
          {item.tags.slice(0, 3).map((tag, tIdx) => (
            <React.Fragment key={tIdx}>
              <span className="hover:text-slate-200">{tag}</span>
              {tIdx < Math.min(item.tags.length, 3) - 1 && <span aria-hidden="true" className="text-slate-600">·</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
