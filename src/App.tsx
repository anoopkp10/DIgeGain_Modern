import React, { useState, useEffect } from 'react';
import { AppData } from './lib/validators.ts';
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
