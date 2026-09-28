import React, { useEffect, useState } from 'react';
import { Logo } from './ui/Logo.tsx';
import { MagneticButton } from './ui/MagneticButton.tsx';
import { Menu, X, Sun, Moon, ArrowUpRight } from 'lucide-react';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activePath, setActivePath] = useState('/');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLight, setIsLight] = useState(() => {
    try {
      return localStorage.getItem('digegain-theme') === 'light';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', isLight);
    document.documentElement.classList.toggle('dark', !isLight);
    try {
      localStorage.setItem('digegain-theme', isLight ? 'light' : 'dark');
    } catch {
      // Theme still applies for this page view when storage is unavailable.
    }
  }, [isLight]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 60) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Hide on scroll down, show on scroll up
      if (currentScrollY > 150) {
        if (currentScrollY > lastScrollY && !mobileMenuOpen) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, mobileMenuOpen]);

  useEffect(() => {
    const updateActivePath = () => {
      if (currentPath !== '/') {
        setActivePath(currentPath);
        return;
      }

      const sectionIds = ['hero', 'about', 'services', 'process'];
      const activeSection = sectionIds.reduce((activeId, id) => {
        const section = document.getElementById(id);
        return section && section.getBoundingClientRect().top <= window.innerHeight * 0.35
          ? id
          : activeId;
      }, 'hero');

      setActivePath(activeSection === 'hero' ? '/' : `/#${activeSection}`);
    };

    updateActivePath();
    window.addEventListener('scroll', updateActivePath, { passive: true });
    return () => window.removeEventListener('scroll', updateActivePath);
  }, [currentPath]);

  const toggleTheme = () => {
    setIsLight(prev => !prev);
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/#about' },
    { label: 'Services', path: '/#services' },
    { label: 'Portfolio', path: '/portfolio' },
    { label: 'Process', path: '/#process' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleLinkClick = (path: string) => {
    setMobileMenuOpen(false);
    setActivePath(path);
    onNavigate(path);
  };

  const handleLogoClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);
    if (currentPath !== '/') {
      onNavigate('/');
    }
    setTimeout(() => {
      const hero = document.getElementById('hero') || document.getElementById('hero-heading');
      if (hero) {
        hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
        hero.focus({ preventScroll: true });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, currentPath === '/' ? 20 : 120);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled
            ? 'bg-[#060D1A]/85 backdrop-blur-md border-b border-white/10 py-3.5 shadow-2xl shadow-black/40'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
          {/* Brand Logo - Both Icon & DIGEGAIN wordmark focus Hero */}
          <div
            onClick={handleLogoClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLogoClick();
              }
            }}
            role="button"
            tabIndex={0}
            className="group flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] rounded-lg cursor-pointer select-none"
            aria-label="DIGEGAIN - Navigate to Hero"
          >
            <Logo variant="full" size="md" clickable={false} onClick={handleLogoClick} />
          </div>

          {/* Desktop Navigation Links with Emotion Agency Rolling Text Hover */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Main Navigation">
            {navLinks.map(link => {
              const isActive = activePath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleLinkClick(link.path)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-2 text-sm font-medium tracking-wide transition-colors ${
                    isActive ? 'text-[#0EA5E9]' : 'text-slate-300 hover:text-[#16A34A]'
                  }`}
                >
                  <span
                    className={`absolute bottom-0 left-0 h-[2px] w-full transition-colors ${
                      isActive ? 'bg-[#0EA5E9]' : 'bg-transparent'
                    }`}
                  />
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Header Utilities & CTA */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
              aria-pressed={isLight}
              title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
            >
              {isLight ? <Moon className="w-4 h-4 text-slate-800" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Magnetic CTA */}
            <MagneticButton
              onClick={() => handleLinkClick('/contact')}
              className="relative px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide text-white bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] hover:shadow-lg hover:shadow-[#0284C7]/40 active:scale-95 transition-all flex items-center gap-2 group"
            >
              <span>Let's connect</span>
              <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </MagneticButton>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-300 hover:text-white"
              aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
              aria-pressed={isLight}
              title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
            >
              {isLight ? <Moon className="w-5 h-5 text-slate-800" /> : <Sun className="w-5 h-5 text-amber-400" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="p-2 text-slate-200 hover:text-white focus:outline-none"
              aria-label="Open mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-[#060D1A]/95 backdrop-blur-2xl flex flex-col justify-between px-8 py-24 transition-all duration-500 lg:hidden ${
          mobileMenuOpen
            ? 'opacity-100 pointer-events-auto translate-y-0'
            : 'opacity-0 pointer-events-none -translate-y-8'
        }`}
      >
        <div className="flex flex-col space-y-6">
          <div className="text-xs font-mono tracking-widest text-[#0EA5E9] uppercase">
            NAVIGATION
          </div>
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => handleLinkClick(link.path)}
              aria-current={activePath === link.path ? 'page' : undefined}
              className={`flex items-center justify-between text-left text-3xl font-heading font-bold transition-colors py-2 border-b border-white/5 ${
                activePath === link.path ? 'text-[#0EA5E9]' : 'text-white hover:text-[#16A34A]'
              }`}
            >
              <span>{link.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-6 pt-8 border-t border-white/10">
          <button
            onClick={() => handleLinkClick('/contact')}
            className="w-full py-4 rounded-xl text-center font-semibold text-white bg-gradient-to-r from-[#EA580C] via-[#0284C7] to-[#16A34A] shadow-lg shadow-[#0284C7]/20"
          >
            Start Your Project
          </button>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>© DIGEGAIN</span>
            <span>hello@digegain.com</span>
          </div>
        </div>
      </div>
    </>
  );
};
