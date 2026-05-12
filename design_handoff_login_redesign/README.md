# Handoff: MAP Test — Login redesign (Variation A · Hero photograph)

## Overview

Replace the existing centered-card login screen on the MAP Test platform with a **modern split-screen layout**: a large brand photograph fills the left pane, a focused sign-in form sits on the right. The visual language continues directly into the existing dashboard (same mesh gradient palette, same indigo/purple primary, same large display headings).

This handoff is for **Variation A** — the photograph hero direction the design lead approved. Two other variations were explored (B · Dashboard preview, C · Photo collage) and are not in this package.

## About the design files

The files in this bundle (`login-preview.html`, `*.jsx`, `*.css`) are **design references**, not production code to copy directly. They are an HTML/React-via-Babel prototype showing the intended look, copy, spacing, and behaviour. They use plain `.mt-*` CSS classes for clarity.

**Your job:** recreate the design in the MAP Test codebase using its established environment — its existing React + (Tailwind / CSS-modules / styled-components / whatever-it-is) setup, its existing primitive components (Input, Button, etc.), its existing token system. If the codebase has no UI conventions yet, pick a sensible modern stack and implement there. **Do not** ship the `.mt-*` classes verbatim; treat them as a reference for anatomy and pixel values.

Open `login-preview.html` directly in a browser to see the design rendered at the 1440×900 reference size.

## Fidelity

**High-fidelity.** Every measurement, color, and font weight in this document is intentional. Recreate the design pixel-accurately at the 1440-wide reference, then add the responsive breakpoints described in §8.

## Goal & success criteria

A new user opening `/login` should:
1. Feel they're entering the same product they signed into yesterday — same gradient, same indigo, same chrome
2. Understand within 2 seconds what MAP Test does (the hero tagline + stat strip)
3. Sign in with email + password in under 15 seconds (the form is the obvious focal point on the right)
4. Have nothing competing for attention: no SSO, no "create account", no role selector — just the form

## Screens

There is **one screen** in this handoff: `/login` (replacing the existing one).

It is composed of two panes inside one container:

```
┌─────────────────────────────────┬─────────────────┐
│                                 │                 │
│        HERO PANE (left)         │   FORM PANE     │
│           880 wide              │   (right)       │
│                                 │    560 wide     │
│   • Full-bleed photograph       │                 │
│   • Hero copy (white, overlay)  │   • Logo        │
│   • 3-up stat strip (glass)     │   • Chip        │
│                                 │   • H1          │
│                                 │   • Subtitle    │
│                                 │   • Email       │
│                                 │   • Password    │
│                                 │   • Remember    │
│                                 │   • Sign in     │
│                                 │   • Footer line │
└─────────────────────────────────┴─────────────────┘
                          1440 × 900 (reference)
```

---

## Design tokens

Add these to your token file / Tailwind config / theme.

### Colors

| Token              | Hex       | Usage                                          |
|--------------------|-----------|------------------------------------------------|
| `indigo-500`       | `#6366F1` | Primary brand, focused inputs, CTA gradient    |
| `indigo-600`       | `#5558E3` | Link hover, gradient mid                       |
| `indigo-700`       | `#4B45CC` | Accent serif word, eyebrow                     |
| `purple-400`       | `#A78BFA` | Decorative                                     |
| `purple-500`       | `#8B5CF6` | CTA gradient mid                               |
| `purple-600`       | `#7C3AED` | Photo tint                                     |
| `brand-blue`       | `#DBE7FF` | Mesh gradient stop 1                           |
| `brand-lavender`   | `#E9DDFF` | Mesh gradient stop 2                           |
| `brand-pink`       | `#FFDEEC` | Mesh gradient stop 3, accent em                |
| `accent-pink`      | `#FBCFE8` | Hero `em` text                                 |
| `ink`              | `#0F172A` | Primary text                                   |
| `ink-soft`         | `#1E293B` | Form labels                                    |
| `muted`            | `#64748B` | Secondary text, placeholders                   |
| `muted-2`          | `#94A3B8` | Tertiary text, input placeholder               |
| `line`             | `#E2E8F0` | Input borders, dividers                        |
| `line-soft`        | `#EEF1F6` | Soft dividers                                  |
| `surface`          | `#FFFFFF` | Form pane, inputs                              |
| `surface-2`        | `#FAFAFB` | Surface hover                                  |
| `success-bg`       | `#DCFCE7` | (Reserved — matches dashboard pills)           |
| `success-fg`       | `#15803D` | (Reserved — matches dashboard pills)           |

