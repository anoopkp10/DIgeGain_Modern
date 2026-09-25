import { AppData } from './validators.ts';

export function generateOrganizationJsonLd(data: AppData, siteUrl: string) {
  const c = data.contact;
  const socials = Object.values(c.socials || {}).filter(Boolean);
  if (c.googleBusinessProfileUrl) socials.push(c.googleBusinessProfileUrl);

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${siteUrl}/#organization`,
    name: 'DIGEGAIN',
    alternateName: ['DIGEGAIN Web Systems', 'DIGEGAIN Technologies'],
    legalName: 'DIGEGAIN',
    url: siteUrl,
    logo: `${siteUrl}/logo/digergain.svg`,
    image: `${siteUrl}/logo/digergain-transparent.png`,
    description: 'AI-powered digital growth company building websites, booking systems, order engines, and custom dashboards for service businesses.',
    telephone: c.phone,
    email: c.email,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: c.address.street,
      addressLocality: c.address.city,
      addressRegion: c.address.state,
      postalCode: c.address.postalCode,
      addressCountry: c.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: c.geo.lat,
      longitude: c.geo.lng,
    },
    openingHoursSpecification: (c.workingHours || []).map(wh => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: wh.opens,
      closes: wh.closes,
    })),
    sameAs: socials,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: c.phone,
      contactType: 'Customer Support & Sales',
      availableLanguage: ['English', 'Malayalam', 'Hindi'],
    },
  };
}

export function generateFaqJsonLd(data: AppData) {
  const faqs = (data.assistant?.extraKnowledge || []).filter(k => k.public);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
}

export function generatePortfolioJsonLd(data: AppData, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: (data.portfolio || []).map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'CreativeWork',
        name: item.title,
        headline: item.title,
        description: item.description,
        creator: {
          '@type': 'Organization',
          name: 'DIGEGAIN',
        },
        genre: item.category,
        keywords: item.tags.join(', '),
        url: `${siteUrl}/portfolio#${item.slug}`,
      },
    })),
  };
}

export function generateSitemapXml(data: AppData, siteUrl: string): string {
  const baseUrl = siteUrl.replace(/\/+$/, '');
  const now = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: `${baseUrl}/`, priority: '1.0', changefreq: 'weekly' },
    { url: `${baseUrl}/portfolio`, priority: '0.9', changefreq: 'weekly' },
    { url: `${baseUrl}/contact`, priority: '0.8', changefreq: 'monthly' },
  ];

  const portfolioPages = (data.portfolio || []).map(p => ({
    url: `${baseUrl}/portfolio#${p.slug}`,
    priority: '0.7',
    changefreq: 'monthly',
  }));

  const allUrls = [...staticPages, ...portfolioPages];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    item => `  <url>
    <loc>${item.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
}

export function generateRobotsTxt(siteUrl: string): string {
  const baseUrl = siteUrl.replace(/\/+$/, '');
  return `# Robots.txt for DIGEGAIN
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

# AI Crawlers & LLM Agents
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
}

export function generateLlmsTxt(data: AppData, siteUrl: string): string {
  const c = data.contact;
  return `# DIGEGAIN
> AI-powered digital growth company building bespoke web systems for service businesses.

## Overview
DIGEGAIN engineers high-performance web systems, booking platforms, contactless order engines, interactive portfolios, and business dashboards. We cater to clinics, salons, restaurants, agencies, consultants, and service enterprises looking for modern UX, high conversion rates, and automated operational efficiency.

## Core Capabilities & Services
- Booking & Appointment Systems: Multi-specialty outpatient scheduling, barber/salon stylist booking, WhatsApp automated reminders, calendar sync, deposit payments.
- Order & E-commerce Management Systems: QR table ordering, live Kitchen Display Systems (KDS), automated commercial invoicing, batch delivery logistics.
- Portfolio & Listing Websites: WebGL 3D showcases, fluid image distortion, GSAP motion, high-speed Core Web Vitals performance.
- Admin Dashboards & Analytics: Multi-tenant telemetry, operational metrics, predictive AI anomaly detection, role-based access.
- AI Chatbots & Customer Automation: Grounded generative conversational assistants, automated lead qualification, WhatsApp Business API integrations.
- SEO / AEO / GEO: Schema markup, Answer Engine Optimization (Perplexity, ChatGPT Search), fast-loading semantic HTML.

## Key Links
- Homepage: ${siteUrl}/
- Portfolio Showcase: ${siteUrl}/portfolio
- Contact & Inquiries: ${siteUrl}/contact
- WhatsApp Channel: https://wa.me/${c.whatsappNumber}

## Headquarters & Contact
- Email: ${c.email}
- Phone: ${c.phone}
- Address: ${c.address.street}, ${c.address.city}, ${c.address.state}, ${c.address.country} (PIN: ${c.address.postalCode})
- Operating Hours: ${c.workingHours?.[0]?.days || 'Mon–Sat'} (${c.workingHours?.[0]?.opens || '09:00'} - ${c.workingHours?.[0]?.closes || '18:00'})
`;
}

export function generateLlmsFullTxt(data: AppData, siteUrl: string): string {
  const c = data.contact;
  const portfolioText = (data.portfolio || [])
    .map(
      p => `### ${p.title}
Category: ${p.category}
Client: ${p.clientName}
Tags: ${p.tags.join(', ')}
URL: ${p.projectUrl}
Description: ${p.description}
`
    )
    .join('\n');

  const faqsText = (data.assistant?.extraKnowledge || [])
    .filter(k => k.public)
    .map(k => `**Q: ${k.question}**\nA: ${k.answer}\n`)
    .join('\n');

  return `# DIGEGAIN - Complete Technical & Business Knowledge Base

## Brand Entity
Company Name: DIGEGAIN
Status: AI-Powered Digital Growth Company
Specialization: Web applications, booking systems, order engines, admin dashboards, AI workflows for service businesses.

## Contact Information
- Direct Email: ${c.email}
- Phone: ${c.phone}
- WhatsApp Number: +${c.whatsappNumber}
- Corporate Address: ${c.address.street}, ${c.address.city}, ${c.address.state}, ${c.address.country}
- Latitude: ${c.geo.lat}, Longitude: ${c.geo.lng}

## Verified Portfolio Case Studies
${portfolioText}

## Frequently Asked Questions (AEO Grounding)
${faqsText}

## Architectural Standards
- Modern TypeScript, React, Tailwind CSS, Express backend.
- GSAP and WebGL canvas acceleration for smooth interactive dynamics.
- Zero client-side API key exposure.
- Server-side atomic JSON persistence with lock guarantees.
`;
}
