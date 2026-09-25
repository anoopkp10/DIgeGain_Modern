import React, { useEffect, useState, useRef } from 'react';

export const CustomCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [lagPos, setLagPos] = useState({ x: -100, y: -100 });
  const [cursorState, setCursorState] = useState<{
    hovered: boolean;
    label: string;
    magnetic: boolean;
  }>({
    hovered: false,
    label: '',
    magnetic: false,
  });
  const [isTouch, setIsTouch] = useState(true);

  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: -100, y: -100 });
  const currentLagRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Check touch devices or prefers-reduced-motion
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (hasTouch || reducedMotion) {
      setIsTouch(true);
      return;
    }

    setIsTouch(false);
    document.body.classList.add('has-custom-cursor');

    const onMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      setPos({ x: e.clientX, y: e.clientY });

      // Detect interactive elements under cursor
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest('a, button, input, textarea, select, [role="button"], [data-cursor]');
      const card = target.closest('[data-cursor-label]');

      if (card) {
        const label = card.getAttribute('data-cursor-label') || 'View';
        setCursorState({ hovered: true, label, magnetic: false });
      } else if (interactive) {
        setCursorState({ hovered: true, label: '', magnetic: interactive.hasAttribute('data-magnetic') });
      } else {
        setCursorState({ hovered: false, label: '', magnetic: false });
      }
    };

    const animate = () => {
      const lerpFactor = 0.18;
      currentLagRef.current.x += (targetRef.current.x - currentLagRef.current.x) * lerpFactor;
      currentLagRef.current.y += (targetRef.current.y - currentLagRef.current.y) * lerpFactor;
      setLagPos({ x: currentLagRef.current.x, y: currentLagRef.current.y });
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.body.classList.remove('has-custom-cursor');
      window.removeEventListener('mousemove', onMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (isTouch) return null;

  return (
    <>
      {/* Precision center dot */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200"
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`,
          opacity: cursorState.label ? 0 : 1,
        }}
      >
        <div
          className={`rounded-full transition-all duration-150 ${
            cursorState.hovered
              ? 'w-2 h-2 bg-[#0EA5E9] shadow-[0_0_8px_#0EA5E9]'
              : 'w-1.5 h-1.5 bg-[#EA580C] shadow-[0_0_6px_#EA580C]'
          }`}
        />
      </div>

      {/* Lagging ring with fluid difference mix */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
        style={{
          transform: `translate3d(${lagPos.x}px, ${lagPos.y}px, 0) translate(-50%, -50%)`,
        }}
      >
        {cursorState.label ? (
          <div className="flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-[#EA580C] via-[#0284C7] to-[#16A34A] text-white text-xs font-semibold uppercase tracking-wider shadow-lg shadow-[#0284C7]/30 scale-110">
            {cursorState.label}
          </div>
        ) : (
          <div
            className={`rounded-full border transition-all duration-200 ${
              cursorState.hovered
                ? 'w-12 h-12 border-[#0EA5E9] bg-[#0284C7]/20 scale-125'
                : 'w-8 h-8 border-[#EA580C] bg-[#EA580C]/10 shadow-[0_0_12px_rgba(234,88,12,0.4)]'
            }`}
          />
        )}
      </div>
    </>
  );
};
