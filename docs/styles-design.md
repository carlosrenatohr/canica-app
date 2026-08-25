# Canica Design System v1
## UI/UX Foundation
### Internal Design Document
Version: 0.1 (Draft)

> **⚠️ Deprecated (2026-08-25):** This document has been superseded by:
> - **`.specs/design-system.md` v1.1** — approved Canica Clinical palette and design direction
> - **`docs/audits/2026-08-10-ui-ux/260810_CANICA_UI_UX_AUDIT_AND_ACTION_PLAN.md`** — comprehensive audit and action plan
> - **`docs/ui-ux-refresh-progress.md`** — implementation tracker
>
> This file is kept for historical reference only. Do not use as a source of truth.

---

# Philosophy

Canica should **not feel like another hospital system**.

Most medical systems have three major problems:

- They feel old.
- They overwhelm users.
- They were designed around databases instead of humans.

Our goal is different.

We are designing a platform that feels somewhere between:

- Linear
- Notion
- Stripe Dashboard
- Apple Health
- Headspace
- Modern SaaS dashboards

without losing the seriousness expected from medical software.

Every pixel should communicate:

- Trust
- Calm
- Precision
- Speed
- Professionalism

Never cold.
Never sterile.
Never childish.

The interface should reduce anxiety instead of increasing it.

---

# Primary Design Principles

## 1. Calm before Information

Most EHR systems throw information at the user.

Canica reveals information progressively.

Instead of:

Patient
History
Labs
Appointments
Insurance
Notes
Vitals
Files

Everything at once...

We display:

Patient

↓

Summary

↓

Clinical Information

↓

Everything else.

---

## 2. Large breathing spaces

White space is not wasted space.

Medical software produces cognitive fatigue.

Spacing reduces errors.

Large paddings.

Few borders.

Generous margins.

---

## 3. Cards instead of tables

Tables only where truly necessary.

Everything else becomes cards.

Examples:

Appointment

Instead of

Patient | Date | Status | Doctor

Use

┌──────────────┐

John Smith

Today 10:30 AM

Dr. García

Confirmed

└──────────────┘

---

## 4. Information hierarchy

The eye should always know where to look first.

Priority:

1 Primary action

2 Critical medical alerts

3 Current task

4 Context

5 Metadata

Never five elements competing for attention.

---

## 5. One accent color

Avoid rainbow dashboards.

One primary color.

One success.

One warning.

One danger.

Everything else is grayscale.

A common criticism of legacy EHRs is excessive use of a single saturated color across the interface without enough hierarchy, making important actions harder to distinguish.:contentReference[oaicite:0]{index=0}

---

# Visual Personality

Keywords

Modern

Warm

Elegant

Minimal

Clinical

Reliable

Human

Intelligent

Premium

---

Not:

Corporate blue everywhere

Windows XP

Bootstrap Admin Panel

Medical ERP

---

# Inspiration

We intentionally borrow ideas from multiple products instead of copying one.

## Stripe

Excellent hierarchy.

Large typography.

Beautiful spacing.

---

## Linear

Minimal UI.

Fast interactions.

Command palette.

Keyboard friendly.

---

## Apple Health

Rounded cards.

Friendly health visualization.

Soft colors.

---

## Notion

Excellent typography.

Low visual noise.

---

## Arc Browser

Glass effects.

Smooth transitions.

Subtle gradients.

---

## Headspace

Warm colors.

Reduced anxiety.

Friendly illustrations.

---

Healthcare UX research consistently emphasizes reducing cognitive load for clinicians while keeping patient experiences approachable and trustworthy.:contentReference[oaicite:1]{index=1}

---

# Color System

## Philosophy

We are NOT creating a blue hospital.

Blue inspires trust.

But too much blue becomes boring.

Instead:

Neutral UI

+

Fresh accent.

---

# Primary

Medical Teal

```txt
#0F766E
```

Hover

```txt
#115E59
```

Light

```txt
#CCFBF1
```

---

# Secondary

Indigo

```txt
#4F46E5
```

Used for

Analytics

AI

Insights

Advanced actions

---

# Success

```txt
#16A34A
```

---

# Warning

```txt
#D97706
```

---

# Danger

```txt
#DC2626
```

---

# Info

```txt
#0284C7
```

---

# Light Theme

Background

```txt
#FAFAFA
```

Surface

```txt
#FFFFFF
```

Secondary Surface

```txt
#F5F7FA
```

Border

```txt
#E5E7EB
```

Primary Text

```txt
#111827
```

Secondary Text

