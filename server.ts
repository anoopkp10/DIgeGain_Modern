import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { constants as fsConstants } from 'node:fs';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';
import {
  readAppData,
  writeAppData,
  getContact,
  updateContact,
  getPortfolio,
  savePortfolioItem,
  deletePortfolioItem,
  getLeads,
  addLead,
  updateLead,
  deleteLead,
  getAssistantConfig,
  updateAssistantConfig,
  getSettings,
  updateSettings,
} from './src/lib/data.ts';
import {
  ContactFormSubmissionSchema,
  PortfolioItemSchema,
  LeadSchema,
  type PortfolioItem,
} from './src/lib/validators.ts';
import {
  createSessionToken,
  verifySessionToken,
  validateAdminCredentials,
  COOKIE_NAME,
} from './src/lib/auth.ts';
import {
  sendClientConfirmation,
  sendAdminNotification,
  verifySmtp,
} from './src/lib/mailer.ts';
import { streamChatResponse } from './src/lib/ai.ts';
import { checkRateLimit } from './src/lib/rate-limit.ts';
import {
  generateSitemapXml,
  generateRobotsTxt,
  generateLlmsTxt,
  generateLlmsFullTxt,
} from './src/lib/seo.ts';
import sharp from 'sharp';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Multer storage configuration for uploads
const UPLOADS_DIR = path.resolve(process.cwd(), 'public/uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVideo = file.mimetype.startsWith('video/');
    const targetDir = path.join(UPLOADS_DIR, 'portfolio', isVideo ? 'videos' : 'images');
    void fs.mkdir(targetDir, { recursive: true, mode: 0o755 })
      .then(() => fs.access(targetDir, fsConstants.R_OK | fsConstants.W_OK | fsConstants.X_OK))
      .then(() => cb(null, targetDir))
      .catch(err => cb(err as Error, targetDir));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
    cb(null, `${Date.now()}-${cleanName}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max limit
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/gif',
      'video/mp4',
      'video/webm',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Allowed: JPG, PNG, WEBP, AVIF, GIF, MP4, WEBM'));
    }
  },
});

// Admin authentication middleware
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.cookies[COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Admin session required' });
  }

  const { valid, username } = await verifySessionToken(token);
  if (!valid) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }

  (req as any).user = username;
  next();
}

// -------------------------------------------------------------
// SEO & AI Crawlers Routes
// -------------------------------------------------------------
app.get('/sitemap.xml', async (req, res) => {
  try {
    const data = await readAppData();
    const siteUrl = data.settings.siteUrl || `https://${req.get('host')}`;
    const xml = generateSitemapXml(data, siteUrl);
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
});

app.get('/robots.txt', (req, res) => {
  const siteUrl = `https://${req.get('host')}`;
  const txt = generateRobotsTxt(siteUrl);
  res.setHeader('Content-Type', 'text/plain');
  res.send(txt);
});

app.get('/llms.txt', async (req, res) => {
  try {
    const data = await readAppData();
    const siteUrl = data.settings.siteUrl || `https://${req.get('host')}`;
    const txt = generateLlmsTxt(data, siteUrl);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(txt);
  } catch (err) {
    res.status(500).send('Error generating llms.txt');
  }
});

app.get('/llms-full.txt', async (req, res) => {
  try {
    const data = await readAppData();
    const siteUrl = data.settings.siteUrl || `https://${req.get('host')}`;
    const txt = generateLlmsFullTxt(data, siteUrl);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(txt);
  } catch (err) {
    res.status(500).send('Error generating llms-full.txt');
  }
});

