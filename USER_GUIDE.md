# DIGEGAIN — User Guide (PART A: Normal Users & Admin Editors)
No coding needed. Site: https://digegain.com | Admin: https://digegain.com/admin

## 1. What is DIGEGAIN?
DIGEGAIN builds AI-powered web systems for service businesses:
1. Booking & Appointment Systems (clinic, salon, calendar sync + WhatsApp reminders)
2. Order & E-Commerce Systems (restaurant QR ordering, Kitchen Display KDS, B2B portals)
3. Portfolio & Listing Websites (fast WebGL/motion sites)
4. Admin Dashboards & Analytics
5. AI Chatbots & Automation
6. SEO / AEO / GEO Growth (Google + ChatGPT/Perplexity/Gemini answers)

Visitors can browse work, chat with AI, submit inquiries. Admins manage everything from /admin.

## 2. Public Site Tour
### 2.1 Home (/)
Hero with 3D canvas. Buttons: View Work -> portfolio, Start Project -> contact.
Services grid (6 cards) — clicking pre-fills contact Service field.
Sections: featured work, process, testimonials, FAQ. Header: Home/Portfolio/Contact + Start Project.
Footer: email, phone, address, hours, socials.
Floating bottom-right: green WhatsApp bubble + sparkle AI Assistant bubble.

### 2.2 Portfolio (/portfolio)
Filter: All, Booking System, Order System, Portfolio Website, Dashboard, Other.
Card: cover image/video, category badge, FEATURED ribbon, client, tags.
Click -> Detail Modal: description, tags, client, Visit Live link, Build this for your business -> jumps to /contact pre-filled.

### 2.3 Contact (/contact)
Left: inquiry form. Right: Direct Communication (WhatsApp card + Email/Phone card + address/hours).

| Field | Required | Rules |
|-------|----------|-------|
| Full Name | Yes | min 2 chars |
| Email | Yes | valid email |
| Phone/WhatsApp | Yes | digits only, min 7 digits |
| Service | Yes | 7-item dropdown |
| Budget | No | e.g. Rs.50k-1L |
| Project Details | Yes | 10-3000 chars |

Submit flow:
1. Click Submit Project Requirements (disables + Submitting...).
2. Success: confetti + Thank-You panel (name, lead ID like lead-..., inbox, time) + Submit Another button.
3. Confirmation email attempted to you; admin gets New Lead alert.
4. If email fails, inquiry is STILL saved — team replies in 24h.
5. Leaving /contact clears Thank-You (fresh form next visit).
Errors: invalid email/phone/message, Too many submissions (30/10min), Spam detected.
## 3. AI Assistant (DIGEGAIN AI Chat)
Floating sparkle button on every page. Greeting + suggested question chips.
Text + Voice: mic uses browser Web Speech API (Chrome/Edge best). Speaker reads replies aloud.
Expand/minimize, clear history (sessionStorage digegain_chat_history), streaming replies.
AI knows services, contact/location/hours, portfolio, admin FAQs. Never invents prices — says team will quote after understanding requirements, offers WhatsApp handoff.
In-chat lead capture: mini form (name/email/phone/message) -> saved as source ai-assistant, same email pipeline.

## 4. WhatsApp Fast Path
Any WhatsApp button opens https://wa.me/<digits>?text=<message> with pre-written Hi DIGEGAIN text. No login.

## 5. Admin Panel (/admin)
Login with Admin Username + Master Password. Set ADMIN_USERNAME and ADMIN_PASSWORD environment variables. No defaults provided.
5 tabs (default Leads):

### 5.1 Leads
Newest-first: name, email, phone, service, budget, message, source badge (contact-form/ai-assistant), email dots (client/admin + error), status (new/contacted/closed), date.
Search + status filter. Actions: change status (instant, no reload), Resend emails, Delete, mailto reply, WhatsApp open. Export CSV, Refresh.

### 5.2 Portfolio
Grid with preview/category/featured. Add: title (required), category, description, client, URL, tags (comma-separated), featured checkbox, one image/video (JPG/PNG/WEBP/AVIF/GIF/MP4/WEBM, max 100MB). Images auto-convert to WebP q85.
Edit keeps or replaces media (old file deleted). Delete removes row + file. Slug auto-generated. Order field sorts.

### 5.3 Contact / Site Content
Edit company, tagline, email, phone, WhatsApp digits (no +), default WA message, address, lat/lng, Google Business/Maps/Review URLs, hours, 6 socials. Save -> live instantly.

### 5.4 Assistant
Toggle enabled, bot name, greeting, suggested questions (one per line), Extra FAQs (Q+A+Public checkbox; only Public go to site/AI/SEO). Lead-capture toggle.

### 5.5 Email Settings
Notification inbox (notifyEmail) — where New Lead alerts go.
SMTP: host, port, user, pass (eye toggle), secure, from-email, from-name. Presets: Gmail (smtp.gmail.com:465 secure), Office365, Zoho. Verify Connection + Send Test Email (reports via SMTP server vs via relay).
Plain English: SMTP filled -> professional mailbox send. Empty/blocked -> HTTPS relay backup still delivers admin alert. Client confirmation needs SMTP; without it dot=failed but lead safe + retryable.
Toasts confirm saves. Logout clears session. Back to Site returns home.

## 6. Daily Workflows Cheat Sheet
- New inquiry: email inbox + Leads row (new + dots). Set contacted after reply; closed when won/lost.
- Email bounced? Fix SMTP -> open lead -> Resend.
- Add project: Portfolio -> Add -> fill + upload -> Save -> check /portfolio.
- Change phone/hours: Contact tab -> edit -> Save.
- Teach AI FAQ: Assistant -> Add Q/A Public ON -> Save -> test chat.
- Change alert inbox: Email tab -> notifyEmail -> Save -> Test Email.

## 7. Troubleshooting
| Symptom | Fix |
|---------|-----|
| Form won't submit | email format, phone 7+ digits, message 10+ chars |
| Too many submissions | wait ~10 min |
| No confirmation email | check spam; admin Resend; lead still saved |
| Mic not working | Chrome/Edge + allow mic; type instead |
| Admin login fails | caps; wait 15min after 10 tries; check env |
| Upload rejected | JPG/PNG/WEBP/GIF/MP4/WEBM <=100MB |
| Old content | hard refresh Ctrl+Shift+R |

## 8. Privacy
Inquiries store name/email/phone/message + time to respond. No account needed. GA4 pageviews only; admin uses one HttpOnly cookie. Delete request: email hello@digegain.com.

