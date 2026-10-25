export const isTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

// Native dialog paths keep files refreshable, unlike browser File objects.
export async function pickFilesFromDialog() {
  try {
    const [{ open }, { invoke }] = await Promise.all([
      import('@tauri-apps/plugin-dialog'),
      import('@tauri-apps/api/core'),
    ])
    const selected = await open({
      multiple: true,
      directory: false,
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'mdx', 'txt'] }],
    })
    const paths = selected == null ? [] : [selected].flat()
    if (paths.length === 0) return []
    return await invoke('read_dropped_files', { paths })
  } catch (error) {
    console.warn('file dialog failed:', error)
    return []
  }
}
