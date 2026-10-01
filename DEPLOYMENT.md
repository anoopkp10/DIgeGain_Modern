# Node.js Deployment

This project uses one Express server for the website, admin API, uploads, email, and Gemini chat. The PHP API has been removed. The server serves the production Vite build from `dist/` and handles `/api/*` itself.

## Hostinger

1. Create a Hostinger Node.js application with Node.js 22 or newer and the project root as the application directory.
2. If Hostinger asks for an application startup file, set it to `server.js`. Set the start command to `npm start` when Hostinger provides a start-command field.
3. Set the environment variables below in Hostinger's Node.js application settings. Do not upload real secrets in `.env.example` or commit a `.env` file.
4. Deploy the source and run `npm ci --include=dev` and `npm run build` in the application directory. If Hostinger installs production dependencies after building, Vite is only needed during the build; the production server does not load it. Start or restart the Node.js application afterward with `npm start`.
5. Ensure the Node.js application user owns or can read/write `data/` and `public/uploads/portfolio/`. Data is persisted in `data/appdata.json`; uploaded project media is persisted under `public/uploads/portfolio/images/` and `public/uploads/portfolio/videos/`. Keep these directories when deploying updates and include them in backups. The app creates missing directories with private/readable owner permissions and checks access at startup; do not use `777`.

## Environment

Copy `.env.example` to `.env` for local development. On Hostinger, add the equivalent values in the application's environment settings instead.

- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `SESSION_SECRET` are required in production. Choose a unique password and a long random session secret.
- `GEMINI_API_KEY` enables live Gemini responses. Create the key in Google AI Studio. Without it, the assistant uses its local fallback responses.
- `LLM_MODEL` defaults to `gemini-2.5-flash` and can be changed to another model available to your API key.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_SECURE` configure Nodemailer. For Hostinger mail, use the SMTP hostname and mailbox credentials shown in Hostinger Email settings. Use port `465` with `SMTP_SECURE=true`, or port `587` with `SMTP_SECURE=false`.
- `MAIL_FROM` should use the authenticated mailbox or an allowed sender alias. `ADMIN_NOTIFY_EMAIL` is the address that receives new inquiries unless the admin settings specify a notification email.
- `NODE_ENV` must be `production` on Hostinger. `PORT` is normally provided by Hostinger; locally it defaults to `3000`.

Contact submissions are saved to `appdata.json` before email is attempted. A failed SMTP delivery is recorded on the lead, and can be retried from the admin dashboard once SMTP is configured.

## Troubleshooting API 404s

- Test `/api/appdata`. If it returns a 404, verify the domain is assigned to the Node.js application, the application root is the project root, and Hostinger starts it with `node server.js` or `npm start`.
- If `/api/appdata` returns a 500, check the Node application logs and ensure `data/appdata.example.json` is deployed and the `data/` directory is writable.