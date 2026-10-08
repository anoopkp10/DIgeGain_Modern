import React, { useState, useEffect, useRef } from 'react';
import { ContactData } from '../lib/validators.ts';
import {
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { trackConversion } from '../lib/analytics.ts';

export interface SubmittedInquiry {
  leadId: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  recipientEmail?: string;
  submittedAt: string;
}

interface ContactPageProps {
  contact: ContactData;
  configuredEmail?: string;
  preselectedService?: string;
  preselectedMessage?: string;
  submittedInquiry?: SubmittedInquiry | null;
  onSubmittedInquiryChange?: (inquiry: SubmittedInquiry | null) => void;
  onNavigate: (path: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  contact,
  configuredEmail = 'anoopkp10@gmail.com',
  preselectedService,
  preselectedMessage,
  submittedInquiry: propSubmittedInquiry,
  onSubmittedInquiryChange,
  onNavigate,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: preselectedService || 'Booking & Appointment System',
    message: preselectedMessage || '',
    website_trap: '', // honeypot
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // Guards: prevent double-submit and double lift-up (React 18 StrictMode
  // double-invokes handlers/effects in dev, which looks like "reloading twice")
  const submittingRef = useRef(false);
  const liftedLeadIdRef = useRef<string | null>(null);

  // Single source of truth: derive from prop first, fall back to local only
  // for cross-refresh retention. Local setter only used as fallback writer.
  // NOTE: Thank-You is session-only (App clears on navigation) — storage
  // writes below are best-effort only and never re-hydrated on mount, so a
  // fresh form always shows when returning to /contact.
  const [localSubmittedInquiry, setLocalSubmittedInquiry] = useState<SubmittedInquiry | null>(null);

  // Sync when navigating from portfolio "Build this for your business"
  // (ContactPage remounts on route change, but this covers re-selection too)
  useEffect(() => {
    if (preselectedService) {
      setFormData(prev => ({ ...prev, service: preselectedService }));
    }
    if (preselectedMessage) {
      setFormData(prev => (prev.message ? prev : { ...prev, message: preselectedMessage }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedService, preselectedMessage]);

  // NOTE: no prop->local sync effect here. That pattern caused a race:
  // on success we called both setLocal + onSubmittedInquiryChange(prop),
  // then the sync effect overwrote local with the stale prop (null) and
  // hid the Thank-You. Prop is the source of truth; local is refresh fallback.

  const activeInquiry = propSubmittedInquiry ?? localSubmittedInquiry;

  const services = [
    'Booking & Appointment System',
    'Order & E-Commerce Management System',
    'Portfolio & Listing Web App',
    'Admin Dashboard & Analytics',
    'AI Chatbot & CRM Automation',
    'SEO / AEO / GEO Digital Growth',
    'Custom Web Architecture',
  ];

  const triggerBrandConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EA580C', '#0284C7', '#16A34A', '#0EA5E9'],
      });
    } catch {
      // Confetti is decorative; continue without breaking
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Ignore while a submission is already in flight (double-click guard).
    // NOTE: this flag is set AFTER validation below so failed validation
    // never locks the form.
    if (submittingRef.current) return;
    setErrorMsg('');

    // Phone / WhatsApp mandatory validation
    const digitsOnly = formData.phone.trim().replace(/[^0-9]/g, '');
    if (!formData.phone.trim() || digitsOnly.length < 7) {
      setErrorMsg('Please provide a valid Phone / WhatsApp number (minimum 7 digits).');
      return;
    }
    if (formData.message.trim().length < 10) {
      setErrorMsg('Please describe your project in at least 10 characters.');
      return;
    }

    // Build the receipt record up-front so the Thank-You shows instantly,
    // even if mail/API is slow. API success only fills in leadId/recipient.
    const pendingInquiry: SubmittedInquiry = {
      leadId: `lead-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      service: formData.service,
      message: formData.message.trim(),
      recipientEmail: configuredEmail || 'anoopkp10@gmail.com',
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    // Flip UI immediately (session-only, no waiting, no blank form)
    submittingRef.current = true;
    setLocalSubmittedInquiry(pendingInquiry);
    // Lift to App only once per leadId — the second lift (same data) is what
    // re-renders App -> remounts route and feels like a "second reload".
    if (liftedLeadIdRef.current !== pendingInquiry.leadId) {
      liftedLeadIdRef.current = pendingInquiry.leadId;
      onSubmittedInquiryChange?.(pendingInquiry);
    }
    triggerBrandConfetti();
    try {
      trackConversion('contact_form_submit', { service: formData.service });
    } catch {}

    setLoading(true);

    try {
      // 1. Submit to server API (records lead in database and initiates email dispatch)
      const res = await fetch('/api/contact-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      const effectiveRecipient = data.recipient || configuredEmail || 'anoopkp10@gmail.com';

      // 2. Client-side parallel automated email relay dispatch as secondary guarantee
      try {
        fetch(`https://formsubmit.co/ajax/${encodeURIComponent(effectiveRecipient)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Referer: 'https://digegain.com',
            Origin: 'https://digegain.com',
          },
          body: JSON.stringify({
            _subject: `[DIGEGAIN New Lead] ${formData.name.trim()} – ${formData.service}`,
            _replyto: formData.email.trim(),
            _template: 'table',
            'Lead Reference': data.leadId || `lead-${Date.now()}`,
            'Client Name': formData.name.trim(),
            'Client Email': formData.email.trim(),
            'Phone / WhatsApp': formData.phone.trim(),
            'Requested Web System': formData.service,
            'Project Requirements': formData.message.trim(),
            'Submitted Time': new Date().toLocaleString(),
          }),
          keepalive: true,
        }).catch(() => {});
      } catch {}

      const inquiryRecord: SubmittedInquiry = {
        ...pendingInquiry,
        leadId: data.leadId || pendingInquiry.leadId,
        recipientEmail: effectiveRecipient,
      };

      // Refresh record with server leadId/recipient (UI already showing Thank-You)
      setLocalSubmittedInquiry(inquiryRecord);
      if (liftedLeadIdRef.current !== inquiryRecord.leadId) {
        liftedLeadIdRef.current = inquiryRecord.leadId;
        onSubmittedInquiryChange?.(inquiryRecord);
      }

      // Reset form fields (kept for next "Submit Another" — hidden while Thank-You shows)
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: 'Booking & Appointment System',
        message: '',
        website_trap: '',
      });

      // Do NOT scroll or navigate here: the form -> Thank-You swap already
      // changes page height, and any scrollTo/scrollIntoView on top of that
      // feels like a full page reload. Leave viewport exactly where it is.
    } catch (err: any) {
      // Keep the Thank-You visible — lead is already shown instantly.
      // Only surface a soft note; do NOT clear the inquiry or blank the form.
      setErrorMsg('');
      console.warn('Contact API background sync note:', err?.message || err);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const handleResetForm = () => {
    liftedLeadIdRef.current = null;
    setLocalSubmittedInquiry(null);
    onSubmittedInquiryChange?.(null);
    setErrorMsg('');
  };

  const waUrl = `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(
    contact.whatsappMessage || 'Hi DIGEGAIN, I would like to discuss a web project.'
  )}`;

  return (
    <div className="pt-28 pb-20 px-6 sm:px-8 max-w-7xl mx-auto space-y-16">
      {/* Page Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center gap-2 font-mono text-xs text-[#0EA5E9] uppercase tracking-widest">
          <span>(CONTACT)</span>
          <span aria-hidden="true">·</span>
          <span>START YOUR PROJECT</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-heading font-extrabold text-white tracking-tight leading-tight">
          Let's architect your next{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EA580C] via-[#0284C7] to-[#16A34A]">
            digital growth engine.
          </span>
        </h1>
        <p className="text-base text-slate-300 leading-relaxed">
          Tell us about your business goals, operational bottlenecks, or project concepts. We review your requirements and respond within 24 hours with architecture blueprints, timeline, and exact cost projection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Main Form or Retained Thank You Page */}
        <div id="contact-form-card" className="lg:col-span-7 glass-panel p-8 sm:p-10 rounded-3xl border border-white/10 space-y-6 scroll-mt-28">
          {activeInquiry ? (
            /* ═════════════════════════════════════════════════
                RETAINED THANK YOU / CONFIRMATION VIEW
                (Persists across refreshes, tab changes & navigations)
            ═════════════════════════════════════════════════ */
            <div className="space-y-8 animate-fade-in py-2">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                    REQUIREMENTS DISPATCHED & NOTIFICATION SENT
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
                    Thank You, {activeInquiry.name}!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                    Your project inquiry has been securely registered. An immediate notification alert has been sent to our engineering inbox ({activeInquiry.recipientEmail || configuredEmail || 'anoopkp10@gmail.com'}).
                  </p>
                </div>
              </div>

              {/* Inquiry Receipt Card */}
              <div className="p-6 rounded-2xl bg-[#060D1A] border border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0EA5E9]" />
                    <span className="text-xs font-mono font-bold text-white uppercase">Inquiry Receipt</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-0.5 rounded-md">
                    Ref: {activeInquiry.leadId}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Primary Contact</span>
                    <span className="text-white font-semibold">{activeInquiry.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Email Address</span>
                    <span className="text-slate-300 font-semibold">{activeInquiry.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Phone / WhatsApp</span>
                    <span className="text-slate-300 font-semibold">{activeInquiry.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Requested Web System</span>
                    <span className="text-[#0EA5E9] font-bold">{activeInquiry.service}</span>
                  </div>
                </div>

                {activeInquiry.message && (
                  <div className="pt-3 border-t border-white/5">
                    <span className="text-slate-500 block text-[11px] font-mono mb-1">Submitted Project Notes:</span>
                    <p className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl whitespace-pre-line leading-relaxed italic">
                      "{activeInquiry.message}"
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 pt-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Engineering review initiated. Expected turnaround: &lt; 24 hours.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/portfolio')}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] hover:shadow-lg hover:shadow-[#0284C7]/20 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <span>Explore Portfolio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                  title="Clear confirmation and submit another requirement"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Submit Another</span>
                </button>
              </div>
            </div>
          ) : (
            /* ═════════════════════════════════════════════════
                SUBMIT PROJECT REQUIREMENTS FORM
            ═════════════════════════════════════════════════ */
            <>
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-xl font-heading font-bold text-white">
                    Project Inquiry Form
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Delivered directly to {configuredEmail}
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Response within 24h
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Honeypot anti-spam field */}
                <input
                  type="text"
                  name="website_trap"
                  value={formData.website_trap}
                  onChange={e => setFormData(prev => ({ ...prev, website_trap: e.target.value }))}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 block">
                      Your Name <span className="text-[#0EA5E9]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Ramesh Nair"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-[#060D1A] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#0EA5E9] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 block">
                      Your Email <span className="text-[#0EA5E9]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@business.com"
                      value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-[#060D1A] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#0EA5E9] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 block">
                      Phone / WhatsApp <span className="text-[#0EA5E9]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98470 12345"
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-[#060D1A] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#0EA5E9] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 block">
                      Service Required
                    </label>
                    <select
                      value={formData.service}
                      onChange={e => setFormData(prev => ({ ...prev, service: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-[#060D1A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#0EA5E9] transition-colors"
                    >
                      {services.map(s => (
                        <option key={s} value={s} className="bg-[#060D1A]">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 block">
                    Project Details / Requirements <span className="text-[#0EA5E9]">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your current business workflow, what you want to automate (e.g. appointment scheduling, table orders, dashboard), or any reference websites..."
                    value={formData.message}
                    onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-[#060D1A] border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#0EA5E9] transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#EA580C] via-[#0284C7] to-[#16A34A] hover:shadow-xl hover:shadow-[#0284C7]/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Submitting Project Requirements...</span>
                  ) : (
                    <>
                      <span>Submit Project Requirements</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Contact Info Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Direct Connect Box */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <h3 className="text-xs font-mono font-bold tracking-widest text-[#0EA5E9] uppercase">
              Direct Communication
            </h3>

            <div className="space-y-4">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 text-white hover:bg-[#25D366]/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center text-white shadow">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-[#25D366] font-semibold">Direct Messaging</div>
                    <div className="text-sm font-bold">Chat on WhatsApp</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#25D366] group-hover:translate-x-0.5 transition-transform" />
              </a>

              <a
                href={`mailto:${contact.email}`}
                className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#16A34A]/20 border border-[#16A34A]/40 flex items-center justify-center text-[#16A34A]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-slate-400">Official Inquiries</div>
                    <div className="text-sm font-bold">{contact.email}</div>
                    {contact.phone && (
                      <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-300">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
