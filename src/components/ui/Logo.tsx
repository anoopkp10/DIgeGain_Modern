import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  clickable?: boolean;
  layout?: 'horizontal' | 'stacked';
  textColor?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showText = true,
  onClick,
  clickable = true,
  layout = 'horizontal',
  textColor,
}) => {
  const sizeMap = {
    sm: {
      height: 28,
      width: 28,
      textSize: 'text-lg',
      gap: 'gap-2',
    },
    md: {
      height: 36,
      width: 36,
      textSize: 'text-2xl',
      gap: 'gap-2.5',
    },
    lg: {
      height: 48,
      width: 48,
      textSize: 'text-3xl',
      gap: 'gap-3',
    },
    xl: {
      height: 64,
      width: 64,
      textSize: 'text-4xl',
      gap: 'gap-4',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isInteractive = clickable || !!onClick;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (clickable) {
      if (window.location.pathname !== '/' || window.location.hash) {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      setTimeout(() => {
        const hero = document.getElementById('hero') || document.getElementById('hero-heading');
        if (hero) {
          hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
          hero.focus({ preventScroll: true });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    }
  };

  return (
    <div
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isInteractive ? 'DIGEGAIN - Navigate to Hero' : undefined}
      className={`inline-flex items-center select-none ${
        layout === 'stacked' ? 'flex-col items-center text-center' : 'flex-row'
      } ${currentSize.gap} ${
        isInteractive
          ? 'cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] rounded-lg'
          : 'group'
      } ${className}`}
    >
      {/* High-Fidelity SVG Ribbon Globe with softened blue tones matching site dark theme */}
      <svg
        width={currentSize.width}
        height={currentSize.height}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="logoTopRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB300" />
            <stop offset="40%" stopColor="#FB8C00" />
            <stop offset="100%" stopColor="#F57C00" />
          </linearGradient>
          <linearGradient id="logoMidOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF7043" />
            <stop offset="30%" stopColor="#F4511E" />
            <stop offset="100%" stopColor="#E64A19" />
          </linearGradient>
          {/* Refined blue gradient - softened to match site dark palette */}
          <linearGradient id="logoBlueRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#0284C7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
          <linearGradient id="logoGreenRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#43A047" />
            <stop offset="50%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#1B5E20" />
          </linearGradient>
        </defs>

        <g transform="translate(100, 100)">
          {/* 1. Top Amber/Orange Ribbon */}
          <path
            d="M -32 -74 C -12 -88, 18 -92, 48 -76 C 36 -66, 16 -68, -4 -64 C -18 -60, -28 -66, -32 -74 Z"
            fill="url(#logoTopRibbon)"
          />

          {/* 2. Mid Orange Sweeping Ribbon */}
          <path
            d="M -78 -38 C -68 -66, -26 -84, 18 -78 C 58 -72, 82 -44, 76 -18 C 60 -10, 36 -18, 12 -25 C -28 -38, -62 -32, -78 -38 Z"
            fill="url(#logoMidOrange)"
          />

          {/* 3. Mid Blue Dynamic Swoosh - softened */}
          <path
            d="M -88 -2 C -86 -22, -45 -44, 8 -42 C 54 -40, 86 -14, 94 16 C 78 20, 48 10, 18 0 C -22 -14, -64 -2, -88 -2 Z"
            fill="url(#logoBlueRibbon)"
          />

          {/* 3b. Center Lower Slate-Blue Ribbon */}
          <path
            d="M -94 24 C -88 4, -54 -16, -4 -12 C 44 -8, 86 12, 94 38 C 72 44, 32 32, -18 18 C -58 8, -82 24, -94 24 Z"
            fill="#0369A1"
            fillOpacity="0.9"
          />

          {/* 4. Bottom Green Rising Ribbon */}
          <path
            d="M -80 50 C -64 24, -18 8, 28 20 C 72 32, 92 62, 68 84 C 48 80, 20 66, -22 48 C -52 36, -74 52, -80 50 Z"
            fill="url(#logoGreenRibbon)"
          />

          {/* 5. Lower Emerald Leaf Ribbon */}
          <path
            d="M -48 80 C -24 68, 12 65, 52 76 C 58 82, 42 90, 8 88 C -24 86, -42 84, -48 80 Z"
            fill="#16A34A"
          />
        </g>
      </svg>

      {/* Brand Wordmark "DIGEGAIN" with softened blue to match the site's dark aesthetic */}
      {variant === 'full' && showText && (
        <span
          onClick={isInteractive ? handleClick : undefined}
          data-cursor="pointer"
          className={`font-heading font-black uppercase select-none transition-colors duration-200 leading-none tracking-wide ${
            layout === 'stacked'
              ? 'mt-2 text-center'
              : ''
          } ${currentSize.textSize} ${textColor || ''}`}
        >
          {textColor ? (
            'DIGEGAIN'
          ) : (
            <>
              <span className="text-[#38BDF8]/85 hover:text-[#38BDF8] transition-colors">DIGE</span>
              <span className="text-[#16A34A] dark:text-[#22C55E] transition-colors">G</span>
              <span className="text-[#38BDF8]/85 hover:text-[#38BDF8] transition-colors">AIN</span>
            </>
          )}
        </span>
      )}
    </div>
  );
};
