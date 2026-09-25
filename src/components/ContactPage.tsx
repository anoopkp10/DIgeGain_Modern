import React, { useState } from 'react';
import { ContactData } from '../lib/validators.ts';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Star,
  ExternalLink,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ContactPageProps {
  contact: ContactData;
  preselectedService?: string;
  onNavigate: (path: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  contact,
  preselectedService,
  onNavigate,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: preselectedService || 'Booking & Appointment System',
    budget: '₹50,000 - ₹1,00,000',
    message: '',
    website_trap: '', // honeypot
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const services = [
    'Booking & Appointment System',
    'Order & E-Commerce Management System',
    'Portfolio & Listing Web App',
    'Admin Dashboard & Analytics',
    'AI Chatbot & CRM Automation',
    'SEO / AEO / GEO Digital Growth',
    'Custom Web Architecture',
  ];

  const budgetOptions = [
    '₹30,000 - ₹50,000',
    '₹50,000 - ₹1,00,000',
    '₹1,00,000 - ₹2,50,000',
    '₹2,50,000+',
    'Flexible / Seeking Consultation',
  ];

  const triggerBrandConfetti = () => {
    // Confetti in brand colors: Orange (#EA580C), Blue (#0284C7), Green (#16A34A), Sky (#0EA5E9)
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#EA580C', '#0284C7', '#16A34A', '#0EA5E9'],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/contact-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setSuccessMsg(data.message || 'Thank you! Your project inquiry has been received.');
      triggerBrandConfetti();
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: 'Booking & Appointment System',
        budget: '₹50,000 - ₹1,00,000',
        message: '',
        website_trap: '',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting inquiry. Please contact us via WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const cleanPhone = (contact.phone || '').replace(/[^0-9+]/g, '');
  const waUrl = `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(contact.whatsappMessage || 'Hi DIGEGAIN')}`;

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
          Tell us about your business goals, operational bottlenecks, or ideas. We respond within 24 hours with a scope blueprint, timeline, and exact cost projection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Contact Form Column */}
        <div className="lg:col-span-7 glass-panel p-8 sm:p-10 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <h2 className="text-xl font-heading font-bold text-white">
              Project Inquiry Form
            </h2>
            <span className="text-xs font-mono text-slate-400">Response within 24h</span>
          </div>

          {successMsg ? (
            <div className="py-12 px-6 rounded-xl bg-[#092218] border border-emerald-500/30 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-xl font-heading font-bold text-white">Inquiry Received!</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                {successMsg}
              </p>
              <div className="pt-4 flex justify-center gap-4">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-full bg-[#25D366] font-semibold text-xs text-white hover:bg-[#20bd5a] transition-colors inline-flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Direct WhatsApp Chat</span>
                </a>
                <button
                  onClick={() => setSuccessMsg('')}
                  className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Send another message
                </button>
              </div>
            </div>
          ) : (
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
                    Phone / WhatsApp (Optional)
                  </label>
                  <input
                    type="tel"
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
                  Estimated Budget Range
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {budgetOptions.map(b => (
                    <button
                      type="button"
                      key={b}
                      onClick={() => setFormData(prev => ({ ...prev, budget: b }))}
                      className={`px-3 py-2 rounded-lg text-xs font-mono text-center transition-all ${
                        formData.budget === b
                          ? 'bg-[#0284C7] text-white font-semibold shadow-md shadow-[#0284C7]/30'
                          : 'bg-[#060D1A] text-slate-400 border border-white/5 hover:border-white/20'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
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
                className="w-full py-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#EA580C] via-[#0284C7] to-[#16A34A] hover:shadow-xl hover:shadow-[#0284C7]/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Submitting Inquiry...</span>
                ) : (
                  <>
                    <span>Submit Project Requirements</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Contact Info & Google Business Profile Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Connect Cards */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6">
            <h3 className="text-xs font-mono font-bold tracking-widest text-[#0EA5E9] uppercase">
              Direct Communication
            </h3>

            <div className="space-y-4">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-white hover:bg-[#25D366]/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-[#25D366] font-semibold">Direct Messaging</div>
                    <div className="text-sm font-bold">Chat on WhatsApp</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#25D366] group-hover:translate-x-0.5 transition-transform" />
              </a>

              {contact.phone && (
                <a
                  href={`tel:${cleanPhone}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0284C7]/20 border border-[#0284C7]/40 flex items-center justify-center text-[#0EA5E9]">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono text-slate-400">Direct Telephone</div>
                      <div className="text-sm font-bold">{contact.phone}</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </a>
              )}

              <a
                href={`mailto:${contact.email}`}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#16A34A]/20 border border-[#16A34A]/40 flex items-center justify-center text-[#16A34A]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-slate-400">Official Inquiries</div>
                    <div className="text-sm font-bold">{contact.email}</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Google Business Profile Block (Section 10) */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-[#EA580C]">
                <MapPin className="w-4 h-4" />
                <span>Google Business Profile</span>
              </div>
              <div className="flex items-center gap-1 text-amber-400 text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span className="font-bold">5.0</span>
                <span className="text-slate-400">(Verified)</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-heading font-bold text-white">
                {contact.companyName}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {contact.address.street}, {contact.address.city}, {contact.address.state}, {contact.address.postalCode}
              </p>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5 pt-1">
                <Clock className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>
                  {contact.workingHours?.[0]?.days}: {contact.workingHours?.[0]?.opens} – {contact.workingHours?.[0]?.closes}
                </span>
              </div>
            </div>

            {/* Embedded Google Map */}
            {contact.googleMapsEmbedUrl ? (
              <div className="rounded-xl overflow-hidden aspect-[16/9] border border-white/10">
                <iframe
                  src={contact.googleMapsEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="DIGEGAIN Location Map"
                />
              </div>
            ) : (
              <div className="aspect-[16/9] rounded-xl bg-[#060D1A] border border-white/10 flex items-center justify-center text-xs font-mono text-slate-500">
                Kochi Infopark Phase 2 · Kerala
              </div>
            )}

            {/* Google Business Profile Actions */}
            <div className="flex items-center gap-3 pt-2">
              {contact.googleBusinessProfileUrl && (
                <a
                  href={contact.googleBusinessProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-center text-slate-200 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Get Directions</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {contact.googleReviewUrl && (
                <a
                  href={contact.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-lg bg-[#EA580C]/10 hover:bg-[#EA580C]/20 border border-[#EA580C]/30 text-xs font-semibold text-center text-[#EA580C] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Star className="w-3 h-3 fill-[#EA580C]" />
                  <span>Leave a Review</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
