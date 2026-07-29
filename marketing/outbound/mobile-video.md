# Mobile demo video — distribution

**Files** (in `marketing/linkedin/videos/`):

| File | Use |
|------|-----|
| `mobile-sign.webm` | **Primary** — clean phone UI, 1080×1920, ~12s |
| `mobile-live-landing.webm` | Optional B-roll of live site on iPhone viewport |

Re-record: `cd marketing/linkedin && npm run record:mobile`

**CTA everywhere:** https://docracy.io/try

---

## Post copy (LinkedIn / X / communities)

```
Sign an NDA on your phone — no app install.

Docracy is free for up to 2 signers. No account for you or them.
Paid is $10/mo flat when you need more.

Try it: https://docracy.io/try
```

Shorter (X):

```
E-sign on mobile. No app. Free ≤2 signers.

https://docracy.io/try
```

---

## Where to post this video

| # | Place | How | Notes |
|---|-------|-----|-------|
| 1 | **LinkedIn** (feed post) | Native video upload + copy above | Posts still OK even if DMs don’t work |
| 2 | **X** | Upload video + short copy | Use `/go/x` only if you want attribution; `/try` is fine |
| 3 | **Indie Hackers** | Post or comment with video link / upload if allowed | Soft: “built a mobile-first free e-sign path” |
| 4 | **IndieFamily Discord** | Share in show-and-tell / feedback **once** | Soft, not spam — you already intro’d |
| 5 | **r/freelance** or **r/smallbusiness** | Only inside a helpful comment, not a cold promo post | Attach if Reddit allows; else link |
| 6 | **YouTube Shorts** | Upload vertical webm/mp4 | Title: “Sign an NDA on your phone (no app)” |
| 7 | **TikTok** / **Instagram Reels** | Same vertical file | Optional; same CTA in caption |
| 8 | **Product Hunt** maker comment / gallery | Only if updating existing listing assets | Don’t re-launch |
| 9 | **SaaSHub / AlternativeTo** | Add video URL to listing when available | After AlternativeTo unlock (~Aug 5) |

Skip: cold LinkedIn DMs, blasting every Discord channel.

---

## Convert webm → mp4 (if a site rejects webm)

```bash
ffmpeg -i marketing/linkedin/videos/mobile-sign.webm -c:v libx264 -pix_fmt yuv420p -an marketing/linkedin/videos/mobile-sign.mp4
```
