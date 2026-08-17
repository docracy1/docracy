# Backlink reclamation outreach — email template

Target: the 293 contacts in `marketing/seo-research/docracy-backlink-contacts.csv`. Their page links to
**docracy.com** — the original 2011-era free-document product, acquired by eversign in 2019 and discontinued.
The domain now just redirects to a generic "Learn More" page. This docracy.io is a separate, independently
built product with no relation to the original team — same honest framing as `/docracy-alternative`.

Two pitch styles below, pick by target type:

- **Story version** (default) — for dead/inactive sites, personal blogs, editorial pieces: explains what
  happened to docracy.com and positions docracy.io as bringing back what was good about it (free templates,
  no signup, dead-simple signing) via the Marketplace. Not a claim of continuity or affiliation — just
  "built in that spirit."
- **Short version** — for domains that are clearly still active, running businesses: skip the backstory,
  just flag the broken link and describe docracy.io plainly as an e-signature subscription tool. Busy
  companies don't need the 2019-acquisition history, just the fact and the fix.

Either way: this is a dead-link fix, not a "check out my tool" cold pitch — that's what makes it worth a
reply. Never claim docracy.io *is* the original docracy.com or that it's an official revival — it isn't,
and overclaiming would undercut the exact honesty that makes the dead-link framing credible.

## Subject line options

- Quick heads-up: a link on {{their_domain}} points to a discontinued site
- {{their_page_title}} — one of your links is dead
- Small fix for your {{context, e.g. "resources" / "contact"}} page
- Broken link on {{their_domain}}

Pick based on note/context: use "dead link" framing for role-based/generic contacts, more specific/personal
framing (referencing their actual page) for personal-site or editorial contacts where you can plausibly say
you read the page.

## Template — role-based / generic contacts (support@, info@, contact@)

```
Subject: Quick heads-up: a link on {{their_domain}} points to a discontinued site

Hi,

I noticed a page on {{their_domain}} links to docracy.com — that product was acquired by eversign back in
2019 and discontinued; the domain now just redirects to a generic landing page, so the link doesn't lead
anywhere useful for your readers anymore.

Not affiliated with the original team, but we built docracy.io in that same spirit — free e-signatures, no
signup required, and a growing Marketplace of 90+ free templates (NDAs, leases, contracts) picking up
where the old docracy.com left off. If you'd ever want to swap the link for something live, happy to have
you look. No pressure either way — just flagging the dead link since it's an easy fix.

Thanks for the read,
{{your_name}}
Docracy — https://docracy.io
```

## Template — editorial / redaktion contacts (editor@, tips@, editorial@)

```
Subject: {{their_page_title}} — one of your links is dead

Hi {{name_if_known}},

Came across your piece linking to docracy.com — worth flagging that it was acquired by eversign in 2019
and shut down, so the link now just redirects to a generic page rather than anything relevant to what you
were referencing.

We run docracy.io now — a separate, independently built free e-signature tool with a growing Marketplace
of free templates, built in the spirit of what made the original useful (not affiliated with the original
docracy.com team) — happy to share more if it's ever useful for an update, but mainly just wanted to flag
the broken link.

Best,
{{your_name}}
Docracy — https://docracy.io
```

## Template — personal sites (name@domain, found via HTML scan)

```
Subject: Small fix for {{their_page_title}}

Hey {{first_name}},

Quick note — I saw {{their_domain}} links to docracy.com, which was acquired and discontinued back in
2019 (the domain just redirects to a generic page now). Figured you'd want to know in case it's worth a
swap or a removal.

For what it's worth, we built docracy.io since — a separate, independent tool that brought back what was
actually useful about the original (free templates, no signup, simple signing) via a growing Marketplace —
but that's secondary, mainly just flagging the dead link.

Cheers,
{{your_name}}
```

## Short version — for domains that are clearly still active, running businesses

Use when the target company is obviously alive and operating (real product, recent activity, active blog)
— skip the 2019-acquisition backstory entirely and keep it to the practical fact.

```
Subject: Broken link on {{their_domain}}

Hi,

Quick note — a link on {{their_domain}} points to docracy.com, which is broken / no longer live.

We run docracy.io — a simple e-signature subscription tool, free to start, no signup required to try it —
happy to be considered if you ever update the link, but mainly just wanted to flag it.

Thanks,
{{your_name}}
Docracy — https://docracy.io
```

## Notes on sending

- Personalize {{their_page_title}} / {{context}} per row — a generic mail-merge blast reads as spam and
  these are dead-link tips, which land far better as 1:1-feeling notes.
- Don't bulk-send to the whole 293 at once — this is a "did you actually look at my page" pitch; sending
  in small batches (20-30/day) keeps deliverability and reply rate reasonable.
- Skip WHOIS-sourced admin@ addresses first if time is short — lowest reply rate of the bunch, and some
  are on registrar-privacy proxies that won't forward anyway.
- Track replies against `marketing/seo-research/docracy-backlink-contacts.csv` — mark sent/replied/updated
  so a re-run doesn't re-contact the same domain.
- Never claim docracy.io is a continuation of, revival of, or affiliated with the original docracy.com —
  it isn't, and that claim would be false. "Built in that spirit" / "brought back what was useful" is the
  honest way to get the same warm framing without the false continuity claim.
