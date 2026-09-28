import React from 'react';
import { HeroCanvas } from './HeroCanvas.tsx';
import { MagneticButton } from './ui/MagneticButton.tsx';
import { ArrowUpRight, ChevronDown } from 'lucide-react';

interface HeroProps {
  onNavigate: (path: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <section
      id="hero"
      tabIndex={-1}
      aria-label="DIGEGAIN Hero Section"
      className="relative min-h-screen w-full flex items-center justify-center pt-24 pb-16 px-6 sm:px-8 overflow-hidden bg-[#060D1A] outline-none"
    >
      {/* 3D WebGL Three.js Particle Neural Field */}
      <HeroCanvas />

      {/* Radial soft gradient glow background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-[#0284C7]/20 via-[#0EA5E9]/15 to-[#16A34A]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Hero Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto text-center space-y-8">
        {/* Top Kicker Label */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b1b2e]/80 border border-white/10 text-xs font-mono text-slate-300 backdrop-blur-md shadow-lg shadow-black/40">
          <span className="w-2 h-2 rounded-full bg-[#0EA5E9] animate-pulse" />
          <span className="text-[#0EA5E9] font-bold">DIGEGAIN</span>
          <span className="text-slate-600">|</span>
          <span>AI-Powered Digital Growth Company</span>
        </div>

        {/* Headline with Split-Text / High-Impact Reveal */}
        <h1
          id="hero-heading"
          tabIndex={-1}
          className="text-4xl sm:text-6xl md:text-7xl font-heading font-extrabold tracking-tight text-white leading-[1.08] max-w-6xl mx-auto outline-none"
        >
          We build{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EA580C] via-[#0284C7] to-[#16A34A]">
            AI-powered web systems
          </span>{' '}
          that grow your business.
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          High-conversion booking engines, order management systems, visual portfolio platforms, and admin dashboards engineered for modern service businesses.
        </p>

        {/* Two Magnetic CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <MagneticButton
            onClick={() => onNavigate('/contact')}
            className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-sm tracking-wide text-white bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] hover:shadow-xl hover:shadow-[#0284C7]/40 active:scale-95 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Start your project</span>
            <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </MagneticButton>

          <MagneticButton
            onClick={() => onNavigate('/portfolio')}
            className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-sm tracking-wide text-slate-200 hover:text-white bg-[#0b1b2e]/90 hover:bg-[#10243d] border border-white/10 hover:border-[#0EA5E9]/50 transition-all flex items-center justify-center gap-2"
          >
            <span>View our work</span>
          </MagneticButton>
        </div>

        {/* Numbered quick tickers (Section 6 marquee / badge discipline) */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-400">
          <span>Booking Engines</span>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <span>Order & KDS Systems</span>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <span>Business Dashboards</span>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <span>AI Lead Capture</span>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={() => {
          document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-500 hover:text-white transition-colors focus:outline-none"
        aria-label="Scroll to content"
      >
        <span className="text-[10px] font-mono tracking-widest uppercase">Scroll</span>
        <ChevronDown className="w-4 h-4 animate-bounce text-[#0EA5E9]" />
      </button>
    </section>
  );
};
