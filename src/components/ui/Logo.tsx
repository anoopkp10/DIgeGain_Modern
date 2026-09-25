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
      icon: 28,
      gap: 'gap-1',
      stackedFontSize: 'text-[9px]',
      stackedTracking: 'tracking-[0.2em]',
      stackedMargin: 'mt-0.5',
      horizontalFontSize: 'text-lg',
    },
    md: {
      icon: 36,
      gap: 'gap-1.5',
      stackedFontSize: 'text-[11px]',
      stackedTracking: 'tracking-[0.22em]',
      stackedMargin: 'mt-1',
      horizontalFontSize: 'text-xl',
    },
    lg: {
      icon: 48,
      gap: 'gap-2',
      stackedFontSize: 'text-xs',
      stackedTracking: 'tracking-[0.25em]',
      stackedMargin: 'mt-1.5',
      horizontalFontSize: 'text-2xl',
    },
    xl: {
      icon: 64,
      gap: 'gap-2.5',
      stackedFontSize: 'text-base',
      stackedTracking: 'tracking-[0.28em]',
      stackedMargin: 'mt-2',
      horizontalFontSize: 'text-4xl',
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
      className={`${
        layout === 'stacked'
          ? 'inline-flex flex-col items-center justify-center text-center'
          : `inline-flex items-center ${currentSize.gap}`
      } select-none ${
        isInteractive
          ? 'cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] rounded-lg'
          : 'group'
      } ${className}`}
    >
      {/* High-Fidelity SVG Ribbon Globe matching the uploaded image */}
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        onClick={isInteractive ? handleClick : undefined}
        className={`flex-shrink-0 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-6 ${
          isInteractive ? 'cursor-pointer' : ''
        }`}
      >
        <defs>
          <linearGradient id="logoOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="50%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#C2410C" />
          </linearGradient>
          <linearGradient id="logoBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="60%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
          <linearGradient id="logoGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="50%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0284C7" floodOpacity="0.35" />
          </filter>
        </defs>

        <g transform="translate(100, 100) scale(0.85)">
          {/* Top Yellow-Orange Ribbon */}
          <path
            d="M -30 -85 C -10 -92, 25 -88, 52 -72 C 32 -65, 8 -70, -22 -66 C -35 -72, -40 -80, -30 -85 Z"
            fill="#F97316"
          />
          {/* Main Orange Swirl Ribbon */}
          <path
            d="M -80 -42 C -72 -68, -32 -90, 22 -85 C 72 -78, 92 -45, 80 -15 C 62 -4, 38 -12, 18 -22 C -30 -40, -62 -32, -80 -42 Z"
            fill="url(#logoOrange)"
          />
          {/* Upper Azure Blue Arc */}
          <path
            d="M -92 -5 C -90 -28, -50 -55, 15 -50 C 68 -48, 98 -16, 96 20 C 78 22, 52 12, 22 -2 C -25 -20, -68 -5, -92 -5 Z"
            fill="url(#logoBlue)"
          />
          {/* Middle Deep Blue Swirling Ribbon */}
          <path
            d="M -96 22 C -92 2, -60 -22, -8 -18 C 50 -12, 92 12, 98 42 C 75 48, 32 32, -18 18 C -60 8, -84 24, -96 22 Z"
            fill="#0369A1"
          />
          {/* Lower Vibrant Green Swirl */}
          <path
            d="M -85 50 C -68 22, -18 8, 35 22 C 82 35, 98 68, 72 90 C 50 85, 18 70, -28 52 C -60 40, -80 52, -85 50 Z"
            fill="url(#logoGreen)"
          />
          {/* Bottom Accent Green Tip */}
          <path
            d="M -50 82 C -22 68, 18 65, 60 80 C 65 86, 45 96, 8 94 C -28 92, -46 88, -50 82 Z"
            fill="#15803D"
          />
        </g>
      </svg>

      {/* Brand Wordmark "DIGEGAIN" */}
      {(variant === 'full' && showText) && (
        <span
          onClick={isInteractive ? handleClick : undefined}
          data-cursor="pointer"
          className={`font-heading font-black uppercase select-none transition-colors duration-200 leading-none ${
            isInteractive ? 'cursor-pointer' : ''
          } ${
            layout === 'stacked'
              ? `${currentSize.stackedFontSize} ${currentSize.stackedTracking} ${currentSize.stackedMargin}`
              : `${currentSize.horizontalFontSize} tracking-tight`
          } ${
            textColor ||
            'text-[#0EA5E9] group-hover:text-[#38BDF8]'
          }`}
        >
          DIGEGAIN
        </span>
      )}
    </div>
  );
};
