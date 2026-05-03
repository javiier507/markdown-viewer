# Markdown Viewer

A web-based markdown viewer built with React + Vite. Users open local `.md` files and read them rendered, with a sidebar to switch between multiple open files.

## Features

- **Empty state** — centered "Open File" button when no files are loaded.
- **Multi-file sidebar** — left rail (264px) lists every opened file; click to switch the active one. The `+` button at the top opens the file picker to add more, and a per-file `×` button (visible on hover/active) removes that file.
- **Syntax highlighting** — fenced code blocks are highlighted via `highlight.js`; falls back to plaintext for unknown languages.
- **Light/dark theme** — follows `prefers-color-scheme` (UI + syntax tokens).
- **Safe rendering** — markdown is parsed by `marked` and sanitized by `DOMPurify` before injection.

## Stack

- **UI**: React 19, Vite 8
- **Markdown**: `marked` + `DOMPurify`
- **Highlighting**: `highlight.js` + `marked-highlight` (GitHub-inspired token theme in `src/syntax.css`)
- **Desktop**: Tauri 2 (`src-tauri/`); `vite.config.js` is Tauri-aware (strict port, `TAURI_ENV_*` envPrefix, platform-specific build target, ignores `src-tauri/**` in watch).

## Notes

- Interface is in English by design.
- Tauri requires the Rust toolchain installed locally; `pnpm tauri:dev` / `pnpm tauri:build` will fail without it. The Vite app on its own (`pnpm dev` / `pnpm build`) works without Rust.
