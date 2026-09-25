import React, { useState, useEffect } from 'react';
import { HeroCanvas } from './HeroCanvas.tsx';
import { MagneticButton } from './ui/MagneticButton.tsx';
import {
  ArrowUpRight,
  ChevronDown,
  Calendar,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Clock,
} from 'lucide-react';

interface HeroProps {
  onNavigate: (path: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section
      id="hero"
      tabIndex={-1}
      aria-label="DIGEGAIN Hero Section"
      className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-6 sm:px-8 overflow-hidden bg-[#060D1A] outline-none"
    >
      {/* 3D WebGL Three.js Particle Neural Field */}
      <HeroCanvas />

      {/* Radial soft gradient glow background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-[#0284C7]/20 via-[#0EA5E9]/15 to-[#16A34A]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Hero Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
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
          className="text-4xl sm:text-6xl md:text-7xl font-heading font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mx-auto outline-none"
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
          <div className="flex items-center gap-1.5">
            <span className="text-[#0EA5E9] font-bold">(001)</span>
            <span>Booking Engines</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[#EA580C] font-bold">(002)</span>
            <span>Order & KDS Systems</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[#16A34A] font-bold">(003)</span>
            <span>Business Dashboards</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[#0EA5E9] font-bold">(004)</span>
            <span>AI Lead Capture</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          FLOATING UI CARDS WITH PARALLAX DEPTH
      ═══════════════════════════════════════════════ */}

      {/* Floating Card 1: Mini Booking Calendar (Top Left) */}
      <div
        className="hidden lg:flex absolute left-8 top-32 glass-panel p-4 rounded-xl border border-white/10 shadow-2xl flex-col gap-2 w-64 pointer-events-none transition-transform duration-200 ease-out"
        style={{
          transform: `translate3d(${mousePos.x * -18}px, ${mousePos.y * -14}px, 0)`,
        }}
      >
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#0EA5E9] font-semibold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Clinic Portal</span>
          </span>
          <span className="text-emerald-400 text-[10px]">Slot Confirmed</span>
        </div>
        <div className="bg-[#060D1A] p-2 rounded-lg text-xs space-y-1">
          <div className="text-white font-medium">Dr. Ramesh · Cardiology</div>
          <div className="text-slate-400 text-[11px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Tomorrow at 10:30 AM</span>
          </div>
        </div>
      </div>

      {/* Floating Card 2: Real-time Order Engine & KDS (Top Right) */}
      <div
        className="hidden lg:flex absolute right-8 top-36 glass-panel p-4 rounded-xl border border-white/10 shadow-2xl flex-col gap-2 w-64 pointer-events-none transition-transform duration-200 ease-out"
        style={{
          transform: `translate3d(${mousePos.x * 20}px, ${mousePos.y * -16}px, 0)`,
        }}
      >
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#EA580C] font-semibold flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>BistroFlow KDS</span>
          </span>
          <span className="text-emerald-400 text-[10px]">Table #04</span>
        </div>
        <div className="bg-[#060D1A] p-2 rounded-lg text-xs space-y-1">
          <div className="text-white font-medium flex justify-between">
            <span>2x Artisan Pizzas</span>
            <span className="text-slate-400">Cooking</span>
          </div>
          <div className="text-slate-400 text-[11px]">Synced with Kitchen Screen</div>
        </div>
      </div>

      {/* Floating Card 3: AI Chat Lead Bubble (Bottom Left) */}
      <div
        className="hidden xl:flex absolute left-12 bottom-24 glass-panel p-4 rounded-xl border border-white/10 shadow-2xl flex-col gap-2 w-64 pointer-events-none transition-transform duration-200 ease-out"
        style={{
          transform: `translate3d(${mousePos.x * -24}px, ${mousePos.y * 18}px, 0)`,
        }}
      >
        <div className="flex items-center gap-2 text-xs font-mono text-[#0EA5E9]">
          <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9]" />
          <span>DIGEGAIN AI Assistant</span>
        </div>
        <div className="bg-[#060D1A] p-2.5 rounded-lg text-xs text-slate-300 leading-snug">
          "I've qualified your project requirements and scheduled a discovery call."
        </div>
      </div>

      {/* Floating Card 4: Telemetry / Uptime Growth (Bottom Right) */}
      <div
        className="hidden xl:flex absolute right-12 bottom-24 glass-panel p-4 rounded-xl border border-white/10 shadow-2xl flex-col gap-2 w-64 pointer-events-none transition-transform duration-200 ease-out"
        style={{
          transform: `translate3d(${mousePos.x * 22}px, ${mousePos.y * 20}px, 0)`,
        }}
      >
        <div className="flex items-center justify-between text-xs font-mono text-[#16A34A]">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Architecture SLA</span>
          </span>
          <span className="text-xs font-bold text-white">99.9%</span>
        </div>
        <div className="h-1.5 w-full bg-[#060D1A] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#0284C7] to-[#16A34A] w-[95%]" />
        </div>
        <div className="text-[11px] text-slate-400 flex justify-between">
          <span>Sub-second response</span>
          <span className="text-[#16A34A]">AEO Ready</span>
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
