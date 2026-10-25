export async function readFileFromPath(path) {
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke('read_file', { path })
  } catch (error) {
    console.warn('read_file failed:', error)
    return null
  }
}
