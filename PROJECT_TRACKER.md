# Jay Trainer Music — Project Tracker

> **Last updated:** 2026-05-28 @ session 9 — Cloudflare cutover sync, dead-Netlify cleanup, Paperclip operating plan
> **Updated by:** Claude (session 9)
> **Git branch:** `main`
> **Latest commit:** `1aa5d1d` — "Allow same-origin brand asset embed" (session 9 edits uncommitted at time of writing)
>
> **Paperclip/Tolaria operations (private vault):** the autonomous-label operating docs live in the vault, not this repo. To launch a working session, use the vault's `operations/Autonomous Operations Launch Brief.md` (24/7 agent org; supervised-auto; goals: make Jay Trainer a household name + generate income). See also `operations/Paperclip Operating Plan And Backlog.md` and the dated session logs. Campaign video assets: `assets/wip/video/week{1,2}-hires-20260528/`.

---

## 1. PROJECT OVERVIEW

| Field | Value |
|---|---|
| **Project name** | jay-trainer-music |
| **Type** | Artist/musician website |
| **Artist** | Jay Trainer |
| **Genre** | Folk, Acoustic Rock, Americana, Singer-Songwriter |
| **Location** | Pittsburgh, Pennsylvania |
| **Label** | Briar Patch Records (independent, self-founded) |
| **Domain** | jaytrainermusic.com |
| **Stack** | Eleventy 2.x (SSG), Nunjucks templates, vanilla CSS/JS |
| **Hosting (production)** | **Cloudflare Pages** (project `jay-trainer-music`). Netlify abandoned — showed usage-limit failures. |
| **Serverless** | Cloudflare Pages Functions in `functions/api/` (`/api/*` routes) |
| **Repo** | Local at `/Users/jaytrainer/Documents/jay-trainer-music` |
| **Private vault** | `/Users/jaytrainer/Documents/briar-patch-records-vault` (Tolaria — operating memory, not public) |

---

## 2. TECH STACK — DETAILED

| Layer | Technology | Version/Notes |
|---|---|---|
| **Static site generator** | Eleventy (11ty) | ^2.0.1 (devDependency) |
| **Templating** | Nunjucks (.njk) + Markdown (.md) | htmlTemplateEngine: njk |
| **Styling** | Vanilla CSS | Token-based custom properties (CSS variables) |
| **JavaScript** | Vanilla JS (5 files) | No framework, no bundler |
| **Fonts** | Google Fonts + self-hosted | Inter (300-700) body, **Fraunces** (300-700 +italic) headings, Jeff Dungan (self-hosted) accents. NOTE: heading font is now Fraunces, not Playfair Display. |
| **Payment** | Stripe Checkout | Via Cloudflare Pages Function `functions/api/create-checkout-session.js`. **Live in production** (secrets in Cloudflare). |
| **Newsletter** | Kit (ConvertKit) | Via `functions/api/newsletter-subscribe.js`. **Live in production** — form `Jay Trainer Music Newsletter` (ID `9487977`). |
| **Order email** | Resend | Sent by `functions/api/stripe-webhook.js` after `checkout.session.completed`. |
| **Package manager** | npm | package-lock.json present; runtime dep `stripe`, devDep `@11ty/eleventy` |
| **Build command** | `npm run build` → `eleventy` | Output: `_site/` |
| **Dev command** | `npm start` → `eleventy --serve` | Local dev server |
| **Deploy command** | `npm run deploy:cloudflare` | `wrangler pages deploy _site --project-name jay-trainer-music` |

---

## 3. DIRECTORY STRUCTURE

