import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppFabProps {
  whatsappNumber: string;
  whatsappMessage: string;
}

export const WhatsAppFab: React.FC<WhatsAppFabProps> = ({
  whatsappNumber,
  whatsappMessage,
}) => {
  if (!whatsappNumber) return null;

  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage || 'Hi DIGEGAIN')}`;

  return (
    <aside
      aria-label="Contact options"
      className="fixed bottom-6 right-6 z-40"
    >
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-cursor-label="Chat"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-2xl shadow-[#25D366]/40 hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#25D366]/50"
        aria-label="Chat with DIGEGAIN on WhatsApp"
      >
        {/* Pulsing ring animation */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-40 animate-ping pointer-events-none" />

        <MessageCircle className="w-7 h-7 fill-white/20 transition-transform duration-300 group-hover:rotate-12" />

        {/* Tooltip on hover */}
        <span className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#0b1b2e] text-slate-200 border border-white/10 text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-xl shadow-black/50">
          Chat on WhatsApp
        </span>
      </a>
    </aside>
  );
};