### Gradients

```css
--grad-brand: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #C084FC 100%);
--grad-bg:    linear-gradient(135deg, #DBE7FF 0%, #E9DDFF 50%, #FFDEEC 100%);
/* grad-bg MUST be identical to the dashboard's background gradient. */
```

### Type

Use **Plus Jakarta Sans** (400, 500, 600, 700, 800) and **Instrument Serif** (400, 400 italic). Both load from Google Fonts. The serif is used for *one accent word* in each heading — never for body text.

| Token       | Family               | Spec                                          |
|-------------|----------------------|-----------------------------------------------|
| `display`   | Plus Jakarta Sans    | 48 / 700 / 1.05 · `tracking: -0.03em`         |
| `display-em`| Instrument Serif     | 48 / 400 italic / 1.05 · `tracking: -0.01em`  |
| `h1`        | Plus Jakarta Sans    | 44 / 700 / 1.1 · `tracking: -0.025em`         |
| `h1-em`     | Instrument Serif     | 44 / 400 italic / 1.1                          |
| `body-lg`   | Plus Jakarta Sans    | 16 / 400 / 1.55                                |
| `body`      | Plus Jakarta Sans    | 15 / 500 / 1                                   |
| `label`     | Plus Jakarta Sans    | 13 / 600 / 1                                   |
| `eyebrow`   | Plus Jakarta Sans    | 12 / 700 / 1 · `uppercase` · `tracking: 0.12em` |
| `chip`      | Plus Jakarta Sans    | 12 / 600 / 1 · `tracking: 0.01em`              |
| `caption`   | Plus Jakarta Sans    | 11 / 500 / 1.4                                 |
| `stat-n`    | Plus Jakarta Sans    | 28 / 700 / 1 · `tracking: -0.03em`             |
| `stat-sup`  | Plus Jakarta Sans    | 16 / 700 / 1 · color `indigo-600`              |

### Radii

| Token | Value |
|-------|-------|
| `r-sm`   | 8px   |
| `r-md`   | 12px  (inputs, buttons) |
| `r-lg`   | 16px  (stat cards) |
| `r-xl`   | 24px  |
| `r-2xl`  | 32px  |
| `r-pill` | 999px (chip, checkbox check) |

### Shadow

```css
--shadow-md: 0 4px 16px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.04);
--shadow-lg: 0 24px 60px -20px rgba(76,70,204,.25),
             0 12px 24px -12px rgba(15,23,42,.10);
/* Button glow */
--shadow-cta: 0 8px 24px -8px rgba(99,102,241,.55),
              inset 0 1px 0 rgba(255,255,255,.2);
--shadow-cta-hover: 0 12px 28px -8px rgba(99,102,241,.65);
```

### Glass (used for stat cards)

```css
background: rgba(255, 255, 255, 0.65);
backdrop-filter: blur(20px) saturate(140%);
-webkit-backdrop-filter: blur(20px) saturate(140%);
border: 1px solid rgba(255, 255, 255, 0.6);
border-radius: 16px;
box-shadow: 0 8px 24px -12px rgba(15, 23, 42, 0.15);
```

---

## Layout

### Container

Desktop reference: **1440 × 900**. Use a CSS grid with a fixed right column:

```jsx
<div className="min-h-dvh grid lg:grid-cols-[1fr_560px]">
  <LoginHero />   {/* left — 880px at reference */}
  <LoginForm />   {/* right — 560px fixed */}
</div>
```

### Form pane (right)

- Width: **560px** fixed on desktop, full-width on mobile
- Padding: **56px 64px** desktop · **32px 24px** mobile
- Background: `surface` (white)
- Layout: vertical flex, the form group itself is `margin: auto 0` to vertically center inside the pane
- Internal gap: **18px** between major elements (logo / form-head / fields / button / footer)

### Hero pane (left)

- Background: `--grad-bg` (mesh gradient — same as the dashboard) — acts as a fallback if the photograph fails to load
- The photograph is `position: absolute; inset: 0; object-fit: cover; object-position: center`
- Two overlays sit on top of the photograph:
  1. **Top/bottom gradient** (linear, indigo→transparent→dark) — softens the photo so white text reads on the hero copy and stat cards
  2. **Color cast** (radial gradients of `purple-600` at bottom-right + `indigo-500` at top-left) — applied with `mix-blend-mode: multiply` at 70% opacity to keep ANY photo on-brand
