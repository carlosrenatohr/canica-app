# Design System

> **Status:** Approved (direction)  
> **Version:** 1.1
> **Changes (1.1):** Canica Clinical palette, Spanish-neutral UI language, complete light/dark theme direction

Visual language for canica. Implementation lives primarily in `packages/ui` and `apps/web`.

The current product UI language is **neutral professional Spanish**. Domain statuses,
errors, navigation labels, accessibility labels, and empty states must not leak raw
English enum values or regional slang. This language rule applies to user-visible UI;
source identifiers and API contracts remain in English where the codebase requires them.

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

## Color palette — Canica Clinical

Canica uses a warm neutral-first interface with a restrained clinical teal accent.
Iris is reserved for AI-generated content and insights so that AI output remains
visually distinguishable until a physician confirms it.

| Token role | Light | Dark | Use |
| --- | --- | --- | --- |
| Primary | `#0F766E` | `#2DD4BF` | Main actions, links, active context, focus |
| Primary hover | `#115E59` | `#5EEAD4` | Hover and active interaction |
| Primary light | `#CCFBF1` | `#134E4A` | Subtle selected surfaces |
| AI | `#4F46E5` | `#A5B4FC` | AI suggestions, insights, AI labels only |
| AI light | `#EEF2FF` | `#312E81` | AI surfaces |
| Info | `#0284C7` | `#38BDF8` | Informational feedback |
| Success | `#16A34A` | `#4ADE80` | Successful and completed states |
| Warning | `#D97706` | `#FBBF24` | Pending and attention states |
| Danger | `#DC2626` | `#F87171` | Destructive actions and errors |
| Background | `#FAFAF9` | `#0B1120` | Page canvas |
| Surface | `#FFFFFF` | `#111A2E` | Cards and primary surfaces |
| Elevated surface | `#FFFFFF` | `#1A2540` | Dialogs, menus, elevated content |
| Secondary background | `#F5F5F4` | `#182338` | Secondary surfaces |
| Border | `#E7E5E4` | `#293750` | Dividers and boundaries |
| Primary text | `#1C1917` | `#F1F5F9` | Main content |
| Muted text | `#78716C` | `#94A3B8` | Supporting content |

**Avoid:**

- Bright reds (except true semantic danger)
- Hospital greens
- Old-fashioned blues
- Rainbow status dashboards
- Using the AI color for arbitrary decoration

Semantic colors (success, warning, danger, info) should be restrained, accessible in both light and dark themes, and never communicate meaning through color alone.

---

## Typography

Preferred families:

- **Geist** (primary UI)
- `system-ui` (fallback)

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
- **Dark mode from day one, with a user-controlled toggle and persisted preference**
- Dense data where needed (tables, timelines) without sacrificing calm chrome

---

## Component guidelines

- Base primitives from **shadcn/ui** (Radix + Tailwind)
- Shared components live in `packages/ui`
- App-specific compositions live in `apps/web`
- Prefer composition over one-off styled duplicates
- Forms: React Hook Form + Zod schemas from `packages/validation`
- AI-generated content must be visually distinguishable (labels, badges, or similar) until physician confirms
- AI-generated content uses the dedicated AI/iris semantic tokens and must not be presented as physician-authored content

---

## Layout patterns (direction)

- Clear primary navigation for clinical modules
- Patient context always visible when working inside a chart
- Destructive actions require confirmation
- Empty states teach the next action without noise
- Navigation labels, statuses, errors, and accessibility text use neutral professional Spanish

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
