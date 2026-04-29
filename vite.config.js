import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

const host = process.env.TAURI_DEV_HOST

// https://vite.dev/config/
// Tauri-aware Vite config: https://v2.tauri.app/start/frontend/vite/
export default defineConfig(async () => ({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],

  // Don't clear the terminal so Rust compiler errors stay visible alongside Vite.
  clearScreen: false,

  server: {
    port: 5173,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: 'ws', host, port: 1421 }
      : undefined,
    watch: {
      // Vite shouldn't watch Tauri's Rust sources.
      ignored: ['**/src-tauri/**'],
    },
  },

  // Expose TAURI_ENV_* vars to the frontend in addition to VITE_*.
  envPrefix: ['VITE_', 'TAURI_ENV_*'],

  build: {
    // Match the WebView versions Tauri ships on each platform.
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    // Don't minify in debug builds so stack traces stay useful.
    // Vite 8 defaults to Oxc (Rolldown); the upstream Tauri example pins 'esbuild',
    // which would require esbuild as a separate dependency under Vite 8.
    minify: !process.env.TAURI_ENV_DEBUG,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
}))
