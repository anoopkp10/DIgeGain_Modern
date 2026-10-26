# DIGEGAIN — Technical Guide (PART B: Developers/Admins/DevOps)

## 1. Stack
| Layer | Tech | Purpose |
|-------|------|---------|
| Frontend | React 19 + TS, Vite 8, Tailwind 4, motion 12, three 0.186, lucide-react, canvas-confetti | SPA (main.tsx->App.tsx), custom pushState router, 3D hero |
| Backend | Node 22+, Express 4.21, tsx dev / esbuild bundle server.js prod | One server: site + /api + uploads + email + AI |
| Validation | Zod 4 (validators.ts) | Contact/Portfolio/Lead/Assistant/Smtp/Settings/AppData + honeypot form schema |
| Auth | jose HS256 JWT 7d + cookie-parser | Cookie digegain_admin_session (HttpOnly) + Bearer fallback |
| Email | Nodemailer 10 pooled + HTTPS relay (formsubmit ajax) | SMTP primary, relay fallback for admin alerts |
| AI | @google/genai gemini-2.5-flash + fallbackSmartReply | Grounded SSE streaming chat |
| Uploads | multer 2 disk 100MB whitelist + sharp WebP q85 | 1 media/item under public/uploads/portfolio/images|videos |
| Store | data/appdata.json + backup + tmp-rename + mutex | Zero-DB CMS; example seed on first run |
| SEO | seo.ts + GA4 G-J2ZFSD2WPS | sitemap/robots/llms/llms-full + JSON-LD Org/FAQ/Portfolio |
| Deploy | Hostinger Node app npm start -> node server.js | dist static + SPA fallback; persist data/ + uploads/ |

Scripts: dev=tsx server.ts (Vite middlewareMode), build=vite build + esbuild server.ts --bundle --packages=external, start=node server.js, lint=tsc --noEmit.

## 2. Repo Map
server.ts (all routes/static/boot), src/main.tsx, src/App.tsx (router + /api/appdata + /api/auth/me),
components: Header/Footer/Hero/HeroCanvas/HomeSections/PortfolioPage/PortfolioCard/ProjectDetailModal/ContactPage/WhatsAppFab/ui/AdminLogin/AdminDashboard/chat/ChatWidget,
## 3. Workflows
### 3.1 Boot
startServer(): ensureWritableDirectory(data/ 0700, uploads/ 0755) + R/W/X check. Dev: vite.middlewares. Prod: express.static(dist) + * -> dist/index.html. listen(PORT,0.0.0.0). JSON 10mb. Multer sanitizes filename ([^a-z0-9_-]->_ + Date.now prefix).

### 3.2 Content Load
App.tsx GET /api/appdata -> {contact, portfolio, assistant(public FAQs only), settings:{siteUrl}} -> routes / /portfolio /contact /admin. Service pre-select flows to contact form. Thank-You is session-only (cleared leaving /contact).

### 3.3 Contact Pipeline POST /api/contact-form
Browser (honeypot website_trap, double-submit guard, confetti, GA contact_form_submit)
-> rate contact:<ip> 30/10min (429) -> Zod ContactFormSubmissionSchema (name>=2, email, msg 10-3000, trap empty) -> phone digits>=7 (unless ai-assistant) -> addLead() FIRST (lead-<ts>-<rand>, new, pending/pending) -> sendClientConfirmation (SMTP only) -> sendAdminNotification (SMTP then relay) -> updateLead emailStatus -> 200 {success,message,leadId,recipient}.
Resend: POST /api/leads/:id/resend (auth). Test: POST /api/test-email dummy lead -> {method: smtp|relay}.

### 3.4 AI Chat POST /api/chat (SSE text/event-stream)
Rate chat:<ip> 25/10min. {messages:[{role,content}]}. streamChatResponse reads appdata, buildSystemPrompt (company+portfolio+public FAQs+rules: no invented pricing, WA handoff, markdown), generateContentStream(model LLM_MODEL||gemini-2.5-flash, temp 0.7) -> data:{"text":chunk} ... [DONE]. No key/error -> fallbackSmartReply keyword engine (word-stream 20ms). In-chat lead -> POST /api/contact-form source=ai-assistant.

