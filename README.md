# Euron Export AG — Website

> Swiss B2B export company website. Built on **Next.js 16**, **Sanity CMS**, **Tailwind CSS 4**, and **GSAP** animations. The Sanity Studio is embedded directly under `/studio` — no separate repository required.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 4 |
| CMS | Sanity.io (embedded studio) | 6 |
| Animations | GSAP + `@gsap/react` | 3 |
| Fonts | Inter (body), Playfair Display (headings) | — |
| Deployment | Vercel (recommended) | — |

---

## Project Structure

```
euron-export.ch/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout — fonts, metadata
│   │   ├── page.tsx            # Home page (Server Component, fetches Sanity)
│   │   ├── globals.css         # Design tokens (@theme), global resets
│   │   └── studio/
│   │       ├── layout.tsx      # Studio route layout (noindex)
│   │       └── [[...tool]]/
│   │           └── page.tsx    # Embedded Sanity Studio (Client Component)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx      # Fixed nav with scroll-based background transition
│   │   │   └── Footer.tsx      # Footer with contact info from CMS
│   │   ├── sections/
│   │   │   ├── HeroSection.tsx      # Full-screen hero with GSAP entrance
│   │   │   ├── AboutSection.tsx     # Split layout with PortableText body
│   │   │   ├── ServicesSection.tsx  # 3-column service cards with icon set
│   │   │   ├── MarketsSection.tsx   # Dark region cards grid
│   │   │   ├── WhyUsSection.tsx     # Stats/USP strip on navy background
│   │   │   └── ContactSection.tsx   # Contact form (Formspree or custom API)
│   │   └── ui/
│   │       ├── Button.tsx           # Reusable button (primary / outline / ghost)
│   │       └── SectionHeading.tsx   # Headline + gold accent bar
│   ├── lib/
│   │   └── animations/
│   │       ├── useScrollReveal.ts   # Scroll-triggered stagger reveal hook
│   │       ├── useHeroAnimation.ts  # Hero entrance timeline (SplitText words)
│   │       ├── useCountUp.ts        # Animated number counter on scroll
│   │       └── index.ts             # Re-export barrel
│   ├── sanity/
│   │   ├── env.ts               # Env var validation (throws if missing)
│   │   ├── client.ts            # Published + preview Sanity clients
│   │   ├── image.ts             # Image URL builder helper
│   │   ├── queries.ts           # All GROQ queries (homePageQuery, etc.)
│   │   └── schemaTypes/
│   │       ├── index.ts         # Schema barrel export
│   │       ├── siteSettings.ts  # Global site settings schema
│   │       ├── heroSection.ts
│   │       ├── aboutSection.ts
│   │       ├── servicesSection.ts
│   │       ├── marketsSection.ts
│   │       ├── whyUsSection.ts
│   │       └── contactSection.ts
│   └── types/
│       └── sanity.ts            # TypeScript interfaces for all CMS types
├── sanity.config.ts             # Sanity Studio config (schema, structure, plugins)
├── next.config.ts               # Next.js config (Sanity CDN image domains)
├── .env.local.example           # Required environment variables template
└── package.json
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your Sanity credentials:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_API_READ_TOKEN=your_read_token   # optional, for draft previews
```

