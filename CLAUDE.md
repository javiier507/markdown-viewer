# Markdown Viewer

A web-based markdown viewer built with React + Vite. Users open local `.md` files and read them rendered, with a sidebar to switch between multiple open files.

## Features

- **Empty state** — centered "Open File" button when no files are loaded.
- **Multi-file sidebar** — left rail (264px) lists every opened file; click to switch the active one. The `+` button at the top opens the file picker to add more.
- **Syntax highlighting** — fenced code blocks are highlighted via `highlight.js`; falls back to plaintext for unknown languages.
- **Light/dark theme** — follows `prefers-color-scheme` (UI + syntax tokens).
- **Safe rendering** — markdown is parsed by `marked` and sanitized by `DOMPurify` before injection.

## Design-only (not yet wired)

- Per-file `×` remove button in the sidebar — appears on hover/active but has no `onClick` handler.

## Stack

- **UI**: React 19, Vite 8
- **Markdown**: `marked` + `DOMPurify`
- **Highlighting**: `highlight.js` + `marked-highlight` (GitHub-inspired token theme in `src/syntax.css`)

## Notes

- Interface is in English by design.