### 3.5 Admin (requireAdmin: cookie OR Bearer)
PUT /api/contact|/api/admin/contact -> updateContact.
POST|PUT|DELETE /api/portfolio[/:id] (multer .any()): one media/item, slugify, tags/existingMedia JSON-parse, failed validation deletes uploads, delete unlinks files.
POST /api/upload (single file + Sharp WebP) -> {path,type}. DELETE /api/upload {path must start /uploads/}.
GET|PUT|PATCH|DELETE /api/leads[/:id], POST /api/leads/:id/resend.
GET|PUT /api/assistant, /api/settings {notifyEmail,siteUrl,smtp{host,port,user,pass,secure,fromEmail,fromName}}, POST /api/test-email.
Auth: POST /api/auth/login (rate login:<ip> 10/15min, Set-Cookie HttpOnly Secure SameSite=None 7d + {token}), GET /api/auth/me, POST /api/auth/logout.
Public reads: /api/contact, /api/portfolio?category=, /api/appdata (sanitized). SEO: /sitemap.xml /robots.txt /llms.txt /llms-full.txt live from appdata.

lib: validators/data/auth/mailer/email-templates/ai/rate-limit/seo/analytics,
data/appdata.json (live), public/data/appdata.example.json (seed), public/uploads/, dist/, .env, vite.config.ts (React+Tailwind, @->., HMR ignores data/ uploads/), tsconfig ES2022.
## 4. Email Deep Dive (mailer.ts + email-templates.ts)
Transport createTransporter(customSmtp?): env SMTP_HOST/PORT/USER/PASS/SECURE overridden by settings.smtp (UI). 465->secure else 587/false. pool 3/50, tls.rejectUnauthorized:false. Null if host/user/pass missing.
Verify: transporter.verify() -> {ok,message}.
Admin notify (guaranteed): SMTP (from MAIL_FROM||Name<user>, to notifyEmail||ADMIN_NOTIFY_EMAIL||anoopkp10@gmail.com, replyTo lead.email, [New Lead] Name-Service, HTML+text with Reply/WA buttons). On fail/no-transporter -> sendHttpEmailRelay POST formsubmit.co/ajax/<recipient> (_subject,_replyto,table,IST time). Any HTTP response = dispatched (method:relay).
Client confirm SMTP-only: branded card + WhatsApp CTA. Skipped if unconfigured (failed, retryable).
Templates: sanitizeHtml escapes &<>"'. WA links encodeURIComponent.
Status: Lead.emailStatus {clientConfirmation,adminNotification: sent|failed|pending, error} shown as dots.

## 5. Security
Auth: HS256 {sub,role:admin} 7d; SESSION_SECRET (prod empty fails closed; dev fallback). Cookie HttpOnly Secure SameSite=None 7d + Bearer. Login rate-limited.
Input: Zod server-side incl. AppDataSchema.parse before write. Honeypot trap, phone check, length caps. Multer whitelist (jpg/png/webp/avif/gif/mp4/webm) 100MB + sanitize + join containment; delete guard /uploads/. HTML escaped. JSON 10mb.
Abuse: in-memory per-IP (contact 30/10m, chat 25/10m, login 10/15m) + 5min sweep (single-process; use Redis if scaled).
FS: data 0700, json 0600 tmp+rename, uploads 0755, no 777. Rolling backup + mutex.
Exposure: /api/appdata strips leads/private FAQs/SMTP/notifyEmail. No client keys (Gemini server-only).
TODO: hash admin password, CSRF, persistent limiter, audit log, SECRET length check, SPF/DKIM/DMARC.

## 6. Data Shapes
Contact{companyName,tagline,email,phone,whatsappNumber,whatsappMessage,address,geo,google URLs,workingHours[],socials}. PortfolioItem{id,slug,title,category Booking|Order|Portfolio|Dashboard|Other,description,clientName,projectUrl,tags[],media[{type,path,alt}],coverIndex,featured,order,dates}. Lead{id,name,email,phone,service,budget,message,source, emailStatus,status new|contacted|closed,createdAt}. Assistant{enabled,name,greeting,suggestedQuestions[],extraKnowledge[{id,question,answer,public}],leadCaptureEnabled}. Settings{notifyEmail,siteUrl,smtp?{host,port,user,pass,secure,fromEmail,fromName}}.

## 7. Env, Run, Deploy
.env from .env.example. Prod required: ADMIN_USERNAME/PASSWORD/SESSION_SECRET. Email: SMTP_HOST/PORT/USER/PASS/SECURE, MAIL_FROM, ADMIN_NOTIFY_EMAIL. AI: GEMINI_API_KEY, LLM_MODEL. System: NODE_ENV=production, PORT.
Local: npm i -> .env -> npm run dev (:3000) -> npm run lint. Build: npm run build -> npm start.
Hostinger Node22+: root=project, startup server.js / npm start, npm ci --include=dev && npm run build, persist data/ + uploads/, set env, restart. /api/appdata 404=wrong app binding/start file; 500=missing example/unwritable data/.
Ops: backup data/*.json + uploads/ before updates. Fix SMTP -> Verify -> Resend.