```
jay-trainer-music/
├── .eleventy.js              # Eleventy config (filters, passthrough, dirs)
├── .env.example              # Env template (Stripe + ConvertKit keys)
├── .gitignore                # OS, editor, node_modules, _site, .env, Distressed Assets/, Inspiration Images/
├── package.json              # Single devDep: @11ty/eleventy ^2.0.1
├── package-lock.json
├── netlify.toml              # Netlify deployment config (build, headers, redirects)
├── PROJECT_TRACKER.md        # THIS FILE
│
├── src/                      # ── SOURCE (Eleventy input) ──
│   ├── _data/                # Global data files
│   │   ├── site.json         # Site metadata, social links, geo coords
│   │   ├── releases.json     # 8 releases with tracks, prices, Bandcamp URLs
│   │   ├── merch.json        # 3 merch items (poster, t-shirt, digital discog)
│   │   └── navigation.json   # 5 nav items (Music, Merch, About, Journal, Label)
│   │
│   ├── _includes/
│   │   ├── layouts/
│   │   │   ├── base.njk      # Root HTML shell (head, nav, footer, scripts)
│   │   │   ├── page.njk      # Generic page layout (extends base)
│   │   │   ├── single.njk    # Single content layout (extends base)
│   │   │   ├── album.njk     # Album detail page layout (extends base)
│   │   │   └── post.njk      # Blog post layout (extends base)
│   │   └── partials/
│   │       ├── nav.njk              # Top navigation bar
│   │       ├── footer.njk           # 3-column footer + copyright
│   │       ├── player.njk           # Persistent audio player HTML
│   │       ├── cart-drawer.njk      # Slide-out cart drawer
│   │       ├── cart-icon.njk        # Cart icon for nav
│   │       ├── music-card.njk       # Release card component
│   │       ├── merch-card.njk       # Merch item card component
│   │       ├── blog-card.njk        # Blog post card component
│   │       ├── newsletter-signup.njk # Newsletter form (ConvertKit)
│   │       ├── streaming-banner.njk  # Platform links banner
│   │       └── structured-data.njk   # JSON-LD schema (all page types)
│   │
│   ├── css/
│   │   ├── styles.css        # Main stylesheet (~2300 lines, token-based)
│   │   ├── player.css        # Audio player styles
│   │   └── cart.css          # Cart drawer styles
│   │
│   ├── js/
│   │   ├── router.js         # PJAX soft navigation (keeps player alive across pages)
│   │   ├── main.js           # Scroll reveal, tracklist toggles, nav scroll
│   │   ├── player.js         # HTML5 audio player (master playlist, continuous playback)
│   │   ├── cart.js           # localStorage cart + Stripe Checkout + format selection
│   │   └── newsletter.js     # Newsletter form submission (ConvertKit via Netlify fn)
│   │
│   ├── assets/images/        # 26 images (JPG/PNG) — hero, about, releases, merch, textures
│   │   └── blog/             # 8 unique blog feature images (from inspiration folder)
│   ├── assets/audio/previews/ # 60-second MP3 preview clips for all 48 tracks by release slug
│   │
│   ├── blog/                 # Blog posts (Markdown)
│   │   ├── blog.json         # Collection config (tags: blog, layout: post)
│   │   ├── what-is-americana-music.md                  (2026-03-03) NEW
│   │   ├── the-gear-behind-the-sound.md                (2026-02-28) NEW
│   │   ├── five-songs-that-changed-how-i-write.md      (2026-02-20) NEW
│   │   ├── on-writing-songs-in-the-dark-hours.md       (2026-02-15)
│   │   ├── a-whisper-of-ruin-the-full-story.md         (2026-02-10) NEW
│   │   ├── why-every-song-i-write-is-about-pittsburgh.md (2026-01-25) NEW
│   │   ├── recording-by-firelight.md                   (2026-01-10)
│   │   └── roots-on-place-memory-and-pittsburgh.md     (2025-12-05)
│   │
│   ├── music/                # Album/single pages (Markdown)
│   │   ├── music.json        # Collection config (tags: music, layout: album)
│   │   ├── a-whisper-of-ruin-deluxe.md
│   │   ├── lifeline.md
│   │   ├── last-days-of-summer.md
│   │   ├── the-southern-winds.md
│   │   ├── blackout-asylum.md
│   │   ├── den-of-thieves.md
│   │   ├── of-the-sun.md
│   │   └── the-waking-hours.md
│   │
│   ├── index.njk             # Homepage (hero, discography, about, merch, journal)
│   ├── about.njk             # About page (bio, timeline, influences, FAQ)
│   ├── music.njk             # Music listing (featured + grid)
│   ├── merch.njk             # Merch listing
│   ├── label.njk             # Briar Patch Records page
│   ├── blog.njk              # Blog listing
│   ├── cart.njk              # Cart page (redirects to drawer)
│   ├── cart-success.njk      # Post-checkout success page
│   ├── 404.njk               # Custom 404 page
│   ├── feed.njk              # Atom/RSS feed
│   ├── sitemap.njk           # XML sitemap
│   ├── robots.txt.njk        # robots.txt
│   └── llms.txt              # LLM-readable site summary
│
├── functions/                # ── NETLIFY SERVERLESS FUNCTIONS ──
│   ├── create-checkout-session.js   # Stripe Checkout session creator
│   ├── newsletter-subscribe.js      # ConvertKit form subscriber
│   └── stripe-webhook.js            # Stripe webhook handler (payment events)
│
├── _site/                    # ── BUILD OUTPUT (gitignored) ──
│   └── (generated HTML, CSS, JS, images, XML)
│
└── assets/images/            # ── ROOT-LEVEL IMAGE COPIES ──
    └── (same images as src/assets/images — passthrough copy source)
```

