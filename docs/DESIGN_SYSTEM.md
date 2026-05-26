# Jay Trainer Music Design System

This site is intentionally styled from a small set of tokens and content data. When changing the visual direction, start here instead of hunting through templates.

## Token Sources

Primary design tokens live in `src/css/styles.css` inside `:root`.

- Raw palette: `--white`, `--cream`, `--warm-tan`, `--coffee`, `--bark`, `--ink`, and related alpha values.
- Semantic colors: `--color-brand-primary`, `--color-action-fill`, `--color-border-subtle`, `--surface-body`, `--text-heading`, `--text-on-dark`, and related tokens.
- Type: `--font-body`, `--font-heading`, `--font-accent`, `--font-size-*`, `--line-*`, `--tracking-*`, and `--weight-*`.
- Spacing: `--space-*`, `--page-gutter`, `--section-padding-*`, `--button-padding`, and component layout tokens.
- Shape and depth: `--radius-*`, `--shadow-*`, and `--border-*`.
- Decorative CSS media: `--media-stain`, `--media-hero`, `--media-foxing`, `--media-water-stain`, and related texture tokens.

Use semantic tokens in component styles when possible. Raw palette tokens should mostly be used inside the token layer or for one-off art-directed details.

## Common Changes

Change the primary button color:

```css
:root {
  --color-action-fill: var(--warm-tan);
  --color-action-fill-hover: var(--coffee);
}
```

If a button still references `--warm-tan` directly, update that component to `--color-action-fill` as part of the same change.

Change body or heading fonts:

```css
:root {
  --font-body: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  --font-heading: 'Fraunces', serif;
}
```

Change site-wide section spacing:

```css
:root {
  --page-gutter: var(--space-11xl);
  --section-padding-y: var(--space-14xl);
  --section-padding-x: var(--page-gutter);
}
```

Change card rounding or drawer depth:

```css
:root {
  --card-radius: var(--radius-2xl);
  --shadow-drawer: -4px 0 30px var(--black-a15);
}
```

## Image And Media Data

Template-level media lives in `src/_data/site.json` under `media`.

- Listing header texture: `site.media.decorative.listingHeader`
- Paper crease transition: `site.media.decorative.paperCrease`
- Home about images: `site.media.about.homePrimary` and `site.media.about.homeSecondary`
- About page images: `site.media.about.pagePrimary` and `site.media.about.pageSecondary`
- Author image: `site.media.about.author`
- Icons/feed images: `site.media.icons`

Album/release imagery lives in `src/_data/releases.json`.

```json
{
  "title": "A Whisper Of Ruin — Deluxe Edition",
  "coverArt": "/assets/images/a-whisper-of-ruin-cover.jpg"
}
```

Merch imagery lives in `src/_data/merch.json`.

```json
{
  "name": "Jay Trainer T-Shirt",
  "image": "/assets/images/jay-trainer-tshirt.jpg"
}
```

Decorative CSS-only textures are tokens in `src/css/styles.css`, because they are part of the visual system rather than content.

## Component Style Locations

- Navigation, hero, section layout, cards, blog, merch, newsletter, footer: `src/css/styles.css`
- Audio player and album detail tracklist/actions: `src/css/player.css`
- Cart icon, drawer, cart page, checkout/success states: `src/css/cart.css`
- Music cards: `src/_includes/partials/music-card.njk`
- Merch cards: `src/_includes/partials/merch-card.njk`
- Newsletter form markup: `src/_includes/partials/newsletter-signup.njk`
- Checkout behavior: `src/js/cart.js` and `functions/create-checkout-session.js`
- Newsletter behavior: `src/js/newsletter.js` and `functions/newsletter-subscribe.js`

## Guardrails

- Do not hardcode new hex, RGB, font-size, line-height, letter-spacing, repeated spacing, radius, shadow, or border values in component CSS. Add or reuse a token first.
- Keep content images in JSON data unless the image is purely decorative CSS texture.
- Keep product/release Stripe IDs in release and merch data. Do not move checkout secrets into frontend code.
- `@font-face` file URLs and font descriptor values are intentionally literal because they are asset declarations, not UI styling.
- The `-1px` skip-link margin is intentionally literal for accessibility hiding.
