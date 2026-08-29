# Personal Resume Site — Design Doc

A single-page resume site, styled as a systems-monitoring dashboard,
built with plain HTML/CSS/JS and deployed via GitHub Pages to a custom
domain.

This document is written so that someone (or some AI) with **zero prior
context** on this project can read it, understand every decision that
was made and why, and pick up the work — in the spirit of a
design-doc-first / fresh-context-review workflow. It should be updated
whenever the architecture changes materially, not just the content.

---

## 1. Overview

**Goal:** Build a personal resume/portfolio site, inspired by an
existing example site (a single-page personal resume, GitHub-Pages
hosted, with sections like About, Career Journey, and Contact), but
with original content and a distinct visual identity, hosted on a
custom domain the owner already controls.

**Constraints that shaped the design:**
- No build tooling — the owner wanted the simplest possible stack for
  GitHub Pages, so plain HTML/CSS/JS was chosen over React or a static
  site generator.
- The site needed to eventually support **pluggable content** — i.e.
  content should be editable independent of markup/styling/logic, the
  same way the inspiration site appeared to work (its raw HTML showed
  "Loading…" placeholders before content populated, indicating a
  client-side fetch-and-render pattern rather than hardcoded HTML).
- Visual design should be *specific to the subject*, not a generic
  template. The site owner's career is in distributed-systems
  reliability and monitoring at large tech companies, so the design
  leans into a "systems dashboard" aesthetic rather than a conventional
  resume look.

**Current state:** Content and presentation are fully decoupled. All
resume content lives in one JSON file; the HTML is a content-free
skeleton; a small JS file fetches the JSON and renders the page. The
site is live on GitHub Pages with a custom domain and HTTPS enforced.

---

## 2. Alternatives considered

Documenting what was *not* chosen, and why, so future changes don't
inadvertently re-litigate settled decisions without knowing the
tradeoffs.

### 2.1 Tech stack
| Option | Verdict | Why |
|---|---|---|
| **Plain HTML/CSS/JS** | ✅ Chosen | No build step, trivial to host on GitHub Pages, easy to hand-edit, matches the owner's stated preference for simplicity. |
| React | ❌ Rejected | Requires a build step (bundler) to produce static output for Pages; unnecessary complexity for a single-page site with no complex interactivity. |
| Static site generator (11ty, Jekyll, Hugo) | ❌ Not chosen | Would add a build step and a new toolchain to learn/maintain, for a site with only ~7 sections and no blog/multi-page needs. Revisit if the site grows to many pages. |

### 2.2 Content storage / "pluggability"
The explicit goal was to mirror the inspiration site's apparent
architecture: markup and content are decoupled so content can be
updated without touching code.

| Option | Verdict | Why |
|---|---|---|
| **Single `content.json` file, fetched at runtime** | ✅ Chosen | No parser dependency (JSON is native to `fetch()` + `JSON.parse` in every browser). A malformed edit fails loudly and locally (JSON parse error) rather than silently breaking unrelated code. Content is fully separable from logic — a non-engineer could edit it. |
| Separate JS module (`content.js` exporting an object) | ❌ Not chosen | Mixes content into executable JS syntax; a stray missing comma or quote is a *code* bug, not just a *data* bug, and can be harder to isolate. No real benefit over JSON at this scale. |
| Markdown / YAML files per section | ❌ Not chosen | Would require pulling in a parser library (e.g. a YAML or Markdown parser) as a dependency, working against the "no build step, no dependencies" goal, for marginal authoring benefit given the content is structured data (dates, bullet lists, nested groups), not prose. |
| Hardcoded content directly in HTML (original approach, since revised) | ❌ Superseded | This was the *first* version of the site. It worked, but coupled content to markup — updating a job title meant editing HTML directly, and the whole page had to be re-diffed to review a content-only change. Migrated away from this once "pluggable like the inspiration site" became an explicit requirement. |

### 2.3 Hosting / domain
| Option | Verdict | Why |
|---|---|---|
| **GitHub Pages + custom domain via CNAME + registrar DNS** | ✅ Chosen | Free, matches the inspiration site's hosting choice, and the owner already owned the domain. |
| Netlify / Vercel | ❌ Not chosen | Would work fine, but adds an additional third-party platform account for no added benefit over GitHub Pages given the site's simplicity (static files only, no serverless functions needed). |

### 2.4 Visual design direction
| Option | Verdict | Why |
|---|---|---|
| **Dark "systems dashboard" theme** — metrics rendered as animated stat tiles, career timeline styled like a deploy/status log with health-indicator dots, monospace type for all numbers/dates/tech tags | ✅ Chosen | Deliberately tied to the subject matter (a career spent building monitoring/observability systems) rather than a generic template look. |
| Light, conventional "corporate resume" template | ❌ Not chosen | Would be safe but generic — didn't differentiate the site or reflect the owner's actual domain expertise. |

