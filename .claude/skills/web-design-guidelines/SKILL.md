---
name: web-design-guidelines
description: Audit Markdown Viewer UI code for accessibility, interaction, responsive layout, theming, content resilience, and WebView performance. Use when asked to review or audit UI, UX, or accessibility; do not invoke for ordinary implementation unless a review is requested.
license: MIT; see LICENSE.txt
metadata:
  author: vercel
  version: "1.0.0-project.1"
  upstream: vercel-labs/agent-skills
  upstream-rules: vercel-labs/web-interface-guidelines command.md
  snapshot-date: "2026-09-23"
  modified: "Uses a local Tauri-focused rules snapshot instead of live fetching"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines Audit

Review the requested UI files against the local, versioned rules in
[`references/tauri-webview-guidelines.md`](references/tauri-webview-guidelines.md).
Read that reference before performing the audit.

## Workflow

1. Resolve the provided files or patterns. If none are provided, infer the
   smallest relevant set from the user's request; ask only when the target is
   genuinely ambiguous.
2. Read the relevant JSX, CSS, and supporting interaction code.
3. Apply every relevant rule in the local snapshot. Respect its documented
   Tauri/Vite exclusions instead of reporting website-only findings.
4. Report findings grouped by file using clickable `file:line` locations.
5. State the issue and, only when non-obvious, the expected correction. Do not
   modify files unless the user also asked for fixes.

## Output

Keep the audit terse and prioritize user impact:

```text
## src/components/Example.jsx

src/components/Example.jsx:42 - icon-only button lacks an accessible name
src/components/Example.jsx:58 - destructive action has no confirmation or undo
```

Write `✓ pass` for a reviewed file with no findings. Do not add a preamble or
repeat rules that the code already satisfies.
