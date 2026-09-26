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
      {/* High-Fidelity SVG Ribbon Globe */}
      <svg
        width={currentSize.width}
        height={currentSize.height}
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="logoOrangeGrad" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#FFB300" />
            <stop offset="60%" stopColor="#F7941D" />
            <stop offset="100%" stopColor="#E65100" />
          </linearGradient>
          <linearGradient id="logoBlueGrad" x1="0%" y1="20%" x2="100%" y2="80%">
            <stop offset="0%" stopColor="#29B6F6" />
            <stop offset="50%" stopColor="#1E8FCC" />
            <stop offset="100%" stopColor="#0277BD" />
          </linearGradient>
          <linearGradient id="logoGreenGrad" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#81C784" />
            <stop offset="50%" stopColor="#4CAF50" />
            <stop offset="100%" stopColor="#2E7D32" />
          </linearGradient>
          <linearGradient id="logoYellowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="100%" stopColor="#FFA000" />
          </linearGradient>
        </defs>

        <g transform="translate(120, 120)">
          {/* Top Yellow/Amber Tip Ribbon */}
          <path
            d="M -30 -90 C -10 -95, 20 -92, 45 -78 C 30 -70, 10 -75, -20 -72 C -32 -76, -38 -84, -30 -90 Z"
            fill="url(#logoYellowGrad)"
          />
          {/* Top-Mid Orange Main Ribbon */}
          <path
            d="M -75 -48 C -70 -72, -35 -92, 15 -88 C 65 -82, 85 -50, 75 -22 C 60 -12, 40 -20, 20 -28 C -25 -45, -55 -40, -75 -48 Z"
            fill="url(#logoOrangeGrad)"
          />
          {/* Upper Blue Ribbon Arch */}
          <path
            d="M -85 -10 C -85 -30, -50 -55, 10 -52 C 60 -50, 92 -20, 95 15 C 80 18, 55 10, 25 -2 C -20 -18, -60 -5, -85 -10 Z"
            fill="url(#logoBlueGrad)"
          />
          {/* Center Royal Blue Sweeping Band */}
          <path
            d="M -92 18 C -90 -2, -60 -25, -10 -22 C 45 -18, 88 5, 96 35 C 75 42, 35 30, -15 15 C -55 5, -80 20, -92 18 Z"
            fill="#1565C0"
          />
          {/* Vibrant Emerald-Green Rising Ribbon */}
          <path
            d="M -80 45 C -65 20, -20 5, 30 18 C 75 30, 95 62, 70 85 C 50 82, 20 68, -25 50 C -55 38, -75 48, -80 45 Z"
            fill="url(#logoGreenGrad)"
          />
          {/* Lower Leaf Accent Ribbon */}
          <path
            d="M -50 78 C -25 65, 15 62, 55 75 C 62 82, 45 92, 10 90 C -25 88, -45 84, -50 78 Z"
            fill="#66BB6A"
          />
        </g>
      </svg>

      {/* Brand Wordmark "DIGEGAIN" */}
      {variant === 'full' && showText && (
        <span
          onClick={isInteractive ? handleClick : undefined}
          data-cursor="pointer"
          className={`font-heading font-black uppercase select-none transition-colors duration-200 leading-none ${
            layout === 'stacked'
              ? 'mt-2 text-center tracking-widest'
              : 'tracking-wider'
          } ${currentSize.textSize} ${
            textColor
              ? textColor
              : 'text-transparent bg-clip-text bg-gradient-to-r from-[#1E8FCC] to-[#29B6F6] group-hover:from-[#29B6F6] group-hover:to-[#38BDF8]'
          }`}
        >
          DIGEGAIN
        </span>
      )}
    </div>
  );
};