---

## 4. PAGES & ROUTES

| Route | Source File | Layout | Description |
|---|---|---|---|
| `/` | `src/index.njk` | base.njk | Homepage — hero, discography, about, merch, journal |
| `/music/` | `src/music.njk` | base.njk | Music listing — featured release + grid of all releases |
| `/music/[slug]/` | `src/music/*.md` | album.njk | Individual album/single detail pages (8 total) |
| `/merch/` | `src/merch.njk` | base.njk | Merch shop listing |
| `/about/` | `src/about.njk` | base.njk | Full bio, timeline, influences, FAQ |
| `/blog/` | `src/blog.njk` | base.njk | Journal listing |
| `/blog/[slug]/` | `src/blog/*.md` | post.njk | Individual blog posts (8 total) |
| `/label/` | `src/label.njk` | base.njk | Briar Patch Records label page (incl. AI-lane disclosure) |
| `/press/` | `src/press.njk` | base.njk | Press kit / EPK |
| `/contact/` | `src/contact.njk` | base.njk | Contact + verified inquiry paths |
| `/bpr/brand-style-guide/` | `src/bpr/brand-style-guide/index.html` | (standalone) | Brand guide — **unlinked + noindex** (internal reference) |
| `/cart/` | `src/cart.njk` | base.njk | Cart page |
| `/cart/success/` | `src/cart-success.njk` | base.njk | Checkout success page |
| `/404.html` | `src/404.njk` | base.njk | Custom 404 page |
| `/feed.xml` | `src/feed.njk` | — | Atom/RSS feed |
| `/sitemap.xml` | `src/sitemap.njk` | — | XML sitemap |
| `/robots.txt` | `src/robots.txt.njk` | — | Robots.txt |
| `/llms.txt` | `src/llms.txt` | — | LLM-readable summary |

**Total pages generated:** 32 (8 album + 8 blog + static incl. press/contact). Brand guide HTML is copied as a standalone asset, not an Eleventy page.

---

## 5. DISCOGRAPHY (releases.json)

| # | Title | Slug | Type | Year | Tracks | Price | Featured |
|---|---|---|---|---|---|---|---|
| 1 | A Whisper Of Ruin — Deluxe Edition | `a-whisper-of-ruin-deluxe` | album | 2019 | 15 | $7.99 | YES |
| 2 | Lifeline | `lifeline` | single | 2023 | 1 | $1+ | no |
| 3 | Last Days Of Summer | `last-days-of-summer` | single | 2023 | 1 | Free | no |
| 4 | The Southern Winds | `the-southern-winds` | single | 2023 | 1 | $1+ | no |
| 5 | Blackout Asylum | `blackout-asylum` | album | 2021 | 5 | Free | no |
| 6 | Den Of Thieves | `den-of-thieves` | album | 2015 | 6 | $5.99 | no |
| 7 | Of The Sun | `of-the-sun` | album | 2010 | 10 | Free | no |
| 8 | The Waking Hours | `the-waking-hours` | album | 2006 | 9 | $10.99 | no |

**Notes:**
- All 48 tracks have `previewFile` fields pointing to 60-second MP3 preview clips in `src/assets/audio/previews/`
- All `audioFile` fields are empty strings ("") — full tracks not hosted yet
- All `stripePrice` fields are empty strings — Stripe price IDs not configured yet
- Cover art images are hosted on Bandcamp CDN (f4.bcbits.com)

---

## 6. MERCH ITEMS (merch.json)

| Item | Price | Type | Stripe Configured |
|---|---|---|---|
| Blackout Asylum — Poster (12"x18") | $14.99 | physical | NO (stripePrice empty) |
| Jay Trainer — T-Shirt (Grey/Black/White) | $16.99 | physical | NO (stripePrice empty) |
| Full Digital Discography (7 releases, 35% off) | $12.34 | digital | NO (stripePrice empty) |

---

## 7. BLOG POSTS

