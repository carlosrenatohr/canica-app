# Design System

> **Status:** Approved (direction)  
> **Version:** 1.0

Visual language for canica. Implementation lives primarily in `packages/ui` and `apps/web`.

---

## Brand attributes

canica should communicate:

- Professionalism
- Trust
- Precision
- Calm
- Technology

It should **never** communicate:

- Corporate blue overload
- Medical clichés
- Outdated gradients
- “Hospital software” aesthetics

---

## Visual identity

**Style:** modern SaaS — minimal, elegant, clean, premium.

**Inspired by:** Linear, Raycast, Notion, Stripe, Vercel.

---

## Color palette

| Token role | Direction |
| --- | --- |
| Primary | Deep Navy |
| Secondary | Emerald |
| Accent | Sky Blue |
| Background | Warm White |
| Neutrals | Neutral Gray scale |

**Avoid:**

- Bright reds (except true semantic danger)
- Hospital greens
- Old-fashioned blues

Semantic colors (success, warning, danger, info) should be restrained and accessible in both light and dark themes.

---

## Typography

Preferred families:

- **Geist** (primary UI)
- **Inter** (fallback / secondary)

Hierarchy should favor clarity over decoration. Clinical screens prioritize scannability (names, vitals, dates, statuses).

---

## Icons

- Library: **Lucide React**
- Style: rounded, minimal, outlined
- Consistent stroke width across the product

---

## UI principles

- Large spacing — avoid cramped clinical forms
- Rounded corners
- Subtle shadows
- Glass effects only when appropriate
- Excellent accessibility (keyboard, contrast, focus rings)
- **Dark mode from day one**
- Dense data where needed (tables, timelines) without sacrificing calm chrome

---

## Component guidelines

- Base primitives from **shadcn/ui** (Radix + Tailwind)
- Shared components live in `packages/ui`
- App-specific compositions live in `apps/web`
- Prefer composition over one-off styled duplicates
- Forms: React Hook Form + Zod schemas from `packages/validation`
- AI-generated content must be visually distinguishable (labels, badges, or similar) until physician confirms

---

## Layout patterns (direction)

- Clear primary navigation for clinical modules
- Patient context always visible when working inside a chart
- Destructive actions require confirmation
- Empty states teach the next action without noise

---

## Logo direction

### Avoid clichés

- Red crosses
- Hearts
- Stethoscopes
- ECG lines
- Medical shields

### Represent instead

- Intelligence
- Precision
- Trust
- Modern software
- Clinical workflow

### Possible concepts

- Abstract monogram “C”
- Geometric folded shape
- Neural-inspired minimal symbol
- Medical record abstraction
- Connected nodes (clinical intelligence)

### Must work as

- App icon
- Favicon
- Mobile icon
- Lettermark
- Social profile image

---

## Accessibility baseline

- WCAG-minded contrast in light and dark
- Visible focus states
- Do not rely on color alone for status
- Respect reduced-motion preferences where animations exist
