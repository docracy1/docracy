# Backlink reclamation outreach — email template

Target: the 293 contacts in `marketing/seo-research/docracy-backlink-contacts.csv`. Their page links to
**docracy.com** — the original 2011-era free-document product, acquired by eversign in 2019 and discontinued.
The domain now just redirects to a generic "Learn More" page. This docracy.io is a separate, independently
built product with no relation to the original team — same honest framing as `/docracy-alternative`.

The pitch is a dead-link fix, not a "check out my tool" cold pitch — that's what makes it worth a reply.

## Subject line options

- Quick heads-up: a link on {{their_domain}} points to a discontinued site
- {{their_page_title}} — one of your links is dead
- Small fix for your {{context, e.g. "resources" / "contact"}} page

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

Not affiliated with the original team, but I run a separate, independently built e-signature tool now at
docracy.io (free, no signup required) that covers similar ground if you'd ever want to swap the link for
something live. No pressure either way — just flagging the dead link since it's an easy fix.

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

I run docracy.io now, a separate free e-signature tool (no relation to the original docracy.com team) —
happy to share more if it's ever useful for an update, but mainly just wanted to flag the broken link.

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

For what it's worth, I run a separate, unrelated tool now at docracy.io if you're ever looking for a free
e-signature option — but that's secondary, mainly just flagging the dead link.

Cheers,
{{your_name}}
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