| Title | Date | Slug |
|---|---|---|
| What Is Americana Music? A Singer-Songwriter's Field Guide | 2026-03-03 | `what-is-americana-music` |
| The Gear Behind the Sound: Recording Folk Music at Home | 2026-02-28 | `the-gear-behind-the-sound` |
| Five Songs That Changed How I Write | 2026-02-20 | `five-songs-that-changed-how-i-write` |
| On Writing Songs in the Dark Hours | 2026-02-15 | `on-writing-songs-in-the-dark-hours` |
| A Whisper Of Ruin: The Full Story Behind the Album | 2026-02-10 | `a-whisper-of-ruin-the-full-story` |
| Why Every Song I Write Is About Pittsburgh | 2026-01-25 | `why-every-song-i-write-is-about-pittsburgh` |
| Recording by Firelight: The Making of the Deluxe Edition | 2026-01-10 | `recording-by-firelight` |
| Roots — On Place, Memory, and Why Pittsburgh Matters | 2025-12-05 | `roots-on-place-memory-and-pittsburgh` |

---

## 8. DESIGN SYSTEM — CSS TOKENS

### Color Palette (`:root` custom properties)
| Token | Value | Usage |
|---|---|---|
| `--white` | #ffffff | Backgrounds |
| `--cream` | #f5f0e8 | Primary background |
| `--parchment` | #ede5d5 | Secondary background |
| `--warm-tan` | #c9aa80 | Accents, borders |
| `--coffee` | #8b5e3c | Primary action color |
| `--coffee-dark` | #444444 | Hover states (neutralized from brown) |
| `--bark` | #2b2b2b | Dark backgrounds, nav (neutralized from brown) |
| `--moss` | #4a5e3a | Secondary accent |
| `--muted-red` | #7a3d35 | Tertiary accent |
| `--steel-blue` | #5171A5 | Link color |
| `--slate-blue` | #7C98B3 | Secondary blue |
| `--navy` | #364B6D | Dark blue |
| `--midnight` | #07090E | Darkest background |
| `--ink` | #1f1f1f | Text color (neutralized from brown) |
| `--fog` | #d8d0c5 | Muted borders |
| `--light-fog` | #eee8dc | Light borders |

### Typography
| Font | Weights | Usage |
|---|---|---|
| Inter | 300, 400, 500, 600 | Body text, UI elements |
| Playfair Display | 400, 600, 700 (+italics) | Headings, display text |
| Jeff Dungan (QE) | 400 | Handwritten accents (labels, quotes) — self-hosted @font-face |

### Theme Color
- `<meta name="theme-color" content="#3d2b1a">` (bark)

---

## 9. KEY FEATURES — STATUS

### Fully Built
- [x] Homepage with hero, discography, about section, merch, journal
- [x] Music listing page with featured release + grid
- [x] 8 individual album/single detail pages with tracklists
- [x] About page with bio, timeline, influences grid, FAQ (with Schema.org FAQPage)
- [x] Merch listing page
- [x] Blog/Journal listing and 8 blog posts (each with unique feature image)
- [x] Briar Patch Records label page
- [x] Press kit / EPK page
- [x] Contact page with verified public inquiry paths
- [x] Tolaria + Paperclip private-vault operating docs
- [x] Persistent HTML5 audio player (master playlist, continuous playback, seek, volume, prev/next)
- [x] PJAX soft navigation — player keeps playing seamlessly across page navigations
- [x] Shopping cart (localStorage-based, slide-out drawer, format selection)
- [x] Newsletter signup form (ConvertKit integration via serverless function)
- [x] Stripe Checkout integration (serverless function)
- [x] Stripe webhook handler (payment event processing)
- [x] SEO: Open Graph (with locale, image dimensions), Twitter Cards (with site/creator), article meta tags, author/keywords meta, canonical URLs
- [x] Structured data: JSON-LD for WebSite, MusicGroup, MusicPlaylist, Person, FAQPage (10 Qs), BlogPosting (enhanced: wordCount, keywords, image), MusicAlbum (genre, Offers), Product/Offer (merch), Organization, BreadcrumbList
- [x] Atom/RSS feed (with full content, category tags, icon/logo)
- [x] XML sitemap (with lastmod timestamps)
- [x] robots.txt (with Disallow for cart, 404)
- [x] llms.txt (comprehensive: content index, discography table, all page URLs, themes, social links)
- [x] Blog post layout: TL;DR block, keyword tags, Listen CTA, prev/next navigation, microdata
- [x] Blog cards: reading time display
- [x] Custom 404 page
- [x] Scroll reveal animations (IntersectionObserver)
- [x] Nav scroll state (adds `.scrolled` class)
- [x] Tracklist toggle (expand/collapse on music cards)
- [x] Skip-to-content accessibility link
- [x] Token-based CSS design system with CSS custom properties
- [x] Responsive design (mobile-first)
- [x] Cart success/thank-you page

