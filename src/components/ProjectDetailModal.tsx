import React, { useEffect } from 'react';
import { PortfolioItem } from '../lib/validators.ts';
import { X, ExternalLink, ArrowRight, ArrowLeft, Video as VideoIcon, Calendar, Building2, Tag } from 'lucide-react';

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
  // Sync with browser history and handle Back button / Escape key
  useEffect(() => {
    if (!item) return;

    // Push hash to history if not currently pointing to this project
    if (window.location.hash !== `#${item.slug}`) {
      window.history.pushState(
        { modalOpen: true, project: item.slug },
        '',
        `${window.location.pathname}#${item.slug}`
      );
    }

    // Handle browser Back button or mobile back swipe
    const handlePopState = () => {
      onClose();
    };
    window.addEventListener('popstate', handlePopState);

    // Handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Prevent body background scroll while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [item, onClose]);

  if (!item) return null;

  const handleClose = () => {
    if (window.location.hash) {
      window.history.back();
    }
    onClose();
  };

  const media = item.media?.[0];
  const isVideo =
    media?.type === 'video' ||
    (media?.path ? /\.(mp4|webm)$/i.test(media.path) : false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl overflow-y-auto animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-[#081220] border border-white/15 rounded-3xl shadow-2xl shadow-black overflow-hidden my-6 transition-all"
      >
        {/* Modal Top Navigation Bar with Go Back and Close */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-[#050A14]/90 backdrop-blur-md sticky top-0 z-20">
          {/* Back to Portfolio Button */}
          <button
            onClick={handleClose}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all hover:border-[#0EA5E9]/50 group"
            title="Go back to portfolio list"
            aria-label="Go back to portfolio"
          >
            <ArrowLeft className="w-4 h-4 text-[#0EA5E9] transition-transform group-hover:-translate-x-1" />
            <span>Back to Portfolio</span>
          </button>

          {/* Category & Client */}
          <div className="hidden md:flex items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-[#0EA5E9]/15 border border-[#0EA5E9]/30 text-xs font-mono font-bold text-[#0EA5E9] uppercase tracking-wider">
              {item.category}
            </span>
            {item.clientName && (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{item.clientName}</span>
              </span>
            )}
          </div>

          {/* Close Details Button */}
          <button
            onClick={handleClose}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] hover:border-white/20"
            aria-label="Close project modal"
            title="Close details (Esc)"
          >
            <span className="hidden sm:inline">Close</span>
            <X className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </button>
        </div>

        {/* 1. LARGE IMAGE / VIDEO SHOWCASE (Cinematic view) */}
        <div className="relative w-full bg-[#03060E] flex items-center justify-center overflow-hidden border-b border-white/10">
          {media ? (
            isVideo ? (
              <div className="w-full max-h-[65vh] flex items-center justify-center bg-black">
                <video
                  src={media.path}
                  controls
                  autoPlay
                  playsInline
                  className="w-full max-h-[65vh] object-contain shadow-2xl"
                />
              </div>
            ) : (
              <div className="w-full max-h-[70vh] flex items-center justify-center bg-black/40 p-2 sm:p-4">
                <img
                  src={media.path}
                  alt={media.alt || item.title}
                  className="w-full max-h-[65vh] object-contain rounded-xl shadow-2xl select-none"
                />
              </div>
            )
          ) : (
            <div className="w-full h-80 flex flex-col items-center justify-center text-slate-500 font-mono text-sm gap-2">
              <span className="text-[#0EA5E9] font-bold text-lg">DIGEGAIN WEB SYSTEM</span>
              <span className="text-xs text-slate-400">Production Architecture Preview</span>
            </div>
          )}

          {/* Indicator Badge */}
          {isVideo && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-xs font-mono text-white flex items-center gap-2">
              <VideoIcon className="w-3.5 h-3.5 text-[#0EA5E9]" />
              <span>Full Video Demo</span>
            </div>
          )}
        </div>

        {/* 2. FULL PROJECT DETAILS */}
        <div className="p-6 sm:p-10 space-y-8 bg-[#081220]">
          {/* Main Title & Kicker */}
          <div className="space-y-2 border-b border-white/10 pb-6">
            <h2
              id="modal-project-title"
              className="text-2xl sm:text-4xl font-heading font-extrabold text-white tracking-tight leading-snug"
            >
              {item.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
              {item.clientName && (
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Building2 className="w-3.5 h-3.5 text-[#0EA5E9]" />
                  <span>Client: <strong className="text-white">{item.clientName}</strong></span>
                </div>
              )}
              {item.createdAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Engineered: {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                </div>
              )}
              <div className="md:hidden">
                <span className="px-2 py-0.5 rounded bg-[#0EA5E9]/15 text-[#0EA5E9] uppercase font-bold text-[10px]">
                  {item.category}
                </span>
              </div>
            </div>
          </div>

          {/* Grid: Main Description & Sidebar Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Full Detailed Description & Architecture */}
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold text-[#16A34A] uppercase tracking-wider flex items-center gap-2">
                  <span>System Architecture & Overview</span>
                </h3>
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal">
                  {item.description}
                </p>
              </div>

              {/* Technologies & Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    <span>Tech Stack & Integration Capabilities</span>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300 hover:text-white hover:border-[#0EA5E9]/40 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 4 Cols: Quick Info & Live Link */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#050A14] p-5 rounded-2xl border border-white/10 space-y-5">
                {/* Live Demo Link */}
                {item.projectUrl ? (
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase mb-1.5">
                      Live Production Link
                    </div>
                    <a
                      href={item.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-[#0284C7]/20 hover:bg-[#0284C7]/30 border border-[#0EA5E9]/40 text-xs text-[#0EA5E9] hover:text-white font-semibold transition-all flex items-center justify-between group/link"
                    >
                      <span>Visit Live System</span>
                      <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    </a>
                  </div>
                ) : (
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase mb-1">
                      System Deployment
                    </div>
                    <div className="text-xs font-semibold text-slate-300">
                      Private Enterprise Deployment
                    </div>
                  </div>
                )}

                {/* Category */}
                <div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase">
                    System Category
                  </div>
                  <div className="text-xs font-bold text-white mt-1">
                    {item.category}
                  </div>
                </div>

                {/* Client */}
                {item.clientName && (
                  <div className="pt-3 border-t border-white/5">
                    <div className="text-[11px] font-mono text-slate-400 uppercase">
                      Client Organization
                    </div>
                    <div className="text-xs font-semibold text-slate-200 mt-1">
                      {item.clientName}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action CTA Footer with Back to Portfolio Option */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#050A14] -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 p-6 sm:p-8">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="text-sm font-heading font-bold text-white">
                Interested in building a custom system like this?
              </div>
              <div className="text-xs text-slate-400">
                Tailored architecture, zero licensing bloat, ready in 2–4 weeks.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleClose}
                className="w-full sm:w-auto px-5 py-3 rounded-full font-semibold text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2"
                title="Go back to portfolio list"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Portfolio</span>
              </button>

              <button
                onClick={() => {
                  handleClose();
                  onNavigateToContact(item.category);
                }}
                className="w-full sm:w-auto px-7 py-3 rounded-full font-bold text-xs text-white bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] hover:shadow-lg hover:shadow-[#0284C7]/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Build this for your business</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