// -------------------------------------------------------------
// Public Data API Routes
// -------------------------------------------------------------
app.get('/api/appdata', async (req, res) => {
  try {
    const data = await readAppData();
    // Return sanitized public representation (hide private leads)
    res.json({
      contact: data.contact,
      portfolio: data.portfolio,
      assistant: {
        enabled: data.assistant.enabled,
        name: data.assistant.name,
        greeting: data.assistant.greeting,
        suggestedQuestions: data.assistant.suggestedQuestions,
        extraKnowledge: data.assistant.extraKnowledge.filter(k => k.public),
        leadCaptureEnabled: data.assistant.leadCaptureEnabled,
      },
      settings: {
        siteUrl: data.settings.siteUrl,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load application data' });
  }
});

app.get('/api/contact', async (req, res) => {
  try {
    const contact = await getContact();
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contact details' });
  }
});

app.get('/api/portfolio', async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const portfolio = await getPortfolio(category);
    res.json(portfolio);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

app.get('/api/assistant', async (req, res) => {
  try {
    const assistant = await getAssistantConfig();
    res.json(assistant);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assistant config' });
  }
});

// -------------------------------------------------------------
// Public Contact Form Submission
// -------------------------------------------------------------
app.post('/api/contact-form', async (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  // 1. IP Rate Limiting (30 requests per 10 minutes for testing & clients)
  const rate = checkRateLimit(`contact:${clientIp}`, 30, 10 * 60 * 1000);
  if (!rate.allowed) {
    return res.status(429).json({
      error: `Too many submissions. Please wait ${Math.ceil(rate.resetInMs / 60000)} minutes before trying again.`,
    });
  }

  // 2. Honeypot and Zod Validation
  const parseResult = ContactFormSubmissionSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: parseResult.error.issues[0]?.message || 'Validation error',
    });
  }

  const { name, email, phone, service, budget, message, website_trap } = parseResult.data;

  // Bot honeypot check
  if (website_trap && website_trap.length > 0) {
    return res.status(400).json({ error: 'Spam detected' });
  }

  // Validate mandatory phone/WhatsApp for contact-form submissions
  const cleanPhoneDigits = (phone || '').replace(/[^0-9]/g, '');
  if (req.body.source !== 'ai-assistant' && (!phone || cleanPhoneDigits.length < 7)) {
    return res.status(400).json({ error: 'Please provide a valid Phone / WhatsApp number (minimum 7 digits).' });
  }

  // 3. Prepare and persist Lead first so data is never lost
  const leadId = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const leadData = {
    id: leadId,
    name,
    email,
    phone: phone || '',
    service,
    budget: budget || '',
    message,
    source: (req.body.source === 'ai-assistant' ? 'ai-assistant' : 'contact-form') as 'contact-form' | 'ai-assistant',
    emailStatus: {
      clientConfirmation: 'pending' as const,
      adminNotification: 'pending' as const,
      error: '',
    },
    status: 'new' as const,
    createdAt: new Date().toISOString(),
  };

  try {
    await addLead(leadData);
    const appData = await readAppData();
    const recipientEmail = appData.settings.notifyEmail?.trim() || 'anoopkp10@gmail.com';

    // 4. Send Client Confirmation Email (using configured SMTP if available)
    const clientSend = await sendClientConfirmation(leadData, appData.contact, appData.settings.smtp);

    // 5. Send Admin Notification Email directly to configured email
    const adminSend = await sendAdminNotification(
      leadData,
      appData.contact,
      recipientEmail,
      appData.settings.smtp
    );

    // 6. Update lead status with exact email dispatch status
    await updateLead(leadId, {
      emailStatus: {
        clientConfirmation: clientSend.success ? 'sent' : 'failed',
        adminNotification: adminSend.success ? 'sent' : 'failed',
        error: clientSend.error || adminSend.error || '',
      },
    });

    res.json({
      success: true,
      message: `Thank you, ${name}! Your project requirements have been received and a notification has been sent to ${recipientEmail}. Our engineering team will respond within 24 hours.`,
      leadId,
      recipient: recipientEmail,
    });
  } catch (err: any) {
    console.error('Contact form submission error:', err);
    res.status(500).json({ error: 'Server error processing inquiry. Please try WhatsApp or email.' });
  }
});

// -------------------------------------------------------------
// Public AI Assistant Chat (Streaming SSE)
// -------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  // Rate limiting (20 messages per 10 minutes)
  const rate = checkRateLimit(`chat:${clientIp}`, 25, 10 * 60 * 1000);
  if (!rate.allowed) {
    return res.status(429).json({
      error: 'Chat rate limit reached. Please wait a few minutes before sending more messages.',
    });
  }

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    for await (const chunk of streamChatResponse(messages)) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.write(`data: ${JSON.stringify({ error: 'Chat service interrupted' })}\n\n`);
    res.end();
  }
});

// -------------------------------------------------------------
// Admin Auth Routes
// -------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const rate = checkRateLimit(`login:${clientIp}`, 10, 15 * 60 * 1000);
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many login attempts. Please wait 15 minutes.' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (!validateAdminCredentials(username, password)) {
    return res.status(401).json({ error: 'Invalid admin username or password' });
  }

  const token = await createSessionToken(username);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.json({ ok: true, user: username, token });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/me', async (req, res) => {
  const token = req.cookies[COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.json({ authenticated: false });
  }
  const { valid, username } = await verifySessionToken(token);
  res.json({ authenticated: valid, user: valid ? username : null });
});

// -------------------------------------------------------------
// Protected Admin Routes (Write & Management)
// -------------------------------------------------------------
function parsePortfolioJson<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error('Invalid JSON in portfolio form data');
  }
}