### 2.5 Profile photo
A headshot was initially added (hero section, with a small caption
tag). It was later **removed at the owner's request** — the hero
section was collapsed from a two-column (text + photo) layout to a
single centered column. The photo file and its CSS rules were removed. The
orphaned photo-frame classes (`.photo-frame`, `.hero-photo`,
`.hero-photo-wrap`, `.photo-tag`) lingered as dead code for a while
afterwards and have since been deleted from `style.css` — if a photo is
reinstated, they need to be written fresh. `.hero-inner-no-photo` is
still live and still used by `index.html`.

---

## 3. Implementation details

### 3.1 Repository file listing

| File | Purpose |
|---|---|
| `index.html` | Page skeleton only. Contains no resume content — only empty elements with `id`s (mount points) that `render.js` populates, plus a handful of `<template>` blocks (`tpl-metric`, `tpl-initiative-metric`, `tpl-timeline-entry`, `tpl-role-block`, `tpl-skill-group`, `tpl-chip`) used to stamp out repeating structures. |
| `content.json` | The single source of truth for all resume content. See §3.4 for schema. Editing the site's content means editing this file and nothing else. |
| `render.js` | Fetches `content.json` on page load (`fetch('content.json')`) and populates every section of `index.html` from it. Also owns the count-up animation for the metric tiles (via `IntersectionObserver`, so numbers animate in once scrolled into view) and respects `prefers-reduced-motion`. If the fetch fails (e.g. malformed JSON, or the file is missing), it replaces the page body with a plain-language error message that includes the fix for the most common cause (previewing via `file://` instead of a local server). |
| `style.css` | All visual styling. Defines the design tokens (CSS custom properties for color, font, spacing) at the top, then component-level styles. No content lives here. |
| `og.png` | 1200×630 social preview image (Open Graph / Twitter card), referenced by absolute URL from `index.html`. Generated to match the site's design tokens; regenerate it if the name, tagline, or headline metrics change. |
| `favicon.svg` | Vector favicon (`JQ` monogram + green status dot) used by modern browsers. |
| `favicon.png` | 180×180 raster fallback favicon / `apple-touch-icon`. |
| `CNAME` | Single-line file (GitHub Pages convention) containing the custom domain, telling GitHub Pages which domain to serve this repo at. |
| `README.md` | This document. |

Files that existed in earlier iterations and were later removed:
- `script.js` — superseded by `render.js` once the content/template
  split was introduced. If present in an older checkout, delete it.
- `img/headshot.jpg` — removed along with the photo feature (§2.5).

### 3.2 Metadata and crawlers — an exception to "no content in HTML"

The content/markup split in §2.2 has one deliberate exception. Social
scrapers (LinkedIn, Slack, iMessage, Facebook) and many search crawlers
**do not execute JavaScript**, so anything `render.js` injects at runtime
is invisible to them. Before this was addressed, the static document
they saw had the literal title `Loading…` and an empty description,
which is what a shared link previewed as.

Consequently these are hardcoded as real values in `index.html`:

- `<title>` and `<meta name="description">` — still overwritten at
  runtime by `renderMeta()` from `content.json`, so **the two copies
  must be kept in sync by hand** when `meta.pageTitle` /
  `meta.pageDescription` change.
- The `og:*` and `twitter:*` tags, including an absolute
  `og:image` URL (`https://jimquinn.com/og.png`) — relative paths are
  not reliably resolved by scrapers.
- A `<noscript>` block carrying the name, tagline, and a LinkedIn link,
  so a JS-less visitor gets the essentials instead of a blank page.

One thing is deliberately kept **out** of the static HTML: the email
address. It lives only in `content.json` and is injected at runtime, so
the literal string never appears in `index.html` — anything that doesn't
execute JavaScript (most naive address harvesters) never sees it. The
footer link renders the label `meta.emailLabel` ("email") rather than the
address itself. This is a speed bump, not real protection: `content.json`
is a public file and a determined scraper can simply fetch it. The
`<noscript>` fallback therefore points at LinkedIn instead of email.

If the site ever needs this duplication removed, the fix is a build step
that stamps the static tags from `content.json` — which would mean
giving up the "no build tooling" constraint in §1.

### 3.3 Rendering flow

1. Browser loads `index.html`. At this point the page shows only
   structural chrome (nav, empty section headers) — no resume content
   is visible yet.
2. `render.js`'s `init()` function runs on load, calls `loadContent()`,
   which does `fetch('content.json')`.
