# Tolaria + Paperclip Operations

The private label vault lives outside this website repo:

`/Users/jaytrainer/Documents/briar-patch-records-vault`

That vault is the canonical operating memory for Briar Patch Records. This Eleventy repo is the public website and Netlify deploy surface.

## Public Export Boundary

Only Tolaria notes marked `public_export: true` are eligible for website use. Sensitive strategy, contacts, financials, legal notes, agent logs, and account details stay out of this repo.

Before publishing vault material:

1. Confirm `public_export: true`.
2. Verify facts against the latest catalog, Bandcamp, and public pages.
3. Strip private metadata.
4. Add or update the public Eleventy page.
5. Run `npm run build`.
6. Review the generated public page for private information.

## Current Public Exports

- `/press/` - Jay Trainer EPK and press kit.
- `/contact/` - verified contact paths and inquiry categories.
- `/label/` - public Briar Patch Records positioning and AI-native lane distinction.
- `/llms.txt` - AI-readable public facts.

## Paperclip Role

Paperclip should operate against the vault, not directly against this repo by default. Agents may draft public copy, outreach, campaign plans, and reports, but public actions require approval under the vault's `AGENTS.md` and `Approval Gates` procedure.
