# Markdown Viewer

A clean markdown viewer built with React + Vite, with optional desktop packaging via Tauri 2. Open one or many `.md` files, switch between them in a left sidebar, read them rendered with syntax highlighting, light/dark theme.

## Stack

- **UI**: React 19, Vite 8
- **Markdown**: `marked` + `DOMPurify`
- **Highlighting**: `highlight.js` + `marked-highlight` (GitHub-inspired token theme in `src/syntax.css`)
- **Desktop**: Tauri 2 (`src-tauri/`); `vite.config.js` is Tauri-aware (strict port, `TAURI_ENV_*` envPrefix, platform-specific build target, ignores `src-tauri/**` in watch).

## Requirements

- **Node** 18+ and **pnpm**
- **Rust toolchain** (stable) — only for Tauri commands; the Vite app works without it.
- **Platform-specific dependencies** — [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) (MSVC Build Tools on Windows, WebKitGTK on Linux, Xcode CLT on macOS).

## Install

```sh
pnpm install
```

## Web (Vite only)

```sh
pnpm dev          # start dev server at http://localhost:5173
pnpm build        # production build into dist/
pnpm preview      # serve the production build locally
pnpm lint         # run ESLint
```

## Desktop (Tauri)

```sh
pnpm tauri:dev    # launches Vite + compiles Rust + opens the desktop window
pnpm tauri:build  # produces the platform installer (.msi/.exe/.dmg/.AppImage)
pnpm tauri        # raw Tauri CLI passthrough (e.g. pnpm tauri info)
```

`tauri:dev` runs `pnpm dev` automatically via `beforeDevCommand`, so a single command brings up everything. The first run compiles ~400 Rust crates and can take 5–15 minutes; subsequent runs are fast.

Build artifacts land in `src-tauri/target/release/bundle/`.

## Project layout

```
src/                 React app (App.jsx, App.css, syntax.css, index.css)
src-tauri/           Tauri (Rust) backend + tauri.conf.json
public/              static assets served by Vite
dist/                Vite production output (consumed by Tauri's frontendDist)
```

## Agent Docs

- [CLAUDE.md](./CLAUDE.md) — feature overview, and development rules
- [.claude/skills](./.claude/skills) — design system and Tauri v2 development guides
