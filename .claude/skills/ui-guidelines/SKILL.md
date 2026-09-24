---
name: ui-guidelines
description: Project-specific UI implementation rules for the Markdown Viewer. Use before changing JSX or CSS for app chrome, controls, panels, dialogs, screens, theming, or interaction states. Pair with frontend-design for new visual directions or substantial redesigns; use markdown-viewer for rendered document content.
---

# UI Guidelines — Markdown Viewer

Keep interface changes consistent with the product that already exists. These
guidelines are the implementation contract; they do not replace visual design.

## Working with other skills

- For a new screen, substantial redesign, or explicit visual exploration, also
  use `frontend-design`. It owns the proposed visual direction; this skill owns
  integration with the existing application.
- For routine UI changes, preserve the current visual language. Do not invent a
  new palette, type system, component shape, or motion language.
- An explicitly requested redesign may change these conventions. When it does,
  update this skill in the same change so it remains the source of truth.
- Use `markdown-viewer` for rendered Markdown, reading behavior, and `.prose*`
  or `.hljs*` styles. Use `tauri-v2` for native configuration, IPC, or Rust.
- Use `web-design-guidelines` when the task is an accessibility or UX audit.

User requirements take precedence over every skill. When multiple skills apply,
meet the visual intent from `frontend-design` within the constraints here unless
the user explicitly authorizes changing those constraints.

## Product character

- Calm and content-first: application chrome supports the document rather than
  competing with it.
- Both light and dark themes must work in the same change.
- Motion communicates state changes; avoid decorative or ambient animation.
- Preserve established patterns before adding a new variant or abstraction.

## CSS architecture

- Use plain CSS imported from JSX. Do not introduce CSS Modules,
  CSS-in-JS, or utility classes.
- Name classes with BEM: `.block`, `.block__element`, `.block--modifier`, and
  `.block__element--modifier`. Use hyphens inside names.
- Avoid selector nesting deeper than `.block .block__element` except for HTML
  produced by the Markdown renderer.
- Use Flexbox for one-dimensional layouts and Grid when the layout is genuinely
  two-dimensional. Do not measure layout in JavaScript when CSS can express it.
- Preserve full-height inheritance through `html`, `body`, and `#root`; screen
  containers fill their parent instead of using `min-height: 100vh`.

## Tokens and themes

- Use the tokens already defined in `src/index.css`; do not duplicate literal
  colors, font stacks, or shadows in component styles.
- Add a token only for a semantic value that will be reused. Define its light
  value in `:root` and its dark value in the existing
  `prefers-color-scheme: dark` block.
- Core tokens are `--text`, `--text-muted`, `--text-h`, `--bg`,
  `--bg-sidebar`, `--bg-hover`, `--bg-active`, `--border`,
  `--border-strong`, `--accent`, `--accent-hover`, `--accent-bg`, and
  `--danger`.
- Use `--shadow-sm`, `--shadow-md`, and `--shadow-lg` for elevation, and
  `--sans` and `--heading` for application typography. Markdown-specific
  `--mono` and `--code-bg` are governed by `markdown-viewer`.
- Theme-independent literals are acceptable only when their invariance is
  intentional, such as white text on the brand background.

## Established application patterns

- The sidebar is a fixed-width, non-shrinking column with a bordered header and
  a vertically scrollable list. The main content area owns document scrolling.
- Buttons share the `.btn` base and use modifiers for variants. New variants
  may change emphasis but should not silently redefine the component geometry.
- Icon buttons are compact square controls with an accessible name. Decorative
  inline SVGs use `currentColor` and `aria-hidden="true"`.
- File rows progress from transparent to hover to active surfaces. Keep labels
  truncatable with `min-width: 0`, and reveal secondary actions on hover,
  active state, and `:focus-within`—never on hover alone.
- Empty states center themselves inside the main flex column and provide a
  direct next action.

## Interaction quality

- Every interactive control supports keyboard use and has a visible
  `:focus-visible` outline using `--accent`.
- Use semantic elements: buttons for actions and anchors for navigation.
- Give icon-only controls an `aria-label`; use `title` only as supplemental
  help, not as the accessible name.
- Define hover, active, focus-visible, disabled, and open/selected states that
  actually apply to the control. Do not hide essential actions from keyboard
  or touch users.
- List transitioned properties explicitly and respect
  `prefers-reduced-motion` when adding non-trivial motion.

## Verification

Review the changed interface in light and dark themes, at narrow and normal
window widths, with keyboard-only navigation. For a substantial redesign,
capture and critique a rendered screenshot as directed by `frontend-design`.