- Hero copy is positioned at the top-left of the pane (padding 56px on all sides)
- Stat strip is absolute-positioned 48px from the bottom, spans `left: 56px` to `right: 56px`

---

## Components

### `<Logo />`

- Container: `inline-flex`, `gap: 12px`, `align-items: center`
- Mark: 40×40, `border-radius: 12px`, background `--grad-brand`, contains a book glyph (lucide-react `Book` icon, 20×20, stroke 2, white)
- Box-shadow: `0 6px 16px -4px rgba(99,102,241,.45)`
- Wordmark: "**MAP** Test" — `<b>` on "MAP", regular weight on "Test", both `font-size: 19px`, weight 700/400, `letter-spacing: -0.01em`

### `<Chip />` (status pill)

- Pill: `height: 26px`, `padding: 0 10px`, `border-radius: 999px`
- Background: `rgba(99,102,241,0.08)` (indigo at 8%)
- Text: 12 / 700, color `indigo-700`
- Leading dot: 6×6 indigo-500, `border-radius: 50%`, `gap: 6px`
- Copy: **"Spring 2026 testing window"**

### `<HeadingBlock />` (H1 + subtitle)

- H1: type token `h1`, color `ink`
  - "**Welcome** `<em>back</em>`" — the last word is in Instrument Serif italic at the same size, color `indigo-700`
- Subtitle: type token `body-lg`, color `muted`
  - Copy: **"Sign in to view your adaptive growth report and continue your assessment."**

### `<Field />` (Email, Password)

```
height:      52px
border:      1.5px solid var(--line)
border-radius: 12px
padding:     0 18px (46px left when leading icon)
font:        500 15px Plus Jakarta Sans
color:       var(--ink)
placeholder: muted-2, weight 400
```

**Focus state:**
```
border-color: var(--indigo-500);
box-shadow:   0 0 0 4px rgba(99, 102, 241, 0.12);
outline:      none;
```

**Leading icon** (left 16px, color `muted-2`, 18×18, stroke 1.75):
- Email field: lucide `Mail`
- Password field: lucide `Lock`

**Trailing button** (password only, right 14px):
- 30×30 hit target, `border-radius: 6px`, background transparent
- Hover: `background: var(--line-soft)`, color `var(--ink)`
- Icon: lucide `Eye` (or `EyeOff` when password is revealed) 18×18 stroke 1.75
- Toggles input `type` between `password` ↔ `text`
- ARIA: `aria-label="Show password"` / `"Hide password"`, `aria-pressed` reflects state

### `<Label />`

Sits above each field, with a **flex-row** for password (label + "Forgot password?" link right-aligned).

- Style: type token `label`, color `ink-soft`
- Forgot link: type token `label`, color `indigo-600`, hover `indigo-700` + underline, `aria-label="Reset your password"`

### `<Checkbox />` ("Keep me signed in on this device")

- Custom: 18×18, `border: 1.5px solid #CBD5E1`, `border-radius: 5px`
- Checked: background `indigo-500`, border `indigo-500`, white checkmark drawn with CSS pseudo-element
- Label text: 13 / 500, color `muted`, gap 10px from box

### `<SignInButton />`

```
height:    52px
width:     100% (block)
padding:   0 20px
background: var(--grad-brand);
color:     white
font:      600 15px Plus Jakarta Sans, letter-spacing -0.005em
gap:       10px (between text and arrow icon)
radius:    12px
shadow:    var(--shadow-cta)
```

- Trailing icon: lucide `ArrowRight` 16×16 stroke 2
- Hover: `shadow: var(--shadow-cta-hover)`
- Active: `transform: translateY(1px)`
- Loading: replace arrow with spinner; disable pointer events

### Footer line

Single line at the bottom of the form pane:

> **"Developed by Arnon Arpaket · © 2026"**

- Type token `caption`, color `muted-2`, `letter-spacing: 0.02em`
- "Arnon Arpaket" wrapped in `<b>` (weight 700, inherits color)

### Hero copy (left pane)

- **Eyebrow:** "MAP · TEST" — type token `eyebrow`, color `white` at 90% opacity, `margin-bottom: 14px`
- **H2:** `font: 700 48px/1.05`, `letter-spacing: -0.03em`, color `white`, `text-shadow: 0 2px 20px rgba(15,23,42,.25)`
  - Copy: **"Measure growth.\nInspire `<em>`progress.`</em>`"** (two-line, line break between sentences)
  - The em accent word uses Instrument Serif italic, color `accent-pink` (`#FFDEEC`)