### Not Yet Configured / Incomplete
- [x] **Audio previews** — 60-second preview clips for ALL 8 releases (48 tracks) via `previewFile` field. Player builds a master playlist and plays continuously through entire catalogue.
- [x] **Format selection** — MP3/WAV toggle on album pages, stored in cart, passed as Stripe checkout metadata.
- [x] **Soft navigation** — PJAX router intercepts internal links, swaps `<main>` content via fetch, keeping the audio player alive across page navigations.
- [x] **Button system overhaul** — No Bandcamp links anywhere. Two-tier button system: `btn-primary` (solid, no borders) and `btn-secondary` (transparent with outline). Add To Cart always visible (no stripePrice conditional).
- [ ] **Full audio files** — `audioFile` fields still empty. Full 320kbps MP3s generated in `src/assets/audio/full/` but not served (for future purchase delivery)
- [ ] **Stripe price IDs** — All `stripePrice` fields empty in releases.json and merch.json. Cart/checkout non-functional until configured
- [ ] **Environment variables** — .env not present (only .env.example). Stripe + ConvertKit keys needed
- [x] **Favicon** — `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, `favicon-32x32.png` all present in `src/assets/images/`
- [x] **Spotify/Apple Music links** — Real URLs configured in site.json
- [ ] **Stripe webhook TODOs** — `stripe-webhook.js` has two TODOs: send download links for digital items, create order notification for physical items
- [x] **Mobile nav hamburger** — Fully functional: HTML button in nav.njk, JS toggle in main.js, CSS shows at ≤600px with animated X transform
- [ ] **Contact form** — No contact page or form exists
- [ ] **Search** — No search functionality (structured data references search but no actual search page)
- [ ] **Image optimization** — No image optimization pipeline (no eleventy-img or similar)
- [ ] **Analytics** — No analytics script included (no Google Analytics, Plausible, etc.)
- [x] **Deployment** — `netlify.toml` created with build config, 404 redirect, security headers, and cache rules
- [ ] **Dark mode** — No dark mode support
- [x] **Tolaria vault** — Private local vault created at `/Users/jaytrainer/Documents/briar-patch-records-vault` with note types, release/track catalog, Paperclip agent briefs, approval gates, and public-export workflow

---

## 10. EXTERNAL SERVICES & INTEGRATIONS

| Service | Purpose | Status |
|---|---|---|
| **Stripe** | Payment processing (Checkout + Webhooks) | **Live** — `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in Cloudflare. Webhook at `/api/stripe-webhook` (unsigned calls rejected 400). Note: release/merch `stripePrice` IDs still empty, so individual products aren't purchasable yet. |
| **Kit (ConvertKit)** | Email newsletter | **Live** — `CONVERTKIT_API_KEY` + `CONVERTKIT_FORM_ID` (9487977) in Cloudflare. Signups return 200. |
| **Resend** | Order notification email | Configured in Cloudflare; used by stripe-webhook on successful checkout. |
| **Bandcamp** | Music hosting, streaming, downloads | Active — all release URLs point here |
| **Google Fonts** | Typography (Inter, Playfair Display, Caveat) | Active |
| **Bandcamp CDN** | Cover art image hosting (f4.bcbits.com) | Active |
| **Tolaria** | Private label vault and Markdown knowledge base | Local vault created, private GitHub repo pending/active depending on remote setup |
| **Paperclip** | AI label operating system for agents/goals/budgets/approvals | Operating model and agent briefs created in Tolaria vault |
| **YouTube** | Video content | URL configured |
| **Instagram** | Social presence | URL configured |
| **Twitter/X** | Social presence | URL configured |
| **Facebook** | Social presence | URL configured |
| **Spotify** | Streaming | Active — real artist URL |
| **Apple Music** | Streaming | Active — real artist URL |

---

## 11. SEO & STRUCTURED DATA

