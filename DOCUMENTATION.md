# DIGEGAIN — Complete User & Technical Documentation
Version: 1.0 | Date: 2026-10-09 | App: DIGEGAIN Modern (AI-Powered Digital Growth & Web Systems)

> Live site: https://digegain.com | Admin: https://digegain.com/admin

This document has **two parts**:

- **PART A — User Guide (Non-Technical):** what the site does, how to use every feature.
- **PART B — Technical Guide (Developers/Admins):** architecture, workflow, email system, security, frameworks, APIs, deployment.

Start here:

- Normal visitor / business owner → read **PART A** in `USER_GUIDE.md`.
- Developer / deployer / admin configurator → read **PART B** in `TECHNICAL_GUIDE.md`.

## Quick Map

| Who | File | Contents |
|-----|------|----------|
| Everyone | `DOCUMENTATION.md` (this file) | Index + glossary + release info |
| Visitors + Admin editors | `USER_GUIDE.md` | Features, contact form, AI chat, WhatsApp, portfolio, admin panel usage |
| Developers / DevOps | `TECHNICAL_GUIDE.md` | Stack, architecture, data flow, email pipeline, security, API reference, env, deployment |

## What is DIGEGAIN?

DIGEGAIN is an AI-powered digital agency website + lead-management system for service businesses (clinics, salons, restaurants, agencies). Public visitors browse services/portfolio, chat with AI, and submit project inquiries. Admins manage leads, portfolio, site content, AI knowledge, and email settings from `/admin` — no code needed.

## Glossary

- **Lead:** one project inquiry (name, email, phone, service, budget, message).
- **Portfolio item:** one case study (title, category, description, tags, 1 image/video).
- **Assistant (DIGEGAIN AI):** floating chat widget answering questions + capturing leads.
- **appdata.json:** single JSON file (`data/appdata.json`) storing all site content.
- **SMTP:** mail server config used to send emails. **Relay fallback:** HTTPS backup sender when SMTP is missing/blocked.
