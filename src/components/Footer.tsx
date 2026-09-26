import React from 'react';
import { Logo } from './ui/Logo.tsx';
import { ContactData } from '../lib/validators.ts';
import { Mail, MapPin, Clock, ArrowUpRight, MessageCircle, Facebook, Instagram, Linkedin } from 'lucide-react';

interface FooterProps {
  contact: ContactData;
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ contact, onNavigate }) => {
  const waUrl = `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(contact.whatsappMessage || 'Hi DIGEGAIN')}`;

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About DIGEGAIN', path: '/#about' },
    { label: 'Web Systems & Services', path: '/#services' },
    { label: 'Client Portfolio', path: '/portfolio' },
    { label: 'Engineering Process', path: '/#process' },
    { label: 'Contact & Consultation', path: '/contact' },
    { label: 'Admin Portal', path: '/admin' },
  ];

  const servicesList = [
    'Booking & Appointment Systems',
    'Order & E-Commerce Management',
    'Portfolio & Listing Web Apps',
    'Admin Dashboards & Telemetry',
    'AI Chatbots & CRM Automation',
    'SEO / AEO / GEO Acceleration',
  ];

  const handleLogoClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    onNavigate('/');
    setTimeout(() => {
      const hero = document.getElementById('hero') || document.getElementById('hero-heading');
      if (hero) {
        hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
        hero.focus({ preventScroll: true });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <footer className="relative bg-[#040812] border-t border-white/10 pt-20 pb-12 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0284C7]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-[#16A34A]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pb-16 border-b border-white/5">
          {/* Column 1: Brand & Positioning */}
          <div className="lg:col-span-4 space-y-6">
            <div
              onClick={handleLogoClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLogoClick();
                }
              }}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9] rounded-lg cursor-pointer inline-flex items-center select-none"
              aria-label="DIGEGAIN Homepage - Move focus to Hero"
            >
              <Logo size="lg" variant="full" clickable={false} onClick={handleLogoClick} />
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              DIGEGAIN is an AI-powered digital growth company. We architect and build high-performance web systems, booking engines, order platforms, and business dashboards for growing service enterprises.
            </p>

            <div className="flex items-center gap-3">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/30 text-xs font-semibold tracking-wide transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Us</span>
              </a>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-mono font-bold tracking-widest text-[#0EA5E9] uppercase">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              {navLinks.map(link => (
                <li key={link.path}>
                  <button
                    onClick={() => onNavigate(link.path)}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 group"
                  >
                    <span>{link.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Capabilities */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-mono font-bold tracking-widest text-[#16A34A] uppercase">
              Web Systems
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              {servicesList.map(service => (
                <li key={service} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
                  <span>{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Location */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-mono font-bold tracking-widest text-[#EA580C] uppercase">
              Headquarters
            </h4>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#EA580C] flex-shrink-0 mt-0.5" />
                <span>
                  {contact.address.street}, {contact.address.city}, {contact.address.state}, {contact.address.country}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#0EA5E9] flex-shrink-0" />
                <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors">
                  {contact.email}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                <span>
                  {contact.workingHours?.[0]?.days}: {contact.workingHours?.[0]?.opens} – {contact.workingHours?.[0]?.closes}
                </span>
              </div>
            </div>

            {/* Social icons */}
            <div className="pt-2">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Connect</div>
              <div className="flex items-center gap-2.5">
                <a
                  href={contact.socials?.facebook || 'https://facebook.com/digergain'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow DIGEGAIN on Facebook"
                  title="Facebook"
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:border-[#1877F2]/60 hover:bg-[#1877F2]/15 text-slate-400 hover:text-[#1877F2] flex items-center justify-center transition-all duration-200 group"
                >
                  <Facebook className="w-4 h-4 transition-transform group-hover:scale-110" />
                </a>

                <a
                  href={contact.socials?.instagram || 'https://instagram.com/digergain'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow DIGEGAIN on Instagram"
                  title="Instagram"
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:border-[#E4405F]/60 hover:bg-[#E4405F]/15 text-slate-400 hover:text-[#E4405F] flex items-center justify-center transition-all duration-200 group"
                >
                  <Instagram className="w-4 h-4 transition-transform group-hover:scale-110" />
                </a>

                <a
                  href={contact.socials?.linkedin || 'https://linkedin.com/company/digergain'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Connect with DIGEGAIN on LinkedIn"
                  title="LinkedIn"
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:border-[#0A66C2]/60 hover:bg-[#0A66C2]/15 text-slate-400 hover:text-[#0A66C2] flex items-center justify-center transition-all duration-200 group"
                >
                  <Linkedin className="w-4 h-4 transition-transform group-hover:scale-110" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} <strong className="text-slate-300">DIGEGAIN</strong>. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('/contact')} className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => onNavigate('/contact')} className="hover:text-slate-300 transition-colors">
              Terms of Service
            </button>
            <a href="/sitemap.xml" target="_blank" className="hover:text-slate-300 transition-colors">
              Sitemap
            </a>
            <a href="/llms.txt" target="_blank" className="hover:text-slate-300 transition-colors font-mono">
              /llms.txt
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
