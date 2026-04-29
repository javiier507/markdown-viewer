# Markdown Viewer

A clean markdown viewer built with React + Vite, with optional desktop packaging via Tauri 2. Open one or many `.md` files, switch between them in a left sidebar, read them rendered with syntax highlighting, light/dark theme.

## Requirements

- **Node** 18+ and **pnpm** — required for both web and desktop workflows.
- **Rust toolchain** (stable, via `rustup`) — required only for Tauri commands.
- **Platform-specific system dependencies** for Tauri (MSVC Build Tools on Windows, WebKitGTK + build-essential on Linux, Xcode CLT on macOS).

See the official Tauri prerequisites guide for the exact install steps per OS: <https://v2.tauri.app/start/prerequisites/>

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
