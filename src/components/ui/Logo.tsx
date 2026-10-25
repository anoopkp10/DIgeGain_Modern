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
      {/* PNG Logo (replaces inline SVG) - identical look and feel across the app.
           The PNG already contains the ribbon icon + "DIGEGAIN" wordmark baked in,
           so no separate text span is rendered (avoids duplicate "DIGEGAIN"). */}
      <img
        src={variant === 'icon' ? '/logo/digegain-icon.png' : '/logo/digegain-transparent.png'}
        alt="DIGEGAIN"
        width={currentSize.width}
        height={currentSize.height}
        className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
        onClick={isInteractive ? handleClick : undefined}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
      />
    </div>
  );
};