### JSON-LD Schema Types (in structured-data.njk)
| Schema Type | Page | Status |
|---|---|---|
| BreadcrumbList | All pages except home | Active |
| WebSite | Homepage | Active |
| MusicGroup | Homepage | Active |
| MusicPlaylist | Homepage (full discography, 48 tracks) | Active |
| Person | About page | Active |
| FAQPage | About page (10 FAQs) | Active |
| BlogPosting | Each blog post (enhanced: wordCount, keywords, image) | Active |
| MusicAlbum + MusicRecording | Each album/single page (genre, Offers) | Active |
| Product + Offer | Merch page (3 items) | Active |
| Organization | Label page (Briar Patch Records) | Active |

### Meta Tags
- Open Graph (title, description, image, image:width/height, url, type, site_name, locale)
- Article tags (article:published_time, article:author, article:tag) on blog posts
- Twitter Cards (summary_large_image, twitter:site, twitter:creator)
- Author, keywords meta tags
- Canonical URLs
- Theme color

---

## 12. ELEVENTY CONFIG (.eleventy.js)

### Custom Filters
| Filter | Purpose |
|---|---|
| `readableDate` | Formats date as "Month Year" (e.g., "February 2026") |
| `isoDate` | Formats date as ISO 8601 string |
| `w3Date` | Formats date as W3C date (YYYY-MM-DD) for sitemaps |
| `readingTime` | Estimates reading time (words / 230) |
| `wordCount` | Counts words in content string |
| `getPrevNext` | Returns prev/next posts from a collection for navigation |
| `slug` | Converts string to URL-safe slug |
| `findBySlug` | Finds release object by slug in collection |
| `limit` | Array slice (first N items) |
| `exclude` | Filter array by excluding a slug |
| `currentYear` | Returns current year (for dynamic footer copyright) |

### Passthrough Copies
- `src/css` → `/css`
- `src/js` → `/js`
- `src/assets` → `/assets`
- `src/llms.txt` → `/llms.txt`

---

## 13. GIT HISTORY

| Commit | Date | Message |
|---|---|---|
| `1aa5d1d` | 2026-05-27 | Allow same-origin brand asset embed |
| `7252a5e` | 2026-05-27 | Render platform assets directly in brand guide |
| `debd841` | 2026-05-27 | Expose root favicon assets |
| `d56aa34` | 2026-05-27 | Embed platform brand assets guide |
| `2e772df` | 2026-05-27 | Port site functions to Cloudflare Pages |
| `d74483a` | 2026-05-27 | Prepare site for Cloudflare Pages |
| `100b7b1` | 2026-05-27 | Add platform brand assets to guide |
| `a79b7db` | 2026-05-27 | Renumber brand guide sections |
| `732c5b3` | 2026-03-03 | SEO/AIO/GEO overhaul, 5 new blog posts, unique blog images, wider content |
| `25bc1c9` | 2026-03-03 | Update PROJECT_TRACKER.md for session 6 |
| `fc11723` | 2026-03-03 | Add netlify.toml, image lazy-loading, and gitignore cleanup |
| `055b1e1` | 2026-03-02 | Audio previews, soft navigation, UI overhaul, format selection |
| `df6bbb6` | 2026-03-02 | Add distressed paper textures and real streaming platform links |
| `802463d` | 2026-03-02 | Add favicons, mobile nav, dynamic footer year, and clean up dead links |
| `812d9d7` | 2026-03-02 | Update PROJECT_TRACKER.md with latest commit hash and session log |
| `18ea8e6` | 2026-03-02 | Add Jeff Dungan accent font, neutralize text colors, fix social icons |
| `93af3ed` | 2026-03-02 | Rebuild as Eleventy site with token-based design system, SEO, and new pages |
| `8e0159c` | 2026-03-01 | Initial commit: Jay Trainer music website |

**Branch:** `main` (only branch)

---

## 14. KNOWN ISSUES & TECHNICAL DEBT