function slugifyPortfolioTitle(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function savePortfolioForm(
  body: Record<string, any>,
  files: Express.Multer.File[],
  itemId?: string,
): Promise<PortfolioItem> {
  const portfolio = await getPortfolio();
  const existing = itemId ? portfolio.find(item => item.id === itemId) : undefined;
  if (itemId && !existing) throw new Error('Portfolio item not found');

  const title = String(body.title ?? existing?.title ?? '').trim();
  const rawRetained = parsePortfolioJson(body.existingMedia, existing?.media ?? []);
  const retainedMedia = Array.isArray(rawRetained)
    ? rawRetained
    : rawRetained ? [rawRetained] : [];

  const uploadedMedia = files.map(file => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      type: isVideo ? 'video' as const : 'image' as const,
      path: `/uploads/portfolio/${isVideo ? 'videos' : 'images'}/${file.filename}`,
      alt: title || path.parse(file.originalname).name,
    };
  });

  // Strictly enforce one uploaded image/video per item through admin
  const finalMedia = uploadedMedia.length > 0
    ? [uploadedMedia[0]]
    : retainedMedia.slice(0, 1);

  const item = PortfolioItemSchema.parse({
    id: itemId || body.id || `prj-${Date.now()}`,
    slug: body.slug || existing?.slug || slugifyPortfolioTitle(title),
    title,
    category: body.category || existing?.category || 'Booking System',
    description: body.description ?? existing?.description ?? '',
    clientName: body.clientName ?? existing?.clientName ?? '',
    projectUrl: body.projectUrl ?? existing?.projectUrl ?? '',
    tags: parsePortfolioJson(body.tags, existing?.tags ?? []),
    media: finalMedia,
    coverIndex: 0,
    featured: body.featured === undefined
      ? existing?.featured ?? false
      : body.featured === true || body.featured === 'true',
    order: Number(body.order ?? existing?.order ?? 0),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return savePortfolioItem(item);
}

async function removeUploadedFiles(files: Express.Multer.File[]) {
  await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})));
}

app.put(['/api/admin/contact', '/api/contact'], requireAdmin, async (req, res) => {
  try {
    const updated = await updateContact(req.body);
    res.json({ success: true, contact: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update contact' });
  }
});

app.post(['/api/admin/portfolio', '/api/portfolio'], requireAdmin, upload.any() as any, async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) || [];
  try {
    const saved = await savePortfolioForm(req.body, files);
    res.json({ success: true, item: saved });
  } catch (err: any) {
    await removeUploadedFiles(files);
    res.status(400).json({ error: err.message || 'Failed to save portfolio project' });
  }
});

app.put(['/api/admin/portfolio/:id', '/api/portfolio/:id'], requireAdmin, upload.any() as any, async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) || [];
  try {
    const saved = await savePortfolioForm(req.body, files, req.params.id);
    res.json({ success: true, item: saved });
  } catch (err: any) {
    await removeUploadedFiles(files);
    res.status(400).json({ error: err.message || 'Failed to update portfolio project' });
  }
});

app.delete(['/api/admin/portfolio/:id', '/api/portfolio/:id'], requireAdmin, async (req, res) => {
  try {
    const deleted = await deletePortfolioItem(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete portfolio item' });
  }
});

app.post(['/api/admin/upload', '/api/upload'], requireAdmin, upload.single('file') as any, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const isVideo = req.file.mimetype.startsWith('video/');
    let finalPath = `/uploads/portfolio/${isVideo ? 'videos' : 'images'}/${req.file.filename}`;

    // Auto-convert images to webp with sharp for optimization
    if (!isVideo && req.file.mimetype !== 'image/webp') {
      try {
        const webpFilename = `${path.parse(req.file.filename).name}.webp`;
        const webpFullPath = path.join(path.dirname(req.file.path), webpFilename);

        await sharp(req.file.path)
          .webp({ quality: 85 })
          .toFile(webpFullPath);

        // Remove original raw file
        await fs.unlink(req.file.path);
        finalPath = `/uploads/portfolio/images/${webpFilename}`;
      } catch (sharpErr) {
        console.warn('Sharp conversion fallback, keeping original:', sharpErr);
      }
    }

    res.json({
      success: true,
      path: finalPath,
      type: isVideo ? 'video' : 'image',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Upload processing error' });
  }
});

app.delete(['/api/admin/upload', '/api/upload'], requireAdmin, async (req, res) => {
  const filePath = req.body.path;
  if (!filePath || !filePath.startsWith('/uploads/')) {
    return res.status(400).json({ error: 'Invalid file path' });
  }
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await fs.unlink(fullPath);
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'File not found or already removed' });
  }
});