- **Sub:** `body-lg`, color `white` at 92%, `text-shadow: 0 1px 14px rgba(15,23,42,.3)`, `max-width: 440px`
  - Copy: **"An adaptive K-12 assessment platform that meets every student where they are — and shows them where to go next."**

### Stat strip (3 glass cards)

3-column CSS grid, `gap: 14px`. Each card uses the glass recipe above, padding `18px`.

| Card | Number              | Label                                          |
|------|---------------------|------------------------------------------------|
| 1    | **12<sup>M+</sup>** | Adaptive assessments delivered each year       |
| 2    | **RIT**             | Reliable growth scale across all grades        |
| 3    | **98<sup>%</sup>**  | Educator satisfaction across 8K+ schools       |

- Number: type token `stat-n`, the `<sup>` is `stat-sup` (16 / 700, color `indigo-600`), display flex with `align-items: baseline; gap: 4px`
- Label: 12 / 500, color `muted`, line-height 1.4

---

## Interactions & behavior

| State                          | Behaviour                                                                 |
|--------------------------------|---------------------------------------------------------------------------|
| Focus an input                 | 1.5px indigo border + 4px soft ring at 12% indigo                         |
| Blur an invalid input          | Border `#EF4444`, ring 10% red, error message below in red / 13 / 500     |
| Submit form (Enter or click)   | Disable button; replace arrow with spinner; POST to existing auth endpoint |
| Submit success                 | Redirect to dashboard (existing post-auth route)                          |
| Submit error                   | Toast top-center with server error; do not clear inputs; focus email      |
| Toggle password reveal         | Flip input `type`; update `aria-pressed`; do not lose focus on input      |
| Hover Forgot password          | Underline + color shift to `indigo-700`                                   |
| Hover Sign in                  | Shadow grows from `--shadow-cta` to `--shadow-cta-hover`                  |
| Press Sign in                  | `translateY(1px)`                                                          |
| Photo fails to load            | Gracefully fall back to `--grad-bg`; hero copy still reads (white-on-gradient is AA) |

### Form submission contract

```
POST /api/auth/login
Body: { email: string, password: string, remember: boolean }
Response 200: { ok: true, redirect: '/dashboard' }
Response 401: { ok: false, error: 'invalid_credentials' }
```