```txt
#6B7280
```

---

# Dark Theme

Background

```txt
#0B0F14
```

Card

```txt
#121923
```

Elevated

```txt
#182230
```

Border

```txt
#273244
```

Primary Text

```txt
#F9FAFB
```

Secondary Text

```txt
#94A3B8
```

Accent

Same as Light Mode.

Never change brand colors.

---

# Radius

Everything rounded.

Buttons

12px

Inputs

14px

Cards

18px

Dialogs

24px

Never sharp corners.

---

# Shadows

Very subtle.

Not Material Design 2018.

Think Apple.

```css
0 4px 12px rgb(0 0 0 / 6%)
```

Maximum.

---

# Typography

Font

Inter

Fallback

system-ui

---

Scale

Display

40

H1

32

H2

24

H3

20

Body

16

Small

14

Caption

12

---

Weight

400

500

600

700

Avoid 800+.

---

# Icons

Lucide Icons

Consistent stroke

2px

No filled icons.

---

# Component Language

## Buttons

Primary

Filled

Secondary

Outline

Ghost

Text only

Danger

Red

Never more than four variants.

---

## Inputs

Large

Comfortable

Floating labels NOT required.

Placeholder should never replace labels.

---

## Cards

Card

↓

Header

↓

Body

↓

Footer

Consistent everywhere.

---

## Tables

Rounded

Sticky header

Hover state

Search

Filters

Bulk actions

Responsive collapse

---

# Layout

Desktop

```
Sidebar

Topbar

Content
```

---

Sidebar

72px collapsed

260px expanded

Persistent.

---

Topbar

Search

Notifications

Quick Actions

User Menu

---

# Navigation

Maximum 7 root sections.

Example

Dashboard

Patients

Appointments

Clinical

Billing

Administration

Settings

Everything else nested.

---

# Dashboard Philosophy

Role based.

Every role sees something different.

Doctor

Today's Patients

Next Appointment

Pending Notes

Alerts

Recent Results

---

Receptionist

Today's Schedule

Check-ins

Queue

Payments

---

Patient

Upcoming Appointment

Prescriptions

Medical History

Documents

Messages

---

Administrator

KPIs

Users

Clinics

Activity

Audit

---

# Motion

Very important.

Animations should feel premium.

150ms

200ms

250ms

Never longer.

No bounce.

Use ease-out.

---

# Empty States

Never

"No data"

Instead

Illustration

Helpful text

Primary CTA

---

# Loading

Skeletons.

Never giant spinners.

---

# Accessibility

Minimum contrast AA.

Keyboard navigation.

Visible focus.

44px click targets.

Reduced motion support.

Screen reader friendly.

---

# HIPAA-conscious UX

HIPAA is not only backend.

The interface must reinforce privacy.

Examples

Patient avatar blurred until opened.

Medical data hidden in notifications.

No PHI inside browser titles.

Auto lock.

Session timeout warning.

Audit visibility.

Consent screens.

Role aware navigation.

HIPAA-compliant products increasingly treat privacy, consent, and data visibility as UX decisions rather than only backend concerns.:contentReference[oaicite:2]{index=2}

---

# Tailwind v4 Strategy

No inline colors.

Everything uses semantic tokens.

Example

Primary

Surface

Background

Muted

Border

Accent

Success

Warning

Danger

Avoid

```
bg-blue-500

text-gray-700
```

Prefer

```
bg-primary

bg-surface

text-muted

border-default
```

This makes rebranding nearly free.

---

# Folder Organization

```
styles/

    tokens.css

    theme.css

    typography.css

    animations.css

components/

layout/

dashboard/

forms/

patients/

appointments/

clinical/

shared/
```

---

# Future Branding

Current codename

Canica

Brand feeling

Healthcare

AI

Human

Simple

Reliable

Future logo should work in:

Light

Dark

Monochrome

Favicon

App icon

Print

Embroidery

---

Possible visual direction

A rounded "C"

+

A subtle medical cross

+

A flowing path

representing

Patient Journey

instead of

Hospital.

---

# Future Illustrations

Rounded.

Minimal.

Flat.

Small gradients.

Avoid stock medical photos.

People should represent:

Doctors

Patients

Nurses

Families

without becoming cartoonish.

---

# North Star

If Apple designed an Electronic Medical Record,
and Stripe designed the dashboard,
while Linear built the interactions,
and Apple Health inspired the visual calm...

...that is the quality bar for Canica.

Our objective is not to impress with visuals.

Our objective is to make healthcare professionals think less about the software and more about their patients.