import React, { useRef, useState } from 'react';
import { PortfolioItem } from '../lib/validators.ts';
import { ArrowUpRight, Play, Video as VideoIcon } from 'lucide-react';

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

    // Subtle 3D tilt
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const media = item.media?.[0];
  const isVideo =
    media?.type === 'video' ||
    (media?.path ? /\.(mp4|webm)$/i.test(media.path) : false);

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
          isHovered ? '1.015, 1.015, 1.015' : '1, 1, 1'
        })`,
        transition: isHovered
          ? 'transform 0.1s ease-out'
          : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="group relative cursor-pointer rounded-2xl overflow-hidden glass-panel glass-panel-hover border border-white/10 hover:border-[#0EA5E9]/50 flex flex-col transition-all duration-300 shadow-lg shadow-black/40 hover:shadow-2xl hover:shadow-[#0284C7]/15"
    >
      {/* 1. UPLOADED IMAGE OR VIDEO */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#091524]">
        {media ? (
          isVideo ? (
            <div className="w-full h-full relative group/video">
              <video
                src={media.path}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white flex items-center gap-1.5 shadow">
                <VideoIcon className="w-3 h-3 text-[#0EA5E9]" />
                <span>VIDEO DEMO</span>
              </div>
            </div>
          ) : (
            <img
              src={media.path}
              alt={media.alt || item.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 group-hover:filter group-hover:brightness-105"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#071322] text-slate-500 font-mono text-xs gap-2">
            <span className="text-[#0EA5E9] font-bold">DIGEGAIN ENGINE</span>
            <span className="text-[11px] text-slate-400">{item.category}</span>
          </div>
        )}

        {/* Ambient Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060D1A] via-transparent to-transparent opacity-70 pointer-events-none" />

        {/* Top Badges (Category & Index) */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-[#060D1A]/80 backdrop-blur-md border border-white/10 text-[#0EA5E9] font-bold uppercase tracking-wider text-[11px]">
            {item.category}
          </span>
          <span className="px-2 py-1 rounded-lg bg-[#060D1A]/70 backdrop-blur-md border border-white/5 text-slate-400 text-[10px]">
            SYS/0{index + 1}
          </span>
        </div>
      </div>

      {/* 2. BELOW: TITLE, DESCRIPTION, CLIENT & METADATA */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4 bg-gradient-to-b from-transparent to-[#040812]/50">
        <div className="space-y-3">
          {/* Client Organization Kicker */}
          {item.clientName && (
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              {item.clientName}
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-heading font-extrabold text-white group-hover:text-[#0EA5E9] transition-colors leading-snug flex items-start justify-between gap-3">
            <span className="line-clamp-2">{item.title}</span>
            <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-[#0EA5E9]/20 border border-white/10 group-hover:border-[#0EA5E9]/40 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110">
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0EA5E9] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </h3>

          {/* Description prominently below media */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
            {item.description}
          </p>
        </div>

        {/* Footer Info: Technologies & Action prompt */}
        <div className="pt-3.5 border-t border-white/5 space-y-2">
          {/* Tech stack tags */}
          <div className="flex items-center flex-wrap gap-1 text-[11px] text-slate-400 font-mono">
            {item.tags.slice(0, 3).map((tag, tIdx) => (
              <React.Fragment key={tIdx}>
                <span className="hover:text-slate-200">{tag}</span>
                {tIdx < Math.min(item.tags.length, 3) - 1 && (
                  <span aria-hidden="true" className="text-slate-600">·</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Prompt */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#0EA5E9] pt-1">
            <span className="group-hover:underline">Click to view full architecture</span>
            <span>→</span>
          </div>
        </div>
      </div>
    </div>
  );
};