(Confirm exact contract with the existing API — keep what's there.)

---

## State management

Local component state only — no global store needed.

```ts
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [remember, setRemember] = useState(true);  // default ON
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
```

---

## Responsive behaviour

| Breakpoint    | Behaviour                                                                                                |
|---------------|----------------------------------------------------------------------------------------------------------|
| ≥1280px       | Split layout exactly as designed                                                                         |
| 1024–1279px   | Keep split; form pane shrinks to 480px; reduce hero H2 from 48px to 40px                                 |
| 768–1023px    | Stack vertically: form first (full width), then hero below as a 320px-tall band (stats only, no big photo) |
| <768px        | Hide hero entirely. Form is full-width. Show a compact 64px banner at the top with logo + tagline only   |

---

## Accessibility

- ✅ Every input has a programmatic `<label>` linked via `htmlFor`
- ✅ Password reveal button has `aria-label` and `aria-pressed`
- ✅ Focus ring is always visible (4px indigo halo) — never `outline: none` without replacement
- ✅ Color contrast: form copy on white meets WCAG AAA; hero copy on photograph meets AA at minimum (the photo + multiply-blend tint guarantee this on any source image)
- ✅ Pressing `Enter` in any field submits the form
- ✅ Decorative SVGs (logo book glyph, hero photo) have `aria-hidden="true"`
- ✅ `prefers-reduced-motion`: disable any shadow/transform transitions
- ✅ Tab order: Email → Password → Forgot link → Reveal eye → Remember me → Sign in
- ✅ `next/image` (or your codebase's image component) for the hero photograph with proper `priority`, `sizes`, and a low-quality blur placeholder

---

## Copy reference

| Slot                  | Copy                                                                            |
|-----------------------|---------------------------------------------------------------------------------|
| Chip                  | Spring 2026 testing window                                                      |
| H1                    | Welcome *back*                                                                  |
| Subtitle              | Sign in to view your adaptive growth report and continue your assessment.       |
| Email label           | Email address                                                                   |
| Email placeholder     | you@school.edu                                                                  |
| Password label        | Password                                                                        |
| Password placeholder  | ••••••••••                                                                      |
| Forgot link           | Forgot password?                                                                |
| Remember              | Keep me signed in on this device                                                |
| CTA                   | Sign in                                                                         |
| Footer                | Developed by **Arnon Arpaket** · © 2026                                         |
| Hero eyebrow          | MAP · TEST                                                                      |
| Hero H2               | Measure growth. Inspire *progress.*                                             |
| Hero subtitle         | An adaptive K-12 assessment platform that meets every student where they are — and shows them where to go next. |
| Stat 1                | **12M+** · Adaptive assessments delivered each year                             |
| Stat 2                | **RIT** · Reliable growth scale across all grades                               |
| Stat 3                | **98%** · Educator satisfaction across 8K+ schools                              |

---

## Assets

### Hero photograph

The reference design uses **Unsplash photo `1503676260728-1c00da094a0b`** as a placeholder. **Replace with a licensed brand-aligned photo before launch.**

**Photo brief:**
- Single subject (or small group) — student/learner, age 8–16
- Natural light, warm tone, 3/4 angle
- Subject is focused on a notebook / tablet / book — not posing at camera
- Avoid stock-photo cheese (overly clean, fake-smile, dated outfits)
- Crop: portrait or 4:5 OK; aspect 16:9 down to 4:5 all work because the photo is `object-fit: cover` over an 880×900 frame
- Resolution: at least **2400px on the long edge**, save as **WebP at q=80** (PNG/JPG fallback acceptable)
- If photographed locally: real Thai school students with consent / parental consent would feel most authentic

### Icons

Use **`lucide-react`** (or your existing icon library mapping to these). Icons used:

- `Book` (logo mark — 20×20, stroke 2, white)
- `Mail` (email field leading icon — 18×18, stroke 1.75, `muted-2`)
- `Lock` (password field leading icon — 18×18, stroke 1.75, `muted-2`)
- `Eye` / `EyeOff` (password reveal — 18×18, stroke 1.75)
- `ArrowRight` (sign-in CTA trailing icon — 16×16, stroke 2, white)

### Fonts

Add to your font loader:

```jsx
import { Plus_Jakarta_Sans, Instrument_Serif } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});
```

---

## Implementation checklist

- [ ] Add color, gradient, type, radii, shadow tokens to your token file / Tailwind config
- [ ] Load Plus Jakarta Sans (400/500/600/700/800) and Instrument Serif (400 + italic)
- [ ] Build primitives if missing: `Logo`, `Chip`, `Field`, `PasswordField`, `Checkbox`, `Button`
- [ ] Build `<LoginForm>` composing the primitives — wire to the existing auth endpoint
- [ ] Build `<LoginHero>` with the photograph + overlays + hero copy + stat strip
- [ ] Stitch into `app/(auth)/login/page.tsx` (or equivalent) as a 2-column server component; client-mark only the form
- [ ] Source and add the production hero photograph
- [ ] Add responsive breakpoints (§8); QA at 1440 / 1280 / 1024 / 768 / 375
- [ ] Verify tab order, focus styles, screen-reader announcement of errors
- [ ] Run axe-core / Lighthouse a11y — target ≥ 95
- [ ] Confirm the mesh gradient on the dashboard background matches `--grad-bg` byte-for-byte (share a single CSS variable if possible)

---

## Files in this bundle

| File                  | What's in it                                                                        |
|-----------------------|-------------------------------------------------------------------------------------|
| `README.md`           | This handoff document                                                               |
| `login-preview.html`  | Standalone runnable preview — open in a browser to see the design at 1440×900       |
| `shared.css`          | Design tokens + primitive component CSS (input, button, chip, checkbox, etc.)       |
| `form-panel.jsx`      | React components: `Logo`, `LoginForm`, icon set                                     |
| `form-panel.css`      | Layout CSS for the form-pane / hero-pane scaffold + stat cards                      |
| `variation-a.jsx`     | `VariationA` component composing the form + hero with photo                         |
| `variation-a.css`     | Photo-specific styles: overlays, color cast, hero text styling                      |

---

## Open questions for product

These were left unresolved during design and should be confirmed before implementation:

1. **Hero photograph source** — license stock or commission local Thai school students? At what resolution?
2. **"Remember me" semantics** — extend session to 30 days, or just persist the email field?
3. **Forgot password route** — does the existing reset flow exist and where does it live?
4. **Thai-language version** — if planned, the H1/H2 sizing needs to allow a Sarabun or Noto Sans Thai fallback at ~104% of the Latin metric for visual parity. Confirm before launch.
5. **Footer attribution** — should "Developed by Arnon Arpaket · © 2026" remain on the production login or move to an About page?
