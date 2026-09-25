import React, { useState } from 'react';
import { PortfolioItem } from '../lib/validators.ts';
import { X, ExternalLink, Share2, Check, ArrowRight } from 'lucide-react';

interface ProjectDetailModalProps {
  item: PortfolioItem | null;
  onClose: () => void;
  onNavigateToContact: (service: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  item,
  onClose,
  onNavigateToContact,
}) => {
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const currentMedia = item.media[activeMediaIdx] || item.media[0];

  const shareUrl = `${window.location.origin}/portfolio#${item.slug}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#091524] border border-white/15 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden my-8"
      >
        {/* Header / Close button */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#060D1A]/50">
          <div>
            <div className="text-xs font-mono text-[#0EA5E9] uppercase tracking-wider">
              {item.category}
            </div>
            <h2 className="text-2xl font-heading font-bold text-white mt-1">
              {item.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Media Viewer */}
        <div className="relative aspect-[16/9] bg-black/60 overflow-hidden">
          {currentMedia?.type === 'video' ? (
            <video
              src={currentMedia.path}
              controls
              autoPlay
              muted
              className="w-full h-full object-contain"
            />
          ) : currentMedia ? (
            <img
              src={currentMedia.path}
              alt={currentMedia.alt || item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-sm">
              DIGEGAIN Visual Showcase
            </div>
          )}
        </div>

        {/* Thumbnails if multiple media */}
        {item.media.length > 1 && (
          <div className="flex gap-2 p-4 bg-[#050B14] overflow-x-auto border-b border-white/5">
            {item.media.map((m, idx) => (
              <button
                key={idx}
                onClick={() => setActiveMediaIdx(idx)}
                className={`w-20 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                  activeMediaIdx === idx ? 'border-[#0EA5E9] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={m.path} alt={m.alt} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Content Details */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main description */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-sm font-mono text-[#16A34A] uppercase tracking-wider">
                System Overview
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {item.description}
              </p>

              {/* Zero-pill tags */}
              <div className="pt-2">
                <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">
                  Architecture & Technologies
                </div>
                <div className="flex items-center flex-wrap gap-2 text-xs font-mono text-slate-300">
                  {item.tags.map((tag, idx) => (
                    <React.Fragment key={idx}>
                      <span>{tag}</span>
                      {idx < item.tags.length - 1 && <span className="text-slate-600">/</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar info */}
            <div className="space-y-4 bg-[#060D1A] p-5 rounded-xl border border-white/5">
              <div>
                <div className="text-[11px] font-mono text-slate-500 uppercase">Client Organization</div>
                <div className="text-sm font-semibold text-white mt-0.5">{item.clientName || 'Private Enterprise'}</div>
              </div>

              <div>
                <div className="text-[11px] font-mono text-slate-500 uppercase">Category</div>
                <div className="text-sm font-semibold text-[#0EA5E9] mt-0.5">{item.category}</div>
              </div>

              {item.projectUrl && (
                <div>
                  <div className="text-[11px] font-mono text-slate-500 uppercase">Live Demo / Production</div>
                  <a
                    href={item.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#0EA5E9] hover:underline font-semibold"
                  >
                    <span>Visit Live System</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Share actions */}
              <div className="pt-2 border-t border-white/5">
                <div className="text-[11px] font-mono text-slate-500 uppercase mb-2">Share Project</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyShareLink}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy link'}</span>
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Check out ${item.title} by DIGEGAIN: ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 transition-colors"
                    title="Share to WhatsApp"
                  >
                    WA
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Looking to build a similar high-performance web system?
            </div>
            <button
              onClick={() => {
                onClose();
                onNavigateToContact(item.category);
              }}
              className="px-6 py-2.5 rounded-full font-semibold text-xs text-white bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] hover:shadow-lg hover:shadow-[#0284C7]/30 transition-all flex items-center gap-2"
            >
              <span>Build this for your business</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
