# How to get customers

Code converts people who already touch the product. This file is the **outbound** work that puts new people into that funnel.

**Use short links only** (no ugly UTMs in posts/DMs):

| Link | Goes to |
|------|---------|
| https://docracy.io/try | Sample mutual NDA → prepare |
| https://docracy.io/nda | Same |
| https://docracy.io/price | Pricing |
| https://docracy.io/go/dm | Sample NDA (for outreach DMs) |
| https://docracy.io/go/ph | Product Hunt (historical) |
| https://docracy.io/go/hn | Show HN |
| https://docracy.io/go/li | LinkedIn |
| https://docracy.io/go/x | X |

Attribution is recorded under the hood (`ref` / `utm_*`).

## Status

- [x] Conversion CTAs + short links deployed
- [x] Google Search Console domain verified
- [x] Product Hunt (at go-live) — do not re-launch
- [x] Community answers (Reddit / IH) — see `outbound/distribution.md`
- [ ] Partner emails (`outbound/partner-batch.md` — 12 ready)
- [ ] Directories (AlternativeTo first)
- [ ] Reverse-trial replies to anyone who used the product
- [ ] Watch GSC: which queries hit `/docusign-alternative`, `/nda-signing`, templates

## This week (do in order)

**Start here:** `outbound/distribution.md`

### 1. Partner emails (primary for first customers)
`outbound/partner-batch.md` — send the 12 ready emails. Reply same day.

### 2. Directories + listicle pitches
`outbound/directories.md` + `distribution.md` §C–D.

### 3. Google (automated channel)
In Search Console: Performance → filter pages `/docusign-alternative`, `/nda-signing`, `/free-templates/*`.  
Share top queries — we tighten titles/CTAs from real data. Money pages now CTA to sample NDA in the hero.

### 4. Reverse trials
`outbound/reverse-trial.md` — anyone who sent/signed.

### 5. Social (support only)
2–3 posts/week max. Demos in `linkedin/` and `x/`. CTA: `docracy.io/try`.

### 6. Show HN — optional later
Only after a few quotes. PH is done. See `outbound/launch-checklist.md`.

## Kill criteria (2 weeks)

- Outreach → trials but no upgrades → check PrepareSent / Status / pricing CTAs in Admin → Growth
- Almost no trials → change niche/message, not product features
- Cold social → ignore vanity; keep light

## Do not do yet

- Paid ads (except a tiny Google test after we see organic `/try` conversions)
- Enterprise sales
- X/LinkedIn automation
- Re-launch Product Hunt
