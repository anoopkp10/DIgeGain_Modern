import { z } from 'zod';

export const ContactWorkingHourSchema = z.object({
  days: z.string().default('Mon–Sat'),
  opens: z.string().default('09:00'),
  closes: z.string().default('18:00'),
});

export const ContactSocialsSchema = z.object({
  facebook: z.string().default(''),
  instagram: z.string().default(''),
  linkedin: z.string().default(''),
  youtube: z.string().default(''),
  twitter: z.string().default(''),
  behance: z.string().default(''),
});

export const ContactAddressSchema = z.object({
  street: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  postalCode: z.string().default(''),
  country: z.string().default('IN'),
});

export const ContactGeoSchema = z.object({
  lat: z.number().default(0),
  lng: z.number().default(0),
});

export const ContactSchema = z.object({
  companyName: z.string().default('DIGEGAIN'),
  tagline: z.string().default('AI-Powered Web Systems & Digital Growth'),
  email: z.string().email().or(z.string()).default('hello@digergain.com'),
  phone: z.string().default(''),
  whatsappNumber: z.string().regex(/^\d*$/, 'Only digits allowed, no +').default(''),
  whatsappMessage: z.string().default("Hi DIGEGAIN, I'd like to discuss a project."),
  address: ContactAddressSchema.default({ street: '', city: '', state: '', postalCode: '', country: 'IN' }),
  geo: ContactGeoSchema.default({ lat: 0, lng: 0 }),
  googleBusinessProfileUrl: z.string().default(''),
  googleMapsEmbedUrl: z.string().default(''),
  googleReviewUrl: z.string().default(''),
  workingHours: z.array(ContactWorkingHourSchema).default([]),
  socials: ContactSocialsSchema.default({ facebook: '', instagram: '', linkedin: '', youtube: '', twitter: '', behance: '' }),
});

export const PortfolioMediaSchema = z.object({
  type: z.enum(['image', 'video']).default('image'),
  path: z.string(),
  alt: z.string().default(''),
});

export const PortfolioItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string().min(1, 'Title is required'),
  category: z.enum([
    'Booking System',
    'Order System',
    'Portfolio Website',
    'Dashboard',
    'Other',
  ]).default('Booking System'),
  description: z.string().default(''),
  clientName: z.string().default(''),
  projectUrl: z.string().default(''),
  tags: z.array(z.string()).default([]),
  media: z.array(PortfolioMediaSchema).default([]),
  coverIndex: z.number().int().default(0),
  featured: z.boolean().default(false),
  order: z.number().int().default(0),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

export const LeadEmailStatusSchema = z.object({
  clientConfirmation: z.enum(['sent', 'failed', 'pending']).default('pending'),
  adminNotification: z.enum(['sent', 'failed', 'pending']).default('pending'),
  error: z.string().default(''),
});

export const LeadSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().default(''),
  service: z.string().default('General Inquiry'),
  budget: z.string().default(''),
  message: z.string().default(''),
  source: z.enum(['contact-form', 'ai-assistant']).default('contact-form'),
  emailStatus: LeadEmailStatusSchema.default({
    clientConfirmation: 'pending',
    adminNotification: 'pending',
    error: '',
  }),
  status: z.enum(['new', 'contacted', 'closed']).default('new'),
  createdAt: z.string().default(() => new Date().toISOString()),
});

export const AssistantExtraKnowledgeSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  answer: z.string().min(1),
  public: z.boolean().default(true),
});

export const AssistantSchema = z.object({
  enabled: z.boolean().default(true),
  name: z.string().default('DIGEGAIN AI'),
  greeting: z.string().default("Hi! I'm DIGEGAIN's AI assistant. Ask me about our services, our approach, or past projects."),
  suggestedQuestions: z.array(z.string()).default([]),
  extraKnowledge: z.array(AssistantExtraKnowledgeSchema).default([]),
  leadCaptureEnabled: z.boolean().default(true),
});

export const SettingsSchema = z.object({
  notifyEmail: z.string().email().or(z.string()).default('anoopkp10@gmail.com'),
  siteUrl: z.string().default('https://digergain.com'),
});

export const AppDataSchema = z.object({
  contact: ContactSchema,
  portfolio: z.array(PortfolioItemSchema),
  leads: z.array(LeadSchema),
  assistant: AssistantSchema,
  settings: SettingsSchema,
});

export type ContactData = z.infer<typeof ContactSchema>;
export type PortfolioItem = z.infer<typeof PortfolioItemSchema>;
export type PortfolioMedia = z.infer<typeof PortfolioMediaSchema>;
export type LeadData = z.infer<typeof LeadSchema>;
export type Lead = LeadData;
export type AssistantData = z.infer<typeof AssistantSchema>;
export type AssistantExtraKnowledge = z.infer<typeof AssistantExtraKnowledgeSchema>;
export type SettingsData = z.infer<typeof SettingsSchema>;
export type AppData = z.infer<typeof AppDataSchema>;

// Contact form input validator with honeypot
export const ContactFormSubmissionSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please enter a valid email address').max(120),
  phone: z.string().trim().max(30).optional().default(''),
  service: z.string().trim().max(100).default('General Inquiry'),
  budget: z.string().trim().max(80).optional().default(''),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(3000),
  website_trap: z.string().max(0, 'Bot detected').optional().default(''), // honeypot
});
