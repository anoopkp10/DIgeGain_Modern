import React, { useEffect, useState } from 'react';
import { Logo } from './Logo.tsx';

interface PreloaderProps {
  onComplete: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    // Check if user already saw preloader in this session
    if (sessionStorage.getItem('digegain_preloaded') === 'true') {
      onComplete();
      setHasCompleted(true);
      return;
    }

    const duration = 1200; // 1.2s rapid counter
    const startTime = performance.now();

    const update = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      const currentVal = Math.floor(progress * 100);
      setCount(currentVal);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        sessionStorage.setItem('digegain_preloaded', 'true');
        setIsFading(true);
        setTimeout(() => {
          setHasCompleted(true);
          onComplete();
        }, 500);
      }
    };

    const animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [onComplete]);

  const handleSkip = () => {
    sessionStorage.setItem('digegain_preloaded', 'true');
    setIsFading(true);
    setTimeout(() => {
      setHasCompleted(true);
      onComplete();
    }, 200);
  };

  if (hasCompleted) return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#060D1A] transition-all duration-500 ${
        isFading ? 'opacity-0 pointer-events-none -translate-y-4' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Animated glowing logo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-[#EA580C]/25 via-[#0284C7]/35 to-[#16A34A]/25 rounded-full animate-pulse" />
          <Logo size="xl" variant="full" clickable={false} />
        </div>

        {/* Counter */}
        <div className="flex items-baseline gap-1 font-mono text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#16A34A]">
          <span>{String(count).padStart(3, '0')}</span>
          <span className="text-xl text-[#64748b] font-normal">%</span>
        </div>

        <div className="mt-4 text-xs tracking-widest text-[#64748b] uppercase font-mono">
          Initializing Web Systems Engine
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-[#0f233d] rounded-full mt-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#EA580C] via-[#0284C7] to-[#16A34A] transition-all duration-75 ease-out"
            style={{ width: `${count}%` }}
          />
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="mt-8 text-xs font-mono text-slate-500 hover:text-white transition-colors underline underline-offset-4"
        >
          [skip intro]
        </button>
      </div>
    </div>
  );
};