3. Once the JSON resolves, a series of `render*()` functions
   (`renderMeta`, `renderMetrics`, `renderAbout`, `renderInitiative`,
   `renderExperience`, `renderSkills`, `renderFooter`) each populate
   their corresponding section, using `document.getElementById` to
   find mount points and `<template>` cloning for repeated structures
   (e.g. one `tpl-timeline-entry` clone per job in
   `content.json → experience.entries`).
4. Text fields are set via `textContent` (safe, no HTML interpretation)
   except where the content is expected to include inline formatting
   like `<strong>`, which use `innerHTML` deliberately (e.g. bullet
   points that bold a key metric).

### 3.4 `content.json` schema

Top-level keys and what they control:

| Key | Controls |
|---|---|
| `meta` | Name, role/title, location, page `<title>`/meta description, hero tagline, contact email, `emailLabel` (the visible text of the footer email link — the address itself is never rendered, see 3.2), and `links` — an array of `{ label, url }` profile links (LinkedIn etc.) rendered into the footer after the email link. A published phone number was previously carried here (`phoneDisplay` / `phoneHref`) and was removed deliberately; don't reintroduce one without a reason. |
| `metrics` | The stat tiles under the hero. Array of `{ value, suffix, label }`. |
| `about` | About section: `{ kicker, title, body }`. |
| `initiative` | The featured-project card: `{ kicker, title, badge, roleTitle, paragraphs: [...], metrics: [...], footnote }`. |
| `experience` | `{ kicker, title, entries: [...] }`. Each entry is either `{ type: "role", current, date, org, location, positions: [{ title, bullets: [...] }] }` or `{ type: "education", date, org, location }`. |
| `skills` | `{ kicker, title, groups: [{ label, items: [...] }] }`. |
| `footer` | `{ kicker, title, body }`. |

Notes:
- Some text fields support inline HTML (e.g. `<strong>`) since they're
  rendered via `innerHTML` for emphasis — keep to simple inline tags
  only, not block-level markup.
- The `experience.entries` array order determines the on-page order of
  the timeline (most recent first, by convention, though the code
  doesn't enforce this).
- The last entry in `experience.entries` automatically gets no
  trailing connector line in the timeline UI (handled in `render.js`,
  not configurable via JSON).

### 3.5 Local preview

`render.js` uses `fetch()`, which browsers block against `file://`
URLs for security. Opening `index.html` by double-clicking it will
fail to load content. Instead, serve the directory locally, e.g.:

```bash
python3 -m http.server 8080
```

then visit `http://localhost:8080`.

### 3.6 Deployment

Static files only, no build step. Push to the `main` branch of the
GitHub Pages repo and Pages rebuilds automatically (typically within a
minute).

**Custom domain setup**, for reference (values specific to GitHub
Pages, not to any particular domain or account):

- **A records** (apex domain) → GitHub Pages IPs:
  `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- **AAAA records** (IPv6, optional) →
  `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
- **CNAME record** (`www` subdomain, optional) → the repo's default
  `<username>.github.io` address
- The domain's **nameservers** must be set to the registrar's own
  default DNS servers (not a third-party marketplace or parking
  service) for records added in the registrar's DNS manager to take
  effect. This tripped up the initial setup — the domain had been
  registered through a marketplace and was still pointed at that
  marketplace's nameservers rather than the registrar's own.
- Source: [GitHub Docs — Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- After DNS verifies in the repo's Pages settings, enable "Enforce
  HTTPS" (may take some time to become available while GitHub issues a
  certificate). This is **enabled** for jimquinn.com — GitHub issued the
  certificate and `https_enforced` is on, so plain `http://` requests
  redirect. Certificates renew automatically; no action needed.

---

## 4. Open questions / possible future work

- Photo: currently removed, and its CSS has now been deleted too (§2.5).
  Reinstating one means writing the styles again.
- The static `<title>`/description in `index.html` duplicate
  `content.json` values (§3.2) and can drift. A tiny check — even a
  grep in CI — would catch a mismatch.
- `og.png` is a generated raster and does not update itself when
  `content.json` changes; the headline metrics baked into it need a
  manual regeneration to stay truthful.
- No automated tests or CI exist. Given the site is static content with
  no logic beyond rendering, the main regression risk is a
  `content.json` edit that doesn't match the schema `render.js`
  expects (e.g. a renamed key). A lightweight JSON-schema validation
  step could be added if this becomes a recurring issue.
- No headless-browser screenshot verification was possible during
  development in the authoring environment (no outbound network
  access to install one) — verification was done by manually
  cross-checking every `id`/class referenced in `render.js` and the
  `<template>` blocks against `index.html` and `style.css`. Recommend
  a real browser check after any structural change.