> **Don't have a Sanity project yet?**
> 1. Go to [sanity.io/manage](https://www.sanity.io/manage) and create a free project.
> 2. Copy the Project ID from the project dashboard.
> 3. Add `http://localhost:3000` to the project's CORS origins (under API settings).

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

---

## Embedded CMS Studio

The Sanity Studio is embedded directly into this Next.js project — **no separate repository or deployment needed**.

**URL:** `http://localhost:3000/studio` (dev) or `https://yourdomain.com/studio` (production)

### How it works

The studio is a single `"use client"` page at `src/app/studio/[[...tool]]/page.tsx` that renders `<NextStudio config={config} />`. The `sanity.config.ts` at the project root defines all schemas, plugins, and the custom content structure.

### Content editors can update

| Section | What they can edit |
|---------|-------------------|
| **Site Settings** | Company name, tagline, logo, email, phone, address, LinkedIn |
| **Hero Section** | Headline, sub-headline, CTA buttons, background image |
| **About Section** | Headline, rich text body, team photo, founding year |
| **Services Section** | Headline, and any number of service cards (title, description, icon) |
| **Markets Section** | Headline, and any number of region cards (name, countries, description, flag) |
| **Why Us Section** | Headline, and stat/USP cards (number, title, description) |
| **Contact Section** | Headline, sub-headline, Formspree endpoint |

Each section is a **singleton document** (one per type) — editors cannot accidentally create duplicates.

---

## GSAP Animations

All animations live in `src/lib/animations/`. They use **`@gsap/react`'s `useGSAP` hook** with a `scope` option so cleanup is automatic on component unmount — no memory leaks.

### `useScrollReveal`

Watches a container element and animates all `[data-reveal]` children when the section enters the viewport.

```tsx
const containerRef = useScrollReveal({ y: 40, stagger: 0.12, start: "top 85%" });
return <section ref={containerRef}>
  <div data-reveal>Animates in</div>
  <div data-reveal>With stagger</div>
</section>;
```

### `useHeroAnimation`

Runs a timeline on mount:
1. Overlay fades to 55% opacity.
2. Headline words split and stagger in from below (uses `SplitText` if available).
3. Sub-headline fades up.
4. CTA buttons scale + fade in.

Target elements via `data-hero-headline`, `data-hero-sub`, and `data-hero-cta` attributes.

### `useCountUp`

Animates numeric elements from 0 to their target value when scrolled into view. Set the target via `data-count-up="42"` on the element.

---

## Design System

All design tokens are defined in `src/app/globals.css` under `@theme inline`:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-navy` | `#0A1628` | Primary dark, backgrounds |
| `--color-gold` | `#C9A84C` | Accent, CTA buttons, highlights |
| `--color-surface` | `#F5F7FA` | Light section backgrounds |
| `--color-gold-light` | `#DFC06A` | Hover state for gold elements |
| `--font-display` | Playfair Display | Headings |
| `--font-sans` | Inter | Body text |

---

## Git Flow

This project was built following a strict feature-branch strategy:

```
main ─────────────────────────────────────────────────── (stable)
  ╰─ feature/init-nextjs        ──► merged to main
  ╰─ feature/cms-integration    ──► merged to main
  ╰─ feature/gsap-animations    ──► merged to main
  ╰─ feature/design-implementation ──► merged to main
```

All feature branches were pushed to the remote (`ShayBosskey/euron-export-ch`) before merging. Merge commits use `--no-ff` to preserve branch history.

---

## Contact Form

The contact form at `#contact` supports two backends:

**Option A — Formspree (recommended, no server needed)**
1. Create a free form at [formspree.io](https://formspree.io).
2. In the CMS Studio → Contact Section → set `Formspree Endpoint` to your form ID (e.g. `xpwzqkjy`).

**Option B — Custom API route**
Create `src/app/api/contact/route.ts` to handle `POST` requests and integrate with any email provider (Resend, SendGrid, etc.).

---

## Deployment

### Vercel (recommended)

1. Push the `main` branch to GitHub (already done).
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Add environment variables in the Vercel dashboard (same as `.env.local`).
4. Deploy — Vercel will auto-detect Next.js.

> **Important:** In your Sanity project settings (sanity.io/manage → API → CORS Origins), add your production domain (e.g. `https://euron-export.ch`).

### Other platforms

The project is a standard Next.js app. It can be deployed on AWS Amplify, Railway, Render, or any Node.js host that supports `npm run build && npm start`.

---

## Type Safety

All Sanity document types are defined in `src/types/sanity.ts`. The GROQ queries in `src/sanity/queries.ts` are typed via the `client.fetch<Type>()` generic — if a schema changes, TypeScript surfaces the mismatch at build time.

---

## Scripts

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npx tsc --noEmit # Type-check without emitting files
```
