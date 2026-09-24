# Testing Plan — Markdown Viewer

> **Status:** Draft · **Scope:** Frontend (React + Vite) · **Strategy:** Unit/integration testing first with Vitest + Testing Library.

## 1. Goal

Introduce a test suite that protects the highest-risk logic (Markdown sanitization, file state management) and supports TDD for the pending features in [TODO.md](../TODO.md), with fast feedback (< 1s) and zero flakiness.

E2E testing (Playwright) and Rust tests (`cargo test`) are explicitly **out of scope** for this first iteration — see [§8](#8-future-work-out-of-scope).

## 2. Decision summary

**Chosen:** Vitest + Testing Library (unit/integration).

Why, in short:

- The codebase is already split into pure functions (`src/lib/`), hooks (`src/hooks/`), and presentational components (`src/components/`) — directly testable units.
- Most pending TODO features are logic-heavy (anchors, Mermaid, storage, drafts, folder grouping), not pixel-heavy.
- The highest-risk code is the `marked → highlight.js → DOMPurify` pipeline (XSS surface) — best covered by fast unit tests with malicious payloads.
- Playwright cannot drive the Tauri desktop shell without experimental WebDriver tooling; it would only cover the secondary web target.

## 3. Stack (exact versions, per repo rules)

| Package | Version | Purpose |
| --- | --- | --- |
| `vitest` | `5.0.1` | Runner; reuses `vite.config.js` (compatible with Vite 8) |
| `jsdom` | `30.1.1` | DOM environment |
| `@testing-library/react` | `16.3.3` | Component + `renderHook` testing (React 19 compatible) |
| `@testing-library/user-event` | `14.6.7` | Realistic user interactions |
| `@testing-library/jest-dom` | `7.0.1` | DOM matchers (`toBeInTheDocument`, …) |
| `@vitest/coverage-v8` | `5.0.1` | (Optional) coverage reports |

```sh
pnpm add -D vitest@5.0.1 jsdom@30.1.1 @testing-library/react@16.3.3 \
  @testing-library/user-event@14.6.7 @testing-library/jest-dom@7.0.1 \
  @vitest/coverage-v8@5.0.1
```

## 4. Proposed file layout

Tests live next to the code they cover (colocated), plus one shared setup file:

```
src/
├── lib/
│   ├── markdown.js
│   ├── markdown.test.js
│   ├── fileKey.js
│   ├── fileKey.test.js
│   ├── readPickedFiles.js
│   └── readPickedFiles.test.js
├── hooks/
│   ├── useOpenFiles.js
│   ├── useOpenFiles.test.jsx
│   ├── useFloatingMenu.js
│   ├── useFloatingMenu.test.jsx
│   ├── useTauriOpenFile.js
│   └── useTauriOpenFile.test.jsx
├── components/
│   ├── MarkdownView.jsx
│   ├── MarkdownView.test.jsx
│   ├── FileListItem.jsx
│   ├── FileListItem.test.jsx
│   └── ...
└── test/
    └── setup.js
```

## 5. Implementation phases

### Phase 0 — Setup

- [ ] Install the dependencies listed in [§3](#3-stack-exact-versions-per-repo-rules).
- [ ] Add a `test` block to `vite.config.js` (Vitest reads the same config; the React plugin and React Compiler preset apply to tests automatically):

  ```js
  /// <reference types="vitest/config" />
  // inside defineConfig({ ... }):
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    // No `globals: true` — import { describe, it, expect } from 'vitest'
    // explicitly so ESLint needs no extra globals config.
  },
  ```

- [ ] Create `src/test/setup.js`:

  ```js
  import '@testing-library/jest-dom/vitest'
  ```

- [ ] Add scripts to `package.json`:

  ```jsonc
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
  ```

- [ ] Smoke test: one trivial `expect(1 + 1).toBe(2)` passes with `pnpm test`.
- [ ] Verify `pnpm lint` stays green (explicit `vitest` imports avoid new globals).

### Phase 1 — `lib/` (pure functions, highest risk first)

**`src/lib/markdown.test.js`** — the security-critical module:

- [ ] Renders GFM: headings, tables, strikethrough, fenced code blocks.
- [ ] Code blocks get `hljs language-*` classes; unknown languages fall back to `plaintext`.
- [ ] **Sanitization (XSS regression suite):**
  - `<script>` tags are stripped.
  - Event handlers are stripped (`<img src=x onerror=...>`).
  - `javascript:` URLs in links are neutralized.
  - Injected `<iframe>` / `<form>` are removed.
- [ ] Empty / nullish input returns `''`.

**`src/lib/fileKey.test.js`:**

- [ ] `makeFileKey` is stable for the same name/size/lastModified and differs when any part differs.
- [ ] `makePathKey` is prefixed (`path::`) and cannot collide with a browser file key.

**`src/lib/readPickedFiles.test.js`:**

- [ ] Reads real `File` objects (jsdom supports `new File([...], name)` + `file.text()`).
- [ ] Empty/null list returns `[]`.
- [ ] A failing read is skipped while the rest succeed (`Promise.allSettled` behavior).

### Phase 2 — `hooks/`

**`src/hooks/useOpenFiles.test.jsx`** (via `renderHook` + `act`):

- [ ] **Regression:** adding the same file twice does not duplicate it in `files`; it reactivates the existing entry (covers the fixed "duplicated files in sidebar" bug).
- [ ] `addFiles` activates the first newly added file.
- [ ] `addFileFromPath` dedupes by `path::` key.
- [ ] `removeFile` removes the entry and clears `activeId` only when the removed file was active.
- [ ] `selectFile` switches `activeId` / `activeFile`.

**`src/hooks/useFloatingMenu.test.jsx`:**

- [ ] Opens/closes via trigger; closes on outside `mousedown`.
- [ ] `Escape` closes and returns focus to the trigger.
- [ ] `ArrowDown`/`ArrowUp` cycle focus across `[role="menuitem"]`.
- [ ] Note: jsdom does not do layout — `getBoundingClientRect` returns zeros, so assert behavior (open/close/focus), not pixel positions.

**`src/hooks/useTauriOpenFile.test.jsx`:**

- [ ] In a non-Tauri environment (no `window.__TAURI_INTERNALS__`) it is a no-op — no dynamic imports happen.
- [ ] With `__TAURI_INTERNALS__` defined and `vi.mock('@tauri-apps/api/core')` / `vi.mock('@tauri-apps/api/event')`: a pending file from `invoke('take_pending_file')` calls the handler once; `open-file` events call the handler with the payload; unmount unsubscribes.

### Phase 3 — Components

**`MarkdownView.test.jsx`:**

- [ ] Renders sanitized HTML into `.prose__body`.
- [ ] Injects one `.code-copy` button per `<pre>` (and does not double-inject on re-render).
- [ ] Clicking copy writes the code text to the clipboard and shows the check state (mock `navigator.clipboard.writeText`; use `vi.useFakeTimers()` for the 2s revert).
- [ ] XSS payload in `content` does not appear in the DOM.

**`FileListItem.test.jsx`:**

- [ ] Select button calls `onSelect(file.id)`.
- [ ] Dots button opens the portal menu (`aria-expanded` toggles); "Remove file" calls `onRemove(file.id)` and closes the menu.

**`EmptyState.test.jsx` / `Sidebar.test.jsx`:**

- [ ] EmptyState CTA calls `onOpen`.
- [ ] Sidebar renders files, marks the active one, collapse toggle calls `onToggleCollapse` (the collapsed state already exists in `App.jsx`).

**`App.test.jsx`** (light integration, optional in this phase):

- [ ] With no files: renders `EmptyState`, no sidebar.
- [ ] Selecting files through `HiddenFileInput` lists them and shows the active document.

### Phase 4 — TDD for upcoming TODO features

Write the failing test first, then implement. Suggested mapping:

| TODO item | Test layer | First test to write |
| --- | --- | --- |
| Anchor link support | `markdown.test.js` | `[text](#section)` renders an in-page anchor; clicking scrolls without reload |
| Render Mermaid | `markdown.test.js` | ` ```mermaid ` blocks render into a Mermaid container, not `hljs` |
| Save in browser storage | `useOpenFiles.test.jsx` | State rehydrates from storage on mount; changes persist |
| Add draft (empty files) | `useOpenFiles.test.jsx` | `addDraft()` creates an untitled empty entry and activates it |
| Sidebar: 3 categories | `useOpenFiles` + `Sidebar.test.jsx` | Grouping derives files/folders/drafts correctly |
| Drag and Drop | `App.test.jsx` | `drop` event with `dataTransfer.files` adds documents |
| Open folder | hook/lib (new) | Folder entries appear grouped in the sidebar |

### Phase 5 — Hardening

- [ ] Add `pnpm test` to CI (and to the Release Please workflow when it lands).
- [ ] Set a coverage floor for `src/lib/**` and `src/hooks/**` (suggested: 90% lines) — **not** for icons/presentational components.
- [ ] Decide on pre-push hook (`husky`) running `vitest run` once the suite stays < 5s.

## 6. Conventions

- **Language:** test code and descriptions in English (repo rule).
- **Naming:** `*.test.js` for pure logic, `*.test.jsx` for hooks/components; colocated with the source.
- **Imports:** always `import { describe, it, expect, vi } from 'vitest'` (no globals).
- **Queries:** prefer accessible queries (`getByRole`, `getByLabelText`) over test ids — the UI already has good ARIA (`aria-label="Options for …"`, `role="menu"`).
- **Structure:** Arrange / Act / Assert; one behavior per `it`.
- **Don't test:** third-party internals (marked, DOMPurify themselves), CSS, or pixel positions.
- **Versions:** exact versions only in `package.json`.

## 7. jsdom limitations and required mocks

| API | Issue | Approach |
| --- | --- | --- |
| `navigator.clipboard` | Not implemented | `vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue() } })` or `Object.defineProperty` |
| `scrollIntoView` | Not implemented (`useScrollActiveIntoView`) | Stub on `Element.prototype` in the tests that need it |
| `getBoundingClientRect` | Returns zeros | Assert behavior, not coordinates (`useFloatingMenu`) |
| `window.__TAURI_INTERNALS__` | Absent by default | Define per-test + `vi.mock('@tauri-apps/api/core' | '.../event')` |
| `File.text()` | Supported in jsdom 30 | Use real `File` objects; polyfill only if a failure appears |

## 8. Future work (out of scope)

- **Rust:** `cargo test` for `read_file_payload` in `src-tauri/src/lib.rs` (path/name extraction, error cases).
- **E2E smoke:** 2–3 Playwright tests against `pnpm preview` (web build) once the app stabilizes pre-release; desktop E2E only via `tauri-driver` if it ever becomes critical.

## 9. Commands

```sh
pnpm test            # run the suite once (CI)
pnpm test:watch      # watch mode while developing
pnpm test:coverage   # coverage report
```

## 10. Risks and notes

- **Vite 8 + Vitest 5:** verified compatible at planning time; if resolution issues appear, pin Vitest to the newest 5.x patch instead of downgrading Vite.
- **React Compiler:** runs through the same Vite pipeline in tests — no special handling expected, but watch for warnings about memoization in hook tests.
- **Suite runtime:** keep it under ~5s; if it grows, split heavy sanitization cases instead of adding retries or sleeps.
