# Web Interface Guidelines — Tauri/Vite Snapshot

Adapted on 2026-09-23 from Vercel's Web Interface Guidelines `command.md` for
the Markdown Viewer's React/Vite frontend running in browsers and a Tauri
WebView. Apply only rules relevant to the reviewed interface.

Upstream: <https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md>

## Accessibility and focus

- Prefer semantic HTML. Use buttons for actions and anchors for navigation.
- Icon-only buttons and unlabeled controls need accessible names. Decorative
  icons use `aria-hidden="true"`; meaningful images need useful `alt` text.
- Every flow must work by keyboard. Composite widgets follow appropriate ARIA
  keyboard and focus patterns rather than adding click handlers to generic
  elements.
- Keep heading levels hierarchical. Async status and validation messages that
  matter to assistive technology use an appropriate live region.
- Every interactive element has a visible, unobscured `:focus-visible` state.
  Never remove outlines without a visible replacement; use `:focus-within` for
  compound controls where useful.
- Opening overlays and menus moves focus appropriately; closing them returns
  focus to the trigger. Focus must not land behind an overlay.

## Interaction

- Provide hover, active, focus, disabled, selected, and open states when they
  apply. Essential actions cannot depend on hover.
- Destructive actions require confirmation or a practical undo window.
- Touch or gesture interactions need click and keyboard alternatives. Keep hit
  targets usable even when the visible icon is small.
- Do not block paste. Use `autoFocus` only when there is one clear desktop
  target and focusing it will not surprise the user.
- Menus, dialogs, drawers, and popovers must remain inside the viewport, close
  predictably, and prevent background interaction when modal.

## Motion

- Honor `prefers-reduced-motion`; disable or simplify non-essential motion.
- Animate `transform` and `opacity` where possible, list transition properties
  explicitly, and keep animations interruptible.
- Motion should explain a user-triggered state change, not run decoratively.

## Content resilience

- Handle empty, short, average, very long, and unbroken content without broken
  layout. Flex/grid children that truncate text need `min-width: 0`.
- User-provided Markdown can contain wide tables, long code lines, deep lists,
  oversized images, and long URLs. Constrain overflow at the nearest meaningful
  container rather than hiding document content globally.
- Use specific action labels and actionable error messages. Loading and saving
  text uses the ellipsis character (`…`).
- Numeric columns that users compare should use tabular numerals.
- Do not rely on placeholders as labels. Form controls need labels, meaningful
  names, suitable input types, and inline errors.

## Layout, themes, and media

- Prefer CSS Flexbox/Grid over JavaScript measurement. Avoid unintended page or
  window-level horizontal scroll.
- Test narrow desktop windows as well as the default window size. Apply mobile
  safe-area rules only when a mobile target or full-bleed layout needs them.
- Keep native controls legible in both themes and declare `color-scheme`
  consistently with the rendered palette.
- Images reserve dimensions when known and scale within the reading area.
  Below-fold remote images may load lazily when that does not break local-file
  behavior.
- Do not disable browser/WebView zoom through viewport metadata.

## Performance

- Do not read layout during React render. Batch DOM reads and writes and avoid
  layout thrashing in scroll, resize, and pointer handlers.
- Large lists or documents should avoid rendering or repeatedly scanning work
  that is not visible. Use `content-visibility` or virtualization only after
  confirming it preserves find-in-page, anchors, selection, and accessibility.
- Deduplicate global listeners and clean up listeners, observers, animation
  frames, and timers.
- Avoid `transition: all`, animated GIFs when efficient video is appropriate,
  and work on every keystroke that can be deferred.

## Tauri/Vite applicability

Do not report these website-oriented rules unless the reviewed feature actually
introduces the corresponding concern:

- URL synchronization for filters, tabs, pagination, or panel state.
- Next.js routing, server components, server actions, SSR, hydration, or React
  Server Component serialization.
- CDN preconnects, font preloads, SEO metadata, or browser theme-color metadata.
- Mobile notches, touch-only behavior, or iOS input zoom when desktop is the
  only supported target.

Tauri does not exempt the frontend from web accessibility or interaction rules.
When a finding crosses into native file access, external URL handling, IPC, or
capabilities, audit the WebView behavior here and use `tauri-v2` for the native
implementation.

## Audit output

Group findings by file and use `file:line - finding`. Skip explanations unless
the correction is non-obvious. Report `✓ pass` when a reviewed file has no
findings.
