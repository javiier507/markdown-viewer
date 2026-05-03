---
name: design-system
description: Use BEFORE writing or editing any JSX/CSS that affects the markdown viewer's UI. Covers design tokens, BEM naming, layout patterns, interactive states, theming, and accessibility conventions. Invoke for any "add/change a button, panel, dialog, screen, or styling" request.
---

# Design System — Markdown Viewer

Visual conventions for this app. Follow them when adding or modifying UI; deviating creates inconsistency.

## Core principles

- **Calm, content-first.** Chrome should fade behind the prose. No decoration that competes with the content.
- **Token-driven.** Reference design tokens for every color, shadow, and font — never hardcode hex, font stacks, or shadow strings in component styles.
- **Both themes, always.** Every change must look correct in light and dark. Tokens are redefined inside `@media (prefers-color-scheme: dark)` so using them gets dark mode for free.
- **Subtle motion.** State transitions are 0.12–0.15s; press feedback is 0.05s. No bounces, fades, or animation flourishes.
- **A11y is non-negotiable.** Every interactive element has a visible `:focus-visible` ring, an `aria-label` when it lacks visible text, and works via keyboard.

## Tokens

Add new values as tokens (in both the light `:root` and the dark `@media` block) before using them. Inline literals only when the value is intentionally theme-independent (e.g., `#fff` for text on the brand background).

| Purpose | Token |
|---|---|
| Body text | `--text` |
| Muted / secondary text | `--text-muted` |
| Headings, strong text | `--text-h` |
| App background | `--bg` |
| Sidebar / chrome surface | `--bg-sidebar` |
| Hover surface | `--bg-hover` |
| Selected / active surface | `--bg-active` |
| Hairline border | `--border` |
| Stronger divider | `--border-strong` |
| Code block background | `--code-bg` |
| Brand / primary action | `--accent` |
| Primary hover | `--accent-hover` |
| Primary tinted background | `--accent-bg` |

Shadows: `--shadow-sm` · `--shadow-md` (resting buttons/cards) · `--shadow-lg` (hover lift, dialogs).
Fonts: `--sans` (body), `--heading` (kept separate so it can diverge later), `--mono` (code).
Base type: `15px / 1.55` set on `:root` — don't reset globally.

## Naming — BEM

```
.block        .block__element        .block--modifier        .block__element--modifier
```

Hyphens within names (`file-item`), `__` for sub-parts, `--` for variants.

- Don't ship utility classes (`.flex`, `.mt-4`).
- Don't introduce CSS Modules or styled-components — plain CSS files imported from JSX.
- Don't nest selectors deeper than `.block .block__element` unless styling externally-rendered HTML (e.g., markdown output).

## Layout

Full-height inheritance: `html`, `body`, and the root mount all use `height: 100%`. Screen-level containers fill their parent — no `min-height: 100vh` workarounds.

Flexbox is the default 1D primitive. Reach for CSS Grid only when 2D arrangement clearly helps.

Recurring patterns:

- **Side rail** — fixed width, `flex-shrink: 0`, `flex-direction: column`, full height. Header has `border-bottom: 1px solid var(--border)`. Scrollable list takes `flex: 1; overflow-y: auto`.
- **Main content area** — `flex: 1`, `overflow-y: auto`, `display: flex; flex-direction: column` so children can use `margin: auto` to center vertically (used by empty states).
- **Reading column** — `max-width: 980px; width: 100%; margin: 0 auto`, with `padding: 56px clamp(20px, 5%, 64px) 96px` (fluid horizontal padding instead of media queries).

## Components

Established patterns; if a new component genuinely doesn't fit, build it on the same primitives.

**Buttons** — base `.btn` (8px radius, 10×22px padding, 14px / 500 font, transitions on background/shadow/transform, `:active { transform: translateY(1px) }`) + variant modifier. The primary variant uses `--accent` + `--shadow-md`; hover lifts to `--shadow-lg`. New variants vary color/border only, not shape.

**Icon buttons** — square 24–28px, `border-radius: 5–6px`, transparent background, `inline-flex` centering. Tint on hover via `--bg-hover`, `--border-strong`, or `--accent` depending on prominence. Always include `aria-label` and `title`.

**List items** — `border-radius: 6px`, `margin-bottom: 2px` for tight stacking. Default transparent → `:hover` → `--bg-hover` → `--active` modifier → `--bg-active` (and bumps `font-weight` + `--text-h` on the label). Secondary actions on the row hide with `opacity: 0` and reveal when the row is hovered or active.

**Empty / zero states** — `margin: auto` inside a flex-column parent. Stack: muted icon (~44px, `opacity: 0.55`) → 28px / 600 title → 15px muted hint → primary action button. `max-width: 420px; text-align: center`.

## Interactive states

Every interactive element handles four:

| State | Convention |
|---|---|
| Default | Subtle / transparent |
| `:hover` | Background tint via `--bg-hover` or `--accent`, transitioned 0.12–0.15s |
| `:active` | `transform: translateY(1px)` for buttons; nothing for list items |
| `:focus-visible` | `outline: 2px solid var(--accent)`, offset `2px` (or `-2px` inset on filled rows) |

Never set `outline: none` without a visible replacement. Style `:focus-visible`, not `:focus` — keyboard users see the ring, mouse users don't.

## Theming

Light/dark switches automatically via `prefers-color-scheme`. There is no theme toggle and no `data-theme` attribute — both palettes redefine the same token names.

Adding a new color token: define it in the light `:root`, add the dark equivalent in the dark `@media` block, then reference via `var(--your-token)`.

## Icons

Inline SVGs as small React components alongside the markup that uses them. `viewBox="0 0 16 16"` for UI icons; larger for hero/empty-state illustrations.

- `stroke="currentColor"` and `fill="none"` so icons inherit the parent's color (theme + hover for free).
- `aria-hidden="true"` on decorative icons — the parent button carries the accessible name.
- Stroke widths: 1.5–1.6 for UI, slightly heavier for hero illustrations.

Don't add an icon library (`lucide-react`, `react-icons`, etc.) — a dependency for a handful of glyphs is unnecessary weight, and inline SVGs allow per-icon hand-tuning.

## Markdown content

For elements rendered from markdown, scope all selectors under the prose container so they don't bleed into the chrome. Headings use `--text-h`, `font-weight: 600`, `letter-spacing: -0.2px`; `h1`/`h2` carry a `border-bottom: 1px solid var(--border)`. Inline `code` and block `pre` both use `--code-bg`; `pre code` resets background to transparent so syntax-highlight tokens read clearly. Token colors for highlighting are scoped under `.hljs-*` and themed via the same `prefers-color-scheme` pattern.

## Spacing & sizing

No formal scale — values are picked per-context and kept consistent across similar components.

| Use | Common values |
|---|---|
| Border-radius | 4px (inline tags), 5–6px (small UI), 8px (buttons, code blocks) |
| Padding (interactive) | 8–10px vertical, 10–22px horizontal |
| Padding (sections) | 16–32px |
| Gap (icon + text) | 8–10px |

If the same magic number reappears 3+ times across components, promote it to a token.
