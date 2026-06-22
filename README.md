# Euron Export — euron-export.ch

Commercial website for Euron Export GmbH, a licensed tyre-recycling and export operation based in Oberdiessbach BE, Switzerland. Built as a headless CMS-driven multi-page Next.js application.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Quick Start](#2-quick-start)
3. [Project Structure](#3-project-structure)
4. [Routing Architecture](#4-routing-architecture)
5. [Sanity CMS — Data Flow](#5-sanity-cms--data-flow)
6. [GSAP Animation System](#6-gsap-animation-system)
7. [Environment Variables](#7-environment-variables)
8. [Deployment — Hostpoint](#8-deployment--hostpoint)
9. [Git Branching Strategy](#9-git-branching-strategy)
10. [TypeScript Conventions](#10-typescript-conventions)

---

## 1. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.9 |
| UI Runtime | React | 19.2.4 |
| Language | TypeScript (strict mode) | ^5 |
| Styling | Tailwind CSS | ^4 |
| Headless CMS | Sanity.io v3 | ^6.0.0 |
| CMS Client | next-sanity | ^13.1.0 |
| Rich Text | @portabletext/react | ^6.2.0 |
| Images | @sanity/image-url | ^2.1.1 |
| Animations | GSAP + @gsap/react | ^3.15.0 / ^2.1.2 |
| Fonts | Saira, IBM Plex Mono (Google Fonts via next/font) | — |

> **Node.js requirement:** 18.18.0 or later (required by Next.js 16).

---

## 2. Quick Start

### 2.1 Clone and Install

```bash
git clone https://github.com/ShayBosskey/euron-export-ch.git
cd euron-export.ch
npm install
```

### 2.2 Configure Environment

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in the three required values (see [Section 7](#7-environment-variables) for where to find them):

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
```

### 2.3 Start the Development Server

```bash
npm run dev
```

The site runs at `http://localhost:3000`.
The embedded Sanity Studio runs at `http://localhost:3000/studio`.

### 2.4 Populate the CMS

1. Navigate to `http://localhost:3000/studio`
2. Sign in with your Sanity account (the same account that owns the project)
3. Fill in **Site Settings** first — siteName, email, phone, and address drive the Navbar and Footer
4. Fill in each section document in order: Hero → About → Services → Markets → Why Us → Contact
5. Every field has a fallback value in the component, so the site renders even with an empty CMS

---

## 3. Project Structure

```
euron-export.ch/
├── public/                         # Static assets (favicons, OG images)
├── src/
│   ├── app/                        # Next.js App Router — all routes live here
│   │   ├── layout.tsx              # Root layout: fonts, global metadata, <html>/<body>
│   │   ├── globals.css             # Design tokens (CSS custom properties), Tailwind base
│   │   ├── page.tsx                # Route: / (Hero)
│   │   ├── about/
│   │   │   └── page.tsx            # Route: /about
│   │   ├── services/
│   │   │   └── page.tsx            # Route: /services
│   │   ├── markets/
│   │   │   └── page.tsx            # Route: /markets
│   │   ├── why-us/
│   │   │   └── page.tsx            # Route: /why-us
│   │   ├── contact/
│   │   │   └── page.tsx            # Route: /contact
│   │   └── studio/
│   │       ├── layout.tsx          # Studio layout (noindex meta)
│   │       └── [[...tool]]/
│   │           └── page.tsx        # Route: /studio/** (Sanity Studio, client component)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # Sticky nav, GSAP entrance, mobile drawer
│   │   │   └── Footer.tsx          # Site footer with CMS-driven contact details
│   │   ├── sections/               # One component per CMS section
│   │   │   ├── HeroSection.tsx
│   │   │   ├── AboutSection.tsx
│   │   │   ├── ServicesSection.tsx
│   │   │   ├── MarketsSection.tsx
│   │   │   ├── WhyUsSection.tsx
│   │   │   └── ContactSection.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       └── SectionHeading.tsx
│   ├── lib/
│   │   └── animations/
│   │       ├── useHeroAnimation.ts  # GSAP hero entrance (SplitText, timeline)
│   │       ├── useScrollReveal.ts   # GSAP scroll-triggered reveal (ScrollTrigger)
│   │       ├── useCountUp.ts        # GSAP number count-up
│   │       └── index.ts             # Barrel export
│   ├── sanity/
│   │   ├── client.ts               # Sanity client + preview client
│   │   ├── env.ts                  # Reads and validates env vars
│   │   ├── image.ts                # urlFor() helper wrapping @sanity/image-url
│   │   ├── queries.ts              # All GROQ queries (one per CMS section)
│   │   └── schemaTypes/
│   │       ├── index.ts            # Exports schema array to sanity.config.ts
│   │       ├── siteSettings.ts
│   │       ├── heroSection.ts
│   │       ├── aboutSection.ts
│   │       ├── servicesSection.ts
│   │       ├── marketsSection.ts
│   │       ├── whyUsSection.ts
│   │       └── contactSection.ts
│   └── types/
│       └── sanity.ts               # TypeScript interfaces for all CMS payloads
├── sanity.config.ts                # Sanity Studio config (schema, structure, plugins)
├── next.config.ts                  # Next.js config (image domain allowlist)
├── tsconfig.json                   # Strict TypeScript config
├── .env.local.example              # Template — copy to .env.local
└── package.json
```

---

## 4. Routing Architecture

Every public-facing section of the site is a **separate Next.js App Router page** — not a single-page scroll-jacked layout. This ensures each section is independently crawlable by search engines and directly linkable.

### 4.1 Route Map

| URL | File | CMS Document Fetched | Purpose |
|---|---|---|---|
| `/` | `src/app/page.tsx` | `heroSection` + `siteSettings` | Landing / Hero |
| `/about` | `src/app/about/page.tsx` | `aboutSection` + `siteSettings` | Company story, stats |
| `/services` | `src/app/services/page.tsx` | `servicesSection` + `siteSettings` | Disposal + compliance |
| `/markets` | `src/app/markets/page.tsx` | `marketsSection` + `siteSettings` | Buying flow + export markets |
| `/why-us` | `src/app/why-us/page.tsx` | `whyUsSection` + `siteSettings` | USP stats, partner logos |
| `/contact` | `src/app/contact/page.tsx` | `contactSection` + `siteSettings` | Form, address, phone |
| `/studio/**` | `src/app/studio/[[...tool]]/page.tsx` | — | Embedded Sanity CMS |

### 4.2 Page Anatomy

Every page follows an identical pattern:

```tsx
// 1. ISR revalidation window
export const revalidate = 60;  // seconds

// 2. SEO metadata (static or from CMS)
export const metadata: Metadata = { title: "...", description: "..." };

// 3. Async server component — fetches CMS data server-side
export default async function SomePage() {
  const data = await client
    .fetch<PageData>(pageQuery)
    .catch(() => null);           // null on any network/CMS error

  return (
    <>
      <Navbar siteName={data?.settings?.siteName ?? "Euron Export"} />
      <main>
        <SomeSectionComponent data={data?.section ?? null} />
      </main>
      <Footer settings={data?.settings ?? null} />
    </>
  );
}
```

Key properties of this pattern:

- **Server Component by default** — data is fetched at request time on the server; zero client JS for the data loading itself
- **ISR at 60 seconds** — Next.js serves a cached HTML page and regenerates it in the background when the cache expires; content changes in Sanity go live within 60 seconds without a redeploy
- **Double-null safety** — `.catch(() => null)` catches fetch failures; `??` fallbacks in JSX handle missing CMS fields independently

### 4.3 The Studio Route

`/studio` is a **catch-all client component** (`[[...tool]]`) that renders the full Sanity Studio embedded inside the Next.js app. The studio layout applies `robots: noindex` to prevent it appearing in search results. Authentication is handled by Sanity's own session cookies — only users added to the Sanity project can access it.

---

## 5. Sanity CMS — Data Flow

### 5.1 Architecture Overview

```
Sanity Cloud (sanity.io)
        │
        │  GROQ query over HTTPS
        ▼
src/sanity/client.ts          ← createClient() with projectId + dataset
        │
        │  client.fetch<T>(query)
        ▼
src/app/[route]/page.tsx      ← Async Server Component
        │
        │  typed prop: data: SectionType | null
        ▼
src/components/sections/      ← "use client" component renders data
```

### 5.2 CMS Schema Documents

Each section of the site maps 1:1 to a Sanity document type. All documents are **singletons** — one document per type, enforced by the `documentId` setting in `sanity.config.ts`.

| Document Type | Studio Label | Key Fields |
|---|---|---|
| `siteSettings` | Site Settings | siteName, tagline, logo, email, phone, address, linkedIn, seoDescription |
| `heroSection` | Hero Section | headline, subheadline, ctaPrimaryLabel/Href, ctaSecondaryLabel/Href, backgroundImage |
| `aboutSection` | About Section | headline, body (Portable Text rich text), image, foundedYear, teamSize |
| `servicesSection` | Services Section | headline, subheadline, services[] {title, description, icon} |
| `marketsSection` | Markets Section | headline, subheadline, markets[] {region, countries, description, flagEmoji} |
| `whyUsSection` | Why Us Section | headline, subheadline, usps[] {title, stat, description} |
| `contactSection` | Contact Section | headline, subheadline, formspreeEndpoint |

### 5.3 GROQ Queries

All queries live in `src/sanity/queries.ts`. Each page imports only the queries it needs and composes them into a single network round-trip:

```ts
// Individual section query (src/sanity/queries.ts)
export const aboutSectionQuery = groq`
  *[_type == "aboutSection"][0]{
    headline,
    body,
    image,
    foundedYear,
    teamSize,
  }
`;

// Page-level query (src/app/about/page.tsx)
const aboutPageQuery = groq`
  {
    "about":    ${aboutSectionQuery},
    "settings": ${siteSettingsQuery},
  }
`;

const data = await client.fetch<AboutPageData>(aboutPageQuery).catch(() => null);
```

The `[0]` projection picks the first (and only) document of each type — this is the singleton pattern. Wrapping individual queries in a single object query means **one HTTPS request per page load**, regardless of how many sections it references.

### 5.4 Image Handling

Sanity stores images on its own CDN (`cdn.sanity.io`). The `urlFor()` helper in `src/sanity/image.ts` builds optimised CDN URLs with on-the-fly resizing:

```ts
import { urlFor } from "@/sanity/image";

const src = urlFor(data.backgroundImage).width(1920).height(1080).url();
// → https://cdn.sanity.io/images/<projectId>/production/<hash>-1920x1080.jpg
```

The domain `cdn.sanity.io` is allow-listed in `next.config.ts` so Next.js `<Image>` can further optimise and serve images through its own pipeline.

### 5.5 TypeScript Types

`src/types/sanity.ts` defines a TypeScript interface for every CMS document. Array fields (`services?`, `markets?`, `usps?`, `body?`) are marked **optional** — Sanity can return partial documents before all fields are filled in the Studio. Every component guards these with `data.field ?? []` fallbacks and checks `data.field && data.field.length > 0` before rendering lists.

### 5.6 Content Fallback Strategy

No CMS field is a hard runtime dependency. If Sanity is unreachable or a document is unpublished:

| Failure Point | Behaviour |
|---|---|
| Entire fetch fails | `.catch(() => null)` returns `null` for the page |
| Home page gets `null` | Renders a "CMS Not Connected" screen with a link to `/studio` |
| All other pages get `null` | Render normally with hardcoded German fallback strings |
| Array field is empty/missing | Section renders without list items (no crash) |
| Image field is missing | Hero falls back to an SVG warehouse illustration; About omits the image column |

### 5.7 Editing Content (Non-Technical Guide)

1. Go to `https://euron-export.ch/studio` (or `http://localhost:3000/studio` locally)
2. Sign in with your Sanity account
3. Select the section to edit from the left sidebar
4. Make your changes and click **Publish**
5. The live site updates within 60 seconds (one ISR cache cycle)

> Images must be uploaded directly in the Studio. Recommended minimum size for Hero background: **1920 × 1080 px**. Accepted formats: JPEG, PNG, WebP.

---

## 6. GSAP Animation System

All animations are isolated in custom hooks inside `src/lib/animations/`. The `@gsap/react` `useGSAP` hook ensures every GSAP context is **automatically cleaned up on component unmount** — no memory leaks, no stale animations when navigating between pages.

### 6.1 Hooks Reference

| Hook | File | Used In | What It Does |
|---|---|---|---|
| `useHeroAnimation` | `useHeroAnimation.ts` | `HeroSection` | Timeline: overlay fade → SplitText word-stagger on headline → sub-headline fade → CTA button scale-in |
| `useScrollReveal` | `useScrollReveal.ts` | All other sections | Targets `[data-reveal]` elements inside a container; translates + fades them in when the container scrolls into view (`ScrollTrigger`, fires once) |
| `useCountUp` | `useCountUp.ts` | Available for stats | Animates a number from 0 to a target value on scroll-into-view |

### 6.2 How `useScrollReveal` Works

Mark any element inside a section with `data-reveal` and it animates automatically:

```tsx
const containerRef = useScrollReveal({ stagger: 0.15, y: 30 });

return (
  <section ref={containerRef}>
    <h2 data-reveal>This fades up first</h2>
    <p data-reveal>This fades up 0.15s later</p>
  </section>
);
```

A single `ScrollTrigger` is attached to the **container**, not one per element — intentional for performance. The `once: true` flag means the animation does not reverse when scrolling back up.

### 6.3 Adding a New Animation

1. Create `src/lib/animations/useMyAnimation.ts`
2. Use `useRef<HTMLElement>(null)` and `useGSAP(() => { ... }, { scope: myRef })`
3. Return `myRef` and attach it to the section's root element via `ref={containerRef as React.RefObject<HTMLElement>}`
4. Export from `src/lib/animations/index.ts`

**Rule:** never call `gsap.to()` outside a `useGSAP` callback. It will not clean up on unmount.

---

## 7. Environment Variables

### 7.1 Required

| Variable | Scope | Where to Find It |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Public (client + server) | [sanity.io/manage](https://sanity.io/manage) → your project → Settings → API |
| `NEXT_PUBLIC_SANITY_DATASET` | Public (client + server) | Same page — typically `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Public (client + server) | Use `2024-01-01` unless you need a newer API feature |

### 7.2 Optional

| Variable | Scope | Purpose |
|---|---|---|
| `SANITY_API_READ_TOKEN` | Server only | Enables draft preview mode. Not required for production. |

### 7.3 Setting Variables in Production

**Vercel:** Project dashboard → Settings → Environment Variables → add each key/value pair.

**VPS:** Create `/var/www/euron-export/.env.local` with production values, or inject via your process manager (PM2 ecosystem file, systemd `EnvironmentFile`).

Variables prefixed `NEXT_PUBLIC_` are embedded into the client bundle at build time. Never store secrets in `NEXT_PUBLIC_` variables.

---

## 8. Deployment — Hostpoint

Hostpoint is the Swiss domain registrar and hosting provider for this project. The recommended production architecture keeps the domain at Hostpoint while serving the Next.js application from Vercel.

### 8.1 Recommended: Vercel + Hostpoint DNS (works with any Hostpoint plan)

Vercel is the platform built by the Next.js team. It natively supports ISR, automatic HTTPS, and zero-downtime deploys. This is the recommended setup.

**Step 1 — Deploy to Vercel**

```bash
npm install -g vercel
vercel login
vercel --prod
```

Vercel auto-detects Next.js. After the first deploy, every push to `main` on GitHub triggers a production deployment automatically via the Vercel GitHub integration.

**Step 2 — Add Environment Variables on Vercel**

Project dashboard → Settings → Environment Variables. Add the three `NEXT_PUBLIC_SANITY_*` variables from [Section 7](#7-environment-variables).

**Step 3 — Configure DNS at Hostpoint**

In the Vercel dashboard: Project → Settings → Domains → add `euron-export.ch` and `www.euron-export.ch`. Vercel displays the DNS records to create.

Log into the Hostpoint control panel and navigate to **Domains → DNS-Einstellungen** for `euron-export.ch`:

| Record Type | Host | Value |
|---|---|---|
| `A` | `@` (root) | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Delete any pre-existing `A` record for `@` before adding the new one. DNS propagation takes up to 48 hours but typically completes within 1 hour on Hostpoint.

**Step 4 — Verify**

Once DNS propagates, `https://euron-export.ch` serves the Next.js app with a Vercel-managed TLS certificate (auto-renewed).

---

### 8.2 Alternative: VPS / Dedicated Server with Node.js (Hostpoint CloudServer)

If you have a Hostpoint CloudServer or Dedicated Server with root access and Node.js 18+ installed:

**Build and start the app**

```bash
git clone https://github.com/ShayBosskey/euron-export-ch.git /var/www/euron-export
cd /var/www/euron-export
cp .env.local.example .env.local   # then fill in production values
npm install
npm run build
```

**Run with PM2**

```bash
npm install -g pm2
pm2 start npm --name "euron-export" -- start
pm2 save
pm2 startup   # follow the printed command to enable auto-start on reboot
```

**Reverse proxy with Nginx**

`npm run start` binds to port 3000. Place Nginx in front to serve on 80/443:

```nginx
server {
    listen 80;
    server_name euron-export.ch www.euron-export.ch;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Obtain an SSL certificate**

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d euron-export.ch -d www.euron-export.ch
```

**Deploying updates**

```bash
cd /var/www/euron-export
git pull origin main
npm install
npm run build
pm2 restart euron-export
```

---

### 8.3 Why Static Export (`next export`) Is Not Suitable

The site uses `export const revalidate = 60` on every page — this tells Next.js to silently regenerate cached pages every 60 seconds so content changes in Sanity go live without a redeploy. Static export (`output: 'export'`) does not support ISR. Using it would require a manual rebuild and FTP upload after every CMS edit. Use Vercel or a Node.js VPS instead.

---

## 9. Git Branching Strategy

This project follows a feature-branch workflow. Every piece of work is isolated in its own branch and merged into `main` only when complete and type-checked.

### 9.1 Branch History

| Branch | Purpose |
|---|---|
| `feature/init-nextjs` | Project scaffold — Next.js, TypeScript, Tailwind CSS, design tokens |
| `feature/cms-integration` | Sanity schemas, client, GROQ queries, embedded Studio at `/studio` |
| `feature/gsap-animations` | Animation hooks: useHeroAnimation, useScrollReveal, useCountUp |
| `feature/design-implementation` | All section UI components, Navbar, Footer |
| `feature/multi-page-routing` | App Router multi-page decomposition, page-level CMS fetch wiring |
| `feature/sanity-wiring` | TypeScript type fixes, React namespace imports, home page SEO metadata |
| `feature/documentation` | This README |

### 9.2 Workflow for New Features

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# ... do the work, running npx tsc --noEmit before committing ...

git add <specific files>        # never git add -A (avoids committing .env.local)
git commit -m "feat(scope): description"
git push -u origin feature/your-feature-name
# Open a pull request on GitHub → merge to main
```

### 9.3 Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope):      new feature or capability
fix(scope):       bug fix
docs(scope):      documentation only
refactor(scope):  code restructure, no behaviour change
chore(scope):     tooling, config, dependencies
```

---

## 10. TypeScript Conventions

- **Strict mode** is on (`"strict": true` in `tsconfig.json`) — no implicit `any`, no unchecked index access
- **All CMS payloads are typed** in `src/types/sanity.ts` — never use `any` for Sanity data
- **Array fields are optional** (`services?: Service[]`) — Sanity can return partial documents; components guard with `data.field ?? []` and `data.field && data.field.length > 0`
- **`import type`** is used for all type-only imports to eliminate them at runtime
- **`groq` tag template literal** is applied to all GROQ strings — enables syntax highlighting and type inference in the Sanity VS Code extension
- **`React.RefObject`** requires `import type React from "react"` in client components — the new JSX transform (`react-jsx`) does not auto-import the React namespace

---

*Built by Shay Elkayam · Next.js + Sanity.io · Hosted on Vercel with Hostpoint DNS*
