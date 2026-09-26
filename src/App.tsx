import React, { useState, useEffect } from 'react';
import { AppData } from './lib/validators.ts';
import {
  generateOrganizationJsonLd,
  generateFaqJsonLd,
  generatePortfolioJsonLd,
} from './lib/seo.ts';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { Hero } from './components/Hero.tsx';
import { HomeSections } from './components/HomeSections.tsx';
import { PortfolioPage } from './components/PortfolioPage.tsx';
import { ContactPage } from './components/ContactPage.tsx';
import { AdminLogin } from './components/admin/AdminLogin.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { CustomCursor } from './components/ui/CustomCursor.tsx';
import { Preloader } from './components/ui/Preloader.tsx';
import { WhatsAppFab } from './components/WhatsAppFab.tsx';
import { ChatWidget } from './components/chat/ChatWidget.tsx';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<string | null>(null);
  const [preselectedService, setPreselectedService] = useState<string>('');
  const [preloaderDone, setPreloaderDone] = useState(false);

  // Fetch initial app data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/appdata');
        if (res.ok) {
          const data = await res.json();
          setAppData(data);
        }
      } catch {
        console.error('Failed to load app data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Check admin session
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('digegain_admin_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/auth/me', {
          headers,
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setAdminUser(data.user);
          }
        }
      } catch {
        // Not logged in
      }
    };
    checkAdmin();
  }, []);

  // Handle browser back / forward
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // SEO, AEO & GEO: Dynamic Metadata & Schema.org JSON-LD Injection
  useEffect(() => {
    // 1. Dynamic Page Titles for SEO
    if (currentPath === '/portfolio') {
      document.title = 'Portfolio & Case Studies | DIGEGAIN Web Systems';
    } else if (currentPath === '/contact') {
      document.title = 'Contact DIGEGAIN | AI Web Development & Tech Solutions';
    } else if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
      document.title = 'DIGEGAIN Admin Console';
    } else {
      document.title = 'DIGEGAIN - AI-Powered Digital Growth & Web Systems';
    }

    // 2. Structured Data (JSON-LD) for Search Engines (SEO), Answer Engines (AEO), and Local Maps (GEO)
    if (!appData) return;
    const siteUrl = appData.settings.siteUrl || window.location.origin;

    const injectJsonLd = (id: string, data: object) => {
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.text = JSON.stringify(data);
    };

    // Organization & LocalBusiness with GeoCoordinates (GEO & SEO)
    injectJsonLd('schema-org-jsonld', generateOrganizationJsonLd(appData, siteUrl));
    // FAQPage schema for Perplexity / Google AI Overviews / Answer Engines (AEO)
    injectJsonLd('schema-faq-jsonld', generateFaqJsonLd(appData));
    // Portfolio ItemList schema for rich search cards (SEO)
    injectJsonLd('schema-portfolio-jsonld', generatePortfolioJsonLd(appData, siteUrl));

    // 3. Google Analytics (GA4) SPA Pageview Tracking
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: currentPath,
      });
    }
  }, [currentPath, appData]);

  const navigate = (path: string) => {
    if (path.startsWith('/#')) {
      const hash = path.substring(1);
      if (currentPath !== '/') {
        window.history.pushState({}, '', '/');
        setCurrentPath('/');
        setTimeout(() => {
          const elem = document.getElementById(hash.replace('#', ''));
          elem?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        const elem = document.getElementById(hash.replace('#', ''));
        elem?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If loading app data initially
  if (loading || !appData) {
    return (
      <div className="min-h-screen bg-[#060D1A] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0EA5E9] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Admin View
  if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
    if (adminUser) {
      return (
        <AdminDashboard
          initialData={appData}
          onLogout={() => setAdminUser(null)}
          onBackToSite={() => navigate('/')}
        />
      );
    }
    return (
      <AdminLogin
        onSuccess={user => setAdminUser(user)}
        onBackToSite={() => navigate('/')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#060D1A] text-[#EAF3FF] selection:bg-[#0284C7]/30 selection:text-[#0EA5E9] relative">
      {/* Preloader intro */}
      <Preloader onComplete={() => setPreloaderDone(true)} />

      {/* Emotion Agency Custom Cursor */}
      <CustomCursor />

      {/* Persistent Navigation Header */}
      <Header currentPath={currentPath} onNavigate={navigate} />

      {/* Route Views */}
      <main className="flex-1">
        {currentPath === '/' && (
          <>
            <Hero onNavigate={navigate} />
            <HomeSections
              onNavigate={navigate}
              onSelectService={service => setPreselectedService(service)}
            />
          </>
        )}

        {currentPath === '/portfolio' && (
          <PortfolioPage
            portfolio={appData.portfolio}
            onNavigate={navigate}
            onSelectService={service => setPreselectedService(service)}
          />
        )}

        {currentPath === '/contact' && (
          <ContactPage
            contact={appData.contact}
            preselectedService={preselectedService}
            onNavigate={navigate}
          />
        )}
      </main>

      {/* Footer */}
      <Footer contact={appData.contact} onNavigate={navigate} />

      {/* Floating Action Buttons */}
      <WhatsAppFab
        whatsappNumber={appData.contact.whatsappNumber}
        whatsappMessage={appData.contact.whatsappMessage}
      />

      <ChatWidget
        assistant={appData.assistant}
        contact={appData.contact}
        onNavigate={navigate}
      />
    </div>
  );
}