// Leads routes - supports both /api/admin/leads and /api/leads
app.get(['/api/admin/leads', '/api/leads'], requireAdmin, async (req, res) => {
  try {
    const leads = await getLeads();
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

const handleUpdateLeadRoute = async (req: express.Request, res: express.Response) => {
  try {
    const updated = await updateLead(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Lead not found' });
    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
};

app.put(['/api/admin/leads/:id', '/api/leads/:id'], requireAdmin, handleUpdateLeadRoute);
app.patch(['/api/admin/leads/:id', '/api/leads/:id'], requireAdmin, handleUpdateLeadRoute);

app.delete(['/api/admin/leads/:id', '/api/leads/:id'], requireAdmin, async (req, res) => {
  try {
    const deleted = await deleteLead(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Lead not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

app.post(['/api/admin/leads/:id/resend', '/api/leads/:id/resend'], requireAdmin, async (req, res) => {
  try {
    const leads = await getLeads();
    const lead = leads.find(l => l.id === req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const appData = await readAppData();
    const recipientEmail = appData.settings.notifyEmail?.trim() || 'anoopkp10@gmail.com';
    const clientSend = await sendClientConfirmation(lead, appData.contact, appData.settings.smtp);
    const adminSend = await sendAdminNotification(lead, appData.contact, recipientEmail, appData.settings.smtp);

    const updated = await updateLead(lead.id, {
      emailStatus: {
        clientConfirmation: clientSend.success ? 'sent' : 'failed',
        adminNotification: adminSend.success ? 'sent' : 'failed',
        error: clientSend.error || adminSend.error || '',
      },
    });

    res.json({ success: true, lead: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retry email delivery' });
  }
});

app.get(['/api/admin/assistant', '/api/assistant'], requireAdmin, async (req, res) => {
  try {
    const assistant = await getAssistantConfig();
    res.json(assistant);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assistant config' });
  }
});

app.put(['/api/admin/assistant', '/api/assistant'], requireAdmin, async (req, res) => {
  try {
    const updated = await updateAssistantConfig(req.body);
    res.json({ success: true, assistant: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update assistant config' });
  }
});

app.get(['/api/admin/settings', '/api/settings'], requireAdmin, async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put(['/api/admin/settings', '/api/settings'], requireAdmin, async (req, res) => {
  try {
    const updated = await updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update settings' });
  }
});

app.post(['/api/admin/test-email', '/api/test-email'], requireAdmin, async (req, res) => {
  try {
    const appData = await readAppData();
    const recipient = req.body.email || appData.settings.notifyEmail || 'anoopkp10@gmail.com';

    const dummyLead = {
      id: `test-lead-${Date.now().toString(36)}`,
      name: 'DIGEGAIN Deliverability Test',
      email: recipient,
      phone: '+91 99612 25385',
      service: 'Web System Deliverability Verification',
      budget: 'Verified Test',
      message: 'This is a test notification verifying that DIGEGAIN lead alerts are delivered directly to your configured inbox.',
      source: 'contact-form' as const,
      emailStatus: { clientConfirmation: 'pending' as const, adminNotification: 'pending' as const, error: '' },
      status: 'new' as const,
      createdAt: new Date().toISOString(),
    };

    const adminSend = await sendAdminNotification(dummyLead, appData.contact, recipient, appData.settings.smtp);
    if (!adminSend.success) {
      return res.status(500).json({ success: false, message: adminSend.error || 'Failed to dispatch test email' });
    }

    const deliveryChannel = adminSend.method === 'smtp' ? 'configured SMTP server' : 'automated email relay';
    res.json({
      success: true,
      message: `Test email successfully dispatched to ${recipient} (via ${deliveryChannel}). Please check your inbox.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Email delivery test failed' });
  }
});

// -------------------------------------------------------------
// Static and Client Assets
// -------------------------------------------------------------
app.use(express.static(path.resolve(process.cwd(), 'public')));

async function startServer() {
  const dataDir = path.resolve(process.cwd(), 'data');
  await ensureWritableDirectory(dataDir, 0o700, 'data');
  await ensureWritableDirectory(UPLOADS_DIR, 0o755, 'public/uploads');

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DIGEGAIN] Server active on port ${PORT}`);
  });
}

async function ensureWritableDirectory(directory: string, mode: number, label: string) {
  await fs.mkdir(directory, { recursive: true, mode });
  try {
    await fs.access(directory, fsConstants.R_OK | fsConstants.W_OK | fsConstants.X_OK);
  } catch {
    throw new Error(`The Node.js process needs read/write access to ${label} (${directory}).`);
  }
}

startServer();
