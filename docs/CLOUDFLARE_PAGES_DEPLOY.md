# Cloudflare Pages Deployment

This site should move off Netlify for the $0 operating model.

## Why

Netlify paused `jaytrainermusic.com` after the free account exceeded usage credits. The main build-size issue was the full MP3 catalog being copied into `_site`.

## Current Build Policy

The Eleventy build copies:

- `src/assets/images` to `/assets/images`
- `src/assets/fonts` to `/assets/fonts`
- `src/assets/audio/previews` to `/assets/audio/previews`
- `src/bpr/brand-style-guide/assets` to `/bpr/brand-style-guide/assets`
- `src/bpr/brand-style-guide/fonts` to `/bpr/brand-style-guide/fonts`

The Eleventy build does **not** copy:

- `src/assets/audio/full`

Audio previews remain live. Full audio files should stay out of static hosting and be handled through Bandcamp, another music platform, or an explicitly approved delivery path.

## Cloudflare Pages Settings

- Project name: `jay-trainer-music`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `_site`
- Node version: `18` or newer

## CLI Deploy

Wrangler is not installed globally in this workspace, but it is available through `npx`:

```bash
npx wrangler --version
```

The local environment is not currently authenticated with Cloudflare. Authenticate once:

```bash
npx wrangler login
```

Then deploy the current build:

```bash
npm run build
npx wrangler pages deploy _site --project-name jay-trainer-music
```

If the Cloudflare Pages project does not exist yet, Wrangler will prompt to create it.

The repo includes `wrangler.toml` with:

```toml
name = "jay-trainer-music"
pages_build_output_dir = "_site"
compatibility_date = "2026-05-28"
```

## Headers

Cloudflare Pages reads `src/_headers` after Eleventy copies it to `_site/_headers`.

The brand style guide remains:

- Unlinked from the public site navigation.
- Excluded from the sitemap.
- Marked with `X-Robots-Tag: noindex, nofollow, noarchive`.

## Cloudflare Pages Functions

The production deploy includes Cloudflare Pages Functions for:

- `/api/create-checkout-session`
- `/api/newsletter-subscribe`
- `/api/stripe-webhook`

Configure these Cloudflare Pages environment variables before treating checkout, webhooks, or newsletter signup as production-ready:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CONVERTKIT_API_KEY`
- `CONVERTKIT_FORM_ID`
- `RESEND_API_KEY`
- `ORDER_NOTIFICATION_TO`
- `ORDER_NOTIFICATION_FROM`

The Stripe webhook endpoint should be updated in Stripe to:

`https://jaytrainermusic.com/api/stripe-webhook`
