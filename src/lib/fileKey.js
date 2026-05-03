/**
 * Stable identity key for a browser File object.
 * Uses name + size + lastModified to distinguish files without reading content.
 */
export const makeFileKey = (file) =>
  `${file.name}::${file.size}::${file.lastModified}`

/**
 * Stable identity key for a Tauri path-based file.
 * Prefixed with "path::" to avoid collisions with browser file keys.
 */
export const makePathKey = (path) => `path::${path}`
