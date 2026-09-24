---
name: markdown-viewer
description: Build and review the Markdown Viewer's document rendering and reading experience. Use for the marked/highlight.js/DOMPurify pipeline, Markdown features, prose or syntax styles, document links and anchors, code-copy behavior, Mermaid, or robustness of rendered Markdown. Do not use for unrelated app chrome or native Tauri IPC.
---

# Markdown Viewer

Make local Markdown documents safe, faithful, readable, and useful across the
web build and the Tauri desktop application.

## Boundaries

- This skill owns `src/lib/markdown.js`, `MarkdownView`, `.prose*` styles,
  `.hljs*` styles, and behavior attached to rendered document nodes.
- Use `ui-guidelines` as well when a change introduces or alters application
  controls, shared tokens, or chrome outside the document.
- Use `tauri-v2` when resolving local paths, opening external resources, adding
  IPC, or changing desktop permissions.
- Treat Markdown as untrusted input even when it comes from a local file.

## Rendering pipeline

- Preserve the pipeline order: parse with `marked`, highlight fenced code with
  `marked-highlight` and highlight.js, then sanitize the final HTML with
  DOMPurify before passing it to `dangerouslySetInnerHTML`.
- Do not weaken sanitization to implement a feature. Extend the renderer and
  sanitizer deliberately, allowing only the minimum required elements,
  attributes, and URL schemes.
- Keep parsing synchronous unless a feature genuinely requires async work; if
  that changes, update the component contract and loading/error behavior.
- Unknown code languages fall back to plaintext instead of throwing.
- Keep renderer configuration centralized rather than mutating global parser
  behavior from React components.

## Document fidelity

- Support standard Markdown and the enabled GitHub Flavored Markdown behavior.
  Preserve semantic HTML for headings, paragraphs, emphasis, links, lists,
  task lists, blockquotes, code, tables, images, and horizontal rules.
- Keep heading order from the source. Anchor IDs must be stable, unique, safe,
  and usable from same-document links.
- Resolve relative links and images against the document source only when the
  runtime supplies a trustworthy base path. Do not invent web URLs for local
  files or bypass Tauri's asset and permission model.
- External navigation must not replace the application unexpectedly. Coordinate
  any native URL/file opening behavior with `tauri-v2`.
- Optional renderers such as Mermaid must fail as inert readable source rather
  than breaking the rest of the document.

## Reading experience

- Scope rendered-content selectors under `.prose__body` so document styles do
  not leak into application chrome.
- Keep a centered reading column with fluid horizontal padding and comfortable
  measure. Optimize prose for sustained reading, not dashboard density.
- Maintain clear heading hierarchy and vertical rhythm. The first heading must
  not create unnecessary top whitespace.
- Long URLs, unbroken text, deeply nested lists, wide tables, large images, and
  long code lines must remain accessible without expanding the app viewport.
  Prefer local horizontal scrolling for tables and code where wrapping would
  destroy meaning.
- Inline code and code blocks use `--mono` and `--code-bg`. `pre code` resets
  the inline-code background so syntax tokens remain legible.
- Syntax colors must remain distinguishable in both themes and meet reasonable
  contrast against the code background.

## Document interactions

- A copy-code control is keyboard reachable, has an accessible name, remains
  discoverable without hover, and reports success or failure without replacing
  the code content.
- Event listeners, observers, timers, and generated controls attached to
  rendered HTML must be cleaned up whenever the document changes or unmounts.
- Do not inject the same enhancement twice after rerenders.
- Internal anchors should move focus or preserve a sensible reading position;
  headings need scroll margin when chrome could obscure them.

## Robustness states

- Distinguish an empty Markdown document from the absence of an open file. An
  empty file is still a valid open document.
- A malformed extension block, unsupported language, broken image, or failed
  enhancement must not prevent the remaining Markdown from rendering.
- Keep large-document work proportional to content size. Avoid repeated DOM
  scans, repeated parsing, or one listener per element when delegation is
  clearer and measurably safer.

## Verification fixture

Exercise changes with representative Markdown containing all heading levels,
inline formatting, nested and task lists, blockquotes, links and anchors, a wide
table, images, inline code, fenced known and unknown languages, long lines, raw
HTML that must be sanitized, an empty file, and malformed optional extensions.
Verify light/dark themes, keyboard navigation, narrow windows, web mode, and
Tauri mode when native resource behavior is involved.