1. ~~**No audio hosting**~~ — Fixed: 60-second preview clips for all 8 releases (48 tracks) play in-browser.
2. **Stripe live but no product price IDs** — Checkout/webhook are live in Cloudflare, but all `stripePrice` IDs in releases.json/merch.json are still empty, so individual products can't be purchased until prices are created in Stripe and pasted into the data files.
3. ~~**Missing favicons**~~ — Fixed: `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, `favicon-32x32.png` all present.
4. ~~**Placeholder streaming links**~~ — Fixed: Real Spotify and Apple Music URLs configured in site.json.
5. **Webhook fulfillment incomplete** — Two TODOs in `stripe-webhook.js` for download link delivery and order notifications.
6. **No image optimization** — Raw JPGs served without responsive sizes, WebP conversion, or lazy-loading optimization beyond native `loading="lazy"`.
7. ~~**No deployment config**~~ — Fixed: `netlify.toml` added with build/publish/functions config, 404 redirect, security headers, cache rules.
8. **No analytics** — No tracking or analytics integration.
9. ~~**Apple Music SVG** — Fixed: now uses proper Apple Music icon~~
10. ~~**Footer year hardcoded**~~ — Fixed: Uses `currentYear` Eleventy filter.

---

## 15. FUTURE OPPORTUNITIES / IDEAS

- Configure Stripe products/prices for actual e-commerce
- Image optimization pipeline (eleventy-img plugin)
- Add analytics (Plausible or similar privacy-respecting option)
- Dark mode toggle
- Contact form / booking inquiry page
- Replace current contact page with a real form once routing, spam protection, and notification handling are configured
- Email download delivery system (post-Stripe webhook)
- Live show / tour dates page
- Video/media gallery

---

## 16. SESSION LOG

| Date | Session | Summary |
|---|---|---|
| 2026-05-28 | Session 9 | **Cloudflare cutover sync + cleanup + Paperclip operating plan.** Reconciled tracker with reality after the Netlify→Cloudflare Pages migration (sessions between 8 and now were committed but not logged here): production host, live Stripe/Kit/Resend config, `functions/api/` routes, Fraunces heading font, brand guide at `/bpr/brand-style-guide/` (unlinked + noindex via `src/_headers`), `wrangler.toml`. **Cleanup:** removed dead Netlify handlers (`functions/stripe-webhook.js`, `create-checkout-session.js`, `newsletter-subscribe.js`) and `netlify.toml` — they were superseded by `functions/api/*` and Cloudflare would have tried to register the root files as broken routes. **Fix:** `site.json` `themeColor` `#3d2b1a`→`#2b2b2b` to match the neutralized bark palette (mobile browser-chrome color). **Vault:** wrote `operations/Paperclip Operating Plan And Backlog.md` — consolidated daily/weekly/monthly cadence, approval gates, source-of-truth map, safe public outputs, 7 automations to build, success metrics, and the next 10 execution tasks. Build verified: 32 pages, 0 errors. |
| 2026-05-27 | Session 8 | **Tolaria + Paperclip foundation**: Created private Tolaria vault outside the public site repo at `/Users/jaytrainer/Documents/briar-patch-records-vault`, with Markdown/YAML note types for Artist, Release, Track, Campaign, Audience, Channel, Contact, Asset, Offer, Procedure, AgentBrief, and MetricReport. Seeded Briar Patch Records, Jay Trainer, Jay Trainer Band lane, AI-native label lane, approval gates, public export workflow, Paperclip company model, six Paperclip agent briefs, 90-day audience growth goal, EPK draft, AI disclosure standard, and generated all 8 release notes plus 48 track notes from `src/_data/releases.json`. Added public `/press/` EPK page, `/contact/` page, sitemap entries, footer/nav links, structured data, stronger `llms.txt`, label page AI-lane disclosure, and `docs/TOLARIA_PAPERCLIP_OPERATIONS.md`. |
| 2026-03-02 | Session 1 | Full project audit. Created PROJECT_TRACKER.md. Set up auto-memory for session persistence. No code changes made. |
| 2026-03-02 | Session 2 | Font exploration: tested Caveat, Reenie Beanie, Splash, Babylonica, Comforter Brush, Square Peg, Quentin, Fuggles, Rock 3D, Special Elite, Waiting for the Sunrise, Whisper, Grahamo, Gloriousity Two, Herbert Cooper, Jeff Dungan. Settled on **Jeff Dungan** (self-hosted). Neutralized body text colors from brown to dark grey (--bark, --ink, --coffee-dark). Replaced footer social text initials (YT/IG/TW/FB/BC) with proper SVG icons. Fixed Apple Music icon (was GitHub Octocat) and Spotify icon (was solid circle) in streaming banner. Added fonts passthrough to Eleventy config. Created PROJECT_TRACKER.md. |
| 2026-03-03 | Session 6 | **Deployment & Cleanup**: Created `netlify.toml` (build config, 404 redirect, security headers: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy; cache rules for CSS/JS/assets/audio). Added `loading="lazy"` to 5 below-fold images across about.njk, index.njk, post.njk. Added `Distressed Assets/` to .gitignore (Affinity design resource packs, not site content). Audited and confirmed: favicons already present (4 files), footer year already dynamic, mobile nav hamburger fully functional, Spotify/Apple Music links already real. Updated PROJECT_TRACKER known issues (resolved 5 items). |
| 2026-03-03 | Session 7 | **SEO/AIO/GEO Overhaul + 5 New Blog Posts + Blog Polish**: Added `w3Date`, `wordCount`, `getPrevNext` filters to .eleventy.js. Added twitterHandle, locale, ogImage dimensions, keywords to site.json. Enhanced base.njk meta tags (author, keywords, og:locale, og:image dimensions, article:published_time, article:tag, twitter:site/creator). Enhanced structured-data.njk: genre+Offer on MusicAlbum, MusicPlaylist on homepage (48 tracks), Product/Offer on merch (3 items), enhanced BlogPosting (wordCount, keywords, image). Added lastmod to all sitemap URLs. Added full content + category tags + icon/logo to RSS feed. Added Disallow rules to robots.txt (cart, 404). Full rewrite of llms.txt (content index, discography table, all page URLs, themes, streaming links). New blog CSS: TL;DR block, keyword tags, Listen CTA, prev/next navigation. Updated blog-card.njk with reading time. Overhauled post.njk: TL;DR, keywords display, Listen CTA, prev/next nav, microdata. Added 5 new FAQ entries to about.njk (10 total). Added description+keywords frontmatter to 3 existing blog posts. Wrote 5 new ~2000-word blog posts: "What Is Americana Music?", "The Gear Behind the Sound", "Five Songs That Changed How I Write", "A Whisper Of Ruin: The Full Story", "Why Every Song I Write Is About Pittsburgh". Fixed post-nav inheriting `position: fixed` from global `nav` selector. Assigned 8 unique feature images from inspiration folder (one per blog post, stored in `src/assets/images/blog/`). Widened blog post content from max-width 860px to 1000px for consistency with other pages. Added `Jay Trainer Site Inspiration Images/` to .gitignore. Build verified: 28 pages, 0 errors. |
| 2026-03-02 | Session 4-5 | **Audio Preview & Format Selection**: Created `scripts/process-audio.sh` to generate 60-second 128kbps MP3 previews (with 3s fade-out) and 320kbps full MP3s from WAV sources. Processed ALL 48 tracks across all 8 releases. Added `previewFile` field to every track in releases.json. Rewrote player.js with master playlist (all tracks across all releases), continuous playback, click-to-jump. Added format selector toggle (MP3/WAV) on album pages (always visible). Updated cart.js to store/display format and pass metadata to Stripe checkout. Updated .gitignore for Music/ and full audio dirs. **Soft Navigation (PJAX)**: Created `router.js` — intercepts internal link clicks, fetches pages via AJAX, swaps `<main>` content so the audio player never stops during navigation. **UI Overhaul**: Removed all Bandcamp buttons. Removed all button borders/outlines on primary buttons. Created `btn-secondary` (transparent + warm-tan outline, white text). Made Add To Cart always visible (removed stripePrice conditionals). Fixed header consistency on about/label pages (listing-header pattern). Stronger nav blur (40px). Widened album content area (860px). Updated about section image to "Figure in Misty Field". Subtle newsletter background. Various responsive and styling fixes across ~22 files. |

---

## 17. INSTRUCTIONS FOR AI ASSISTANTS

**At the start of every session:**
1. Read this file (`PROJECT_TRACKER.md`) for full context
2. Read the auto-memory file at `~/.claude/projects/-Users-jaytrainer-Documents-jay-trainer-music/memory/MEMORY.md`
3. Check `git status` and `git log --oneline -5` for any changes since last session

**At the end of every session:**
1. Update the "Last updated" timestamp at the top of this file
2. Update Section 13 (Git History) if new commits were made
3. Update Section 9 (Features Status) if features were added/completed
4. Add an entry to Section 16 (Session Log) summarizing what was done
5. Update Section 14 (Known Issues) if issues were resolved or new ones found
6. Update any other sections that changed

**Key principles:**
- This file is the single source of truth for the project
- Keep it factual and up-to-date — no speculation
- Timestamps in EST (Eastern Standard Time)
- Use git commit hashes for traceability
