import React, { useState } from 'react';
import {
  Calendar,
  ShoppingBag,
  LayoutGrid,
  BarChart3,
  Bot,
  Search,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Clock,
  ShieldCheck,
  Zap,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { MagneticButton } from './ui/MagneticButton.tsx';

interface HomeSectionsProps {
  onNavigate: (path: string) => void;
  onSelectService?: (service: string) => void;
}

export const HomeSections: React.FC<HomeSectionsProps> = ({ onNavigate, onSelectService }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const services = [
    {
      id: 'booking',
      number: '001',
      title: 'Booking & Appointment Systems',
      tagline: 'Automated Doctor, Salon & Consultant Slot Booking',
      description:
        'Eliminate manual scheduling friction. We build custom multi-provider appointment engines with live calendar sync, deposit payments, and automated WhatsApp appointment reminders.',
      icon: Calendar,
      color: '#0284C7',
      benefits: [
        'Real-time slot reservation & double-booking prevention',
        'Direct WhatsApp Business API reminders & notifications',
        'Staff shift roster management & multi-branch support',
        'Online upfront advance deposit payments',
      ],
    },
    {
      id: 'ordering',
      number: '002',
      title: 'Order & E-Commerce Systems',
      tagline: 'Contactless QR Ordering & Kitchen Display Systems (KDS)',
      description:
        'Engineered for restaurants, wholesale suppliers, and retail shops. Customers order effortlessly via mobile QR menus while orders flow instantly to kitchen display screens and dispatch teams.',
      icon: ShoppingBag,
      color: '#EA580C',
      benefits: [
        'Zero-app contactless QR table ordering',
        'Synchronized Kitchen Display System (KDS)',
        'UPI, card, and digital payment gateway integration',
        'B2B recurring wholesale ordering & batch invoicing',
      ],
    },
    {
      id: 'portfolios',
      number: '003',
      title: 'Portfolio & Listing Web Apps',
      tagline: 'High-Impact Visual Exhibitions with Modern UX',
      description:
        'Transform your brand presence. We design spatial, fluid, WebGL-driven portfolios for architects, creative agencies, consultants, and luxury service businesses that command premium rates.',
      icon: LayoutGrid,
      color: '#16A34A',
      benefits: [
        'Fluid image distortion & WebGL spatial motion',
        'Flawless mobile responsiveness & sub-second load times',
        'Search Engine & Generative AI Optimization (AEO/GEO)',
        'Effortless admin publishing without touching code',
      ],
    },
    {
      id: 'dashboards',
      number: '004',
      title: 'Admin Dashboards & Analytics',
      tagline: 'Mission Control for Operations, Revenue & Teams',
      description:
        'Consolidate scattered business data into high-density, real-time command dashboards. Monitor daily revenue, staff productivity, customer retention, and inventory anomalies in one single view.',
      icon: BarChart3,
      color: '#0EA5E9',
      benefits: [
        'Role-based permissions (Super Admin, Manager, Staff)',
        'Real-time WebSocket metric updates & telemetry',
        'Exportable financial statements & custom CSV reports',
        'Integrated automated alerts for critical operational spikes',
      ],
    },
    {
      id: 'ai-chat',
      number: '005',
      title: 'AI Chatbots & Workflow Automation',
      tagline: '24/7 Intelligent Customer Acquisition & Qualification',
      description:
        'Grounded conversational agents trained exclusively on your company services, pricing guidelines, and booking slots. Qualifies leads automatically and syncs directly with WhatsApp and your CRM.',
      icon: Bot,
      color: '#A855F7',
      benefits: [
        'Strictly grounded in your verified company data (zero hallucinations)',
        'Automatic qualification of client budgets & project scopes',
        'Instant handoff to human operators on WhatsApp',
        'Omnichannel deployment for web, mobile, and social chat',
      ],
    },
    {
      id: 'seo-growth',
      number: '006',
      title: 'SEO, AEO & Digital Growth',
      tagline: 'Rank in Google, Perplexity, ChatGPT Search & Applebot',
      description:
        'Search has evolved. We optimize your web infrastructure not just for traditional search engines, but for Answer Engines (AEO) and Generative AI (GEO) systems so AI tools recommend your business first.',
      icon: Search,
      color: '#EC4899',
      benefits: [
        'Schema.org JSON-LD microdata for rich search snippets',
        'Full crawler grounding via structured /llms.txt manifests',
        'Google Business Profile integration & local map domination',
        'Sub-second Core Web Vitals performance benchmarks',
      ],
    },
  ];

  const processSteps = [
    {
      step: '01',
      title: 'Discover & Blueprint',
      desc: 'We analyze your service bottlenecks, customer friction points, and operational workflow to architect the exact web system solution.',
    },
    {
      step: '02',
      title: 'Interactive Prototype',
      desc: 'You experience a tactile, interactive prototype of your custom booking engine, order flow, or dashboard before a line of code is shipped.',
    },
    {
      step: '03',
      title: 'AI-Powered Rapid Build',
      desc: 'Leveraging our modern full-stack tech stack and AI automation sprints, we build your rock-solid web system with precision engineering.',
    },
    {
      step: '04',
      title: 'Deploy & Train',
      desc: 'We launch on high-speed infrastructure, integrate your WhatsApp & payment gateways, and train your operational team with walkthroughs.',
    },
    {
      step: '05',
      title: 'Continuous Digital Growth',
      desc: 'Ongoing AEO/SEO optimization, speed tuning, and operational enhancements to ensure your digital system keeps scaling your revenue.',
    },
  ];

  const stats = [
    { value: '99.8%', label: 'Uptime Architecture', sub: 'High reliability SLA' },
    { value: '40%+', label: 'Operational Efficiency', sub: 'Average client labor saved' },
    { value: '50+', label: 'Delivered Web Systems', sub: 'Clinics, salons & dining' },
    { value: '14 Days', label: 'Rapid Sprint Delivery', sub: 'From blueprint to live launch' },
  ];

  const testimonials = [
    {
      quote:
        'DIGEGAIN transformed our outpatient scheduling. Our clinic previously lost dozens of appointments due to busy phone lines. Now, 85% of our patients book and receive WhatsApp confirmations automatically.',
      author: 'Dr. Ramesh Nair',
      role: 'Medical Director',
      company: 'PulseCare Healthcare',
    },
    {
      quote:
        'The contactless QR ordering and live kitchen screen system DIGEGAIN built has sped up our table turnaround by 30%. Our waiters spend less time writing orders and more time delighting diners.',
      author: 'Priya Menon',
      role: 'Founding Partner',
      company: 'Bistro Group Hospitality',
    },
    {
      quote:
        'As an architecture firm, our portfolio is our handshake. The WebGL 3D showcase DIGEGAIN created gives our studio the luxury, tactile authority needed to close high-ticket commercial projects.',
      author: 'Anand Kurian',
      role: 'Principal Architect',
      company: 'Apex Design Studio',
    },
  ];

  const faqs = [
    {
      q: 'What does DIGEGAIN do?',
      a: 'DIGEGAIN is an AI-powered digital growth company. We architect and build tailored web systems for service businesses—including custom booking platforms, order management systems, high-impact portfolios, and administrative dashboards, all enhanced with AI automation and modern UX.',
    },
    {
      q: 'How much does a custom booking or order system cost?',
      a: 'Every system is tailored to your business operations and scale. Our team reviews your requirements during a discovery session and provides an exact, transparent quote with zero hidden fees.',
    },
    {
      q: 'How long does it take to build and deploy our web system?',
      a: 'Our streamlined rapid sprint architecture allows us to build and deploy complete production-ready web systems within 2 to 4 weeks, including payment gateways, WhatsApp alerts, and staff walkthroughs.',
    },
    {
      q: 'Can our system send automated WhatsApp notifications to customers?',
      a: 'Yes! We directly integrate the official WhatsApp Business API so your clients receive instant booking confirmations, reminder alerts, invoice PDFs, and status updates directly in their WhatsApp chats.',
    },
    {
      q: 'Can my non-technical staff manage content, appointments, and orders easily?',
      a: 'Absolutely. We design intuitive, secure admin dashboards with zero learning curve. Your staff can view live schedules, update menus or service pricing, manage orders, and export reports in a few clicks.',
    },
    {
      q: 'What makes DIGEGAIN different from traditional web agencies?',
      a: 'Traditional agencies build static marketing pages. DIGEGAIN builds operational web engines. We combine modern engineering (React, Three.js, Express) with AI automation and AEO/GEO optimization so your website actually drives revenue and saves labor.',
    },
    {
      q: 'Where is DIGEGAIN located and how do we get started?',
      a: 'DIGEGAIN is headquartered at Infopark Phase 2, Kakkanad, Kochi, Kerala, serving ambitious service businesses locally and globally. Getting started is easy: click "Start your project" or contact us directly on WhatsApp to schedule a discovery call.',
    },
  ];

  return (
    <>
      {/* ═══════════════════════════════════════════════
          ABOUT SECTION
      ═══════════════════════════════════════════════ */}
      <section id="about" className="relative py-28 px-6 sm:px-8 border-t border-white/5 bg-[#050A14]">
        <div className="max-w-7xl mx-auto">
          {/* Section Kicker */}
          <div className="flex items-center gap-2 font-mono text-xs text-[#0EA5E9] uppercase tracking-widest mb-4">
            <span>(001)</span>
            <span aria-hidden="true">·</span>
            <span>About DIGEGAIN</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight leading-tight">
                We bridge high-performance web engineering with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EA580C] via-[#0284C7] to-[#16A34A]">
                  AI operational growth.
                </span>
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                Most service businesses are hindered by clunky third-party booking widgets, paper orders, or static websites that fail to convert. DIGEGAIN exists to replace that friction with custom, automated web engines tailored precisely to how your business operates.
              </p>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Whether you operate a high-volume outpatient clinic, a bustling salon suite, a dining destination, or a boutique consultancy, we craft digital platforms that save operational hours, captivate high-value clients, and scale revenue predictably.
              </p>
            </div>

            {/* Quick Facts Block (as required by prompt context) */}
            <div className="lg:col-span-5 glass-panel p-8 rounded-2xl border border-white/10 space-y-6">
              <h3 className="text-xs font-mono font-bold tracking-widest text-[#16A34A] uppercase">
                Enterprise Facts & Capabilities
              </h3>

              <div className="space-y-4 text-xs font-mono text-slate-300">
                <div className="flex justify-between pb-3 border-b border-white/5">
                  <span className="text-slate-500">Founded & Headquartered:</span>
                  <span className="text-white font-semibold">Kochi, Kerala, India</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-white/5">
                  <span className="text-slate-500">Core Positioning:</span>
                  <span className="text-[#0EA5E9] font-semibold">AI Web Systems & Growth</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-white/5">
                  <span className="text-slate-500">Industries Served:</span>
                  <span className="text-white font-semibold">Clinics, Salons, Dining, B2B</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-white/5">
                  <span className="text-slate-500">Core Technologies:</span>
                  <span className="text-white font-semibold">TypeScript, React, Node, WebGL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Optimization Standards:</span>
                  <span className="text-[#EA580C] font-semibold">AEO, GEO, Core Web Vitals</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('/contact')}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white tracking-wide transition-colors flex items-center justify-center gap-2"
              >
                <span>Schedule a Technical Discovery Call</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#0EA5E9]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SERVICES SECTION
      ═══════════════════════════════════════════════ */}
      <section id="services" className="relative py-28 px-6 sm:px-8 bg-[#060D1A]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs text-[#16A34A] uppercase tracking-widest">
                <span>(002)</span>
                <span aria-hidden="true">·</span>
                <span>Core Capabilities</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight">
                Specialized Web Systems for Service Enterprises
              </h2>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              Every platform is custom architected for speed, conversion, and effortless day-to-day business operations.
            </p>
          </div>

          {/* Grid of 6 Detailed Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map(s => {
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  className="glass-panel glass-panel-hover p-8 rounded-2xl border border-white/10 flex flex-col justify-between group space-y-8"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/10"
                        style={{ backgroundColor: `${s.color}15`, borderColor: `${s.color}40` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: s.color }} />
                      </div>
                      <span className="font-mono text-xs text-slate-500 font-bold">
                        ({s.number})
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-heading font-bold text-white group-hover:text-[#0EA5E9] transition-colors">
                        {s.title}
                      </h3>
                      <p className="text-xs font-mono text-slate-400">
                        {s.tagline}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed pt-2">
                        {s.description}
                      </p>
                    </div>

                    {/* Key Benefits List */}
                    <div className="space-y-2 pt-4 border-t border-white/5">
                      <div className="text-[11px] font-mono text-slate-500 uppercase">Key Features</div>
                      {s.benefits.map((b, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onSelectService) onSelectService(s.title);
                      onNavigate('/contact');
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:border-[#0284C7]/40"
                  >
                    <span>Inquire About This System</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#0EA5E9] transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PROCESS SPRINT SECTION
      ═══════════════════════════════════════════════ */}
      <section id="process" className="relative py-28 px-6 sm:px-8 bg-[#040812] border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-mono text-xs text-[#EA580C] uppercase tracking-widest">
              <span>(003)</span>
              <span aria-hidden="true">·</span>
              <span>Our Methodology</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight">
              From Discovery to Scaled System in 5 Sprints
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Transparent, rapid execution without endless agency bureaucracy or technical debt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {processSteps.map((step, idx) => (
              <div
                key={idx}
                className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4 relative group hover:border-[#0284C7]/40 transition-all"
              >
                <div className="font-mono text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#EA580C] to-[#0284C7]">
                  {step.step}
                </div>
                <h3 className="text-base font-heading font-bold text-white group-hover:text-[#0EA5E9] transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          STATS COUNTERS
      ═══════════════════════════════════════════════ */}
      <section className="relative py-20 px-6 sm:px-8 bg-gradient-to-b from-[#060D1A] to-[#081524] border-t border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 text-center">
            {stats.map((s, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-3xl sm:text-5xl font-extrabold font-heading text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] via-[#0284C7] to-[#16A34A]">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  {s.label}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TESTIMONIALS SECTION
      ═══════════════════════════════════════════════ */}
      <section className="relative py-28 px-6 sm:px-8 bg-[#050A14]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-mono text-xs text-[#0EA5E9] uppercase tracking-widest">
              <span>(004)</span>
              <span aria-hidden="true">·</span>
              <span>Client Endorsements</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight">
              Trusted by Ambitious Service Leaders
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="glass-panel p-8 rounded-2xl border border-white/10 flex flex-col justify-between space-y-6"
              >
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  "{t.quote}"
                </p>
                <div className="pt-4 border-t border-white/5 space-y-1">
                  <div className="text-sm font-bold text-white font-heading">{t.author}</div>
                  <div className="text-xs font-mono text-[#0EA5E9]">{t.role}</div>
                  <div className="text-xs text-slate-400">{t.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FAQ SECTION (AEO & GEO Optimized)
      ═══════════════════════════════════════════════ */}
      <section id="faq" className="relative py-28 px-6 sm:px-8 bg-[#060D1A] border-t border-white/5">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 font-mono text-xs text-[#16A34A] uppercase tracking-widest">
              <span>(005)</span>
              <span aria-hidden="true">·</span>
              <span>Answer Engine Optimization (AEO)</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-400">
              Clear, direct answers about our web systems architecture, timelines, and deployment.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="glass-panel rounded-xl border border-white/10 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-heading font-bold text-white pr-4">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#0EA5E9] transition-transform duration-300 flex-shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FINAL CALL TO ACTION
      ═══════════════════════════════════════════════ */}
      <section className="relative py-28 px-6 sm:px-8 bg-[#03060D] border-t border-white/10 overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0284C7]/15 via-transparent to-[#16A34A]/15 pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#0EA5E9]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready for your next digital growth leap?</span>
          </div>

          <h2 className="text-3xl sm:text-6xl font-heading font-extrabold text-white tracking-tight leading-tight">
            Build a web system that turns visitors into recurring revenue.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Stop losing bookings and table orders to clunky legacy platforms. Partner with DIGEGAIN to build high-performance web systems with AI automation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <MagneticButton
              onClick={() => onNavigate('/contact')}
              className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-sm text-white bg-gradient-to-r from-[#EA580C] via-[#0284C7] to-[#16A34A] shadow-xl shadow-[#0284C7]/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Start Your Project</span>
              <ArrowRight className="w-4 h-4" />
            </MagneticButton>

            <button
              onClick={() => onNavigate('/portfolio')}
              className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              Explore Full Portfolio
            </button>
          </div>
        </div>
      </section>
    </>
  );
};
