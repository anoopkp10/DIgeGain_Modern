import React, { useState, useEffect } from 'react';
import { ContactData } from '../lib/validators.ts';
import {
  Mail,
  Phone,
  Clock,
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
  submittedInquiry?: SubmittedInquiry | null;
  onSubmittedInquiryChange?: (inquiry: SubmittedInquiry | null) => void;
  onNavigate: (path: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  contact,
  configuredEmail = 'anoopkp10@gmail.com',
  preselectedService,
  submittedInquiry: propSubmittedInquiry,
  onSubmittedInquiryChange,
  onNavigate,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: preselectedService || 'Booking & Appointment System',
    message: '',
    website_trap: '', // honeypot
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Retain submitted state from props, localStorage, and sessionStorage
  const [localSubmittedInquiry, setLocalSubmittedInquiry] = useState<SubmittedInquiry | null>(() => {
    if (propSubmittedInquiry) return propSubmittedInquiry;
    try {
      const savedLocal = localStorage.getItem('digegain_submitted_inquiry');
      if (savedLocal) return JSON.parse(savedLocal);
    } catch {}
    try {
      const savedSession = sessionStorage.getItem('digegain_submitted_inquiry');
      if (savedSession) return JSON.parse(savedSession);
    } catch {}
    return null;
  });

  // Keep prop and local state in sync
  useEffect(() => {
    if (propSubmittedInquiry !== undefined) {
      setLocalSubmittedInquiry(propSubmittedInquiry);
    }
  }, [propSubmittedInquiry]);

  const activeInquiry = propSubmittedInquiry !== undefined ? propSubmittedInquiry : localSubmittedInquiry;

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
    setErrorMsg('');

    // Phone / WhatsApp mandatory validation
    const digitsOnly = formData.phone.trim().replace(/[^0-9]/g, '');
    if (!formData.phone.trim() || digitsOnly.length < 7) {
      setErrorMsg('Please provide a valid Phone / WhatsApp number (minimum 7 digits).');
      return;
    }

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
        leadId: data.leadId || `lead-${Date.now()}`,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        service: formData.service,
        message: formData.message.trim(),
        recipientEmail: effectiveRecipient,
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Persist to BOTH localStorage and sessionStorage so it retains across refreshes & tab switches
      try {
        localStorage.setItem('digegain_submitted_inquiry', JSON.stringify(inquiryRecord));
      } catch {}
      try {
        sessionStorage.setItem('digegain_submitted_inquiry', JSON.stringify(inquiryRecord));
      } catch {}

      setLocalSubmittedInquiry(inquiryRecord);
      onSubmittedInquiryChange?.(inquiryRecord);
      triggerBrandConfetti();

      try {
        trackConversion('contact_form_submit', { service: formData.service });
      } catch {}

      // Reset form fields
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: 'Booking & Appointment System',
        message: '',
        website_trap: '',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting inquiry. Please try again or reach out on WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    try {
      localStorage.removeItem('digegain_submitted_inquiry');
    } catch {}
    try {
      sessionStorage.removeItem('digegain_submitted_inquiry');
    } catch {}
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
        <div className="lg:col-span-7 glass-panel p-8 sm:p-10 rounded-3xl border border-white/10 space-y-6">
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

          {/* Response Promise */}
          <div className="p-6 rounded-3xl bg-[#060D1A] border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#16A34A] uppercase tracking-wider font-bold">
              <Clock className="w-4 h-4" />
              <span>24-Hour Engineering Guarantee</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every project inquiry receives a customized feasibility review, preliminary technology stack recommendation, and timeline estimate from a senior web engineer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
