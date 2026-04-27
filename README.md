# Resumify

Resumify is a section-based resume builder for ATS-safe resumes.

## Features

- Simple section editor instead of a node canvas
- Drag section order
- Show, hide, add, and delete sections
- Live resume preview
- ATS-safe templates
- A4 and Letter page sizing
- Font, spacing, and accent color controls
- Client-side PDF download
- Local browser storage
- Resume import, score, job match, profiles, history, backups, and AI settings

## Run

```bash
npm install
npm run dev
```

## Test

```bash
npm run typecheck
npm test
```

Use Node `20.19+` or `22.12+`. Older Node versions can fail because Vite and the test stack need newer Node.

## Build

```bash
npm run build
```

The app uses TanStack Start SPA mode. The built client files are in `dist/client`,
which is the folder Cloudflare Pages should deploy.

## Export PDF

Open a resume and click `Download`. The PDF is made in the browser.

## Deploy to Cloudflare Pages

Create a Cloudflare Pages project named `resumify`, or set the GitHub repo variable
`CLOUDFLARE_PAGES_PROJECT_NAME` to your project name.

Add these GitHub secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

The deploy workflow runs on pushes to `main`:

```bash
npm ci
npm run check
npm run build
wrangler pages deploy dist/client --project-name=resumify
```

Cloudflare Pages settings:

```text
Build command: npm run build
Build output directory: dist/client
Node version: 22
```

The app is client-side for user data. Resumes, profiles, history, backups, job matches,
and the OpenRouter key stay in browser storage. The Cloudflare site only serves the app files.

`public/_redirects` sends all deep links to `/_shell.html`, so routes like
`/builder/abc123` work after refresh on Cloudflare Pages.
