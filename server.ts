import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
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
  destination: async (req, file, cb) => {
    const isVideo = file.mimetype.startsWith('video/');
    const targetDir = path.join(UPLOADS_DIR, 'portfolio', isVideo ? 'videos' : 'images');
    await fs.mkdir(targetDir, { recursive: true });
    cb(null, targetDir);
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

  // 1. IP Rate Limiting (5 requests per 10 minutes)
  const rate = checkRateLimit(`contact:${clientIp}`, 5, 10 * 60 * 1000);
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

    // 4. Send Client Confirmation Email
    const clientSend = await sendClientConfirmation(leadData, appData.contact);

    // 5. Send Admin Notification Email
    const adminSend = await sendAdminNotification(leadData, appData.contact, appData.settings.notifyEmail);

    // 6. Update lead status in background
    await updateLead(leadId, {
      emailStatus: {
        clientConfirmation: clientSend.success ? 'sent' : 'failed',
        adminNotification: adminSend.success ? 'sent' : 'failed',
        error: clientSend.error || adminSend.error || '',
      },
    });

    res.json({
      success: true,
      message: 'Thank you! Your inquiry has been received. Our engineering team will get back to you within 24 hours.',
      leadId,
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
app.put(['/api/admin/contact', '/api/contact'], requireAdmin, async (req, res) => {
  try {
    const updated = await updateContact(req.body);
    res.json({ success: true, contact: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update contact' });
  }
});

app.post(['/api/admin/portfolio', '/api/portfolio'], requireAdmin, async (req, res) => {
  try {
    const parsed = PortfolioItemSchema.parse({
      ...req.body,
      id: req.body.id || `prj-${Date.now()}`,
    });
    const saved = await savePortfolioItem(parsed);
    res.json({ success: true, item: saved });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to save portfolio project' });
  }
});

app.put(['/api/admin/portfolio/:id', '/api/portfolio/:id'], requireAdmin, async (req, res) => {
  try {
    const parsed = PortfolioItemSchema.parse({
      ...req.body,
      id: req.params.id,
    });
    const saved = await savePortfolioItem(parsed);
    res.json({ success: true, item: saved });
  } catch (err: any) {
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

app.post(['/api/admin/upload', '/api/upload'], requireAdmin, upload.single('file'), async (req, res) => {
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
    const clientSend = await sendClientConfirmation(lead, appData.contact);
    const adminSend = await sendAdminNotification(lead, appData.contact, appData.settings.notifyEmail);

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
    const smtpCheck = await verifySmtp();
    if (!smtpCheck.ok) {
      return res.status(400).json({ success: false, message: smtpCheck.message });
    }

    const appData = await readAppData();
    const dummyLead = {
      id: 'test-lead-001',
      name: 'DIGEGAIN Test Lead',
      email: req.body.email || appData.settings.notifyEmail || 'anoopkp10@gmail.com',
      phone: '+91 98470 12345',
      service: 'Booking System Test',
      budget: '₹1,00,000',
      message: 'This is a test notification verifying that DIGEGAIN SMTP delivery is functioning.',
      source: 'contact-form' as const,
      emailStatus: { clientConfirmation: 'pending' as const, adminNotification: 'pending' as const, error: '' },
      status: 'new' as const,
      createdAt: new Date().toISOString(),
    };

    const adminSend = await sendAdminNotification(dummyLead, appData.contact, dummyLead.email);
    if (!adminSend.success) {
      return res.status(500).json({ success: false, message: adminSend.error });
    }

    res.json({ success: true, message: `Test email successfully sent to ${dummyLead.email}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'SMTP test failed' });
  }
});

// -------------------------------------------------------------
// Static and Client Assets
// -------------------------------------------------------------
app.use(express.static(path.resolve(process.cwd(), 'public')));

async function startServer() {
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

startServer();
