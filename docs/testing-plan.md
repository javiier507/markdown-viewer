# Testing Plan — Markdown Viewer

> **Status:** Implemented 2026-09-23 · **Scope:** Frontend (React + Vite), implemented features only · **Strategy:** Unit/integration testing with Vitest + Testing Library.

The test suite began on `test/frontend-suite` and currently has 35 tests, a frontend CI workflow, and a pnpm lockfile. `jsdom@30.1.0` replaces `30.1.1` because the latter did not meet the workspace's three-day package age policy. Coverage thresholds and a pre-push hook remain deferred. Tests also exposed four fixes: separate `file::` and `path::` key namespaces, copy code via `textContent`, forbid form controls in rendered Markdown, and deduplicate overlapping file reads.

## 1. Goal

Introduce a test suite that protects the **currently implemented** functionality — the highest-risk logic (Markdown sanitization, file state management) and existing UI behavior — with fast feedback (under 5s locally) and zero flakiness.

**Scope:** this plan covers only features that already exist in the codebase. Pending features listed in [TODO.md](../TODO.md) are **out of scope**; each one will define its own tests when it is developed (see [§8](#8-future-work-out-of-scope)).

E2E testing (Playwright) and Rust tests (`cargo test`) are explicitly **out of scope** for this first iteration — see [§8](#8-future-work-out-of-scope).

## 2. Decision summary

**Chosen:** Vitest + Testing Library (unit/integration).

Why, in short:

- Pure functions, hooks, and components are colocated by feature under `src/features/` — directly testable units.
- The behavior worth protecting today (sanitization, file dedup, floating-menu focus handling) is DOM-level logic, not pixel-level visuals — and the same layers will absorb future features as they land.
- The highest-risk code is the `marked → highlight.js → DOMPurify` pipeline (XSS surface) — best covered by fast unit tests with malicious payloads.
- Playwright cannot drive the Tauri desktop shell without experimental WebDriver tooling; it would only cover the secondary web target.

## 3. Stack (exact versions, per repo rules)

| Package | Version | Purpose |
| --- | --- | --- |
| `vitest` | `5.0.1` | Runner; reuses `vite.config.js` (compatible with Vite 8) |
| `jsdom` | `30.1.0` | DOM environment |
| `@testing-library/react` | `16.3.3` | Component + `renderHook` testing (React 19 compatible) |
| `@testing-library/user-event` | `14.6.7` | Realistic user interactions |
| `@testing-library/jest-dom` | `7.0.1` | DOM matchers (`toBeInTheDocument`, …) |
| `@vitest/coverage-v8` | `5.0.1` | (Optional) coverage reports |

```sh
pnpm add -D -E vitest@5.0.1 jsdom@30.1.0 @testing-library/react@16.3.3 \
  @testing-library/user-event@14.6.7 @testing-library/jest-dom@7.0.1 \
  @vitest/coverage-v8@5.0.1
```

## 4. File layout

Tests live next to the code they cover (colocated), plus one shared setup file:

```
src/
├── app/
│   ├── App.jsx
│   └── App.test.jsx
├── features/
│   ├── library/
│   │   ├── useOpenFiles.js
│   │   ├── useOpenFiles.test.jsx
│   │   ├── fileKey.js
│   │   ├── fileKey.test.js
│   │   └── ...
│   └── reader/
│       ├── markdown.js
│       ├── markdown.test.js
│       ├── MarkdownView.jsx
│       └── MarkdownView.test.jsx
├── platform/tauri/
│   ├── useTauriOpenFile.js
│   └── useTauriOpenFile.test.jsx
└── test/setup.js
```

## 5. Implementation phases

### Phase 0 — Setup

- [x] Install the dependencies listed in [§3](#3-stack-exact-versions-per-repo-rules).
- [x] Add a `test` block to `vite.config.js` (Vitest reads the same config; the React plugin and React Compiler preset apply to tests automatically):

  ```js
  // import { defineConfig } from 'vitest/config'
  // inside defineConfig({ ... }):
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    // No `globals: true` — import { describe, it, expect } from 'vitest'
    // explicitly so ESLint needs no extra globals config.
  },
  ```

- [x] Create `src/test/setup.js`:

  ```js
  import '@testing-library/jest-dom/vitest'
  import { cleanup } from '@testing-library/react'
  import { afterEach } from 'vitest'
  afterEach(cleanup)
  ```

- [x] Add scripts to `package.json`:

  ```jsonc
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
  ```

- [x] Smoke test: the initial `lib/` suite passes with `pnpm test`.
- [x] Verify `pnpm lint` stays green (explicit `vitest` imports avoid new globals).

### Phase 1 — Feature logic (pure functions, highest risk first)

**`src/features/reader/markdown.test.js`** — the security-critical module:

- [x] Renders GFM: headings, tables, strikethrough, fenced code blocks.
- [x] Code blocks get `hljs language-*` classes; unknown languages fall back to `plaintext`.
- [x] **Sanitization (XSS regression suite):**
  - `<script>` tags are stripped.
  - Event handlers are stripped (`<img src=x onerror=...>`).
  - `javascript:` URLs in links are neutralized.
  - Injected `<iframe>` / `<form>` are removed.
- [x] Empty / nullish input returns `''`.

**`src/features/library/fileKey.test.js`:**

- [x] `makeFileKey` is stable for the same name/size/lastModified and differs when any part differs.
- [x] `makePathKey` is prefixed (`path::`) and cannot collide with a browser file key.

**`src/features/library/readPickedFiles.test.js`:**

- [x] Reads real `File` objects (jsdom supports `new File([...], name)` + `file.text()`).
- [x] Empty/null list returns `[]`.
- [x] A failing read is skipped while the rest succeed (`Promise.allSettled` behavior).

### Phase 2 — Hooks

**`src/features/library/useOpenFiles.test.jsx`** (via `renderHook` + `act`):

- [x] **Regression:** adding the same file twice does not duplicate it in `files`; it reactivates the existing entry (covers the fixed "duplicated files in sidebar" bug).
- [x] Overlapping reads of the same file do not create duplicate entries.
- [x] `addFiles` activates the first picked file, including one already open.
- [x] `addFileFromPath` dedupes by `path::` key.
- [x] `removeFile` removes the entry and clears `activeId` only when the removed file was active.
- [x] `selectFile` switches `activeId` / `activeFile`.

**`src/features/library/useFloatingMenu.test.jsx`:**

- [x] Opens/closes via trigger; closes on outside `mousedown`.
- [x] `Escape` closes and returns focus to the trigger.
- [x] `ArrowDown`/`ArrowUp` cycle focus across `[role="menuitem"]`.
- [x] Note: jsdom does not do layout — `getBoundingClientRect` returns zeros, so assert behavior (open/close/focus), not pixel positions.

**`src/platform/tauri/useTauriOpenFile.test.jsx`:**

- [x] In a non-Tauri environment (no `window.__TAURI_INTERNALS__`) it is a no-op — no dynamic imports happen.
- [x] With `__TAURI_INTERNALS__` defined and `vi.mock('@tauri-apps/api/core')` / `vi.mock('@tauri-apps/api/event')`: a pending file from `invoke('take_pending_file')` calls the handler once; `open-file` events call the handler with the payload; unmount unsubscribes.

### Phase 3 — Components

**`MarkdownView.test.jsx`:**

- [x] Renders sanitized HTML into `.prose__body`.
- [x] Injects one `.code-copy` button per `<pre>` (and does not double-inject on re-render).
- [x] Clicking copy writes the code text to the clipboard and shows the check state (mock `navigator.clipboard.writeText`; use `vi.useFakeTimers()` for the 2s revert).
- [x] XSS payload in `content` does not appear in the DOM.

**`FileListItem.test.jsx`:**

- [x] Select button calls `onSelect(file.id)`.
- [x] Dots button opens the portal menu (`aria-expanded` toggles); "Remove file" calls `onRemove(file.id)` and closes the menu.

**`EmptyState.test.jsx` / `Sidebar.test.jsx`:**

- [x] EmptyState CTA calls `onOpen`.
- [x] Sidebar renders files, marks the active one, collapse toggle calls `onToggleCollapse` (the collapsed state already exists in `App.jsx`).

**`App.test.jsx`** (light integration, optional in this phase):

- [x] With no files: renders `EmptyState`, no sidebar.
- [x] Selecting files through `HiddenFileInput` lists them and shows the active document.

### Phase 4 — Hardening

- [x] Add `pnpm test` to a new frontend CI workflow.
- [ ] Add tests to Release Please when that workflow exists.
- [ ] Set a coverage floor for feature and platform logic (deferred).
- [ ] Decide on a pre-push hook (deferred).

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
| `window.__TAURI_INTERNALS__` | Absent by default | Define per-test + `vi.mock('@tauri-apps/api/core')` and `vi.mock('@tauri-apps/api/event')` |
| `File.text()` | Supported in jsdom 30.1 | Use real `File` objects |
| `HTMLElement.innerText` | Not implemented | Copy code via `textContent` |

## 8. Future work (out of scope)

- **Pending TODO features:** tests for the items in [TODO.md](../TODO.md) (anchor links, Mermaid, browser storage, drafts, sidebar categories, drag & drop, open folder) are **not part of this plan** — each feature defines its own tests when it is implemented, preferably test-first.
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
