---
name: feature-architecture
description: Guide placement and integration of new features in the Markdown Viewer React frontend. Use for feature work, shared document state, or reorganizing src; pair with specialized UI, Markdown, or Tauri skills when relevant. Do not use for unrelated React projects.
---

# Feature Architecture — Markdown Viewer

Keep new behavior close to the state and UI that own it. The `src/` tree is
organized around these responsibilities:

| Area | Owns |
| --- | --- |
| `app` | Composition of features, empty state, and shell-only state such as sidebar collapse. |
| `features/library` | Open items, identity and deduplication, active selection, browser import, sidebar, folders, and drafts. |
| `features/reader` | Markdown rendering, document interactions, and prose/syntax styles. |
| `platform/tauri` | Desktop events, IPC, and native access; adapts native input for the app. Rust remains in `src-tauri/`. |
| `shared` | Feature-neutral presentation primitives and utilities without feature state, such as the icon set. |

These are ownership boundaries, not a reason to create further directories in
advance. Keep tests next to the behavior they cover. Add local `components`,
`hooks`, or `lib` folders inside a feature only when they make that feature
easier to navigate. When moving existing code, preserve behavior and update
its imports, tests, and applicable CSS together.

## Dependency direction

- `app` wires the library, reader, and platform adapter together. Feature code
  may use `shared`; `shared` must not depend on features.
- Keep behavior in its owning feature. Move a helper to `shared` only when it
  represents a feature-neutral primitive, rather than to avoid a local import.
- The library owns the collection and active item. The reader receives content
  and any trustworthy source context through explicit inputs; it does not read
  library state or call Tauri directly.
- Tauri integration delivers native file-open payloads to the app/library. It
  does not own React document state. Browser file picking remains a separate
  source of input to the same library behavior.
- Preserve the distinct `file::` and `path::` identities for browser files and
  native paths. A browser `File` cannot be reconstructed from its key alone;
  decide what is restorable when adding persistence.

## Integrating a feature

1. Identify its owner by the behavior it changes. Drag and drop, folders,
   drafts, sidebar categories, and persistence belong to the library. Anchors,
   Mermaid, and rendered-document behavior belong to the reader. Native path
   or filesystem work belongs behind the Tauri boundary. Workflow automation
   and external TODO integration live outside `src/`.
2. Trace the input through the owning feature to `app` and the rendered UI.
   Define the minimum new action or prop needed at a boundary. Keep the
   existing `useOpenFiles` action contract during an organization-only move;
   evolve the item model when a new item type actually requires it.
3. Keep web and desktop behavior explicit where they differ. In particular,
   folder access and restored files need platform-specific decisions. Do not
   infer those contracts from the current browser picker or Tauri open event.
4. Add focused behavior tests next to changed code. Writing a failing test
   first is useful when it clarifies a new state transition or regression, but
   it is not mandatory for every edit. Run `pnpm test`, `pnpm lint`, and
   `pnpm build` for code changes, plus a relevant web or Tauri check when a
   platform boundary changes.

Keep state local while the app shell can coordinate it clearly. Introduce a
reducer, Context, or a storage adapter only when actual behavior creates the
need. Split the library into smaller features only if its areas acquire
separate state or workflows.

## Related project guidance

- Use `ui-guidelines` for app chrome, controls, and CSS. Pair it with
  `frontend-design` for new screens or a substantial redesign.
- Use `markdown-viewer` for the rendering pipeline, document links, Mermaid,
  and prose/syntax styles. Treat document content as untrusted input.
- Use `tauri-v2` for Rust commands, IPC, permissions, and native resources.
